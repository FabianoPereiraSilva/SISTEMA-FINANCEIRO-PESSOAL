import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Tags } from 'lucide-react';
import { Icon3D } from '../components/ui/Icon3D';
import { Button3D } from '../components/ui/Button3D';

export const CategoriesView = ({ categories = [], onSaveCategory }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('expense');

  const handleCreate = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSaveCategory({
      name: name.trim(),
      type
    });

    setName('');
    setIsAdding(false);
  };

  const expenses = categories.filter(c => c.type === 'expense');
  const incomes = categories.filter(c => c.type === 'income');

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
            Personalização
          </span>
          <h2 className="font-serif" style={{ fontSize: '32px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            Categorias & Classificação
          </h2>
        </div>

        <Button3D
          variant="sienna"
          size="md"
          icon={<Plus size={16} />}
          onClick={() => setIsAdding(true)}
          shimmer
        >
          Nova Categoria
        </Button3D>
      </div>

      {/* Add Form */}
      {isAdding && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-3d"
          style={{ padding: '20px', marginBottom: '24px', background: 'var(--bg-card)' }}
        >
          <form onSubmit={handleCreate} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: '220px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Nome da Categoria
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Investimentos, Pet Shop, Streaming"
                className="steep-input"
              />
            </div>

            <div style={{ width: '180px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Tipo
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="steep-input"
              >
                <option value="expense">Despesa</option>
                <option value="income">Receita</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <Button3D variant="secondary" size="md" onClick={() => setIsAdding(false)}>
                Cancelar
              </Button3D>
              <Button3D type="submit" variant="sienna" size="md">
                Salvar Categoria
              </Button3D>
            </div>
          </form>
        </motion.div>
      )}

      {/* Categories Grid Split */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Despesas */}
        <div className="card-3d" style={{ padding: '24px' }}>
          <h3 className="font-serif" style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>
            Categorias de Despesa ({expenses.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {expenses.map(cat => (
              <div
                key={cat.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background: 'var(--bg-card-secondary)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <Icon3D name={cat.name} size={34} />
                <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
                  {cat.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Receitas */}
        <div className="card-3d" style={{ padding: '24px' }}>
          <h3 className="font-serif" style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>
            Categorias de Receita ({incomes.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {incomes.map(cat => (
              <div
                key={cat.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background: 'var(--bg-card-secondary)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <Icon3D name={cat.name} size={34} />
                <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
                  {cat.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
