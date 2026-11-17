import { createBrowserRouter, Navigate } from 'react-router-dom';
import ProtectedLayout from './core/layouts/ProtectedLayout';
import LoginPage from './core/layouts/LoginPage';
import NotFoundPage from './core/layouts/NotFoundPage';
import { dashboardRoutes } from './features/dashboard/routes';
import { farmerRoutes } from './features/farmers/routes';
import { buyerRoutes } from './features/buyers/routes';
import { matchingRoutes } from './features/matching/routes';
import { allocationRoutes } from './features/allocation/routes';
import { strategyRoutes } from './features/strategies/routes';
import { priceRoutes } from './features/prices/routes';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <ProtectedLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      ...dashboardRoutes,
      ...farmerRoutes,
      ...buyerRoutes,
      ...matchingRoutes,
      ...allocationRoutes,
      ...strategyRoutes,
      ...priceRoutes,
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
