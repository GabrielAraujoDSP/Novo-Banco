const express = require('express');
const cors = require('cors');
const path = require('path');
const { iniciarBanco } = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

app.use('/api/clientes', require('./routes/clientes'));
app.use('/api/admin', require('./routes/admin'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/cliente.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/admin.html'));
});

// Inicia o banco ANTES de abrir o servidor
iniciarBanco().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🏦 NovoBanco rodando em http://localhost:${PORT}`);
    console.log(`👤 Página do cliente: http://localhost:${PORT}`);
    console.log(`🔐 Painel admin:      http://localhost:${PORT}/admin`);
    console.log(`   Login admin → usuário: adminalterado | senha: senhaalterada\n`);
  });
});
