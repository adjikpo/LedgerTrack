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

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
