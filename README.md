# NovoBanco

Sistema bancário web desenvolvido como projeto de aprendizado, com foco em entender como funciona uma aplicação fullstack real — separação entre frontend e backend, autenticação segura e persistência de dados.

## Sobre o projeto

Esse foi meu primeiro projeto com arquitetura separada de frontend e backend. Antes disso, eu tinha construído versões mais simples onde tudo ficava no HTML e os dados sumiam ao fechar o navegador. Quis evoluir para algo mais próximo do que existe no mercado de verdade.

A ideia foi simples: um sistema bancário com duas interfaces distintas — uma para o cliente gerenciar a própria conta, e outra para o administrador gerenciar todos os clientes.

## O que aprendi

- Como estruturar uma API REST com Node.js e Express
- Como separar responsabilidades entre frontend e backend
- Como funciona autenticação com JWT — o token é gerado no login e enviado em cada requisição protegida
- Por que senhas nunca devem ser salvas em texto puro — usei bcrypt para gerar o hash
- Como o SQLite persiste dados em arquivo local, sem precisar de um servidor de banco separado
- Como o frontend se comunica com o backend via `fetch`
- Como organizar rotas por perfil de acesso (cliente vs admin)

## Tecnologias

**Backend**
- Node.js
- Express
- sql.js (SQLite)
- bcryptjs
- jsonwebtoken (JWT)

**Frontend**
- HTML, CSS e JavaScript puro
- Sem frameworks — quis entender o que acontece por baixo antes de usar abstrações

## Funcionalidades

**Página do cliente**
- Cadastro com CPF e senha
- Login com autenticação JWT
- Visualização de saldo
- Depósito e saque
- Extrato completo de transações

**Painel administrativo**
- Login separado com credenciais de admin
- Visão geral com métricas (total de clientes, saldo, depósitos, saques)
- Listagem e busca de clientes
- Edição de dados de qualquer cliente
- Depósito e saque em nome do cliente
- Exclusão de transações individuais ou histórico completo
- Exclusão de conta

## Como rodar localmente

**Requisitos:** Node.js instalado

```bash
cd backend
npm install
npm start
```

Acesse:
- Cliente → http://localhost:3001
- Admin → http://localhost:3001/admin

Credenciais padrão do admin: `admin` / `admin123`

## Próximos passos

Algumas coisas que quero evoluir nesse projeto:

- Trocar SQLite por PostgreSQL para simular um ambiente de produção real
- Adicionar testes automatizados no backend
- Fazer o deploy em produção no Railway
- Explorar frameworks frontend como React para a interface do cliente

---

Desenvolvido por Gabriel — estudante de desenvolvimento com foco em backend, buscando minha primeira oportunidade na área.
