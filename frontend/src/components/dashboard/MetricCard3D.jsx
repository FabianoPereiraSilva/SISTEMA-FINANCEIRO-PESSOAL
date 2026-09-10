import React from 'react';
import { motion } from 'framer-motion';
import { Icon3D } from '../ui/Icon3D';

export const MetricCard3D = ({
  title,
  value,
  rawNumber = 0,
  iconPreset = 'brand',
  type = 'neutral', // 'income' | 'expense' | 'neutral' | 'sienna'
  badgeText = null,
  isPrivacyMode = false
}) => {
  const formatCurrency = (val) => {
    if (typeof val === 'number') {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    }
    return val;
  };

  const formattedValue = formatCurrency(value);

  const getTypeStyle = () => {
    switch (type) {
      case 'income':
        return { color: 'var(--color-success)' };
      case 'expense':
        return { color: 'var(--color-danger)' };
      case 'sienna':
        return { color: 'var(--color-sienna-brown)' };
      default:
        return { color: 'var(--text-primary)' };
    }
  };

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.015 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="card-3d"
      style={{
        padding: '22px 24px',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: '140px'
      }}
    >
      {/* Background Decorative Light Gradient */}
      <div
        style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: type === 'income' ? 'rgba(52, 211, 153, 0.08)' : type === 'expense' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(93, 42, 26, 0.06)',
          filter: 'blur(30px)',
          pointerEvents: 'none'
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {title}
        </span>
        <Icon3D name={iconPreset} size={42} />
      </div>

      <div>
        <div
          className="font-serif"
          style={{
            fontSize: '28px',
            fontWeight: 600,
            letterSpacing: '-0.5px',
            ...getTypeStyle(),
            filter: isPrivacyMode ? 'blur(8px)' : 'none',
            transition: 'filter 0.2s ease',
            userSelect: isPrivacyMode ? 'none' : 'text'
          }}
        >
          {formattedValue}
        </div>

        {badgeText && (
          <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '6px',
                background: 'var(--bg-card-secondary)',
                color: 'var(--text-secondary)'
              }}
            >
              {badgeText}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};
