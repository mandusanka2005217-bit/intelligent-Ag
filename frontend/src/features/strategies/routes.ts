import { createElement, lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

const StrategiesPage = lazy(() => import('./views/StrategiesPage'));

export const strategyRoutes: RouteObject[] = [
  {
    path: 'strategies',
    element: createElement(StrategiesPage),
  },
];
