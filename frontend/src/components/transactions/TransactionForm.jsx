import React, { useState, useEffect } from 'react';
import { Button3D } from '../ui/Button3D';
import { Icon3D } from '../ui/Icon3D';
import { Check, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

export const TransactionForm = ({
  initialData = null,
  categories = [],
  onSave,
  onCancel,
  loading = false
}) => {
  const [type, setType] = useState(initialData?.type || 'expense');
  const [description, setDescription] = useState(initialData?.description || '');
  const [amount, setAmount] = useState(initialData?.amount ? String(initialData.amount) : '');
  const [categoryId, setCategoryId] = useState(initialData?.category_id || '');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState(initialData?.payment_method || 'pix');

  const filteredCategories = categories.filter(c => c.type === type);

  useEffect(() => {
    if (!categoryId && filteredCategories.length > 0) {
      setCategoryId(filteredCategories[0].id);
    }
  }, [type, filteredCategories]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const numAmount = parseFloat(amount.replace(',', '.'));
    if (!description.trim() || isNaN(numAmount) || numAmount <= 0) return;

    onSave({
      id: initialData?.id,
      type,
      description: description.trim(),
      amount: numAmount,
      category_id: categoryId ? Number(categoryId) : null,
      date,
      payment_method: paymentMethod
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Type Toggle (Despesa vs Receita) */}
      <div
        style={{
          display: 'flex',
          background: 'var(--bg-card-secondary)',
          padding: '4px',
          borderRadius: '16px'
        }}
      >
        <button
          type="button"
          onClick={() => setType('expense')}
          style={{
            flex: 1,
            padding: '10px 0',
            borderRadius: '12px',
            border: 'none',
            background: type === 'expense' ? 'var(--color-danger)' : 'transparent',
            color: type === 'expense' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: 600,
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <ArrowDownLeft size={16} />
          Despesa
        </button>

        <button
          type="button"
          onClick={() => setType('income')}
          style={{
            flex: 1,
            padding: '10px 0',
            borderRadius: '12px',
            border: 'none',
            background: type === 'income' ? 'var(--color-success)' : 'transparent',
            color: type === 'income' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: 600,
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <ArrowUpRight size={16} />
          Receita
        </button>
      </div>

      {/* Large Tactical Amount Input */}
      <div style={{ textAlign: 'center', margin: '6px 0' }}>
        <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
          Valor da Transação
        </label>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <span className="font-serif" style={{ fontSize: '26px', fontWeight: 600, color: type === 'income' ? 'var(--color-success)' : 'var(--color-danger)' }}>
            R$
          </span>
          <input
            type="text"
            inputMode="decimal"
            required
            autoFocus
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0,00"
            className="font-serif"
            style={{
              fontSize: '38px',
              fontWeight: 700,
              width: '200px',
              textAlign: 'left',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: type === 'income' ? 'var(--color-success)' : 'var(--color-danger)'
            }}
          />
        </div>
      </div>

      {/* Description Input */}
      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>
          Descrição
        </label>
        <input
          type="text"
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ex: Almoço de negócios, Supermercado, Salário"
          className="steep-input"
        />
      </div>

      {/* Category Selector with 3D Icons */}
      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>
          Categoria
        </label>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
            gap: '8px',
            maxHeight: '160px',
            overflowY: 'auto',
            paddingRight: '4px'
          }}
        >
          {filteredCategories.map((cat) => {
            const isSelected = String(categoryId) === String(cat.id);
            return (
              <div
                key={cat.id}
                onClick={() => setCategoryId(cat.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 10px',
                  borderRadius: '12px',
                  border: `1px solid ${isSelected ? 'var(--color-sienna-brown)' : 'var(--border-color)'}`,
                  background: isSelected ? 'var(--color-blush-peach)' : 'var(--bg-card-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon3D name={cat.name} size={28} interactive={false} />
                <span style={{ fontSize: '12px', fontWeight: isSelected ? 600 : 400, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {cat.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Date & Payment Method */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Data
          </label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="steep-input"
            style={{ padding: '10px 12px' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Meio de Pagamento
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="steep-input"
            style={{ padding: '10px 12px', cursor: 'pointer' }}
          >
            <option value="pix">Pix</option>
            <option value="cartao_credito">Cartão de Crédito</option>
            <option value="cartao_debito">Cartão de Débito</option>
            <option value="dinheiro">Dinheiro</option>
            <option value="transferencia">Transferência / TED</option>
            <option value="boleto">Boleto</option>
          </select>
        </div>
      </div>

      {/* Save Button */}
      <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
        {onCancel && (
          <Button3D variant="secondary" size="lg" onClick={onCancel} style={{ flex: 1 }}>
            Cancelar
          </Button3D>
        )}
        <Button3D
          type="submit"
          variant="sienna"
          size="lg"
          disabled={loading}
          icon={<Check size={18} />}
          style={{ flex: 2 }}
        >
          {loading ? 'Salvando...' : initialData?.id ? 'Atualizar Transação' : 'Registrar Lançamento'}
        </Button3D>
      </div>
    </form>
  );
};
