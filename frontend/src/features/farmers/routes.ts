import type { RouteObject } from 'react-router-dom';
import FarmersPage from './views/FarmersPage';

export const farmerRoutes: RouteObject[] = [
  {
    path: 'farmers',
    element: <FarmersPage />,
  },
];
