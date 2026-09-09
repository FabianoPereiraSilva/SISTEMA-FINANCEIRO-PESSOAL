const express = require('express');
const router = express.Router();
const { runAsync, getAsync, allAsync } = require('../db');
const { hashPassword, verifyPassword, generateToken, requireAuth } = require('../auth');
const crypto = require('crypto');

// Categorias padrão criadas individualmente para cada novo usuário
const DEFAULT_CATEGORIES = [
  // Despesas
  { name: 'Alimentação & Mercado', type: 'expense', color: '#5d2a1a', icon: 'utensils' },
  { name: 'Moradia & Contas', type: 'expense', color: '#17191c', icon: 'home' },
  { name: 'Transporte & Combustível', type: 'expense', color: '#777b86', icon: 'car' },
  { name: 'Saúde & Bem-Estar', type: 'expense', color: '#5d2a1a', icon: 'heart' },
  { name: 'Lazer & Entretenimento', type: 'expense', color: '#979799', icon: 'smile' },
  { name: 'Educação & Livros', type: 'expense', color: '#17191c', icon: 'book' },
  { name: 'Compras Pessoais', type: 'expense', color: '#777b86', icon: 'shopping-bag' },
  { name: 'Serviços & Assinaturas', type: 'expense', color: '#a3a6af', icon: 'credit-card' },
  // Receitas
  { name: 'Salário & Remuneração', type: 'income', color: '#17191c', icon: 'briefcase' },
  { name: 'Rendimentos & Investimentos', type: 'income', color: '#5d2a1a', icon: 'trending-up' },
  { name: 'Freelance & Projetos', type: 'income', color: '#777b86', icon: 'code' },
  { name: 'Outras Receitas', type: 'income', color: '#979799', icon: 'plus-circle' }
];

// Cria categorias padrão para o usuário se não existirem ainda
async function seedCategoriesIfNeeded(userId) {
  const existing = await getAsync('SELECT COUNT(*) as count FROM categories WHERE user_id = ?', [userId]);
  if (existing && existing.count > 0) return; // Já tem categorias

  for (const cat of DEFAULT_CATEGORIES) {
    await runAsync(
      'INSERT INTO categories (user_id, name, type, color, icon) VALUES (?, ?, ?, ?, ?)',
      [userId, cat.name, cat.type, cat.color, cat.icon]
    );
  }
  console.log(`Categorias padrão criadas para usuário: ${userId}`);
}

const dataService = require('../services/dataService');

// ─── Rota: Inicializar sessão Supabase (primeiro acesso via Supabase Auth) ───
// Chamada pelo frontend após login/registro Supabase para garantir categorias padrão
router.post('/init-session', requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const { name, email } = req.user;

    await dataService.seedDefaultCategories(userId, req.userToken);

    return res.json({
      message: 'Sessão inicializada com sucesso.',
      user: { id: userId, name, email }
    });
  } catch (err) {
    console.error('Erro ao inicializar sessão:', err);
    return res.status(500).json({ error: 'Erro ao inicializar sessão.' });
  }
});

// ─── Registrar novo usuário (usa Supabase Admin se disponível, SQLite como fallback) ───
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Preencha todos os campos obrigatórios (nome, email e senha).' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (password.length < 6) {
      return res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres.' });
    }

    // ── Tentar criar via Supabase Admin API (server-side, sem depender do JS client) ──
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseServiceKey) {
      try {
        const { createClient } = require('@supabase/supabase-js');
        const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
          auth: { autoRefreshToken: false, persistSession: false }
        });

        // Tentar sign up via Supabase Auth
        const { data: supaData, error: supaError } = await adminClient.auth.signUp({
          email: trimmedEmail,
          password,
          options: { data: { name: name.trim() } }
        });

        if (supaError) {
          if (supaError.message.toLowerCase().includes('already registered') || supaError.message.toLowerCase().includes('user already registered')) {
            return res.status(400).json({ error: 'Este e-mail já está cadastrado. Use a opção de login.' });
          }
          throw supaError;
        }

        if (supaData && supaData.user) {
          const userId = supaData.user.id;
          await dataService.seedDefaultCategories(userId);

          // Gerar token JWT local para compatibilidade com o sistema
          const token = generateToken({ id: userId, name: name.trim(), email: trimmedEmail });
          console.log(`[Supabase] Usuário criado: ${trimmedEmail} (${userId})`);
          return res.status(201).json({
            message: 'Conta criada com sucesso!',
            token,
            user: { id: userId, name: name.trim(), email: trimmedEmail },
            provider: 'supabase'
          });
        }
      } catch (supaErr) {
        console.warn('[Supabase] Falha no registro via Supabase, usando SQLite:', supaErr.message);
        // Continua para o fallback SQLite
      }
    }

    // ── Fallback: SQLite local ──
    const existing = await getAsync('SELECT id FROM users WHERE email = ?', [trimmedEmail]);
    if (existing) {
      return res.status(400).json({ error: 'Este e-mail já está cadastrado em outra conta.' });
    }

    const userId = crypto.randomUUID();
    const password_hash = hashPassword(password);
    
    await runAsync(
      'INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)',
      [userId, name.trim(), trimmedEmail, password_hash]
    );

    await seedCategoriesIfNeeded(userId);

    const token = generateToken({ id: userId, name: name.trim(), email: trimmedEmail });
    return res.status(201).json({
      message: 'Conta criada com sucesso!',
      token,
      user: { id: userId, name: name.trim(), email: trimmedEmail }
    });
  } catch (err) {
    console.error('Erro no registro:', err);
    return res.status(500).json({ error: 'Erro interno ao criar conta. Tente novamente.' });
  }
});

// ─── Login (backend local, fallback sem Supabase) ───
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Informe e-mail e senha.' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const user = await getAsync('SELECT * FROM users WHERE email = ?', [trimmedEmail]);

    if (!user) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
    }

    const isValid = verifyPassword(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
    }

    const token = generateToken({ id: user.id, name: user.name, email: user.email });
    return res.json({
      message: 'Autenticado com sucesso!',
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error('Erro no login:', err);
    return res.status(500).json({ error: 'Erro interno no servidor ao autenticar.' });
  }
});

// ─── Perfil atual ───
router.get('/me', requireAuth, async (req, res) => {
  try {
    return res.json({
      user: {
        id: req.userId,
        name: req.user.name || req.user.email?.split('@')[0],
        email: req.user.email
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao buscar perfil do usuário.' });
  }
});

// ─── Esqueci minha senha (fallback backend) ───
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Informe seu e-mail.' });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Tentar via Supabase se configurado no servidor
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseAnonKey) {
      try {
        const { createClient } = require('@supabase/supabase-js');
        const supa = createClient(supabaseUrl, supabaseAnonKey);
        const { error } = await supa.auth.resetPasswordForEmail(trimmedEmail);
        if (!error) {
          return res.json({ message: 'Instruções enviadas com sucesso para o seu e-mail.' });
        }
      } catch (e) {
        console.warn('Erro ao disparar reset Supabase no backend:', e.message);
      }
    }

    // Verificar SQLite
    const user = await getAsync('SELECT id FROM users WHERE email = ?', [trimmedEmail]);
    return res.json({ message: 'Se o e-mail estiver cadastrado, as instruções foram enviadas.' });
  } catch (err) {
    console.error('Erro ao processar esqueci senha:', err);
    return res.status(500).json({ error: 'Erro ao processar solicitação.' });
  }
});

module.exports = router;
