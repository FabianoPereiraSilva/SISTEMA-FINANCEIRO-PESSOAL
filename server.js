require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb } = require('./src/db');

const authRoutes = require('./src/routes/authRoutes');
const transactionRoutes = require('./src/routes/transactionRoutes');
const categoryRoutes = require('./src/routes/categoryRoutes');
const budgetRoutes = require('./src/routes/budgetRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log simples de requisições
app.use((req, res, next) => {
  console.log(`[HTTP] ${req.method} ${req.url}`);
  next();
});

// 1. Rotas da API Primeiro (evita interceptação pelo serve-static)
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Endpoint de configuração pública do Supabase
app.get('/api/config', (req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL || null,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || null
  });
});

// 2. Servir frontend estático da pasta public DEPOIS das APIs (sem cache no desenvolvimento)
app.use(express.static(path.join(__dirname, 'public'), {
  etag: false,
  maxAge: 0,
  setHeaders: (res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  }
}));

// 3. Rota de fallback para SPA (com tratamento seguro para serverless)
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint da API não encontrado.' });
  }
  const indexPath = path.join(__dirname, 'public', 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      // Se não encontrar o arquivo no filesystem do Lambda (normal no Vercel), envia 404 limpo
      res.status(404).json({ error: 'Página estática não encontrada no servidor de aplicação.' });
    }
  });
});

// Middleware global de erro para evitar FUNCTION_INVOCATION_FAILED
app.use((err, req, res, next) => {
  console.error('[Finance Plan Error]:', err);
  res.status(500).json({ error: 'Erro interno do servidor', message: err.message });
});

// Inicialização
async function startServer() {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`=================================================`);
      console.log(` Finance Plan — Sistema Financeiro Pessoal`);
      console.log(` Servidor rodando em: http://localhost:${PORT}`);
      console.log(`=================================================`);
    });
  } catch (err) {
    console.error('Falha crítica ao iniciar servidor:', err);
    process.exit(1);
  }
}

// Em ambiente Serverless (Vercel), roda initDb de forma assíncrona não bloqueante
if (process.env.VERCEL) {
  initDb().catch(err => console.warn('[Vercel InitDb]:', err.message));
}

if (require.main === module && !process.env.VERCEL) {
  startServer();
}

module.exports = app;
