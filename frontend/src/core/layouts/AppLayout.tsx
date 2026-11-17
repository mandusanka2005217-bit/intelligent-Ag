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
  ShieldCheck,
  Sparkles,
  Truck,
  Hourglass,
  AlertOctagon,
  Sliders
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
  { label: 'Farmers List', to: '/farmers', icon: <Users size={20} />, allowedRoles: ['admin'] },
  { label: 'Buyers List', to: '/buyers', icon: <ShoppingCart size={20} />, allowedRoles: ['admin'] },
  { label: 'Matching Engine', to: '/matching', icon: <GitMerge size={20} />, allowedRoles: ['admin'] },
  { label: 'Allocation Engine', to: '/allocation', icon: <BarChart3 size={20} />, allowedRoles: ['admin'] },
  { label: 'Strategies', to: '/strategies', icon: <Scale size={20} />, allowedRoles: ['admin'] },
  { label: 'Price Trends', to: '/prices', icon: <TrendingUp size={20} />, allowedRoles: ['admin', 'farmer', 'buyer'] },
  { label: 'Demand Forecast', to: '/intelligence/forecasting', icon: <Sparkles size={20} />, allowedRoles: ['admin'] },
  { label: 'Transport VRP', to: '/intelligence/transportation', icon: <Truck size={20} />, allowedRoles: ['admin'] },
  { label: 'Crop Freshness', to: '/intelligence/freshness', icon: <Hourglass size={20} />, allowedRoles: ['admin'] },
  { label: 'Supply Risk Alerts', to: '/intelligence/risk', icon: <AlertOctagon size={20} />, allowedRoles: ['admin'] },
  { label: 'Fair Pricing', to: '/intelligence/pricing', icon: <TrendingUp size={20} />, allowedRoles: ['admin'] },
  { label: 'What-If Simulator', to: '/intelligence/simulation', icon: <Sliders size={20} />, allowedRoles: ['admin'] },
  { label: 'Food Waste & CO2', to: '/intelligence/sustainability', icon: <Leaf size={20} />, allowedRoles: ['admin'] },
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
  const [sidebarOpen, setSidebarOpen] = React.useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth > 900 : true;
  });
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const location = useLocation();
  const { currentUser } = useAuthStore();

  // Close mobile menu on route change
  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const user = currentUser || {
    id: 'admin-01',
    name: 'Ravindu (System Admin)',
    username: 'ravindu@2005',
    role: 'admin' as const,
    avatar: '🛡️',
    location: 'Central Command, Colombo',
    createdAt: ''
  };

  const activeNav = navItems.find((item) => location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to)));
  const pageTitle = activeNav?.label ?? 'Agricultural Supply Chain';

  // Filter navigation items by current role
  const visibleNavItems = navItems.filter(
    (item) => !item.allowedRoles || item.allowedRoles.includes(user.role)
  );

  return (
    <div className="app-layout">
      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`sidebar ${sidebarOpen ? 'sidebar--open' : 'sidebar--collapsed'} ${
          mobileMenuOpen ? 'sidebar--mobile-open' : ''
        }`}
      >
        <div className="sidebar__header">
          <Leaf size={28} className="sidebar__logo-icon" />
          {(sidebarOpen || mobileMenuOpen) && <span className="sidebar__brand">AgriSupply</span>}
          <button
            className="sidebar__mobile-close"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar__nav" aria-label="Main navigation">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `sidebar__nav-item ${isActive ? 'sidebar__nav-item--active' : ''}`
              }
            >
              <span className="sidebar__nav-icon">{item.icon}</span>
              {(sidebarOpen || mobileMenuOpen) && <span className="sidebar__nav-label">{item.label}</span>}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              className="mobile-menu-trigger"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu size={22} />
            </button>
            <h1 className="topbar__title">{pageTitle}</h1>
          </div>
          <div className="topbar__actions" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <RoleSwitcher />
            <SimulatedBadge compact />
            <button className="topbar__icon-btn" aria-label="Notifications">
              <Bell size={20} />
            </button>
            <div
              className="topbar__avatar"
              aria-label={user.name}
              title={`${user.name} (${user.role})`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.1rem',
                cursor: 'pointer'
              }}
            >
              {user.avatar}
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
