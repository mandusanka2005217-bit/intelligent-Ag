import { createElement, lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

const BuyersPage = lazy(() => import('./views/BuyersPage'));

export const buyerRoutes: RouteObject[] = [
  {
    path: 'buyers',
    element: createElement(BuyersPage),
  },
];
