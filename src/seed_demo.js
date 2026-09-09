const { runAsync, getAsync } = require('./db');
const { hashPassword } = require('./auth');

async function seed() {
  const email = 'demo@steep.com';
  const existing = await getAsync('SELECT id FROM users WHERE email = ?', [email]);
  if (existing) {
    console.log('Usuário demo já existe:', email);
    return;
  }

  const hash = hashPassword('demo123456');
  const user = await runAsync(
    'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
    ['Helena R.', email, hash]
  );
  const userId = user.id;

  // Categorias padrão
  const cats = [
    { name: 'Alimentação & Mercado', type: 'expense', color: '#5d2a1a', icon: 'utensils' },
    { name: 'Moradia & Contas', type: 'expense', color: '#17191c', icon: 'home' },
    { name: 'Transporte & Mobilidade', type: 'expense', color: '#777b86', icon: 'car' },
    { name: 'Lazer & Cultura', type: 'expense', color: '#979799', icon: 'smile' },
    { name: 'Saúde & Cuidados', type: 'expense', color: '#5d2a1a', icon: 'heart' },
    { name: 'Salário & Honorários', type: 'income', color: '#17191c', icon: 'briefcase' },
    { name: 'Dividendos & Rendimentos', type: 'income', color: '#5d2a1a', icon: 'trending-up' }
  ];

  const catMap = {};
  for (const c of cats) {
    const r = await runAsync(
      'INSERT INTO categories (user_id, name, type, color, icon) VALUES (?, ?, ?, ?, ?)',
      [userId, c.name, c.type, c.color, c.icon]
    );
    catMap[c.name] = r.id;
  }

  const today = new Date();
  const currentYm = today.toISOString().slice(0, 7);

  // Transações do mês atual
  const transactions = [
    { cat: 'Salário & Honorários', desc: 'Remuneração Mensal Principal', amt: 12500, type: 'income', date: `${currentYm}-05`, method: 'pix', status: 'paid' },
    { cat: 'Dividendos & Rendimentos', desc: 'Rendimentos FIIs e Ações', amt: 1180, type: 'income', date: `${currentYm}-15`, method: 'transfer', status: 'paid' },
    { cat: 'Moradia & Contas', desc: 'Aluguel e Condomínio', amt: 3200, type: 'expense', date: `${currentYm}-06`, method: 'transfer', status: 'paid' },
    { cat: 'Alimentação & Mercado', desc: 'Supermercado e Feira Orgânica', amt: 1420, type: 'expense', date: `${currentYm}-08`, method: 'credit', status: 'paid' },
    { cat: 'Transporte & Mobilidade', desc: 'Combustível e Estacionamento', amt: 480, type: 'expense', date: `${currentYm}-10`, method: 'debit', status: 'paid' },
    { cat: 'Lazer & Cultura', desc: 'Jantar Restaurante Vinho', amt: 390, type: 'expense', date: `${currentYm}-12`, method: 'credit', status: 'paid' },
    { cat: 'Saúde & Cuidados', desc: 'Plano de Saúde Individual', amt: 650, type: 'expense', date: `${currentYm}-14`, method: 'pix', status: 'paid' }
  ];

  for (const t of transactions) {
    await runAsync(`
      INSERT INTO transactions (user_id, category_id, description, amount, type, date, payment_method, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [userId, catMap[t.cat], t.desc, t.amt, t.type, t.date, t.method, t.status]);
  }

  // Metas de orçamento
  await runAsync(`
    INSERT INTO budgets (user_id, category_id, monthly_limit, month)
    VALUES (?, ?, ?, ?)
  `, [userId, catMap['Alimentação & Mercado'], 2000, currentYm]);

  await runAsync(`
    INSERT INTO budgets (user_id, category_id, monthly_limit, month)
    VALUES (?, ?, ?, ?)
  `, [userId, catMap['Lazer & Cultura'], 800, currentYm]);

  console.log('Usuário demo criado com sucesso!');
  console.log('Login:', email);
  console.log('Senha: demo123456');
}

seed();
