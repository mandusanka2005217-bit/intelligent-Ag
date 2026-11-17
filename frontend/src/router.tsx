import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from './core/layouts/AppLayout';
import DashboardPage from './features/dashboard/views/DashboardPage';
import FarmersPage from './features/farmers/views/FarmersPage';
import BuyersPage from './features/buyers/views/BuyersPage';
import MatchingPage from './features/matching/views/MatchingPage';
import AllocationPage from './features/allocation/views/AllocationPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'farmers',
        element: <FarmersPage />,
      },
      {
        path: 'buyers',
        element: <BuyersPage />,
      },
      {
        path: 'matching',
        element: <MatchingPage />,
      },
      {
        path: 'allocation',
        element: <AllocationPage />,
      },
    ],
  },
]);
