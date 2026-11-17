import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from './core/layouts/AppLayout';
import NotFoundPage from './core/layouts/NotFoundPage';
import { dashboardRoutes } from './features/dashboard/routes';
import { farmerRoutes } from './features/farmers/routes';
import { buyerRoutes } from './features/buyers/routes';
import { matchingRoutes } from './features/matching/routes';
import { allocationRoutes } from './features/allocation/routes';
import { strategyRoutes } from './features/strategies/routes';
import { priceRoutes } from './features/prices/routes';

/**
 * Route aggregation. Each feature owns its own `routes.ts`; this file only
 * composes them under the shared layout. Elements are lazy-loaded per feature.
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
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
