import React from 'react';
import { motion } from 'framer-motion';

export const Button3D = ({
  children,
  onClick,
  variant = 'primary', // 'primary' | 'sienna' | 'secondary' | 'danger' | 'ghost'
  size = 'md', // 'sm' | 'md' | 'lg' | 'icon'
  disabled = false,
  className = '',
  icon = null,
  type = 'button',
  shimmer = false
}) => {
  const handleClick = (e) => {
    if (disabled) return;
    // Haptic feedback on mobile touch
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      try {
        window.navigator.vibrate(12);
      } catch (_) {}
    }
    if (onClick) onClick(e);
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'sienna':
        return {
          background: 'linear-gradient(135deg, #743420 0%, #5d2a1a 100%)',
          color: '#ffffff',
          boxShadow: '0 4px 0 #3a190f, 0 8px 18px rgba(93, 42, 26, 0.35)',
          border: '1px solid rgba(255, 255, 255, 0.18)'
        };
      case 'secondary':
        return {
          background: 'var(--bg-card-secondary)',
          color: 'var(--text-primary)',
          boxShadow: '0 3px 0 var(--border-color), 0 4px 12px rgba(0, 0, 0, 0.04)',
          border: '1px solid var(--border-color)'
        };
      case 'danger':
        return {
          background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
          color: '#ffffff',
          boxShadow: '0 4px 0 #7f1d1d, 0 8px 18px rgba(185, 28, 28, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.15)'
        };
      case 'ghost':
        return {
          background: 'transparent',
          color: 'var(--text-primary)',
          boxShadow: 'none',
          border: '1px solid transparent'
        };
      case 'primary':
      default:
        return {
          background: 'linear-gradient(135deg, #24272c 0%, #17191c 100%)',
          color: '#ffffff',
          boxShadow: '0 4px 0 #0d0f11, 0 8px 20px rgba(23, 25, 28, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.14)'
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { padding: '8px 14px', fontSize: '13px', borderRadius: '10px' };
      case 'lg':
        return { padding: '16px 28px', fontSize: '16px', borderRadius: '16px', fontWeight: 600 };
      case 'icon':
        return { padding: '10px', width: '42px', height: '42px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' };
      case 'md':
      default:
        return { padding: '12px 20px', fontSize: '14px', borderRadius: '14px', fontWeight: 500 };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={handleClick}
      whileHover={disabled ? {} : { y: -2, scale: 1.015, filter: 'brightness(1.04)' }}
      whileTap={disabled ? {} : { y: 2, scale: 0.97, boxShadow: '0 1px 0 rgba(0,0,0,0.4), 0 2px 6px rgba(0,0,0,0.2)' }}
      transition={{ type: 'spring', stiffness: 500, damping: 22 }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        userSelect: 'none',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'var(--font-sans)',
        ...sizeStyles,
        ...variantStyles
      }}
      className={`btn-3d ${shimmer ? 'shimmer-effect' : ''} ${className}`}
    >
      {/* Light Reflection Line on Top */}
      <span
        style={{
          position: 'absolute',
          top: 0,
          left: '10%',
          right: '10%',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
          pointerEvents: 'none'
        }}
      />

      {icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
      {children && <span>{children}</span>}
    </motion.button>
  );
};
