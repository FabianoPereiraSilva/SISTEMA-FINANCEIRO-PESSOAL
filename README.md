# Finance Plan — Sistema de Gestão Financeira Pessoal

> *Serif analytics on warm paper — Elegância editorial, isolamento estrito de dados e sincronização na nuvem com Supabase.*

---

## ✨ Funcionalidades Principais

- ☁️ **Persistência em Nuvem (Supabase)**: Autenticação segura e banco de dados PostgreSQL na nuvem com *Row Level Security (RLS)*.
- 📂 **Importação de Extratos Bancários (OFX e CSV)**: Arraste extratos do Nubank, Itaú, Inter, Bradesco, etc., com pré-visualização e auto-categorização inteligente.
- 💳 **Compras Parceladas & Contas Fixas**: Projeção automática de parcelas em meses futuros (ex: 12x) e identificação de despesas fixas.
- 🌓 **Modo Escuro & Modo Claro Editorial**: Alternador refinado de tema que respeita as preferências do usuário.
- 👁️ **Modo Privacidade**: Ocultação rápida de saldos com efeito blur para uso seguro em locais públicos.
- 📱 **PWA Completo & Mobile First**: Instalável como aplicativo no celular (iOS/Android), barra inferior táctil (*Bottom Nav*) e botão flutuante rápido (`+`).

---

## 🚀 Como Rodar Localmente

### 1. Clonar e Instalar Dependências
```bash
npm install
```

### 2. Configurar Variáveis de Ambiente
Crie um arquivo `.env` baseado no `.env.example`:
```env
PORT=3000
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anon-aqui
JWT_SECRET=sua-chave-jwt-aqui
```

### 3. Iniciar o Servidor
```bash
npm start
```
Acesse em: `http://localhost:3000`

---

## ⚡ Como Fazer Deploy na Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login com sua conta do GitHub.
2. Clique em **"Add New..." ➔ "Project"**.
3. Importe o repositório: `FabianoPereiraSilva/SISTEMA-FINANCEIRO-PESSOAL`.
4. Em **Environment Variables**, adicione as seguintes variáveis:
   - `SUPABASE_URL`: sua URL do Supabase
   - `SUPABASE_ANON_KEY`: sua chave anônima do Supabase
   - `JWT_SECRET`: uma chave secreta qualquer para assinar tokens locais
5. Clique em **"Deploy"**. A Vercel publicará sua aplicação com certificado SSL gratuito em segundos!
