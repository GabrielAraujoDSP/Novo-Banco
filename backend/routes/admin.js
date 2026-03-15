const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { dbGet, dbAll } = require('../database');
const { authAdmin, JWT_SECRET } = require('../middleware/auth');

// POST /api/admin/login
router.post('/login', (req, res) => {
  const { usuario, senha } = req.body;
  if (!usuario || !senha)
    return res.status(400).json({ erro: 'Usuário e senha obrigatórios' });

  const admin = dbGet('SELECT * FROM admins WHERE usuario = ?', [usuario]);
  if (!admin || !bcrypt.compareSync(senha, admin.senha_hash))
    return res.status(401).json({ erro: 'Credenciais inválidas' });

  const token = jwt.sign({ id: admin.id, tipo: 'admin' }, JWT_SECRET, { expiresIn: '8h' });
  res.json({ token });
});

// GET /api/admin/clientes
router.get('/clientes', authAdmin, (req, res) => {
  const clientes = dbAll(
    'SELECT id, nome, cpf, idade, saldo, criado_em FROM clientes ORDER BY criado_em DESC'
  );
  res.json(clientes);
});

// GET /api/admin/clientes/:id
router.get('/clientes/:id', authAdmin, (req, res) => {
  const cliente = dbGet(
    'SELECT id, nome, cpf, idade, saldo, criado_em FROM clientes WHERE id = ?',
    [req.params.id]
  );
  if (!cliente) return res.status(404).json({ erro: 'Cliente não encontrado' });

  const transacoes = dbAll(
    'SELECT id, tipo, valor, saldo_apos, criado_em FROM transacoes WHERE cliente_id = ? ORDER BY criado_em DESC',
    [req.params.id]
  );

  res.json({ ...cliente, transacoes });
});

// GET /api/admin/resumo
router.get('/resumo', authAdmin, (req, res) => {
  const totalClientes = dbGet('SELECT COUNT(*) as total FROM clientes').total;
  const totalSaldo = dbGet('SELECT SUM(saldo) as total FROM clientes').total || 0;
  const totalDepositos = dbGet("SELECT SUM(valor) as total FROM transacoes WHERE tipo = 'deposito'").total || 0;
  const totalSaques = dbGet("SELECT SUM(valor) as total FROM transacoes WHERE tipo = 'saque'").total || 0;
  const totalTransacoes = dbGet('SELECT COUNT(*) as total FROM transacoes').total;

  res.json({ totalClientes, totalSaldo, totalDepositos, totalSaques, totalTransacoes });
});

module.exports = router;
