let sqlite3;
try {
  sqlite3 = require('sqlite3').verbose();
} catch (e) {
  console.warn('[DB] SQLite3 não pôde ser carregado (ambiente serverless/Vercel):', e.message);
}

let db = null;
const dbPath = process.env.VERCEL
  ? path.resolve('/tmp', 'database.sqlite')
  : path.resolve(__dirname, '../database.sqlite');

if (sqlite3) {
  try {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Erro ao conectar ao banco de dados SQLite:', err.message);
      } else {
        console.log('Conectado com sucesso ao banco SQLite em:', dbPath);
      }
    });
    db.run('PRAGMA foreign_keys = OFF');
  } catch (err) {
    console.warn('[DB] Falha ao instanciar SQLite:', err.message);
    db = null;
  }
}

// Promisificar métodos do SQLite com fallback seguro
const runAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    if (!db) return resolve({ id: 0, changes: 0 });
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

const getAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    if (!db) return resolve(null);
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const allAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    if (!db) return resolve([]);
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
};

// Inicialização dos Schemas — user_id TEXT para suportar UUIDs do Supabase
async function initDb() {
  if (!db) {
    console.log('[DB] SQLite inativo ou desnecessário; operando 100% integrado ao Supabase.');
    return;
  }
  // Tabela de usuários locais (fallback sem Supabase)
  await runAsync(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Verificar se precisa migrar user_id de INTEGER para TEXT nas tabelas antigas
  try {
    const tableInfo = await allAsync("PRAGMA table_info(categories)");
    const userIdCol = tableInfo.find(c => c.name === 'user_id');
    
    if (userIdCol && userIdCol.type === 'INTEGER') {
      console.log('Migrando tabelas para suportar UUIDs Supabase...');
      
      // Recriar tabelas com user_id TEXT
      await runAsync('ALTER TABLE categories RENAME TO categories_old');
      await runAsync(`
        CREATE TABLE categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          name TEXT NOT NULL,
          type TEXT CHECK(type IN ('income', 'expense')) DEFAULT 'expense',
          color TEXT DEFAULT '#17191c',
          icon TEXT DEFAULT 'tag',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await runAsync('INSERT INTO categories SELECT id, CAST(user_id AS TEXT), name, type, color, icon, created_at FROM categories_old');
      await runAsync('DROP TABLE categories_old');

      await runAsync('ALTER TABLE transactions RENAME TO transactions_old');
      await runAsync(`
        CREATE TABLE transactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          category_id INTEGER,
          description TEXT NOT NULL,
          amount REAL NOT NULL,
          type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
          date TEXT NOT NULL,
          payment_method TEXT DEFAULT 'pix',
          status TEXT CHECK(status IN ('paid', 'pending')) DEFAULT 'paid',
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL
        )
      `);
      await runAsync('INSERT INTO transactions SELECT id, CAST(user_id AS TEXT), category_id, description, amount, type, date, payment_method, status, notes, created_at FROM transactions_old');
      await runAsync('DROP TABLE transactions_old');

      await runAsync('ALTER TABLE budgets RENAME TO budgets_old');
      await runAsync(`
        CREATE TABLE budgets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          category_id INTEGER NOT NULL,
          monthly_limit REAL NOT NULL,
          month TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, category_id, month),
          FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
        )
      `);
      await runAsync('INSERT INTO budgets SELECT id, CAST(user_id AS TEXT), category_id, monthly_limit, month, created_at FROM budgets_old');
      await runAsync('DROP TABLE budgets_old');

      console.log('Migração concluída com sucesso!');
    }
  } catch (migErr) {
    // Tabelas não existem ainda, criar normalmente
  }

  await runAsync(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT CHECK(type IN ('income', 'expense')) DEFAULT 'expense',
      color TEXT DEFAULT '#17191c',
      icon TEXT DEFAULT 'tag',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await runAsync(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      category_id INTEGER,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
      date TEXT NOT NULL,
      payment_method TEXT DEFAULT 'pix',
      status TEXT CHECK(status IN ('paid', 'pending')) DEFAULT 'paid',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL
    )
  `);

  await runAsync(`
    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      category_id INTEGER NOT NULL,
      monthly_limit REAL NOT NULL,
      month TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, category_id, month),
      FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
    )
  `);

  console.log('Tabelas SQLite inicializadas com sucesso.');
}

module.exports = {
  db,
  runAsync,
  getAsync,
  allAsync,
  initDb
};
