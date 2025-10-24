import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { getDb, migrate } from './db.js';

dotenv.config();

const db = getDb();
migrate(db);

// Seed demo user
const email = 'demo@ledgertrack.app';
const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
let userId = existing?.id;
if (!userId) {
  userId = nanoid();
  const hash = bcrypt.hashSync('Password123!', 10);
  db.prepare('INSERT INTO users (id, email, username, password_hash) VALUES (?, ?, ?, ?)')
    .run(userId, email, 'Sophie', hash);
}

// Seed habit
const habitId = nanoid();
db.prepare('INSERT OR IGNORE INTO habits (id, user_id, name, icon) VALUES (?, ?, ?, ?)')
  .run(habitId, userId, 'Manger 1 fruit 🥝', 'kiwi');

// Seed entries for yesterday and today
const upsertEntry = db.prepare(`
  INSERT INTO habit_entries (id, habit_id, date, completed)
  VALUES (?, ?, ?, 1)
  ON CONFLICT(habit_id, date) DO UPDATE SET completed=1
`);
upsertEntry.run(nanoid(), habitId, new Date(Date.now() - 86400000).toISOString().slice(0,10));
upsertEntry.run(nanoid(), habitId, new Date().toISOString().slice(0,10));

// Seed a demo tribe with the user and a few peers
let tribe = db.prepare('SELECT id FROM tribes WHERE name = ?').get('Eau');
let tribeId = tribe?.id;
if (!tribeId) {
  tribeId = nanoid();
  db.prepare('INSERT INTO tribes (id, name) VALUES (?, ?)').run(tribeId, 'Eau');
}
const ensureMember = (uid) => {
  db.prepare('INSERT OR IGNORE INTO tribe_members (tribe_id, user_id) VALUES (?, ?)').run(tribeId, uid);
};
ensureMember(userId);

// Peers
const makeUser = (mail, name) => {
  const ex = db.prepare('SELECT id FROM users WHERE email = ?').get(mail);
  if (ex) return ex.id;
  const id = nanoid();
  const hash = bcrypt.hashSync('Password123!', 10);
  db.prepare('INSERT INTO users (id, email, username, password_hash) VALUES (?, ?, ?, ?)')
    .run(id, mail, name, hash);
  return id;
};
const u2 = makeUser('ken@ledgertrack.app', 'Ken');
const u3 = makeUser('lina@ledgertrack.app', 'Lina');
const u4 = makeUser('ari@ledgertrack.app', 'Ari');
ensureMember(u2); ensureMember(u3); ensureMember(u4);

console.log('Migration & seed completed. User:', email, 'Password: Password123!');
