import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Trash2, Edit2, ArrowDownLeft, ArrowUpRight, Filter } from 'lucide-react';
import { Icon3D } from '../components/ui/Icon3D';
import { Button3D } from '../components/ui/Button3D';

export const TransactionsView = ({
  currentMonth,
  transactions = [],
  categories = [],
  isPrivacyMode,
  onOpenNewTransaction,
  onEditTransaction,
  onDeleteTransaction
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'expense' | 'income'
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filtered = transactions
    .filter(t => (t.date || '').startsWith(currentMonth))
    .filter(t => {
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;
      if (categoryFilter !== 'all' && String(t.category_id) !== String(categoryFilter)) return false;
      if (searchTerm.trim() && !t.description.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
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
          marginBottom: '24px'
        }}
      >
        <div>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-sienna-brown)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            Extrato Geral
          </span>
          <h2 className="font-serif" style={{ fontSize: '32px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            Transações do Mês
          </h2>
        </div>

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

      {/* Filter Bar */}
      <div
        className="card-3d"
        style={{
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '12px'
        }}
      >
        {/* Search Input */}
        <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
          <Search size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '13px' }} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por descrição..."
            className="steep-input"
            style={{ padding: '9px 12px 9px 36px', fontSize: '13px' }}
          />
        </div>

        {/* Type Filter Pills */}
        <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-card-secondary)', padding: '4px', borderRadius: '12px' }}>
          {[
            { id: 'all', label: 'Todos' },
            { id: 'expense', label: 'Despesas' },
            { id: 'income', label: 'Receitas' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setTypeFilter(f.id)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: 'none',
                background: typeFilter === f.id ? 'var(--color-ink-black)' : 'transparent',
                color: typeFilter === f.id ? '#ffffff' : 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Category Dropdown */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="steep-input"
          style={{ width: 'auto', minWidth: '160px', padding: '8px 12px', fontSize: '13px', cursor: 'pointer' }}
        >
          <option value="all">Todas as Categorias</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Transactions List */}
      <div className="card-3d" style={{ overflow: 'hidden' }}>
        {filtered.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <AnimatePresence>
              {filtered.map((item, index) => {
                const isIncome = item.type === 'income';
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2, delay: index * 0.02 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px 20px',
                      borderBottom: '1px solid var(--border-color)',
                      background: 'var(--bg-card)',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <Icon3D name={item.description} size={42} />
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {item.description}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {item.date} • {item.payment_method?.toUpperCase() || 'PIX'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div
                        className="font-serif"
                        style={{
                          fontSize: '18px',
                          fontWeight: 600,
                          color: isIncome ? 'var(--color-success)' : 'var(--color-danger)',
                          filter: isPrivacyMode ? 'blur(6px)' : 'none'
                        }}
                      >
                        {isIncome ? '+' : '-'} {formatCurrency(item.amount)}
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Button3D
                          variant="secondary"
                          size="icon"
                          onClick={() => onEditTransaction(item)}
                          title="Editar"
                          style={{ width: '32px', height: '32px', padding: '6px' }}
                        >
                          <Edit2 size={14} />
                        </Button3D>
                        <Button3D
                          variant="ghost"
                          size="icon"
                          onClick={() => onDeleteTransaction(item.id)}
                          title="Excluir"
                          style={{ width: '32px', height: '32px', padding: '6px', color: 'var(--color-danger)' }}
                        >
                          <Trash2 size={14} />
                        </Button3D>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-secondary)' }}>
            <p style={{ fontSize: '15px' }}>Nenhum lançamento encontrado para os filtros selecionados.</p>
            <Button3D variant="sienna" size="md" onClick={onOpenNewTransaction} style={{ marginTop: '16px' }}>
              Criar Novo Lançamento
            </Button3D>
          </div>
        )}
      </div>
    </div>
  );
};
