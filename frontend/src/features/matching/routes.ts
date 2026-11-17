import { createElement, lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

const MatchingPage = lazy(() => import('./views/MatchingPage'));

export const matchingRoutes: RouteObject[] = [
  {
    path: 'matching',
    element: createElement(MatchingPage),
  },
];
