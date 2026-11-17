import type { RouteObject } from 'react-router-dom';
import DashboardPage from './views/DashboardPage';

export const dashboardRoutes: RouteObject[] = [
  {
    path: 'dashboard',
    element: <DashboardPage />,
  },
];
