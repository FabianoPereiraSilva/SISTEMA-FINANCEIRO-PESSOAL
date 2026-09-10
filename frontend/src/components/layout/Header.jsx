import React from 'react';
import { Eye, EyeOff, Moon, Sun, LogOut, Calendar } from 'lucide-react';
import { Button3D } from '../ui/Button3D';

export const Header = ({
  user,
  currentTab,
  onNavigate,
  currentMonth,
  onChangeMonth,
  isDarkMode,
  onToggleTheme,
  isPrivacyMode,
  onTogglePrivacy,
  onSignOut
}) => {
  return (
    <header
      className="glass-panel"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-color)',
        paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))'
      }}
    >
      {/* Brand Logo */}
      <div
        onClick={() => onNavigate('dashboard')}
        style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
      >
        <div style={{ width: '36px', height: '36px', position: 'relative' }}>
          <img
            src="/images/fp-symbol-3d-transparent.png"
            alt="Finance Plan Logo"
            onError={(e) => {
              e.target.src = '/icons/icon-light.png';
            }}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>
        <div>
          <span
            className="font-serif"
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.3px',
              display: 'block',
              lineHeight: 1.1
            }}
          >
            Finance Plan
          </span>
          <span style={{ fontSize: '10px', color: 'var(--color-sienna-brown)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            Editorial Pro
          </span>
        </div>
      </div>

      {/* Desktop Navigation Links */}
      <nav className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {[
          { id: 'dashboard', label: 'Visão Geral' },
          { id: 'transactions', label: 'Transações' },
          { id: 'budgets', label: 'Orçamentos' },
          { id: 'categories', label: 'Categorias' }
        ].map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                padding: '8px 16px',
                borderRadius: '12px',
                border: 'none',
                background: isActive ? 'var(--color-ink-black)' : 'transparent',
                color: isActive ? 'var(--color-paper-white)' : 'var(--text-secondary)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Action Controls (Month, Privacy, Theme, User) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Month Selector */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--bg-card-secondary)',
            padding: '6px 12px',
            borderRadius: '12px',
            border: '1px solid var(--border-color)'
          }}
        >
          <Calendar size={14} color="var(--text-secondary)" />
          <input
            type="month"
            value={currentMonth}
            onChange={(e) => onChangeMonth(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '13px',
              fontFamily: 'var(--font-sans)',
              color: 'var(--text-primary)',
              cursor: 'pointer'
            }}
          />
        </div>

        {/* Privacy Toggle Button */}
        <Button3D
          variant="secondary"
          size="icon"
          onClick={onTogglePrivacy}
          title={isPrivacyMode ? 'Desativar modo privacidade' : 'Ativar modo privacidade'}
        >
          {isPrivacyMode ? <EyeOff size={16} color="var(--color-sienna-brown)" /> : <Eye size={16} />}
        </Button3D>

        {/* Theme Toggle Button */}
        <Button3D
          variant="secondary"
          size="icon"
          onClick={onToggleTheme}
          title={isDarkMode ? 'Tema Claro' : 'Tema Escuro'}
        >
          {isDarkMode ? <Sun size={16} color="#fbbf24" /> : <Moon size={16} />}
        </Button3D>

        {/* User / Sign Out */}
        <Button3D
          variant="ghost"
          size="sm"
          onClick={onSignOut}
          icon={<LogOut size={15} />}
          className="desktop-logout-btn"
        >
          Sair
        </Button3D>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav {
            display: none !important;
          }
          .desktop-logout-btn {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
};
