import React, { Suspense } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
  Users,
  ShoppingCart,
  GitMerge,
  BarChart3,
  Scale,
  TrendingUp,
  Leaf,
  Menu,
  X,
  Bell,
  Sprout,
  ShieldCheck
} from 'lucide-react';
import SimulatedBadge from '@/shared/components/SimulatedBadge';
import Skeleton from '@/shared/components/Skeleton';
import RoleSwitcher from '@/core/components/RoleSwitcher';
import { useAuthStore } from '@/core/store/authStore';

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
  allowedRoles?: ('admin' | 'farmer' | 'buyer')[];
}

const navItems: NavItem[] = [
  { label: 'Admin Dashboard', to: '/dashboard', icon: <ShieldCheck size={20} />, allowedRoles: ['admin'] },
  { label: 'Farmer Dashboard', to: '/farmer-dashboard', icon: <Sprout size={20} />, allowedRoles: ['admin', 'farmer'] },
  { label: 'Buyer Dashboard', to: '/buyer-dashboard', icon: <ShoppingCart size={20} />, allowedRoles: ['admin', 'buyer'] },
  { label: 'Farmers List', to: '/farmers', icon: <Users size={20} />, allowedRoles: ['admin', 'farmer'] },
  { label: 'Buyers List', to: '/buyers', icon: <ShoppingCart size={20} />, allowedRoles: ['admin', 'buyer'] },
  { label: 'Matching Engine', to: '/matching', icon: <GitMerge size={20} />, allowedRoles: ['admin'] },
  { label: 'Allocation Engine', to: '/allocation', icon: <BarChart3 size={20} />, allowedRoles: ['admin'] },
  { label: 'Strategies', to: '/strategies', icon: <Scale size={20} />, allowedRoles: ['admin'] },
  { label: 'Price Trends', to: '/prices', icon: <TrendingUp size={20} />, allowedRoles: ['admin', 'farmer', 'buyer'] },
];

const PageFallback: React.FC = () => (
  <div className="page-fallback" aria-busy="true" aria-live="polite">
    <Skeleton width="220px" height={28} />
    <div style={{ height: 12 }} />
    <Skeleton width="420px" height={14} />
    <div style={{ height: 28 }} />
    <div className="kpi-grid">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="kpi-card">
          <Skeleton width="55%" height={11} />
          <Skeleton width="70%" height={28} />
        </div>
      ))}
    </div>
    <div style={{ height: 24 }} />
    <Skeleton height={260} radius={12} />
  </div>
);

const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const location = useLocation();
  const { currentUser } = useAuthStore();

  const activeNav = navItems.find((item) => location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to)));
  const pageTitle = activeNav?.label ?? 'Agricultural Supply Chain';

  // Filter navigation items by current role
  const visibleNavItems = navItems.filter(
    (item) => !item.allowedRoles || item.allowedRoles.includes(currentUser.role)
  );

  return (
    <div className="app-layout">
      <aside className={`sidebar ${sidebarOpen ? 'sidebar--open' : 'sidebar--collapsed'}`}>
        <div className="sidebar__header">
          <Leaf size={28} className="sidebar__logo-icon" />
          {sidebarOpen && <span className="sidebar__brand">AgriSupply</span>}
        </div>

        <nav className="sidebar__nav" aria-label="Main navigation">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `sidebar__nav-item ${isActive ? 'sidebar__nav-item--active' : ''}`
              }
            >
              <span className="sidebar__nav-icon">{item.icon}</span>
              {sidebarOpen && <span className="sidebar__nav-label">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__footer">
          {sidebarOpen && <SimulatedBadge />}
          <button
            className="sidebar__toggle"
            onClick={() => setSidebarOpen((prev) => !prev)}
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            aria-expanded={sidebarOpen}
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <h1 className="topbar__title">{pageTitle}</h1>
          <div className="topbar__actions" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <RoleSwitcher />
            <SimulatedBadge compact />
            <button className="topbar__icon-btn" aria-label="Notifications">
              <Bell size={20} />
            </button>
            <div
              className="topbar__avatar"
              aria-label={currentUser.name}
              title={`${currentUser.name} (${currentUser.role})`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.1rem',
                cursor: 'pointer'
              }}
            >
              {currentUser.avatar}
            </div>
          </div>
        </header>

        <main className="page-content">
          <Suspense fallback={<PageFallback />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
