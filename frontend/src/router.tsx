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
import { useAuthStore } from './core/store/authStore';

const IndexRedirect: React.FC = () => {
  const currentUser = useAuthStore((s) => s.currentUser);
  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role === 'farmer') return <Navigate to="/farmer-dashboard" replace />;
  if (currentUser.role === 'buyer') return <Navigate to="/buyer-dashboard" replace />;
  return <Navigate to="/dashboard" replace />;
};

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
        element: <IndexRedirect />,
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
