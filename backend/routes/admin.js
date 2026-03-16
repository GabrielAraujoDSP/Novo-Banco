const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { dbGet, dbAll, dbRunSave } = require('../database');
const { authAdmin, JWT_SECRET } = require('../middleware/auth');

router.post('/login', (req, res) => {
  const { usuario, senha } = req.body;
  if (!usuario || !senha) return res.status(400).json({ erro: 'Usuário e senha obrigatórios' });
  const admin = dbGet('SELECT * FROM admins WHERE usuario = ?', [usuario]);
  if (!admin || !bcrypt.compareSync(senha, admin.senha_hash))
    return res.status(401).json({ erro: 'Credenciais inválidas' });
  const token = jwt.sign({ id: admin.id, tipo: 'admin' }, JWT_SECRET, { expiresIn: '8h' });
  res.json({ token });
});

router.get('/clientes', authAdmin, (req, res) => {
  res.json(dbAll('SELECT id, nome, cpf, idade, saldo, criado_em FROM clientes ORDER BY criado_em DESC'));
});

router.get('/clientes/:id', authAdmin, (req, res) => {
  const cliente = dbGet('SELECT id, nome, cpf, idade, saldo, criado_em FROM clientes WHERE id = ?', [req.params.id]);
  if (!cliente) return res.status(404).json({ erro: 'Cliente não encontrado' });
  const transacoes = dbAll('SELECT id, tipo, valor, saldo_apos, criado_em FROM transacoes WHERE cliente_id = ? ORDER BY criado_em DESC', [req.params.id]);
  res.json({ ...cliente, transacoes });
});

router.put('/clientes/:id', authAdmin, (req, res) => {
  const { nome, cpf, idade, senha } = req.body;
  const { id } = req.params;
  const cliente = dbGet('SELECT * FROM clientes WHERE id = ?', [id]);
  if (!cliente) return res.status(404).json({ erro: 'Cliente não encontrado' });
  const cpfLimpo = cpf ? cpf.replace(/\D/g, '') : cliente.cpf;
  if (cpfLimpo.length !== 11) return res.status(400).json({ erro: 'CPF inválido' });
  const cpfExiste = dbGet('SELECT id FROM clientes WHERE cpf = ? AND id != ?', [cpfLimpo, id]);
  if (cpfExiste) return res.status(409).json({ erro: 'CPF já cadastrado em outra conta' });
  const novoNome = nome || cliente.nome;
  const novaIdade = idade ? parseInt(idade) : cliente.idade;
  if (senha && senha.length >= 6) {
    dbRunSave('UPDATE clientes SET nome = ?, cpf = ?, idade = ?, senha_hash = ? WHERE id = ?', [novoNome, cpfLimpo, novaIdade, bcrypt.hashSync(senha, 10), id]);
  } else {
    dbRunSave('UPDATE clientes SET nome = ?, cpf = ?, idade = ? WHERE id = ?', [novoNome, cpfLimpo, novaIdade, id]);
  }
  res.json({ mensagem: 'Cliente atualizado com sucesso!' });
});

router.post('/clientes/:id/depositar', authAdmin, (req, res) => {
  const { valor } = req.body;
  const { id } = req.params;
  if (!valor || valor <= 0) return res.status(400).json({ erro: 'Valor inválido' });
  const cliente = dbGet('SELECT saldo FROM clientes WHERE id = ?', [id]);
  if (!cliente) return res.status(404).json({ erro: 'Cliente não encontrado' });
  const novoSaldo = Math.round((cliente.saldo + valor) * 100) / 100;
  dbRunSave('UPDATE clientes SET saldo = ? WHERE id = ?', [novoSaldo, id]);
  dbRunSave('INSERT INTO transacoes (cliente_id, tipo, valor, saldo_apos) VALUES (?, ?, ?, ?)', [id, 'deposito', valor, novoSaldo]);
  res.json({ mensagem: 'Depósito realizado!', saldo: novoSaldo });
});

router.post('/clientes/:id/sacar', authAdmin, (req, res) => {
  const { valor } = req.body;
  const { id } = req.params;
  if (!valor || valor <= 0) return res.status(400).json({ erro: 'Valor inválido' });
  const cliente = dbGet('SELECT saldo FROM clientes WHERE id = ?', [id]);
  if (!cliente) return res.status(404).json({ erro: 'Cliente não encontrado' });
  if (valor > cliente.saldo) return res.status(400).json({ erro: 'Saldo insuficiente' });
  const novoSaldo = Math.round((cliente.saldo - valor) * 100) / 100;
  dbRunSave('UPDATE clientes SET saldo = ? WHERE id = ?', [novoSaldo, id]);
  dbRunSave('INSERT INTO transacoes (cliente_id, tipo, valor, saldo_apos) VALUES (?, ?, ?, ?)', [id, 'saque', valor, novoSaldo]);
  res.json({ mensagem: 'Saque realizado!', saldo: novoSaldo });
});

router.delete('/clientes/:id/historico/:txId', authAdmin, (req, res) => {
  const tx = dbGet('SELECT id FROM transacoes WHERE id = ? AND cliente_id = ?', [req.params.txId, req.params.id]);
  if (!tx) return res.status(404).json({ erro: 'Transação não encontrada' });
  dbRunSave('DELETE FROM transacoes WHERE id = ?', [req.params.txId]);
  res.json({ mensagem: 'Transação excluída!' });
});

router.delete('/clientes/:id/historico', authAdmin, (req, res) => {
  const cliente = dbGet('SELECT id FROM clientes WHERE id = ?', [req.params.id]);
  if (!cliente) return res.status(404).json({ erro: 'Cliente não encontrado' });
  dbRunSave('DELETE FROM transacoes WHERE cliente_id = ?', [req.params.id]);
  res.json({ mensagem: 'Histórico excluído com sucesso!' });
});

router.delete('/clientes/:id', authAdmin, (req, res) => {
  const cliente = dbGet('SELECT id FROM clientes WHERE id = ?', [req.params.id]);
  if (!cliente) return res.status(404).json({ erro: 'Cliente não encontrado' });
  dbRunSave('DELETE FROM transacoes WHERE cliente_id = ?', [req.params.id]);
  dbRunSave('DELETE FROM clientes WHERE id = ?', [req.params.id]);
  res.json({ mensagem: 'Conta excluída com sucesso!' });
});

router.get('/resumo', authAdmin, (req, res) => {
  const totalClientes = dbGet('SELECT COUNT(*) as total FROM clientes').total;
  const totalSaldo = dbGet('SELECT SUM(saldo) as total FROM clientes').total || 0;
  const totalDepositos = dbGet("SELECT SUM(valor) as total FROM transacoes WHERE tipo = 'deposito'").total || 0;
  const totalSaques = dbGet("SELECT SUM(valor) as total FROM transacoes WHERE tipo = 'saque'").total || 0;
  const totalTransacoes = dbGet('SELECT COUNT(*) as total FROM transacoes').total;
  res.json({ totalClientes, totalSaldo, totalDepositos, totalSaques, totalTransacoes });
});

module.exports = router;
