// Supabase Client Wrapper & Data Layer
const supabaseApp = {
  client: null,
  isConfigured: false,

  async init() {
    try {
      const res = await fetch('/api/config');
      const config = await res.json();

      // __supabaseCreateClient é definido pelo bridge script inline no index.html
      // logo após o carregamento do supabase.min.js — 100% confiável.
      const createClientFn = window.__supabaseCreateClient;

      if (config.supabaseUrl && config.supabaseAnonKey && createClientFn) {
        this.client = createClientFn(config.supabaseUrl, config.supabaseAnonKey);
        this.isConfigured = true;
        console.log('✓ Supabase Client inicializado com sucesso.');

        // Escutar recuperação de senha e eventos de auth
        this.client.auth.onAuthStateChange(async (event, session) => {
          if (event === 'PASSWORD_RECOVERY') {
            console.log('Evento Supabase PASSWORD_RECOVERY capturado.');
            if (window.auth && auth.openUpdatePasswordModal) {
              auth.openUpdatePasswordModal();
            }
          }
        });
      } else {
        console.warn('Supabase não pôde ser inicializado:', {
          hasUrl: !!config.supabaseUrl,
          hasKey: !!config.supabaseAnonKey,
          hasCreateClient: !!createClientFn
        });
      }
    } catch (err) {
      console.warn('Supabase não configurado ou offline. Usando backend local.', err);
    }
  },

  // Autenticação via Supabase Auth
  async register(name, email, password) {
    if (!this.isConfigured) throw new Error('Supabase não inicializado.');
    
    const { data, error } = await this.client.auth.signUp({
      email,
      password,
      options: {
        data: { name }
      }
    });

    if (error) throw error;
    return data;
  },

  async login(email, password) {
    if (!this.isConfigured) throw new Error('Supabase não inicializado.');

    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data;
  },

  async resetPassword(email) {
    if (!this.isConfigured) throw new Error('Supabase não inicializado.');
    const redirectTo = window.location.origin;
    const { data, error } = await this.client.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo
    });
    if (error) throw error;
    return data;
  },

  async updatePassword(newPassword) {
    if (!this.isConfigured) throw new Error('Supabase não inicializado.');
    const { data, error } = await this.client.auth.updateUser({
      password: newPassword
    });
    if (error) throw error;
    return data;
  },

  async logout() {
    if (this.client) {
      await this.client.auth.signOut();
    }
  },

  async getSession() {
    if (!this.client) return null;
    const { data } = await this.client.auth.getSession();
    return data.session;
  },

  // Transações no Supabase com RLS
  async getTransactions(month) {
    if (!this.client) return [];
    let query = this.client
      .from('transactions')
      .select('*, categories(name, color, icon)')
      .order('date', { ascending: false });

    if (month) {
      const start = `${month}-01`;
      const end = `${month}-31`;
      query = query.gte('date', start).lte('date', end);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Erro Supabase getTransactions:', error);
      throw error;
    }
    
    // Normalizar para o formato esperado pelo frontend
    return (data || []).map(t => ({
      ...t,
      category_name: t.categories ? t.categories.name : null,
      category_color: t.categories ? t.categories.color : null,
      category_icon: t.categories ? t.categories.icon : null
    }));
  },

  async createTransaction(transaction) {
    const session = await this.getSession();
    if (!session) throw new Error('Não autenticado no Supabase.');

    const { data, error } = await this.client
      .from('transactions')
      .insert([{
        user_id: session.user.id,
        category_id: transaction.category_id || null,
        description: transaction.description,
        amount: parseFloat(transaction.amount),
        type: transaction.type,
        date: transaction.date,
        payment_method: transaction.payment_method,
        status: transaction.status,
        notes: transaction.notes || null
      }])
      .select('*, categories(name, color, icon)')
      .single();

    if (error) throw error;
    return {
      ...data,
      category_name: data.categories ? data.categories.name : null,
      category_color: data.categories ? data.categories.color : null
    };
  },

  async updateTransaction(id, transaction) {
    const { data, error } = await this.client
      .from('transactions')
      .update({
        category_id: transaction.category_id !== undefined ? transaction.category_id : undefined,
        description: transaction.description,
        amount: transaction.amount ? parseFloat(transaction.amount) : undefined,
        type: transaction.type,
        date: transaction.date,
        payment_method: transaction.payment_method,
        status: transaction.status,
        notes: transaction.notes
      })
      .eq('id', id)
      .select('*, categories(name, color, icon)')
      .single();

    if (error) throw error;
    return data;
  },

  async deleteTransaction(id) {
    const { error } = await this.client
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  // Categorias
  async getCategories() {
    if (!this.client) return [];
    const { data, error } = await this.client
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async createCategory(category) {
    const session = await this.getSession();
    if (!session) throw new Error('Não autenticado.');

    const { data, error } = await this.client
      .from('categories')
      .insert([{
        user_id: session.user.id,
        name: category.name,
        type: category.type,
        color: category.color || '#17191c',
        icon: category.icon || 'tag'
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteCategory(id) {
    const { error } = await this.client
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  // Orçamentos
  async getBudgets(month) {
    if (!this.client) return [];
    const { data, error } = await this.client
      .from('budgets')
      .select('*, categories(name, color, icon)')
      .eq('month', month);

    if (error) throw error;

    // Buscar gastos de cada categoria no mês
    const start = `${month}-01`;
    const end = `${month}-31`;
    const { data: trans } = await this.client
      .from('transactions')
      .select('category_id, amount')
      .eq('type', 'expense')
      .gte('date', start)
      .lte('date', end);

    const spentMap = {};
    (trans || []).forEach(t => {
      spentMap[t.category_id] = (spentMap[t.category_id] || 0) + parseFloat(t.amount);
    });

    return (data || []).map(b => {
      const spent = spentMap[b.category_id] || 0;
      const limit = parseFloat(b.monthly_limit) || 0;
      const percentage = limit > 0 ? Math.min(Math.round((spent / limit) * 100), 100) : 0;
      return {
        ...b,
        category_name: b.categories ? b.categories.name : 'Categoria',
        spent,
        limit,
        remaining: limit - spent,
        percentage,
        isOverLimit: spent > limit
      };
    });
  },

  async saveBudget(categoryId, limit, month) {
    const session = await this.getSession();
    if (!session) throw new Error('Não autenticado.');

    const { data, error } = await this.client
      .from('budgets')
      .upsert({
        user_id: session.user.id,
        category_id: categoryId,
        monthly_limit: parseFloat(limit),
        month
      }, { onConflict: 'user_id, category_id, month' })
      .select();

    if (error) throw error;
    return data;
  },

  async deleteBudget(id) {
    const { error } = await this.client
      .from('budgets')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
};
