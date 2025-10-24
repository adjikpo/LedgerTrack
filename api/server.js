import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { getDb, migrate } from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const CORS_ORIGIN = (process.env.CORS_ORIGIN || '').split(',').filter(Boolean);

app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: (origin, cb) => cb(null, true), credentials: true }));

const db = getDb();
migrate(db);

// Utilities
function signToken(userId) {
  const jti = nanoid();
  const token = jwt.sign({ sub: userId, jti }, JWT_SECRET, { expiresIn: '7d' });
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare('INSERT INTO sessions (id, user_id, jwt_id, expires_at) VALUES (?, ?, ?, ?)')
    .run(nanoid(), userId, jti, expiresAt);
  return token;
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return null;
  }
}

// Auth routes
const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  username: z.string().min(2).max(50).optional(),
});

app.post('/api/auth/register', (req, res) => {
  const parse = RegisterSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'Invalid payload', details: parse.error.flatten() });
  const { email, password, username } = parse.data;

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'Email already in use' });

  const id = nanoid();
  const hash = bcrypt.hashSync(password, 10);
  db.prepare('INSERT INTO users (id, email, username, password_hash) VALUES (?, ?, ?, ?)')
    .run(id, email.toLowerCase(), username || null, hash);

  const token = signToken(id);
  res.json({ token, user: { id, email, username } });
});

const LoginSchema = z.object({ email: z.string().email(), password: z.string() });
app.post('/api/auth/login', (req, res) => {
  const parse = LoginSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'Invalid payload' });
  const { email, password } = parse.data;

  const user = db.prepare('SELECT id, email, username, password_hash FROM users WHERE email = ?').get(email.toLowerCase());
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const ok = bcrypt.compareSync(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  const token = signToken(user.id);
  res.json({ token, user: { id: user.id, email: user.email, username: user.username } });
});

app.get('/api/auth/me', (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'Invalid token' });
  const user = db.prepare('SELECT id, email, username FROM users WHERE id = ?').get(payload.sub);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

// Auth middleware
function requireAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'Invalid token' });
  req.userId = payload.sub;
  next();
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function getCompletedDatesForUser(userId) {
  const rows = db.prepare(
    `SELECT DISTINCT he.date AS d
     FROM habit_entries he
     JOIN habits h ON h.id = he.habit_id
     WHERE h.user_id = ? AND he.completed = 1`
  ).all(userId);
  return new Set(rows.map(r => r.d));
}

function computeUserStreak(userId) {
  const days = getCompletedDatesForUser(userId);
  let count = 0;
  let dt = new Date();
  for (;;) {
    const d = dt.toISOString().slice(0,10);
    if (!days.has(d)) break;
    count += 1;
    dt.setDate(dt.getDate() - 1);
  }
  return count;
}

function getCompletedDatesForHabit(habitId) {
  const rows = db.prepare(
    `SELECT he.date AS d FROM habit_entries he WHERE he.habit_id = ? AND he.completed = 1`
  ).all(habitId);
  return new Set(rows.map(r => r.d));
}

function computeHabitStreak(habitId) {
  const days = getCompletedDatesForHabit(habitId);
  let count = 0;
  let dt = new Date();
  for (;;) {
    const d = dt.toISOString().slice(0,10);
    if (!days.has(d)) break;
    count += 1;
    dt.setDate(dt.getDate() - 1);
  }
  return count;
}

// Home summary
app.get('/api/home', requireAuth, (req, res) => {
  const userId = req.userId;
  let mission = db.prepare('SELECT id, name, icon FROM habits WHERE user_id = ? ORDER BY created_at LIMIT 1').get(userId);
  if (!mission) {
    // bootstrap a default mission
    const id = nanoid();
    db.prepare('INSERT INTO habits (id, user_id, name, icon) VALUES (?, ?, ?, ?)')
      .run(id, userId, 'Manger 1 fruit 🥝', 'kiwi');
    mission = { id, name: 'Manger 1 fruit 🥝', icon: 'kiwi' };
  }
  const today = todayDate();
  const todayRow = db.prepare('SELECT completed FROM habit_entries WHERE habit_id = ? AND date = ?').get(mission.id, today);
  const completedToday = !!(todayRow && todayRow.completed);
  const streak = computeUserStreak(userId);
  res.json({ streak, mission: { id: mission.id, name: mission.name, icon: mission.icon, completedToday } });
});

// Habits
app.get('/api/habits', requireAuth, (req, res) => {
  const userId = req.userId;
  const habits = db.prepare('SELECT id, name, icon, created_at FROM habits WHERE user_id = ? ORDER BY created_at').all(userId);
  const today = todayDate();
  const mapped = habits.map(h => {
    const todayRow = db.prepare('SELECT completed FROM habit_entries WHERE habit_id = ? AND date = ?').get(h.id, today);
    const completedToday = !!(todayRow && todayRow.completed);
    const streak = computeHabitStreak(h.id);
    return { id: h.id, name: h.name, icon: h.icon, streak, completedToday, isTodayMission: false };
  });
  // Mark the first as today mission for UI hint
  if (mapped[0]) mapped[0].isTodayMission = true;
  res.json({ habits: mapped });
});

app.post('/api/habits/:id/complete', requireAuth, (req, res) => {
  const userId = req.userId;
  const habitId = req.params.id;
  const owned = db.prepare('SELECT id FROM habits WHERE id = ? AND user_id = ?').get(habitId, userId);
  if (!owned) return res.status(404).json({ error: 'Habit not found' });
  const id = nanoid();
  const today = todayDate();
  db.prepare(`
    INSERT INTO habit_entries (id, habit_id, date, completed)
    VALUES (?, ?, ?, 1)
    ON CONFLICT(habit_id, date) DO UPDATE SET completed = 1
  `).run(id, habitId, today);
  const streak = computeHabitStreak(habitId);
  res.json({ ok: true, streak });
});

// Tribe (demo data if empty)
app.get('/api/tribe', requireAuth, (req, res) => {
  const userId = req.userId;
  // Try to read tribe membership
  const member = db.prepare('SELECT t.id, t.name FROM tribes t JOIN tribe_members m ON m.tribe_id = t.id WHERE m.user_id = ?').get(userId);
  if (!member) {
    // return demo feed
    const members = [
      { id: 'u1', name: 'Sophie', avatar: 'https://i.pravatar.cc/100?img=1', streak: 12, lastAction: 'A bu 500ml', kudos: 5 },
      { id: 'u2', name: 'Ken', avatar: 'https://i.pravatar.cc/100?img=2', streak: 9, lastAction: 'A marché 5k', kudos: 3 },
      { id: 'u3', name: 'Lina', avatar: 'https://i.pravatar.cc/100?img=3', streak: 20, lastAction: 'A mangé un fruit', kudos: 11 },
      { id: 'u4', name: 'Ari', avatar: 'https://i.pravatar.cc/100?img=4', streak: 7, lastAction: 'A médité 10m', kudos: 2 },
    ];
    return res.json({ tribe: { id: 'demo', name: 'Eau' }, members, leaderboard: members.slice().sort((a,b)=>b.streak-a.streak).map((m,i)=>({ rank: i+1, name: m.name, streak: m.streak })) });
  }
  const rows = db.prepare(`
    SELECT u.id, COALESCE(u.username, u.email) as name
    FROM tribe_members m JOIN users u ON u.id = m.user_id
    WHERE m.tribe_id = ?
  `).all(member.id);
  // For demo, attach placeholder avatars and streaks (0)
  const members = rows.map((r, idx) => ({ id: r.id, name: r.name, avatar: `https://i.pravatar.cc/100?img=${(idx%10)+1}`, streak: 0, lastAction: '—', kudos: 0 }));
  res.json({ tribe: { id: member.id, name: member.name }, members, leaderboard: members.map((m,i)=>({ rank: i+1, name: m.name, streak: m.streak })) });
});

app.post('/api/tribe/kudos', requireAuth, (req, res) => {
  const from = req.userId;
  const to = (req.body && req.body.to_user) || null;
  if (!to || to === from) return res.status(400).json({ error: 'Invalid target' });
  const existing = db.prepare('SELECT id FROM kudos WHERE to_user = ? AND from_user = ?').get(to, from);
  if (existing) {
    db.prepare('DELETE FROM kudos WHERE id = ?').run(existing.id);
    return res.json({ liked: false });
  }
  db.prepare('INSERT INTO kudos (id, to_user, from_user) VALUES (?, ?, ?)').run(nanoid(), to, from);
  res.json({ liked: true });
});

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
