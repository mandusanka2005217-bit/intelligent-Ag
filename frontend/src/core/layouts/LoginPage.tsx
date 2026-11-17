import React, { useState } from 'react';
import { Leaf, Lock, User, MapPin, Phone, ArrowRight, ShieldCheck, Sprout, ShoppingCart, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuthStore, UserRole } from '@/core/store/authStore';
import { useNavigate } from 'react-router-dom';

export const LoginPage: React.FC = () => {
  const { login, register, switchDemoRole } = useAuthStore();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'welcome' | 'login' | 'register'>('welcome');
  const [selectedRole, setSelectedRole] = useState<UserRole>('farmer');

  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const result = login(username, password);
    if (result.success) {
      redirectUser();
    } else {
      setErrorMsg(result.message || 'Login failed');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!name || !username || !password || !location) {
      setErrorMsg('Please fill in all required fields');
      return;
    }

    const result = register({
      name,
      username,
      password,
      role: selectedRole,
      avatar: selectedRole === 'farmer' ? '🌾' : '🛒',
      location,
      phone
    });

    if (result.success) {
      redirectUser(selectedRole);
    } else {
      setErrorMsg(result.message || 'Registration failed');
    }
  };

  const handleQuickDemoLogin = (role: UserRole) => {
    switchDemoRole(role);
    redirectUser(role);
  };

  const redirectUser = (overrideRole?: UserRole) => {
    const role = overrideRole || useAuthStore.getState().currentUser?.role || 'admin';
    if (role === 'farmer') {
      navigate('/farmer-dashboard');
    } else if (role === 'buyer') {
      navigate('/buyer-dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 50%, #fef3c7 100%)',
      padding: '1.5rem',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        width: '100%',
        maxWidth: mode === 'welcome' ? '880px' : '460px',
        background: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        border: '1px solid #e5e7eb',
        overflow: 'hidden',
        transition: 'all 0.3s ease'
      }}>
        {/* Brand Header */}
        <div style={{
          background: 'linear-gradient(90deg, #166534 0%, #15803d 100%)',
          padding: '1.75rem',
          color: '#ffffff',
          textAlign: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ background: '#ffffff', color: '#166534', padding: '0.4rem', borderRadius: '10px', display: 'flex' }}>
              <Leaf size={28} />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
              AgriSupply Coordination Platform
            </h1>
          </div>
          <p style={{ margin: 0, opacity: 0.9, fontSize: '0.95rem' }}>
            Intelligent Agricultural Supply & Demand Matching System
          </p>
        </div>

        {/* WELCOME PORTAL SCREEN */}
        {mode === 'welcome' && (
          <div style={{ padding: '2.5rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.4rem', color: '#1f2937', fontWeight: 700, marginBottom: '0.5rem' }}>
                Welcome to Intelligent AgriSupply
              </h2>
              <p style={{ color: '#6b7280', fontSize: '0.95rem' }}>
                Select your account portal to sign in or register a new profile
              </p>
            </div>

            {/* Role Options Selection */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
              {/* Farmer Card */}
              <div
                style={{
                  border: '2px solid #86efac',
                  background: '#f0fdf4',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🌾</div>
                  <h3 style={{ fontSize: '1.15rem', color: '#166534', fontWeight: 700, margin: '0 0 0.5rem' }}>
                    Farmer Portal
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: '#374151', margin: 0 }}>
                    Register produce, set expected prices, available quantities and manage crop supply.
                  </p>
                </div>
                <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <button
                    onClick={() => { setSelectedRole('farmer'); setMode('login'); }}
                    className="btn btn--primary"
                    style={{ background: '#166534', width: '100%', fontSize: '0.85rem' }}
                  >
                    Farmer Login
                  </button>
                  <button
                    onClick={() => { setSelectedRole('farmer'); setMode('register'); }}
                    style={{ background: '#ffffff', color: '#166534', border: '1px solid #166534', padding: '0.45rem', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Register as Farmer
                  </button>
                </div>
              </div>

              {/* Buyer Card */}
              <div
                style={{
                  border: '2px solid #fed7aa',
                  background: '#fff7ed',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🛒</div>
                  <h3 style={{ fontSize: '1.15rem', color: '#9a3412', fontWeight: 700, margin: '0 0 0.5rem' }}>
                    Buyer Portal
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: '#374151', margin: 0 }}>
                    Post demand requirements, max acceptable pricing and source fresh agricultural harvests.
                  </p>
                </div>
                <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <button
                    onClick={() => { setSelectedRole('buyer'); setMode('login'); }}
                    className="btn btn--primary"
                    style={{ background: '#ea580c', width: '100%', fontSize: '0.85rem' }}
                  >
                    Buyer Login
                  </button>
                  <button
                    onClick={() => { setSelectedRole('buyer'); setMode('register'); }}
                    style={{ background: '#ffffff', color: '#ea580c', border: '1px solid #ea580c', padding: '0.45rem', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Register as Buyer
                  </button>
                </div>
              </div>

              {/* Admin Card */}
              <div
                style={{
                  border: '2px solid #bfdbfe',
                  background: '#eff6ff',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🛡️</div>
                  <h3 style={{ fontSize: '1.15rem', color: '#1e40af', fontWeight: 700, margin: '0 0 0.5rem' }}>
                    System Admin
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: '#374151', margin: 0 }}>
                    Access central analytics, matching & min-cost flow allocation algorithms.
                  </p>
                </div>
                <div style={{ marginTop: '1.5rem' }}>
                  <button
                    onClick={() => { setSelectedRole('admin'); setMode('login'); }}
                    className="btn btn--primary"
                    style={{ background: '#1e40af', width: '100%', fontSize: '0.85rem' }}
                  >
                    Admin Sign In
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Demo Access Bar */}
            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.75rem', fontWeight: 600 }}>
                🚀 Quick 1-Click Demo Login:
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleQuickDemoLogin('admin')}
                  style={{ padding: '0.4rem 0.8rem', background: '#e0e7ff', color: '#3730a3', border: 'none', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  🛡️ Admin Demo (ravindu@2005)
                </button>
                <button
                  onClick={() => handleQuickDemoLogin('farmer')}
                  style={{ padding: '0.4rem 0.8rem', background: '#dcfce7', color: '#15803d', border: 'none', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  🌾 Farmer Demo (Sunil)
                </button>
                <button
                  onClick={() => handleQuickDemoLogin('buyer')}
                  style={{ padding: '0.4rem 0.8rem', background: '#ffedd5', color: '#9a3412', border: 'none', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  🛒 Buyer Demo (Keells)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === 'login' && (
          <div style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0, color: '#111827' }}>
                {selectedRole === 'admin' ? '🛡️ Admin Sign In' : selectedRole === 'farmer' ? '🌾 Farmer Sign In' : '🛒 Buyer Sign In'}
              </h2>
              <button
                onClick={() => setMode('welcome')}
                style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                ← Back
              </button>
            </div>

            {errorMsg && (
              <div style={{ padding: '0.75rem', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#b91c1c', marginBottom: '1.25rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            {selectedRole === 'admin' && (
              <div style={{ background: '#eff6ff', padding: '0.75rem', borderRadius: '8px', border: '1px solid #bfdbfe', fontSize: '0.8rem', color: '#1e40af', marginBottom: '1.25rem' }}>
                <strong>Default Admin Account:</strong><br />
                Username: <code>ravindu@2005</code><br />
                Password: <code>ravindu2005@@</code>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: '#374151' }}>
                  Username / Email
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={selectedRole === 'admin' ? 'ravindu@2005' : 'Enter username or email'}
                    required
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: '#374151' }}>
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem' }}
                />
              </div>

              <button
                type="submit"
                className="btn btn--primary"
                style={{
                  marginTop: '0.5rem',
                  padding: '0.65rem',
                  fontSize: '0.95rem',
                  background: selectedRole === 'admin' ? '#1e40af' : selectedRole === 'buyer' ? '#ea580c' : '#166534'
                }}
              >
                Sign In to Dashboard
              </button>

              {selectedRole !== 'admin' && (
                <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.85rem', color: '#6b7280' }}>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('register')}
                    style={{ background: 'none', border: 'none', color: '#166534', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Register here
                  </button>
                </div>
              )}
            </form>
          </div>
        )}

        {/* REGISTER FORM */}
        {mode === 'register' && (
          <div style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0, color: '#111827' }}>
                {selectedRole === 'farmer' ? '🌾 New Farmer Registration' : '🛒 New Buyer Registration'}
              </h2>
              <button
                onClick={() => setMode('welcome')}
                style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                ← Back
              </button>
            </div>

            {errorMsg && (
              <div style={{ padding: '0.75rem', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#b91c1c', marginBottom: '1rem', fontSize: '0.85rem' }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem', color: '#374151' }}>
                  Full Name / Organization Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={selectedRole === 'farmer' ? 'e.g., K. M. Bandara' : 'e.g., Cargills Agro Hub'}
                  required
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem', color: '#374151' }}>
                  Username / Email *
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g., bandara@farm.lk"
                  required
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem', color: '#374151' }}>
                  Password *
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a secure password"
                  required
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem', color: '#374151' }}>
                    Location / District *
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., Nuwara Eliya"
                    required
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem', color: '#374151' }}>
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+94 7X XXX XXXX"
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn--primary"
                style={{
                  marginTop: '0.5rem',
                  padding: '0.65rem',
                  fontSize: '0.95rem',
                  background: selectedRole === 'farmer' ? '#166534' : '#ea580c'
                }}
              >
                Create Account & Enter Dashboard
              </button>

              <div style={{ textAlign: 'center', marginTop: '0.25rem', fontSize: '0.85rem', color: '#6b7280' }}>
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  style={{ background: 'none', border: 'none', color: '#166534', fontWeight: 600, cursor: 'pointer' }}
                >
                  Sign in here
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
