// Main Application Controller — Finance Plan Pro
const app = {
  currentTab: 'dashboard',
  currentMonth: new Date().toISOString().slice(0, 7), // 'YYYY-MM'
  isDarkMode: false,
  isPrivacyMode: false,

  async init() {
    // 1. Inicializar tema e privacidade
    this.initTheme();
    this.initPrivacy();

    // 2. Registrar Service Worker PWA para instalação mobile
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js').then(reg => {
          console.log('[PWA] Service Worker registrado com sucesso:', reg.scope);
        }).catch(err => {
          console.warn('[PWA] Service Worker não registrado:', err);
        });
      });
    }

    // 3. Inicializar cliente Supabase
    if (window.supabaseApp) {
      await supabaseApp.init();
    }

    // 4. Inicializar seletor de mês com o mês corrente
    const picker = document.getElementById('globalMonthPicker');
    if (picker) {
      picker.value = this.currentMonth;
    }

    // 5. Listener para fechar modais com tecla ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
      }
    });

    // 6. Fechar modal ao clicar fora da caixa
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('open');
        }
      });
    });

    // 7. Configurar data padrão no modal de transações para hoje
    const today = new Date().toISOString().slice(0, 10);
    const dateInput = document.getElementById('transDate');
    if (dateInput) dateInput.value = today;

    // 8. Eventos de Drag and Drop para Extrato Bancário
    const dropzone = document.getElementById('dropzoneBox');
    if (dropzone) {
      ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropzone.classList.add('dragover');
        }, false);
      });

      ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropzone.classList.remove('dragover');
        }, false);
      });

      dropzone.addEventListener('drop', (e) => {
        transactions.handleFileDrop(e);
      }, false);
    }

    // 9. Verificar se a URL contém retorno de recuperação de senha ou link expirado
    if (window.location.hash) {
      const hashStr = window.location.hash.substring(1);
      const params = new URLSearchParams(hashStr);

      if (params.get('error_code') === 'otp_expired' || params.get('error') || hashStr.includes('otp_expired')) {
        setTimeout(() => {
          this.showToast('O link do e-mail expirou. Abra a mensagem mais recente no Gmail.');
          if (window.history && window.history.replaceState) {
            window.history.replaceState(null, '', window.location.pathname);
          }
          if (window.auth && auth.openForgotPasswordModal) {
            auth.openForgotPasswordModal();
            const feedback = document.getElementById('forgotPasswordFeedback');
            if (feedback) {
              feedback.style.display = 'block';
              feedback.style.background = 'rgba(255, 152, 0, 0.12)';
              feedback.style.border = '1px solid rgba(255, 152, 0, 0.3)';
              feedback.style.color = 'var(--color-ink)';
              feedback.innerHTML = '<strong>Link Expirado:</strong> Como foram feitas solicitações anteriores, links antigos deixam de funcionar automaticamente.<br><br>👉 No seu Gmail, abra a <strong>mensagem mais recente</strong> (no final do grupo de e-mails), ou clique no botão abaixo para gerar um novo.';
            }
          }
        }, 500);
      } else if (hashStr.includes('type=recovery') || hashStr.includes('recovery')) {
        setTimeout(() => {
          if (window.auth && auth.openUpdatePasswordModal) {
            auth.openUpdatePasswordModal();
          }
        }, 400);
      }
    }

    await this.checkSession();
  },

  // ────────────── TEMA ESCURO / CLARO ──────────────
  initTheme() {
    const savedTheme = localStorage.getItem('finflow_theme');
    this.isDarkMode = savedTheme === 'dark';
    this.applyTheme();
  },

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('finflow_theme', this.isDarkMode ? 'dark' : 'light');
    this.applyTheme();
    this.showToast(this.isDarkMode ? 'Modo Escuro ativado 🌙' : 'Modo Claro ativado ☀️');
  },

  applyTheme() {
    const iconSrc = this.isDarkMode ? 'icons/icon-dark.png' : 'icons/icon-light.png';
    
    const headerLogo = document.getElementById('brandLogoImg');
    if (headerLogo) headerLogo.src = iconSrc;
    const authLogo = document.getElementById('authLogoImg');
    if (authLogo) authLogo.src = iconSrc;

    if (this.isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      const icon = document.getElementById('themeToggleIcon');
      if (icon) icon.textContent = '☀️';
    } else {
      document.documentElement.removeAttribute('data-theme');
      const icon = document.getElementById('themeToggleIcon');
      if (icon) icon.textContent = '🌙';
    }
  },

  // ────────────── MODO PRIVACIDADE (OCULTAR SALDOS) ──────────────
  initPrivacy() {
    const saved = localStorage.getItem('finflow_privacy');
    this.isPrivacyMode = saved === 'true';
    this.applyPrivacy();
  },

  togglePrivacy() {
    this.isPrivacyMode = !this.isPrivacyMode;
    localStorage.setItem('finflow_privacy', this.isPrivacyMode ? 'true' : 'false');
    this.applyPrivacy();
    this.showToast(this.isPrivacyMode ? 'Modo Privacidade ativado (valores ocultos) 👁️' : 'Valores visíveis 👁️');
  },

  applyPrivacy() {
    if (this.isPrivacyMode) {
      document.body.classList.add('privacy-mode');
      const icon = document.getElementById('privacyToggleIcon');
      if (icon) icon.textContent = '🙈';
    } else {
      document.body.classList.remove('privacy-mode');
      const icon = document.getElementById('privacyToggleIcon');
      if (icon) icon.textContent = '👁️';
    }
  },

  // ────────────── SESSÃO & AUTENTICAÇÃO ──────────────
  async checkSession() {
    let user = null;
    let token = null;

    if (window.supabaseApp && supabaseApp.isConfigured) {
      const session = await supabaseApp.getSession();
      if (session) {
        user = {
          id: session.user.id,
          name: session.user.user_metadata?.name || session.user.email.split('@')[0],
          email: session.user.email,
          provider: 'supabase'
        };
        token = session.access_token;
        api.setAuth(token, user);
      }
    }

    if (!user) {
      user = api.getUser();
      token = api.getToken();
    }

    const authSec = document.getElementById('authSection');
    const dashSec = document.getElementById('appDashboard');
    const mainNav = document.getElementById('mainNav');
    const mobileBottomNav = document.getElementById('mobileBottomNav');
    const navUserArea = document.getElementById('navUserArea');

    if (token && user) {
      authSec.style.display = 'none';
      dashSec.style.display = 'block';
      mainNav.style.display = 'flex';
      if (mobileBottomNav) mobileBottomNav.style.display = 'flex';

      const initials = user.name
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

      navUserArea.innerHTML = `
        <button class="header-action-btn" onclick="app.togglePrivacy()" title="Alternar Modo Privacidade" id="privacyBtn">
          <span id="privacyToggleIcon">${this.isPrivacyMode ? '🙈' : '👁️'}</span>
        </button>
        <button class="header-action-btn" onclick="app.toggleTheme()" title="Alternar Tema Claro/Escuro" id="themeBtn">
          <span id="themeToggleIcon">${this.isDarkMode ? '☀️' : '🌙'}</span>
        </button>
        <div class="user-badge" title="Conectado como ${user.name} (${user.email})">
          <div class="avatar-bubble">${initials}</div>
          <span class="user-name">${user.name}</span>
        </div>
        <button class="pill-btn pill-btn-ghost" style="padding: 6px 16px; font-size: 13px;" onclick="auth.logout()">
          Sair
        </button>
      `;

      document.getElementById('userGreeting').textContent = user.name.split(' ')[0];
      this.loadActiveTab();
    } else {
      authSec.style.display = 'flex';
      dashSec.style.display = 'none';
      mainNav.style.display = 'none';
      if (mobileBottomNav) mobileBottomNav.style.display = 'none';

      navUserArea.innerHTML = `
        <button class="header-action-btn" onclick="app.toggleTheme()" title="Alternar Tema" style="margin-right: 8px;">
          <span id="themeToggleIcon">${this.isDarkMode ? '☀️' : '🌙'}</span>
        </button>
        <button class="pill-btn pill-btn-filled" onclick="auth.switchTab('login')">
          Entrar
        </button>
      `;
    }
  },

  navigate(tabName) {
    this.currentTab = tabName;

    // Atualizar botões de navegação no desktop
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.toggle('active', link.dataset.tab === tabName);
    });

    // Atualizar botões de navegação no mobile bottom nav
    document.querySelectorAll('.mobile-nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.tab === tabName);
    });

    // Alternar visibilidade das abas
    document.querySelectorAll('.tab-content').forEach(sec => {
      sec.style.display = 'none';
    });

    const activeSec = document.getElementById(`tab-${tabName}`);
    if (activeSec) {
      activeSec.style.display = 'block';
    }

    this.loadActiveTab();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  loadActiveTab() {
    if (this.currentTab === 'dashboard') {
      dashboard.load(this.currentMonth);
    } else if (this.currentTab === 'transactions') {
      transactions.load(this.currentMonth);
    } else if (this.currentTab === 'budgets') {
      budgets.load(this.currentMonth);
    } else if (this.currentTab === 'categories') {
      this.loadCategoriesTab();
    }
  },

  handleMonthChange(monthValue) {
    if (!monthValue) return;
    this.currentMonth = monthValue;
    this.loadActiveTab();
  },

  // ────────────── MODAIS ──────────────
  openModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('open');
  },

  closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('open');
  },

  openTransactionModal(defaultType = 'expense') {
    document.getElementById('transId').value = '';
    document.getElementById('transactionModalTitle').textContent = 'Nova Transação';
    document.getElementById('transType').value = defaultType;
    document.getElementById('transAmount').value = '';
    document.getElementById('transDescription').value = '';
    document.getElementById('transDate').value = new Date().toISOString().slice(0, 10);
    document.getElementById('transMethod').value = 'pix';
    document.getElementById('transStatus').value = 'paid';
    document.getElementById('transNotes').value = '';

    // Reset de opções de parcelamento
    const instCheck = document.getElementById('transIsInstallment');
    if (instCheck) instCheck.checked = false;
    const instBox = document.getElementById('installmentOptionsBox');
    if (instBox) instBox.style.display = 'none';
    const recCheck = document.getElementById('transIsRecurring');
    if (recCheck) recCheck.checked = false;

    this.openModal('transactionModal');
    transactions.loadCategories().then(() => {
      transactions.updateModalCategories(defaultType);
    }).catch(e => console.warn(e));
  },

  openBudgetModal() {
    this.openModal('budgetModal');
    budgets.populateCategories().catch(e => console.warn(e));
  },

  openCategoryModal() {
    document.getElementById('categoryForm').reset();
    this.openModal('categoryModal');
  },

  // ────────────── ABA CATEGORIAS ──────────────
  async loadCategoriesTab() {
    try {
      const res = await api.request('/api/categories');
      const cats = res.categories || [];

      const expenseList = document.getElementById('expenseCategoriesList');
      const incomeList = document.getElementById('incomeCategoriesList');

      const expenses = cats.filter(c => c.type === 'expense');
      const incomes = cats.filter(c => c.type === 'income');

      const renderItem = (c) => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: var(--surface-card-mist); border-radius: 12px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 12px; height: 12px; border-radius: 9999px; background-color: ${c.color || '#17191c'};"></div>
            <span style="font-weight: 500; font-size: 15px;">${c.name}</span>
          </div>
          <button class="text-link-arrow" style="color: var(--color-sienna-brown); font-size: 13px;" onclick="app.deleteCategory(${c.id})">
            Remover
          </button>
        </div>
      `;

      expenseList.innerHTML = expenses.length ? expenses.map(renderItem).join('') : '<p style="color: var(--color-slate-gray); font-size: 14px;">Nenhuma categoria de despesa.</p>';
      incomeList.innerHTML = incomes.length ? incomes.map(renderItem).join('') : '<p style="color: var(--color-slate-gray); font-size: 14px;">Nenhuma categoria de receita.</p>';
    } catch (err) {
      console.error('Erro ao carregar categorias:', err);
    }
  },

  async handleSaveCategory(e) {
    e.preventDefault();
    const name = document.getElementById('catName').value;
    const type = document.getElementById('catTypeSelect').value;

    try {
      await api.request('/api/categories', {
        method: 'POST',
        body: JSON.stringify({ name, type })
      });
      this.showToast('Categoria adicionada com sucesso!');
      this.closeModal('categoryModal');
      this.loadCategoriesTab();
    } catch (err) {
      this.showToast(err.message || 'Erro ao criar categoria.');
    }
  },

  async deleteCategory(id) {
    if (!confirm('Tem certeza que deseja remover esta categoria? Transações vinculadas passarão a ser não categorizadas.')) return;

    try {
      await api.request(`/api/categories/${id}`, { method: 'DELETE' });
      this.showToast('Categoria removida.');
      this.loadCategoriesTab();
    } catch (err) {
      this.showToast(err.message || 'Erro ao remover.');
    }
  },

  // ────────────── TOAST NOTIFICATION ──────────────
  showToast(message) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
};

// Inicialização
window.addEventListener('DOMContentLoaded', () => {
  app.init();
});
