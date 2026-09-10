import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export const BottomSheet = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = '540px'
}) => {
  // Lock body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // ESC key handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', justifyContent: 'center' }}>
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 17, 21, 0.65)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)'
            }}
          />

          {/* Bottom Sheet Drawer on Mobile / Centered Card on Large Screens */}
          <motion.div
            initial={{ y: '100%', opacity: 0.8 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0.8 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 400) {
                onClose();
              }
            }}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              maxWidth,
              margin: '0 auto',
              background: 'var(--bg-card)',
              borderTopLeftRadius: '28px',
              borderTopRightRadius: '28px',
              boxShadow: 'var(--shadow-floating)',
              border: '1px solid var(--border-color)',
              borderBottom: 'none',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 1001,
              paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))'
            }}
          >
            {/* Drag Handle Bar */}
            <div
              style={{
                width: '100%',
                padding: '12px 0 6px 0',
                display: 'flex',
                justifyContent: 'center',
                cursor: 'grab'
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '5px',
                  borderRadius: '9999px',
                  background: 'var(--color-smoke-gray)',
                  opacity: 0.45
                }}
              />
            </div>

            {/* Header */}
            <div
              style={{
                padding: '12px 24px 16px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--border-color)'
              }}
            >
              <div>
                <h3 className="font-serif" style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {title}
                </h3>
                {subtitle && (
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {subtitle}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: 'var(--bg-card-secondary)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Body (Scrollable) */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
