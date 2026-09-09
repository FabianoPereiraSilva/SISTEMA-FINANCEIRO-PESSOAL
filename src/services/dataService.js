const { runAsync, allAsync, getAsync } = require('../db');
const { getSupabaseClientForUser, getAnonClient } = require('../supabaseService');

const DEFAULT_CATEGORIES = [
  { name: 'Alimentação & Mercado', type: 'expense', color: '#5d2a1a', icon: 'utensils' },
  { name: 'Moradia & Contas', type: 'expense', color: '#17191c', icon: 'home' },
  { name: 'Transporte & Combustível', type: 'expense', color: '#777b86', icon: 'car' },
  { name: 'Saúde & Bem-Estar', type: 'expense', color: '#5d2a1a', icon: 'heart' },
  { name: 'Lazer & Entretenimento', type: 'expense', color: '#979799', icon: 'smile' },
  { name: 'Educação & Livros', type: 'expense', color: '#17191c', icon: 'book' },
  { name: 'Compras Pessoais', type: 'expense', color: '#777b86', icon: 'shopping-bag' },
  { name: 'Serviços & Assinaturas', type: 'expense', color: '#a3a6af', icon: 'credit-card' },
  { name: 'Salário & Remuneração', type: 'income', color: '#17191c', icon: 'briefcase' },
  { name: 'Rendimentos & Investimentos', type: 'income', color: '#5d2a1a', icon: 'trending-up' },
  { name: 'Freelance & Projetos', type: 'income', color: '#777b86', icon: 'code' },
  { name: 'Outras Receitas', type: 'income', color: '#979799', icon: 'plus-circle' }
];

// Garante categorias padrão no banco (Supabase e SQLite)
async function seedDefaultCategories(userId, token = null) {
  // 1. Sempre seed no SQLite local
  try {
    const existingLocal = await getAsync('SELECT COUNT(*) as count FROM categories WHERE user_id = ?', [userId]);
    if (!existingLocal || existingLocal.count === 0) {
      for (const cat of DEFAULT_CATEGORIES) {
        await runAsync(
          'INSERT INTO categories (user_id, name, type, color, icon) VALUES (?, ?, ?, ?, ?)',
          [userId, cat.name, cat.type, cat.color, cat.icon]
        );
      }
    }
  } catch (err) {
    console.warn('[Seed Local] Aviso:', err.message);
  }

  // 2. Se for Supabase, seed no Supabase
  if (token) {
    try {
      const supa = getSupabaseClientForUser(token);
      if (supa) {
        const { data: supaExisting } = await supa.from('categories').select('id').limit(1);
        if (!supaExisting || supaExisting.length === 0) {
          const toInsert = DEFAULT_CATEGORIES.map(c => ({
            user_id: userId,
            name: c.name,
            type: c.type,
            color: c.color,
            icon: c.icon
          }));
          await supa.from('categories').insert(toInsert);
          console.log(`[Supabase] Categorias padrão inseridas para ${userId}`);
        }
      }
    } catch (supaErr) {
      console.warn('[Seed Supabase] Aviso:', supaErr.message);
    }
  }
}

// ────────────── CATEGORIAS ──────────────
async function getCategories(req, type = null) {
  if (req.isSupabase && req.userToken) {
    try {
      const supa = getSupabaseClientForUser(req.userToken);
      let query = supa.from('categories').select('*').order('name', { ascending: true });
      if (type) query = query.eq('type', type);
      const { data, error } = await query;
      if (!error && data && data.length > 0) return data;
    } catch (e) {
      console.warn('[Supabase getCategories error, fallback to SQLite]:', e.message);
    }
  }

  // Fallback SQLite
  let sql = 'SELECT * FROM categories WHERE user_id = ?';
  const params = [req.userId];
  if (type) {
    sql += ' AND type = ?';
    params.push(type);
  }
  sql += ' ORDER BY name ASC';
  return await allAsync(sql, params);
}

async function createCategory(req, { name, type, color, icon }) {
  const catType = type === 'income' ? 'income' : 'expense';
  const catColor = color || '#17191c';
  const catIcon = icon || 'tag';

  // Sempre grava no SQLite
  const localRes = await runAsync(
    'INSERT INTO categories (user_id, name, type, color, icon) VALUES (?, ?, ?, ?, ?)',
    [req.userId, name.trim(), catType, catColor, catIcon]
  );
  let saved = await getAsync('SELECT * FROM categories WHERE id = ?', [localRes.id]);

  // Se Supabase ativo, grava também lá
  if (req.isSupabase && req.userToken) {
    try {
      const supa = getSupabaseClientForUser(req.userToken);
      const { data, error } = await supa.from('categories').insert({
        user_id: req.userId,
        name: name.trim(),
        type: catType,
        color: catColor,
        icon: catIcon
      }).select().single();
      if (!error && data) saved = data;
    } catch (e) {
      console.warn('[Supabase createCategory warn]:', e.message);
    }
  }

  return saved;
}

// ────────────── TRANSAÇÕES ──────────────
async function getTransactions(req, filters = {}) {
  const { month, startDate, endDate, type, categoryId, status, search } = filters;

  if (req.isSupabase && req.userToken) {
    try {
      const supa = getSupabaseClientForUser(req.userToken);
      let query = supa.from('transactions').select(`
        *,
        categories (
          id,
          name,
          color,
          icon
        )
      `).order('date', { ascending: false }).order('created_at', { ascending: false });

      if (month) {
        const start = `${month}-01`;
        const nextMonthDate = new Date(month + '-01');
        nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
        const end = nextMonthDate.toISOString().slice(0, 10);
        query = query.gte('date', start).lt('date', end);
      }
      if (startDate) query = query.gte('date', startDate);
      if (endDate) query = query.lte('date', endDate);
      if (type) query = query.eq('type', type);
      if (categoryId) query = query.eq('category_id', categoryId);
      if (status) query = query.eq('status', status);
      if (search) query = query.ilike('description', `%${search}%`);

      const { data, error } = await query;
      if (!error && data) {
        // Normalizar formato de categoria
        return data.map(t => ({
          ...t,
          category_name: t.categories ? t.categories.name : null,
          category_color: t.categories ? t.categories.color : null,
          category_icon: t.categories ? t.categories.icon : null
        }));
      }
    } catch (e) {
      console.warn('[Supabase getTransactions error, fallback to SQLite]:', e.message);
    }
  }

  // Fallback SQLite
  let sql = `
    SELECT 
      t.*,
      c.name as category_name,
      c.color as category_color,
      c.icon as category_icon
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.user_id = ?
  `;
  const params = [req.userId];

  if (month) {
    sql += ` AND strftime('%Y-%m', t.date) = ?`;
    params.push(month);
  }
  if (startDate) {
    sql += ` AND t.date >= ?`;
    params.push(startDate);
  }
  if (endDate) {
    sql += ` AND t.date <= ?`;
    params.push(endDate);
  }
  if (type) {
    sql += ` AND t.type = ?`;
    params.push(type);
  }
  if (categoryId) {
    sql += ` AND t.category_id = ?`;
    params.push(categoryId);
  }
  if (status) {
    sql += ` AND t.status = ?`;
    params.push(status);
  }
  if (search) {
    sql += ` AND (t.description LIKE ? OR t.notes LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  sql += ` ORDER BY t.date DESC, t.id DESC`;
  return await allAsync(sql, params);
}

async function createTransaction(req, txData) {
  const { category_id, description, amount, type, date, payment_method, status, notes } = txData;

  // Grava no SQLite
  const localRes = await runAsync(`
    INSERT INTO transactions (
      user_id, category_id, description, amount, type, date, payment_method, status, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    req.userId,
    category_id || null,
    description.trim(),
    parseFloat(amount),
    type,
    date,
    payment_method || 'pix',
    status || 'paid',
    notes ? notes.trim() : null
  ]);

  let resultTx = await getAsync('SELECT * FROM transactions WHERE id = ?', [localRes.id]);

  // Se Supabase ativo, grava também no Supabase
  if (req.isSupabase && req.userToken) {
    try {
      const supa = getSupabaseClientForUser(req.userToken);
      const { data, error } = await supa.from('transactions').insert({
        user_id: req.userId,
        category_id: category_id || null,
        description: description.trim(),
        amount: parseFloat(amount),
        type,
        date,
        payment_method: payment_method || 'pix',
        status: status || 'paid',
        notes: notes ? notes.trim() : null
      }).select().single();

      if (!error && data) {
        resultTx = data;
      } else if (error) {
        console.warn('[Supabase createTransaction error]:', error.message);
      }
    } catch (e) {
      console.warn('[Supabase createTransaction err]:', e.message);
    }
  }

  return resultTx;
}

// Inserção em Lote (usado para Extratos OFX/CSV e Parcelamentos)
async function createTransactionsBatch(req, transactionsArray) {
  const inserted = [];
  for (const item of transactionsArray) {
    const tx = await createTransaction(req, item);
    inserted.push(tx);
  }
  return inserted;
}

async function updateTransaction(req, id, txData) {
  const { category_id, description, amount, type, date, payment_method, status, notes } = txData;

  await runAsync(`
    UPDATE transactions SET
      category_id = ?,
      description = ?,
      amount = ?,
      type = ?,
      date = ?,
      payment_method = ?,
      status = ?,
      notes = ?
    WHERE id = ? AND user_id = ?
  `, [
    category_id || null,
    description.trim(),
    parseFloat(amount),
    type,
    date,
    payment_method || 'pix',
    status || 'paid',
    notes ? notes.trim() : null,
    id,
    req.userId
  ]);

  if (req.isSupabase && req.userToken) {
    try {
      const supa = getSupabaseClientForUser(req.userToken);
      await supa.from('transactions').update({
        category_id: category_id || null,
        description: description.trim(),
        amount: parseFloat(amount),
        type,
        date,
        payment_method: payment_method || 'pix',
        status: status || 'paid',
        notes: notes ? notes.trim() : null
      }).eq('id', id);
    } catch (e) {
      console.warn('[Supabase updateTransaction err]:', e.message);
    }
  }

  return await getAsync('SELECT * FROM transactions WHERE id = ? AND user_id = ?', [id, req.userId]);
}

async function deleteTransaction(req, id) {
  await runAsync('DELETE FROM transactions WHERE id = ? AND user_id = ?', [id, req.userId]);

  if (req.isSupabase && req.userToken) {
    try {
      const supa = getSupabaseClientForUser(req.userToken);
      await supa.from('transactions').delete().eq('id', id);
    } catch (e) {
      console.warn('[Supabase deleteTransaction err]:', e.message);
    }
  }
  return true;
}

// ────────────── ORÇAMENTOS (BUDGETS) ──────────────
async function getBudgets(req, month) {
  if (req.isSupabase && req.userToken) {
    try {
      const supa = getSupabaseClientForUser(req.userToken);
      const { data, error } = await supa.from('budgets').select(`
        *,
        categories (
          name,
          color,
          icon
        )
      `).eq('month', month);

      if (!error && data) {
        return data.map(b => ({
          ...b,
          category_name: b.categories ? b.categories.name : null,
          category_color: b.categories ? b.categories.color : null,
          category_icon: b.categories ? b.categories.icon : null
        }));
      }
    } catch (e) {
      console.warn('[Supabase getBudgets err, fallback]:', e.message);
    }
  }

  return await allAsync(`
    SELECT 
      b.*,
      c.name as category_name,
      c.color as category_color,
      c.icon as category_icon
    FROM budgets b
    JOIN categories c ON b.category_id = c.id
    WHERE b.user_id = ? AND b.month = ?
  `, [req.userId, month]);
}

async function upsertBudget(req, { category_id, monthly_limit, month }) {
  // SQLite Upsert
  const existing = await getAsync(
    'SELECT id FROM budgets WHERE user_id = ? AND category_id = ? AND month = ?',
    [req.userId, category_id, month]
  );

  if (existing) {
    await runAsync(
      'UPDATE budgets SET monthly_limit = ? WHERE id = ?',
      [parseFloat(monthly_limit), existing.id]
    );
  } else {
    await runAsync(
      'INSERT INTO budgets (user_id, category_id, monthly_limit, month) VALUES (?, ?, ?, ?)',
      [req.userId, category_id, parseFloat(monthly_limit), month]
    );
  }

  // Supabase Upsert
  if (req.isSupabase && req.userToken) {
    try {
      const supa = getSupabaseClientForUser(req.userToken);
      await supa.from('budgets').upsert({
        user_id: req.userId,
        category_id,
        monthly_limit: parseFloat(monthly_limit),
        month
      }, { onConflict: 'user_id,category_id,month' });
    } catch (e) {
      console.warn('[Supabase upsertBudget err]:', e.message);
    }
  }

  return true;
}

module.exports = {
  seedDefaultCategories,
  getCategories,
  createCategory,
  getTransactions,
  createTransaction,
  createTransactionsBatch,
  updateTransaction,
  deleteTransaction,
  getBudgets,
  upsertBudget
};
