import { createElement, lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

const FarmersPage = lazy(() => import('./views/FarmersPage'));
const FarmerDashboardView = lazy(() => import('./views/FarmerDashboardView'));

export const farmerRoutes: RouteObject[] = [
  {
    path: 'farmers',
    element: createElement(FarmersPage),
  },
  {
    path: 'farmer-dashboard',
    element: createElement(FarmerDashboardView),
  },
];
