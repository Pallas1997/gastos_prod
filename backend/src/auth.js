const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET;
if (!SECRET) { console.error('Falta JWT_SECRET en las variables de entorno'); process.exit(1) }

const sign = user => jwt.sign({ uid: user.id, email: user.email }, SECRET, { expiresIn: '60d' });

function requireAuth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Falta iniciar sesión' });
  try { req.user = jwt.verify(token, SECRET); next() }
  catch (e) { res.status(401).json({ error: 'Sesión inválida o vencida' }) }
}

module.exports = { sign, requireAuth };
