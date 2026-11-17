import type { RouteObject } from 'react-router-dom';
import AllocationPage from './views/AllocationPage';

export const allocationRoutes: RouteObject[] = [
  {
    path: 'allocation',
    element: <AllocationPage />,
  },
];
