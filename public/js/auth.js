// Authentication Management
const auth = {
  switchTab(tab) {
    const loginBtn = document.getElementById('tabLoginBtn');
    const regBtn = document.getElementById('tabRegisterBtn');
    const loginForm = document.getElementById('loginForm');
    const regForm = document.getElementById('registerForm');

    if (tab === 'login') {
      loginBtn.classList.add('active');
      regBtn.classList.remove('active');
      loginForm.style.display = 'flex';
      regForm.style.display = 'none';
    } else {
      regBtn.classList.add('active');
      loginBtn.classList.remove('active');
      regForm.style.display = 'flex';
      loginForm.style.display = 'none';
    }
  },

  // Inicializa a sessão no backend após login Supabase (cria categorias padrão se necessário)
  async initBackendSession(token) {
    try {
      const response = await fetch('/api/auth/init-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        console.warn('Aviso ao inicializar sessão backend:', data.error || response.status);
      }
    } catch (err) {
      console.warn('Aviso: não foi possível inicializar sessão backend.', err.message);
    }
  },

  async handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    const btn = e.target ? e.target.querySelector('button[type="submit"]') : null;
    if (btn) { btn.disabled = true; btn.textContent = 'Entrando...'; }

    try {
      // 1. Tentar login via Supabase se configurado
      if (window.supabaseApp && supabaseApp.isConfigured) {
        try {
          const supaRes = await supabaseApp.login(email, password);
          if (supaRes && supaRes.user) {
            const token = supaRes.session.access_token;
            const user = {
              id: supaRes.user.id,
              name: supaRes.user.user_metadata?.name || email.split('@')[0],
              email: supaRes.user.email,
              provider: 'supabase'
            };
            api.setAuth(token, user);

            // Inicializar sessão no backend (garante categorias padrão)
            await this.initBackendSession(token);

            document.getElementById('loginForm').reset();
            app.showToast(`Olá, ${user.name}! Login realizado com sucesso.`);
            app.checkSession();
            return;
          }
        } catch (supaErr) {
          const msg = supaErr.message || '';
          if (msg.toLowerCase().includes('email not confirmed')) {
            throw new Error('E-mail não confirmado. Verifique sua caixa de entrada.');
          }
          if (msg.toLowerCase().includes('invalid login credentials') || msg.toLowerCase().includes('invalid credentials')) {
            throw new Error('E-mail ou senha incorretos.');
          }
          // Se for outro erro do Supabase, propaga
          throw new Error(msg || 'Falha ao autenticar via Supabase.');
        }
      }

      // 2. Fallback para Backend Local
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao fazer login.');

      api.setAuth(data.token, data.user);
      document.getElementById('loginForm').reset();
      app.showToast(`Bem-vindo de volta, ${data.user.name}!`);
      app.checkSession();
    } catch (err) {
      app.showToast(err.message || 'Falha ao autenticar.');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Entrar na Conta'; }
    }
  },

  async handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;

    if (!name || !email || !password) {
      app.showToast('Por favor, preencha todos os campos.');
      return;
    }
    if (password.length < 6) {
      app.showToast('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    const btn = e.target ? e.target.querySelector('button[type="submit"]') : null;
    if (btn) { btn.disabled = true; btn.textContent = 'Criando conta...'; }

    try {
      // 1. Tentar registro via Supabase Auth
      if (window.supabaseApp && supabaseApp.isConfigured) {
        try {
          const supaRes = await supabaseApp.register(name, email, password);

          // Caso A: Supabase retornou sessão imediata (confirmação de email desativada)
          if (supaRes && supaRes.session) {
            const token = supaRes.session.access_token;
            const user = {
              id: supaRes.user.id,
              name: name,
              email: email,
              provider: 'supabase'
            };
            api.setAuth(token, user);

            // Inicializar sessão no backend (cria categorias padrão)
            await this.initBackendSession(token);

            document.getElementById('registerForm').reset();
            app.showToast(`Conta criada com sucesso! Bem-vindo, ${name}.`);
            app.checkSession();
            return;
          }

          // Caso B: Supabase exige confirmação por email
          if (supaRes && supaRes.user) {
            app.showToast(`Conta criada! Verifique seu e-mail (${email}) para confirmar o cadastro.`);
            this.switchTab('login');
            document.getElementById('loginEmail').value = email;
            return;
          }

          throw new Error('Resposta inesperada do Supabase durante o cadastro.');
        } catch (supaErr) {
          const msg = supaErr.message || '';
          if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('user already registered')) {
            throw new Error('Este e-mail já está cadastrado. Use a aba "Entrar" para fazer login.');
          }
          if (msg.toLowerCase().includes('password should be at least')) {
            throw new Error('A senha deve ter no mínimo 6 caracteres.');
          }
          throw new Error(msg || 'Falha ao criar conta no Supabase.');
        }
      }

      // 2. Fallback para Backend Local
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao criar conta.');

      api.setAuth(data.token, data.user);
      document.getElementById('registerForm').reset();
      app.showToast(`Conta criada com sucesso! Olá, ${data.user.name}.`);
      app.checkSession();
    } catch (err) {
      app.showToast(err.message || 'Falha ao cadastrar conta.');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Criar Conta'; }
    }
  },

  async logout() {
    try {
      if (window.supabaseApp) {
        await supabaseApp.logout();
      }
    } catch (err) {
      console.warn('Erro ao deslogar do Supabase:', err);
    }
    api.clearAuth();
    app.showToast('Sessão encerrada com segurança.');
    app.checkSession();
  },

  fillDemo() {
    this.switchTab('login');
    document.getElementById('loginEmail').value = 'demo@steep.com';
    document.getElementById('loginPassword').value = 'demo123456';
    const fakeEvent = { preventDefault: () => {}, target: null };
    this.handleLogin(fakeEvent);
  }
};
