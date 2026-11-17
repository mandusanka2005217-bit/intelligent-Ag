import React from 'react';
import { useAuthStore, UserRole } from '@/core/store/authStore';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';

export const RoleSwitcher: React.FC = () => {
  const { currentUser, switchDemoRole, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleSwitch = (role: UserRole) => {
    switchDemoRole(role);
    if (role === 'farmer') {
      navigate('/farmer-dashboard');
    } else if (role === 'buyer') {
      navigate('/buyer-dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userRole = currentUser?.role || 'admin';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f3f4f6', padding: '0.25rem 0.5rem', borderRadius: '8px' }}>
      {/* Show role switch buttons ONLY to Admin */}
      {userRole === 'admin' ? (
        <>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>
            Admin Switch:
          </span>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            {(['admin', 'farmer', 'buyer'] as UserRole[]).map((role) => {
              const isActive = currentUser?.role === role;
              const label = role === 'admin' ? '🛡️ Admin' : role === 'farmer' ? '🌾 Farmer View' : '🛒 Buyer View';
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleSwitch(role)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.25rem 0.6rem',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: isActive ? 600 : 400,
                    background: isActive ? '#ffffff' : 'transparent',
                    color: isActive ? '#111827' : '#4b5563',
                    border: isActive ? '1px solid #d1d5db' : '1px solid transparent',
                    boxShadow: isActive ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.1rem 0.4rem' }}>
          <span style={{ fontSize: '0.85rem' }}>{currentUser?.avatar}</span>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>
            {currentUser?.name} ({currentUser?.role === 'farmer' ? 'Farmer' : 'Buyer'})
          </span>
        </div>
      )}

      <button
        type="button"
        onClick={handleLogout}
        title="Logout to Welcome Screen"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          marginLeft: '0.25rem',
          padding: '0.25rem 0.5rem',
          background: '#fee2e2',
          color: '#b91c1c',
          border: '1px solid #fca5a5',
          borderRadius: '6px',
          fontSize: '0.75rem',
          cursor: 'pointer',
          fontWeight: 600
        }}
      >
        <LogOut size={14} />
        Logout
      </button>
    </div>
  );
};

export default RoleSwitcher;
