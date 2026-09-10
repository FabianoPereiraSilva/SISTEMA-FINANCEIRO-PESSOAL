import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './services/supabase';
import { Header } from './components/layout/Header';
import { MobileNav } from './components/layout/MobileNav';
import { BottomSheet } from './components/ui/BottomSheet';
import { TransactionForm } from './components/transactions/TransactionForm';
import { AuthView } from './views/AuthView';
import { DashboardView } from './views/DashboardView';
import { TransactionsView } from './views/TransactionsView';
import { BudgetsView } from './views/BudgetsView';
import { CategoriesView } from './views/CategoriesView';

export function App() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('fp_theme') === 'dark');
  const [isPrivacyMode, setIsPrivacyMode] = useState(() => localStorage.getItem('fp_privacy') === 'true');

  // Application Data State
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [savingTx, setSavingTx] = useState(false);

  // Apply Theme to document root
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('fp_theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('fp_theme', 'light');
    }
  }, [isDarkMode]);

  // Apply Privacy Mode persistence
  useEffect(() => {
    localStorage.setItem('fp_privacy', isPrivacyMode ? 'true' : 'false');
  }, [isPrivacyMode]);

  // Check Supabase session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          setUser(session.user);
        }
      } catch (e) {
        console.warn('Erro ao verificar sessão Supabase:', e);
      } finally {
        setLoadingUser(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Fetch application data
  const fetchData = useCallback(async () => {
    if (!user) return;

    try {
      // 1. Categories
      const { data: cats, error: catErr } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (!catErr && cats) {
        setCategories(cats);
      }

      // 2. Transactions
      const { data: txs, error: txErr } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      if (!txErr && txs) {
        setTransactions(txs);
      }

      // 3. Budgets
      const { data: bdgs, error: bdgErr } = await supabase
        .from('budgets')
        .select('*');

      if (!bdgErr && bdgs) {
        setBudgets(bdgs);
      }
    } catch (err) {
      console.warn('Erro ao carregar dados do Supabase:', err);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  // Handlers for Transactions
  const handleSaveTransaction = async (formData) => {
    setSavingTx(true);
    try {
      if (formData.id) {
        // Update
        const { error } = await supabase
          .from('transactions')
          .update({
            description: formData.description,
            amount: formData.amount,
            type: formData.type,
            category_id: formData.category_id,
            date: formData.date,
            payment_method: formData.payment_method
          })
          .eq('id', formData.id);

        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('transactions')
          .insert([{
            description: formData.description,
            amount: formData.amount,
            type: formData.type,
            category_id: formData.category_id,
            date: formData.date,
            payment_method: formData.payment_method
          }]);

        if (error) throw error;
      }

      await fetchData();
      setIsTxModalOpen(false);
      setEditingTx(null);
    } catch (err) {
      alert('Erro ao salvar transação: ' + (err.message || 'Verifique sua conexão.'));
    } finally {
      setSavingTx(false);
    }
  };

  const handleDeleteTransaction = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este lançamento?')) return;
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      alert('Erro ao excluir transação: ' + err.message);
    }
  };

  // Handlers for Budgets
  const handleSaveBudget = async (budgetData) => {
    try {
      const { error } = await supabase
        .from('budgets')
        .upsert([{
          category_id: budgetData.category_id,
          monthly_limit: budgetData.monthly_limit,
          month: budgetData.month
        }], { onConflict: 'user_id,category_id,month' });

      if (error) throw error;
      await fetchData();
    } catch (err) {
      alert('Erro ao salvar orçamento: ' + err.message);
    }
  };

  // Handlers for Categories
  const handleSaveCategory = async (catData) => {
    try {
      const { error } = await supabase
        .from('categories')
        .insert([{
          name: catData.name,
          type: catData.type
        }]);

      if (error) throw error;
      await fetchData();
    } catch (err) {
      alert('Erro ao salvar categoria: ' + err.message);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (loadingUser) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-app)' }}>
        <div style={{ textAlign: 'center' }}>
          <img src="/images/fp-symbol-3d-transparent.png" alt="Carregando..." onError={(e) => { e.target.src = '/icons/icon-light.png'; }} style={{ width: '64px', height: '64px', objectFit: 'contain', animation: 'pulse 1.5s infinite' }} />
          <p style={{ marginTop: '14px', fontSize: '13px', color: 'var(--text-secondary)' }}>Carregando Finance Plan...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthView onAuthSuccess={(u) => setUser(u)} />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-app)' }}>
      {/* Top Header */}
      <Header
        user={user}
        currentTab={currentTab}
        onNavigate={setCurrentTab}
        currentMonth={currentMonth}
        onChangeMonth={setCurrentMonth}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(prev => !prev)}
        isPrivacyMode={isPrivacyMode}
        onTogglePrivacy={() => setIsPrivacyMode(prev => !prev)}
        onSignOut={handleSignOut}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '0 20px 100px 20px', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
        <AnimatePresence mode="wait">
          {currentTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <DashboardView
                currentMonth={currentMonth}
                transactions={transactions}
                budgets={budgets}
                categories={categories}
                isPrivacyMode={isPrivacyMode}
                onOpenNewTransaction={() => { setEditingTx(null); setIsTxModalOpen(true); }}
                onNavigate={setCurrentTab}
              />
            </motion.div>
          )}

          {currentTab === 'transactions' && (
            <motion.div
              key="transactions"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <TransactionsView
                currentMonth={currentMonth}
                transactions={transactions}
                categories={categories}
                isPrivacyMode={isPrivacyMode}
                onOpenNewTransaction={() => { setEditingTx(null); setIsTxModalOpen(true); }}
                onEditTransaction={(tx) => { setEditingTx(tx); setIsTxModalOpen(true); }}
                onDeleteTransaction={handleDeleteTransaction}
              />
            </motion.div>
          )}

          {currentTab === 'budgets' && (
            <motion.div
              key="budgets"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <BudgetsView
                currentMonth={currentMonth}
                budgets={budgets}
                transactions={transactions}
                categories={categories}
                onSaveBudget={handleSaveBudget}
              />
            </motion.div>
          )}

          {currentTab === 'categories' && (
            <motion.div
              key="categories"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <CategoriesView
                categories={categories}
                onSaveCategory={handleSaveCategory}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Navigation Bar with 3D FAB */}
      <MobileNav
        currentTab={currentTab}
        onNavigate={setCurrentTab}
        onOpenNewTransaction={() => { setEditingTx(null); setIsTxModalOpen(true); }}
      />

      {/* Quick Entry Drawer / Bottom Sheet */}
      <BottomSheet
        isOpen={isTxModalOpen}
        onClose={() => { setIsTxModalOpen(false); setEditingTx(null); }}
        title={editingTx ? 'Editar Lançamento' : 'Novo Lançamento'}
        subtitle="Preencha os detalhes para manter seu fluxo atualizado"
      >
        <TransactionForm
          initialData={editingTx}
          categories={categories}
          loading={savingTx}
          onSave={handleSaveTransaction}
          onCancel={() => { setIsTxModalOpen(false); setEditingTx(null); }}
        />
      </BottomSheet>
    </div>
  );
}

export default App;
