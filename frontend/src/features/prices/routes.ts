import { createElement, lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

const PricesPage = lazy(() => import('./views/PricesPage'));

export const priceRoutes: RouteObject[] = [
  {
    path: 'prices',
    element: createElement(PricesPage),
  },
];
