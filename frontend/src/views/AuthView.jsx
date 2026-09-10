import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { Button3D } from '../components/ui/Button3D';
import { supabase } from '../services/supabase';

export const AuthView = ({ onAuthSuccess }) => {
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (tab === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password
        });

        if (error) {
          // Fallback to local server API if Supabase direct fails
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email.trim(), password })
          });
          const apiData = await res.json();
          if (res.ok && apiData.ok) {
            onAuthSuccess(apiData.user);
            return;
          }
          throw new Error(error.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : error.message);
        }

        if (data && data.user) {
          onAuthSuccess(data.user);
        }
      } else {
        // Register
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { name: name.trim() } }
        });

        if (error) throw error;

        if (data.session) {
          onAuthSuccess(data.user);
        } else {
          setSuccessMsg('Cadastro realizado com sucesso! Verifique seu e-mail para confirmar a conta.');
          setTab('login');
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Ocorreu um erro ao processar sua solicitação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        background: 'radial-gradient(circle at 50% 15%, rgba(93, 42, 26, 0.05) 0%, var(--bg-app) 70%)'
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{ width: '100%', maxWidth: '440px' }}
      >
        {/* Brand Icon 3D */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <motion.div
            whileHover={{ scale: 1.06, rotateY: 15 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            style={{
              width: '88px',
              height: '88px',
              margin: '0 auto 16px auto',
              perspective: '600px'
            }}
          >
            <img
              src="/images/fp-symbol-3d-transparent.png"
              alt="Finance Plan 3D"
              onError={(e) => { e.target.src = '/icons/icon-light.png'; }}
              style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 12px 24px rgba(93, 42, 26, 0.25))' }}
            />
          </motion.div>

          <h1
            className="font-serif"
            style={{
              fontSize: '28px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              letterSpacing: '-0.5px',
              lineHeight: 1.2
            }}
          >
            Suas finanças pessoais, <br />
            <span className="serif-italic" style={{ color: 'var(--color-sienna-brown)' }}>
              pensadas com clareza.
            </span>
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '8px' }}>
            Gestão patrimonial elegante com privacidade estrita.
          </p>
        </div>

        {/* Auth Box Container */}
        <div
          className="card-3d"
          style={{
            padding: '28px 24px',
            background: 'var(--bg-card)'
          }}
        >
          {/* Tabs */}
          <div
            style={{
              display: 'flex',
              background: 'var(--bg-card-secondary)',
              padding: '4px',
              borderRadius: '14px',
              marginBottom: '24px'
            }}
          >
            <button
              type="button"
              onClick={() => { setTab('login'); setErrorMsg(''); }}
              style={{
                flex: 1,
                padding: '10px 0',
                borderRadius: '10px',
                border: 'none',
                background: tab === 'login' ? 'var(--bg-card)' : 'transparent',
                color: tab === 'login' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: tab === 'login' ? 600 : 500,
                fontSize: '14px',
                boxShadow: tab === 'login' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Entrar na Conta
            </button>
            <button
              type="button"
              onClick={() => { setTab('register'); setErrorMsg(''); }}
              style={{
                flex: 1,
                padding: '10px 0',
                borderRadius: '10px',
                border: 'none',
                background: tab === 'register' ? 'var(--bg-card)' : 'transparent',
                color: tab === 'register' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: tab === 'register' ? 600 : 500,
                fontSize: '14px',
                boxShadow: tab === 'register' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Criar Conta
            </button>
          </div>

          {/* Feedback Alerts */}
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                background: 'var(--color-danger-bg)',
                color: 'var(--color-danger)',
                fontSize: '13px',
                marginBottom: '16px',
                border: '1px solid rgba(239, 68, 68, 0.2)'
              }}
            >
              {errorMsg}
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                background: 'var(--color-success-bg)',
                color: 'var(--color-success)',
                fontSize: '13px',
                marginBottom: '16px',
                border: '1px solid rgba(52, 211, 153, 0.2)'
              }}
            >
              {successMsg}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {tab === 'register' && (
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Nome Completo
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: '14px', top: '16px' }} />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    className="steep-input"
                    style={{ paddingLeft: '40px' }}
                  />
                </div>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                E-mail
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: '14px', top: '16px' }} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.email@exemplo.com"
                  className="steep-input"
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                  Senha
                </label>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: '14px', top: '16px' }} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha secreta"
                  className="steep-input"
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>

            <Button3D
              type="submit"
              variant="sienna"
              size="lg"
              disabled={loading}
              shimmer
              style={{ width: '100%', marginTop: '8px' }}
              icon={loading ? null : <ArrowRight size={18} />}
            >
              {loading ? 'Processando...' : tab === 'login' ? 'Entrar no Sistema' : 'Cadastrar Conta'}
            </Button3D>
          </form>
        </div>

        {/* Security Badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '24px', color: 'var(--text-secondary)', fontSize: '12px' }}>
          <ShieldCheck size={16} color="var(--color-sienna-brown)" />
          <span>Isolamento estrito com criptografia e Row Level Security (RLS)</span>
        </div>
      </motion.div>
    </div>
  );
};
