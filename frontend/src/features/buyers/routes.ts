import { createElement, lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

const BuyersPage = lazy(() => import('./views/BuyersPage'));
const BuyerDashboardView = lazy(() => import('./views/BuyerDashboardView'));

export const buyerRoutes: RouteObject[] = [
  {
    path: 'buyers',
    element: createElement(BuyersPage),
  },
  {
    path: 'buyer-dashboard',
    element: createElement(BuyerDashboardView),
  },
];
