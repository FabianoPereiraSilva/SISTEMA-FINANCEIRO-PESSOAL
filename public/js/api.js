// API Client & Storage Helper
const api = {
  getToken() {
    return localStorage.getItem('finflow_token');
  },

  setAuth(token, user) {
    localStorage.setItem('finflow_token', token);
    localStorage.setItem('finflow_user', JSON.stringify(user));
  },

  getUser() {
    try {
      const u = localStorage.getItem('finflow_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  },

  clearAuth() {
    localStorage.removeItem('finflow_token');
    localStorage.removeItem('finflow_user');
  },

  async request(url, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, { ...options, headers });
      
      if (response.status === 401) {
        this.clearAuth();
        app.checkSession();
        throw new Error('Sessão expirada. Entre novamente.');
      }

      const text = await response.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { error: text || 'Erro de comunicação com o servidor.' };
      }

      if (!response.ok) {
        throw new Error(data.error || `Erro HTTP ${response.status}`);
      }

      return data;
    } catch (err) {
      throw err;
    }
  },

  // Formatação em Real Brasileiro (R$ 1.250,00)
  formatCurrency(value) {
    const val = parseFloat(value) || 0;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(val);
  },

  // Formatação de data amigável DD/MM/AAAA
  formatDate(dateStr) {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  }
};
