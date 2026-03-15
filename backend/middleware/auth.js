const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'novobanco_secret_2024';

function authCliente(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ erro: 'Token não fornecido' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.tipo !== 'cliente') return res.status(403).json({ erro: 'Acesso negado' });
    req.clienteId = decoded.id;
    next();
  } catch {
    res.status(401).json({ erro: 'Token inválido ou expirado' });
  }
}

function authAdmin(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ erro: 'Token não fornecido' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.tipo !== 'admin') return res.status(403).json({ erro: 'Acesso negado' });
    next();
  } catch {
    res.status(401).json({ erro: 'Token inválido ou expirado' });
  }
}

module.exports = { authCliente, authAdmin, JWT_SECRET };
