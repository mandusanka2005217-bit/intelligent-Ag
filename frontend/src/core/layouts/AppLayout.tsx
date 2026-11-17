import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  GitMerge,
  BarChart3,
  Leaf,
  Menu,
  X,
  Bell,
} from 'lucide-react';

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
];

const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  const pageTitle = navItems.find((item) => location.pathname.startsWith(item.to))?.label ?? 'App';

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar--open' : 'sidebar--collapsed'}`}>
        <div className="sidebar__header">
          <Leaf size={28} className="sidebar__logo-icon" />
          {sidebarOpen && <span className="sidebar__brand">AgriSupply</span>}
        </div>

        <nav className="sidebar__nav">
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

        <button
          className="sidebar__toggle"
          onClick={() => setSidebarOpen((prev) => !prev)}
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </aside>

      {/* Main content area */}
      <div className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <h1 className="topbar__title">{pageTitle}</h1>
          <div className="topbar__actions">
            <button className="topbar__icon-btn" aria-label="Notifications">
              <Bell size={20} />
            </button>
            <div className="topbar__avatar">R</div>
          </div>
        </header>

        {/* Page content */}
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
