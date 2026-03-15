# 🏦 NovoBanco

Sistema bancário web com Node.js + SQLite.

## Estrutura

```
novobanco/
├── backend/
│   ├── server.js           → servidor principal
│   ├── database.js         → SQLite + tabelas
│   ├── middleware/
│   │   └── auth.js         → autenticação JWT
│   ├── routes/
│   │   ├── clientes.js     → cadastro, login, saque, depósito
│   │   └── admin.js        → painel administrativo
│   └── package.json
└── frontend/
    ├── cliente.html         → página do cliente
    └── admin.html           → painel do admin
```

## Instalação

### 1. Instale o Node.js
Baixe em https://nodejs.org (versão LTS recomendada)

### 2. Instale as dependências

```bash
cd backend
npm install
```

### 3. Inicie o servidor

```bash
npm start
```

Ou, para desenvolvimento com reinício automático:
```bash
npm run dev
```

## Acesso

| Página | URL |
|--------|-----|
| Cliente | http://localhost:3001 |
| Admin | http://localhost:3001/admin |

## Credenciais padrão do Admin

- **Usuário:** admin
- **Senha:** admin123

> ⚠️ Troque a senha do admin em produção!

## API

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /api/clientes/cadastro | Cria nova conta |
| POST | /api/clientes/login | Login do cliente |
| GET | /api/clientes/perfil | Dados do cliente logado |
| GET | /api/clientes/extrato | Extrato de transações |
| POST | /api/clientes/depositar | Realiza depósito |
| POST | /api/clientes/sacar | Realiza saque |
| POST | /api/admin/login | Login do admin |
| GET | /api/admin/clientes | Lista todos os clientes |
| GET | /api/admin/clientes/:id | Detalhe de um cliente |
| GET | /api/admin/resumo | Métricas gerais |

## Segurança

- Senhas armazenadas com hash **bcrypt**
- Autenticação via **JWT** (expira em 8h)
- Dados nunca expostos no frontend
- Rotas separadas por perfil (cliente / admin)
