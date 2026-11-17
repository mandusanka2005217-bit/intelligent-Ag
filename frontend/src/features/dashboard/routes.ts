import { createElement, lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

const AdminDashboardView = lazy(() => import('./views/AdminDashboardView'));

export const dashboardRoutes: RouteObject[] = [
  {
    path: 'dashboard',
    element: createElement(AdminDashboardView),
  },
  {
    path: 'admin-dashboard',
    element: createElement(AdminDashboardView),
  },
];
