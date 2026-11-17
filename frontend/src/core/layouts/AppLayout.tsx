import React, { Suspense } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
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
} from 'lucide-react';
import SimulatedBadge from '@/shared/components/SimulatedBadge';
import Skeleton from '@/shared/components/Skeleton';
interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: <LayoutDashboard size={20} /> },
  { label: 'Farmers', to: '/farmers', icon: <Users size={20} /> },
  { label: 'Buyers', to: '/buyers', icon: <ShoppingCart size={20} /> },
  { label: 'Matching', to: '/matching', icon: <GitMerge size={20} /> },
  { label: 'Allocation', to: '/allocation', icon: <BarChart3 size={20} /> },
  { label: 'Strategies', to: '/strategies', icon: <Scale size={20} /> },
  { label: 'Prices', to: '/prices', icon: <TrendingUp size={20} /> },
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

  const pageTitle =
    navItems.find((item) => location.pathname.startsWith(item.to))?.label ?? 'Dashboard';

  return (
    <div className="app-layout">
      <aside className={`sidebar ${sidebarOpen ? 'sidebar--open' : 'sidebar--collapsed'}`}>
        <div className="sidebar__header">
          <Leaf size={28} className="sidebar__logo-icon" />
          {sidebarOpen && <span className="sidebar__brand">AgriSupply</span>}
        </div>

        <nav className="sidebar__nav" aria-label="Main navigation">
          {navItems.map((item) => (
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
          <div className="topbar__actions">
            <SimulatedBadge compact />
            <button className="topbar__icon-btn" aria-label="Notifications">
              <Bell size={20} />
            </button>
            <div className="topbar__avatar" aria-hidden="true">
              R
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
