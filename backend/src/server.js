require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const { pool, init } = require('./db');
const { sign, requireAuth } = require('./auth');

const app = express();
app.set('trust proxy', 1); // Render y similares ponen un proxy adelante

const origins = (process.env.FRONTEND_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({ origin: (o, cb) => cb(null, !o || origins.length === 0 || origins.includes(o)) }));
app.use(express.json({ limit: '5mb' }));

const authLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, message: { error: 'Demasiados intentos, probá en unos minutos' } });
const emailOk = e => typeof e === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length <= 200;

app.get('/health', (req, res) => res.json({ ok: true }));

app.post('/api/auth/register', authLimit, async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase(), password = String(req.body.password || '');
    if (!emailOk(email)) return res.status(400).json({ error: 'Email inválido' });
    if (password.length < 6) return res.status(400).json({ error: 'La contraseña tiene que tener al menos 6 caracteres' });
    const hash = await bcrypt.hash(password, 10);
    const r = await pool.query('INSERT INTO users (email, pass_hash) VALUES ($1, $2) ON CONFLICT (email) DO NOTHING RETURNING id, email', [email, hash]);
    if (!r.rows.length) return res.status(409).json({ error: 'Ya existe una cuenta con ese email' });
    res.status(201).json({ token: sign(r.rows[0]), email });
  } catch (e) { next(e) }
});

app.post('/api/auth/login', authLimit, async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase(), password = String(req.body.password || '');
    const r = await pool.query('SELECT id, email, pass_hash FROM users WHERE email = $1', [email]);
    const u = r.rows[0];
    if (!u || !(await bcrypt.compare(password, u.pass_hash))) return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    res.json({ token: sign(u), email: u.email });
  } catch (e) { next(e) }
});

app.get('/api/me', requireAuth, (req, res) => res.json({ email: req.user.email }));

app.get('/api/data', requireAuth, async (req, res, next) => {
  try {
    const r = await pool.query('SELECT data, updated_at FROM user_data WHERE user_id = $1', [req.user.uid]);
    res.json(r.rows[0] ? { data: r.rows[0].data, updatedAt: r.rows[0].updated_at } : { data: null, updatedAt: null });
  } catch (e) { next(e) }
});

app.put('/api/data', requireAuth, async (req, res, next) => {
  try {
    const d = req.body && req.body.data;
    if (!d || typeof d !== 'object' || !d.meta || !d.profiles) return res.status(400).json({ error: 'Datos con formato inválido' });
    const r = await pool.query(
      `INSERT INTO user_data (user_id, data, updated_at) VALUES ($1, $2, now())
       ON CONFLICT (user_id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()
       RETURNING updated_at`, [req.user.uid, d]);
    res.json({ ok: true, updatedAt: r.rows[0].updated_at });
  } catch (e) { next(e) }
});

app.use((req, res) => res.status(404).json({ error: 'No encontrado' }));
app.use((err, req, res, next) => { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) });

const PORT = process.env.PORT || 3000;
init()
  .then(() => app.listen(PORT, () => console.log('API de Mis gastos escuchando en el puerto ' + PORT)))
  .catch(e => { console.error('No pude conectar con la base de datos:', e.message); process.exit(1) });
