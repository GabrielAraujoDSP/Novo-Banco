const initSqlJs = require('sql.js');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'banco.db');

let db;

async function iniciarBanco() {
  const SQL = await initSqlJs();

  // Carrega banco existente ou cria novo
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Salva o banco no disco sempre que houver alteração
  function salvar() {
    const data = db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  }

  // Cria tabelas
  db.run(`
    CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      cpf TEXT UNIQUE NOT NULL,
      idade INTEGER NOT NULL,
      senha_hash TEXT NOT NULL,
      saldo REAL NOT NULL DEFAULT 0,
      criado_em TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS transacoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente_id INTEGER NOT NULL,
      tipo TEXT NOT NULL,
      valor REAL NOT NULL,
      saldo_apos REAL NOT NULL,
      criado_em TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (cliente_id) REFERENCES clientes(id)
    );

    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario TEXT UNIQUE NOT NULL,
      senha_hash TEXT NOT NULL
    );
  `);

  // Cria admin padrão se não existir
  const adminExiste = dbGet('SELECT id FROM admins WHERE usuario = ?', ['admin']);
  if (!adminExiste) {
    const hash = bcrypt.hashSync('admin123', 10);
    dbRun('INSERT INTO admins (usuario, senha_hash) VALUES (?, ?)', ['admin', hash]);
    salvar();
    console.log('✅ Admin padrão criado → usuário: admin | senha: admin123');
  }

  // Sobrescreve métodos para salvar automaticamente após cada escrita
  const _run = db.run.bind(db);
  db.runAndSave = function(sql, params) {
    _run(sql, params);
    salvar();
  };

  salvar();
  console.log('✅ Banco de dados iniciado');
}

// Helpers para consultas
function dbGet(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
}

function dbAll(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function dbRun(sql, params = []) {
  db.run(sql, params);
}

function dbRunSave(sql, params = []) {
  db.run(sql, params);
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function lastId() {
  return dbGet('SELECT last_insert_rowid() as id').id;
}

module.exports = { iniciarBanco, dbGet, dbAll, dbRun, dbRunSave, lastId };
