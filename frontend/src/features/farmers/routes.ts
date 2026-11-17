import { createElement, lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

const FarmersPage = lazy(() => import('./views/FarmersPage'));

export const farmerRoutes: RouteObject[] = [
  {
    path: 'farmers',
    element: createElement(FarmersPage),
  },
];
