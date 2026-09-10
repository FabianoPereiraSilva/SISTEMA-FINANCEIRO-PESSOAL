import React from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, ReceiptText, Target, Tags, Plus } from 'lucide-react';

export const MobileNav = ({ currentTab, onNavigate, onOpenNewTransaction }) => {
  const handleTabClick = (tab) => {
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      try { window.navigator.vibrate(10); } catch (_) {}
    }
    onNavigate(tab);
  };

  const tabs = [
    { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'transactions', label: 'Extrato', icon: ReceiptText },
    { id: 'budgets', label: 'Metas', icon: Target },
    { id: 'categories', label: 'Categorias', icon: Tags }
  ];

  return (
    <>
      {/* Floating 3D Action Button (Quick Add) */}
      <motion.button
        whileHover={{ scale: 1.08, y: -2 }}
        whileTap={{ scale: 0.92, y: 2 }}
        onClick={onOpenNewTransaction}
        className="mobile-fab-3d"
        style={{
          position: 'fixed',
          bottom: 'calc(76px + env(safe-area-inset-bottom, 0px))',
          right: '20px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #743420 0%, #5d2a1a 100%)',
          color: '#ffffff',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          boxShadow: '0 8px 0 #3a190f, 0 12px 24px rgba(93, 42, 26, 0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 90,
          outline: 'none'
        }}
      >
        <Plus size={28} strokeWidth={2.5} />
      </motion.button>

      {/* Bottom Bar Container */}
      <nav
        className="mobile-bottom-nav glass-panel"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 'calc(62px + env(safe-area-inset-bottom, 0px))',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          zIndex: 80,
          borderTop: '1px solid var(--border-color)',
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.05)'
        }}
      >
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: 'none',
                gap: '4px',
                cursor: 'pointer',
                padding: '6px 0',
                color: isActive ? 'var(--color-sienna-brown)' : 'var(--text-secondary)',
                position: 'relative'
              }}
            >
              <div style={{ position: 'relative' }}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    style={{
                      position: 'absolute',
                      top: '-6px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '4px',
                      height: '4px',
                      borderRadius: '50%',
                      background: 'var(--color-sienna-brown)'
                    }}
                  />
                )}
              </div>
              <span style={{ fontSize: '11px', fontWeight: isActive ? 600 : 500 }}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>

      <style>{`
        @media (min-width: 769px) {
          .mobile-bottom-nav, .mobile-fab-3d {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
};
