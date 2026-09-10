import React from 'react';
import { motion } from 'framer-motion';
import { Plus, ArrowRight, Upload, Sparkles, TrendingUp } from 'lucide-react';
import { MetricCard3D } from '../components/dashboard/MetricCard3D';
import { Icon3D } from '../components/ui/Icon3D';
import { Button3D } from '../components/ui/Button3D';

export const DashboardView = ({
  currentMonth,
  transactions = [],
  budgets = [],
  categories = [],
  isPrivacyMode,
  onOpenNewTransaction,
  onNavigate
}) => {
  // Compute monthly metrics
  const monthTransactions = transactions.filter(t => (t.date || '').startsWith(currentMonth));

  const totalIncome = monthTransactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + Number(t.amount || 0), 0);

  const totalExpense = monthTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + Number(t.amount || 0), 0);

  const netBalance = totalIncome - totalExpense;

  const totalBudgetLimit = budgets
    .filter(b => b.month === currentMonth)
    .reduce((acc, b) => acc + Number(b.monthly_limit || 0), 0);

  const budgetUsagePercent = totalBudgetLimit > 0
    ? Math.min(100, Math.round((totalExpense / totalBudgetLimit) * 100))
    : 0;

  // Recent 5 transactions
  const recentTransactions = [...monthTransactions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 6);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div style={{ padding: '24px 0', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Editorial Welcome & Quick Actions */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '28px'
        }}
      >
        <div>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-sienna-brown)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            Panorama Mensal
          </span>
          <h2 className="font-serif" style={{ fontSize: '32px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            Visão Geral & Fluxo
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Button3D
            variant="sienna"
            size="md"
            icon={<Plus size={16} />}
            onClick={onOpenNewTransaction}
            shimmer
          >
            Novo Lançamento
          </Button3D>
        </div>
      </div>

      {/* 4 Bento 3D Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '18px',
          marginBottom: '32px'
        }}
      >
        <MetricCard3D
          title="Receitas Totais"
          value={totalIncome}
          rawNumber={totalIncome}
          iconPreset="salary"
          type="income"
          badgeText="Entradas do mês"
          isPrivacyMode={isPrivacyMode}
        />

        <MetricCard3D
          title="Despesas Totais"
          value={totalExpense}
          rawNumber={totalExpense}
          iconPreset="food"
          type="expense"
          badgeText="Saídas realizadas"
          isPrivacyMode={isPrivacyMode}
        />

        <MetricCard3D
          title="Saldo Líquido"
          value={netBalance}
          rawNumber={netBalance}
          iconPreset="brand"
          type={netBalance >= 0 ? 'income' : 'expense'}
          badgeText={netBalance >= 0 ? 'Economia positiva' : 'Atenção ao déficit'}
          isPrivacyMode={isPrivacyMode}
        />

        <MetricCard3D
          title="Consumo de Metas"
          value={`${budgetUsagePercent}%`}
          rawNumber={budgetUsagePercent}
          iconPreset="target"
          type={budgetUsagePercent > 90 ? 'expense' : 'sienna'}
          badgeText={totalBudgetLimit > 0 ? `Limite: ${formatCurrency(totalBudgetLimit)}` : 'Sem metas no mês'}
          isPrivacyMode={false}
        />
      </div>

      {/* 2-Column Split: Budget Progress / Recent Activity */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px'
        }}
      >
        {/* Budget Progress Card */}
        <div className="card-3d" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h3 className="font-serif" style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Progresso dos Orçamentos
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Acompanhamento de metas estabelecidas
              </p>
            </div>
            <Button3D variant="ghost" size="sm" onClick={() => onNavigate('budgets')} icon={<ArrowRight size={14} />}>
              Ver todos
            </Button3D>
          </div>

          {totalBudgetLimit > 0 ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Executado: {formatCurrency(totalExpense)}</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{budgetUsagePercent}%</span>
              </div>

              {/* 3D Progress Bar Track */}
              <div
                style={{
                  height: '14px',
                  background: 'var(--bg-card-secondary)',
                  borderRadius: '9999px',
                  overflow: 'hidden',
                  position: 'relative',
                  border: '1px solid var(--border-color)',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)'
                }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${budgetUsagePercent}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  style={{
                    height: '100%',
                    background: budgetUsagePercent > 90
                      ? 'linear-gradient(90deg, #f87171, #ef4444)'
                      : 'linear-gradient(90deg, #743420, #5d2a1a)',
                    borderRadius: '9999px',
                    boxShadow: '0 2px 8px rgba(93, 42, 26, 0.4)'
                  }}
                />
              </div>

              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '12px' }}>
                {budgetUsagePercent <= 80
                  ? '✨ Seus gastos estão equilibrados dentro do planejado.'
                  : '⚠️ Atenção: você ultrapassou 80% do teto estipulado para o mês.'}
              </p>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-secondary)' }}>
              <Icon3D name="target" size={54} />
              <p style={{ marginTop: '12px', fontSize: '14px' }}>Nenhum orçamento configurado para este mês.</p>
              <Button3D variant="secondary" size="sm" onClick={() => onNavigate('budgets')} style={{ marginTop: '14px' }}>
                Criar Primeira Meta
              </Button3D>
            </div>
          )}
        </div>

        {/* Recent Activity List */}
        <div className="card-3d" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h3 className="font-serif" style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Últimos Lançamentos
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Transações recentes do período
              </p>
            </div>
            <Button3D variant="ghost" size="sm" onClick={() => onNavigate('transactions')} icon={<ArrowRight size={14} />}>
              Ver extrato
            </Button3D>
          </div>

          {recentTransactions.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recentTransactions.map((item) => {
                const isIncome = item.type === 'income';
                return (
                  <motion.div
                    key={item.id}
                    whileHover={{ x: 3 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: '14px',
                      background: 'var(--bg-card-secondary)',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Icon3D name={item.description} size={36} interactive={false} />
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
                          {item.description}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          {item.date} • {item.payment_method?.toUpperCase() || 'PIX'}
                        </div>
                      </div>
                    </div>

                    <div
                      className="font-serif"
                      style={{
                        fontSize: '15px',
                        fontWeight: 600,
                        color: isIncome ? 'var(--color-success)' : 'var(--color-danger)',
                        filter: isPrivacyMode ? 'blur(6px)' : 'none'
                      }}
                    >
                      {isIncome ? '+' : '-'} {formatCurrency(item.amount)}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-secondary)' }}>
              <p style={{ fontSize: '14px' }}>Nenhuma transação registrada neste mês.</p>
              <Button3D variant="sienna" size="sm" onClick={onOpenNewTransaction} style={{ marginTop: '14px' }}>
                Adicionar Lançamento
              </Button3D>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
