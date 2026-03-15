const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { dbGet, dbAll, dbRunSave, lastId } = require('../database');
const { authCliente, JWT_SECRET } = require('../middleware/auth');

// POST /api/clientes/cadastro
router.post('/cadastro', (req, res) => {
  const { nome, cpf, idade, senha } = req.body;

  if (!nome || !cpf || !idade || !senha)
    return res.status(400).json({ erro: 'Todos os campos são obrigatórios' });

  const cpfLimpo = cpf.replace(/\D/g, '');
  if (cpfLimpo.length !== 11)
    return res.status(400).json({ erro: 'CPF inválido' });

  if (senha.length < 6)
    return res.status(400).json({ erro: 'Senha deve ter pelo menos 6 caracteres' });

  const jaExiste = dbGet('SELECT id FROM clientes WHERE cpf = ?', [cpfLimpo]);
  if (jaExiste)
    return res.status(409).json({ erro: 'CPF já cadastrado' });

  const senhaHash = bcrypt.hashSync(senha, 10);

  dbRunSave(
    'INSERT INTO clientes (nome, cpf, idade, senha_hash, saldo) VALUES (?, ?, ?, ?, 0)',
    [nome, cpfLimpo, parseInt(idade), senhaHash]
  );

  const id = lastId();
  res.status(201).json({ mensagem: 'Conta criada com sucesso!', id });
});

// POST /api/clientes/login
router.post('/login', (req, res) => {
  const { cpf, senha } = req.body;
  if (!cpf || !senha)
    return res.status(400).json({ erro: 'CPF e senha são obrigatórios' });

  const cpfLimpo = cpf.replace(/\D/g, '');
  const cliente = dbGet('SELECT * FROM clientes WHERE cpf = ?', [cpfLimpo]);

  if (!cliente || !bcrypt.compareSync(senha, cliente.senha_hash))
    return res.status(401).json({ erro: 'CPF ou senha incorretos' });

  const token = jwt.sign({ id: cliente.id, tipo: 'cliente' }, JWT_SECRET, { expiresIn: '8h' });

  res.json({
    token,
    cliente: {
      id: cliente.id,
      nome: cliente.nome,
      cpf: cliente.cpf,
      idade: cliente.idade,
      saldo: cliente.saldo,
      criado_em: cliente.criado_em
    }
  });
});

// GET /api/clientes/perfil
router.get('/perfil', authCliente, (req, res) => {
  const cliente = dbGet(
    'SELECT id, nome, cpf, idade, saldo, criado_em FROM clientes WHERE id = ?',
    [req.clienteId]
  );
  if (!cliente) return res.status(404).json({ erro: 'Cliente não encontrado' });
  res.json(cliente);
});

// GET /api/clientes/extrato
router.get('/extrato', authCliente, (req, res) => {
  const transacoes = dbAll(
    'SELECT id, tipo, valor, saldo_apos, criado_em FROM transacoes WHERE cliente_id = ? ORDER BY criado_em DESC LIMIT 50',
    [req.clienteId]
  );
  res.json(transacoes);
});

// POST /api/clientes/depositar
router.post('/depositar', authCliente, (req, res) => {
  const { valor } = req.body;
  if (!valor || valor <= 0)
    return res.status(400).json({ erro: 'Valor inválido' });

  const cliente = dbGet('SELECT saldo FROM clientes WHERE id = ?', [req.clienteId]);
  const novoSaldo = Math.round((cliente.saldo + valor) * 100) / 100;

  dbRunSave('UPDATE clientes SET saldo = ? WHERE id = ?', [novoSaldo, req.clienteId]);
  dbRunSave(
    'INSERT INTO transacoes (cliente_id, tipo, valor, saldo_apos) VALUES (?, ?, ?, ?)',
    [req.clienteId, 'deposito', valor, novoSaldo]
  );

  res.json({ mensagem: 'Depósito realizado!', saldo: novoSaldo });
});

// POST /api/clientes/sacar
router.post('/sacar', authCliente, (req, res) => {
  const { valor } = req.body;
  if (!valor || valor <= 0)
    return res.status(400).json({ erro: 'Valor inválido' });

  const cliente = dbGet('SELECT saldo FROM clientes WHERE id = ?', [req.clienteId]);
  if (valor > cliente.saldo)
    return res.status(400).json({ erro: 'Saldo insuficiente' });

  const novoSaldo = Math.round((cliente.saldo - valor) * 100) / 100;

  dbRunSave('UPDATE clientes SET saldo = ? WHERE id = ?', [novoSaldo, req.clienteId]);
  dbRunSave(
    'INSERT INTO transacoes (cliente_id, tipo, valor, saldo_apos) VALUES (?, ?, ?, ?)',
    [req.clienteId, 'saque', valor, novoSaldo]
  );

  res.json({ mensagem: 'Saque realizado!', saldo: novoSaldo });
});

module.exports = router;
