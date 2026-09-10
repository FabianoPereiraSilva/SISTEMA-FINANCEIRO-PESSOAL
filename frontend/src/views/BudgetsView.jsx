import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Target, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Icon3D } from '../components/ui/Icon3D';
import { Button3D } from '../components/ui/Button3D';

export const BudgetsView = ({
  currentMonth,
  budgets = [],
  transactions = [],
  categories = [],
  onSaveBudget,
  onDeleteBudget
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [limitAmount, setLimitAmount] = useState('');

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // Calculate spent per category for current month
  const monthExpenses = transactions.filter(t => (t.date || '').startsWith(currentMonth) && t.type === 'expense');

  const expenseCategories = categories.filter(c => c.type === 'expense');

  const handleCreateBudget = (e) => {
    e.preventDefault();
    const limit = parseFloat(limitAmount.replace(',', '.'));
    if (!selectedCategory || isNaN(limit) || limit <= 0) return;

    onSaveBudget({
      category_id: Number(selectedCategory),
      monthly_limit: limit,
      month: currentMonth
    });

    setIsEditing(false);
    setSelectedCategory('');
    setLimitAmount('');
  };

  return (
    <div style={{ padding: '24px 0', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
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
            Planejamento & Metas
          </span>
          <h2 className="font-serif" style={{ fontSize: '32px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            Orçamentos por Categoria
          </h2>
        </div>

        <Button3D
          variant="sienna"
          size="md"
          icon={<Plus size={16} />}
          onClick={() => setIsEditing(true)}
          shimmer
        >
          Definir Novo Teto
        </Button3D>
      </div>

      {/* Inline Form to Add Budget */}
      {isEditing && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-3d"
          style={{ padding: '20px', marginBottom: '24px', background: 'var(--bg-card)' }}
        >
          <form onSubmit={handleCreateBudget} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Categoria de Despesa
              </label>
              <select
                required
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="steep-input"
              >
                <option value="">Selecione uma categoria...</option>
                {expenseCategories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div style={{ flex: 1, minWidth: '180px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Limite Mensal (R$)
              </label>
              <input
                type="text"
                inputMode="decimal"
                required
                value={limitAmount}
                onChange={(e) => setLimitAmount(e.target.value)}
                placeholder="Ex: 1200,00"
                className="steep-input"
              />
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <Button3D variant="secondary" size="md" onClick={() => setIsEditing(false)}>
                Cancelar
              </Button3D>
              <Button3D type="submit" variant="sienna" size="md">
                Salvar Limite
              </Button3D>
            </div>
          </form>
        </motion.div>
      )}

      {/* Grid of Budgets */}
      {budgets.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {budgets.map((b) => {
            const cat = categories.find(c => String(c.id) === String(b.category_id));
            const categoryName = cat ? cat.name : 'Geral';
            
            // Spent in this category
            const spent = monthExpenses
              .filter(t => String(t.category_id) === String(b.category_id))
              .reduce((acc, t) => acc + Number(t.amount || 0), 0);

            const limit = Number(b.monthly_limit || 0);
            const percent = limit > 0 ? Math.round((spent / limit) * 100) : 0;
            const isExceeded = spent > limit;
            const isWarning = percent >= 80 && !isExceeded;

            return (
              <motion.div
                key={b.id}
                whileHover={{ y: -3 }}
                className="card-3d"
                style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Icon3D name={categoryName} size={38} />
                    <div>
                      <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {categoryName}
                      </h4>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {percent}% consumido
                      </span>
                    </div>
                  </div>

                  {isExceeded ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-danger)', fontSize: '12px', fontWeight: 600 }}>
                      <AlertTriangle size={14} /> Estourado
                    </span>
                  ) : isWarning ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-sienna-brown)', fontSize: '12px', fontWeight: 600 }}>
                      <AlertTriangle size={14} /> Atenção
                    </span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-success)', fontSize: '12px', fontWeight: 600 }}>
                      <CheckCircle2 size={14} /> Em dia
                    </span>
                  )}
                </div>

                {/* Progress Bar 3D */}
                <div
                  style={{
                    height: '10px',
                    background: 'var(--bg-card-secondary)',
                    borderRadius: '9999px',
                    overflow: 'hidden',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(100, percent)}%`,
                      background: isExceeded
                        ? 'var(--color-danger)'
                        : isWarning
                        ? 'var(--color-sienna-brown)'
                        : 'var(--color-success)',
                      borderRadius: '9999px',
                      transition: 'width 0.4s ease'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    Gasto: <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(spent)}</strong>
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    Teto: <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(limit)}</strong>
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="card-3d" style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-secondary)' }}>
          <Icon3D name="target" size={54} />
          <h3 className="font-serif" style={{ fontSize: '22px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '16px' }}>
            Nenhum limite estipulado ainda
          </h3>
          <p style={{ fontSize: '14px', maxWidth: '460px', margin: '8px auto 20px auto' }}>
            Defina tetos de gastos para suas categorias para receber alertas inteligentes antes de estourar o orçamento.
          </p>
          <Button3D variant="sienna" size="md" onClick={() => setIsEditing(true)}>
            Adicionar Limite de Categoria
          </Button3D>
        </div>
      )}
    </div>
  );
};
