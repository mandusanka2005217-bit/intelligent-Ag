import type { RouteObject } from 'react-router-dom';
import MatchingPage from './views/MatchingPage';

export const matchingRoutes: RouteObject[] = [
  {
    path: 'matching',
    element: <MatchingPage />,
  },
];
