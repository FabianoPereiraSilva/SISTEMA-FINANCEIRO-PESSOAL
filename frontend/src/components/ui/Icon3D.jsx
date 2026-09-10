import React from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PieChart,
  Target,
  ShoppingBag,
  Utensils,
  Home,
  Car,
  Heart,
  Gamepad2,
  BookOpen,
  CreditCard,
  Briefcase,
  Coins,
  ShieldCheck,
  Tag,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';

const PRESETS = {
  // Income / Salary
  salary: {
    bg: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
    shadow: 'rgba(16, 185, 129, 0.45)',
    bevel: 'rgba(255, 255, 255, 0.4)',
    bottomBevel: '#064e3b',
    icon: Coins,
    color: '#ffffff'
  },
  income: {
    bg: 'linear-gradient(135deg, #34d399 0%, #059669 100%)',
    shadow: 'rgba(5, 150, 105, 0.4)',
    bevel: 'rgba(255, 255, 255, 0.45)',
    bottomBevel: '#065f46',
    icon: ArrowUpRight,
    color: '#ffffff'
  },
  // Expenses Categories
  food: {
    bg: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    shadow: 'rgba(234, 88, 12, 0.45)',
    bevel: 'rgba(255, 255, 255, 0.4)',
    bottomBevel: '#9a3412',
    icon: Utensils,
    color: '#ffffff'
  },
  home: {
    bg: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    shadow: 'rgba(29, 78, 216, 0.45)',
    bevel: 'rgba(255, 255, 255, 0.4)',
    bottomBevel: '#1e3a8a',
    icon: Home,
    color: '#ffffff'
  },
  transport: {
    bg: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
    shadow: 'rgba(67, 56, 202, 0.45)',
    bevel: 'rgba(255, 255, 255, 0.4)',
    bottomBevel: '#312e81',
    icon: Car,
    color: '#ffffff'
  },
  health: {
    bg: 'linear-gradient(135deg, #f43f5e 0%, #be123c 100%)',
    shadow: 'rgba(190, 18, 60, 0.45)',
    bevel: 'rgba(255, 255, 255, 0.4)',
    bottomBevel: '#881337',
    icon: Heart,
    color: '#ffffff'
  },
  leisure: {
    bg: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)',
    shadow: 'rgba(126, 34, 206, 0.45)',
    bevel: 'rgba(255, 255, 255, 0.4)',
    bottomBevel: '#581c87',
    icon: Gamepad2,
    color: '#ffffff'
  },
  education: {
    bg: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)',
    shadow: 'rgba(3, 105, 161, 0.45)',
    bevel: 'rgba(255, 255, 255, 0.4)',
    bottomBevel: '#0c4a6e',
    icon: BookOpen,
    color: '#ffffff'
  },
  shopping: {
    bg: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
    shadow: 'rgba(190, 24, 93, 0.45)',
    bevel: 'rgba(255, 255, 255, 0.4)',
    bottomBevel: '#831843',
    icon: ShoppingBag,
    color: '#ffffff'
  },
  services: {
    bg: 'linear-gradient(135deg, #64748b 0%, #334155 100%)',
    shadow: 'rgba(51, 65, 85, 0.45)',
    bevel: 'rgba(255, 255, 255, 0.35)',
    bottomBevel: '#0f172a',
    icon: CreditCard,
    color: '#ffffff'
  },
  sienna: {
    bg: 'linear-gradient(135deg, #7c3520 0%, #5d2a1a 100%)',
    shadow: 'rgba(93, 42, 26, 0.5)',
    bevel: 'rgba(255, 255, 255, 0.35)',
    bottomBevel: '#38170e',
    icon: Wallet,
    color: '#ffffff'
  },
  brand: {
    bg: 'linear-gradient(135deg, #24272c 0%, #17191c 100%)',
    shadow: 'rgba(23, 25, 28, 0.45)',
    bevel: 'rgba(255, 255, 255, 0.3)',
    bottomBevel: '#0c0d0f',
    icon: PieChart,
    color: '#ffffff'
  },
  target: {
    bg: 'linear-gradient(135deg, #e11d48 0%, #9f1239 100%)',
    shadow: 'rgba(159, 18, 57, 0.45)',
    bevel: 'rgba(255, 255, 255, 0.4)',
    bottomBevel: '#4c0519',
    icon: Target,
    color: '#ffffff'
  },
  expense: {
    bg: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
    shadow: 'rgba(185, 28, 28, 0.4)',
    bevel: 'rgba(255, 255, 255, 0.4)',
    bottomBevel: '#7f1d1d',
    icon: ArrowDownLeft,
    color: '#ffffff'
  }
};

export const Icon3D = ({
  name = 'brand',
  size = 44,
  customIcon: CustomIcon = null,
  interactive = true,
  className = ''
}) => {
  // Normalize lookup key
  const key = (name || '').toLowerCase();
  let preset = PRESETS[key];

  if (!preset) {
    if (key.includes('alimen') || key.includes('restaur') || key.includes('mercado')) preset = PRESETS.food;
    else if (key.includes('mora') || key.includes('aluguel') || key.includes('casa')) preset = PRESETS.home;
    else if (key.includes('trans') || key.includes('uber') || key.includes('combust')) preset = PRESETS.transport;
    else if (key.includes('saude') || key.includes('farma') || key.includes('med')) preset = PRESETS.health;
    else if (key.includes('lazer') || key.includes('viag') || key.includes('jogos')) preset = PRESETS.leisure;
    else if (key.includes('educa') || key.includes('curso') || key.includes('livro')) preset = PRESETS.education;
    else if (key.includes('compra') || key.includes('roupa') || key.includes('shopp')) preset = PRESETS.shopping;
    else if (key.includes('serv') || key.includes('assinat') || key.includes('netfl')) preset = PRESETS.services;
    else if (key.includes('salari') || key.includes('rend') || key.includes('incom')) preset = PRESETS.salary;
    else preset = PRESETS.brand;
  }

  const IconComponent = CustomIcon || preset.icon || Tag;
  const iconSize = Math.round(size * 0.52);

  return (
    <motion.div
      whileHover={interactive ? {
        scale: 1.1,
        rotateX: 12,
        rotateY: -10,
        boxShadow: `0 14px 28px -4px ${preset.shadow}, 0 4px 8px rgba(0,0,0,0.15)`
      } : {}}
      whileTap={interactive ? { scale: 0.95 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 18 }}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: `${Math.round(size * 0.32)}px`,
        background: preset.bg,
        boxShadow: `0 8px 18px -3px ${preset.shadow}, inset 0 2px 2px ${preset.bevel}, inset 0 -3px 0 ${preset.bottomBevel}`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        flexShrink: 0,
        userSelect: 'none',
        perspective: '600px',
        transformStyle: 'preserve-3d',
        border: '1px solid rgba(255, 255, 255, 0.22)'
      }}
      className={`icon-3d ${className}`}
    >
      {/* 3D Specular Highlight Bulb */}
      <span
        style={{
          position: 'absolute',
          top: '12%',
          left: '18%',
          width: '38%',
          height: '24%',
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0) 100%)',
          borderRadius: '9999px',
          pointerEvents: 'none',
          filter: 'blur(0.5px)'
        }}
      />

      <IconComponent size={iconSize} color={preset.color} strokeWidth={2.4} />
    </motion.div>
  );
};
