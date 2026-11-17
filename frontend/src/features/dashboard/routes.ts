import { createElement, lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

const DashboardPage = lazy(() => import('./views/DashboardPage'));

export const dashboardRoutes: RouteObject[] = [
  {
    path: 'dashboard',
    element: createElement(DashboardPage),
  },
];
