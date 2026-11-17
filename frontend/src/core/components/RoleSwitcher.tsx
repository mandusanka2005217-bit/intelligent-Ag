import React from 'react';
import { useAuthStore, DEMO_USERS, UserRole } from '@/core/store/authStore';
import { useNavigate } from 'react-router-dom';

export const RoleSwitcher: React.FC = () => {
  const { currentUser, switchUser } = useAuthStore();
  const navigate = useNavigate();

  const handleSwitch = (role: UserRole) => {
    switchUser(role);
    if (role === 'farmer') {
      navigate('/farmer-dashboard');
    } else if (role === 'buyer') {
      navigate('/buyer-dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f3f4f6', padding: '0.25rem 0.5rem', borderRadius: '8px' }}>
      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>
        Demo Role:
      </span>
      <div style={{ display: 'flex', gap: '0.25rem' }}>
        {(['admin', 'farmer', 'buyer'] as UserRole[]).map((role) => {
          const user = DEMO_USERS[role];
          const isActive = currentUser.role === role;
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
              title={user.description}
            >
              <span>{user.avatar}</span>
              <span>{role === 'admin' ? 'Admin' : role === 'farmer' ? 'Farmer' : 'Buyer'}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default RoleSwitcher;
