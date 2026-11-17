import { createElement, lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

const AllocationPage = lazy(() => import('./views/AllocationPage'));

export const allocationRoutes: RouteObject[] = [
  {
    path: 'allocation',
    element: createElement(AllocationPage),
  },
];
