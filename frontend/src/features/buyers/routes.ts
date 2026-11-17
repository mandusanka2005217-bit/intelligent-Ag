import type { RouteObject } from 'react-router-dom';
import BuyersPage from './views/BuyersPage';

export const buyerRoutes: RouteObject[] = [
  {
    path: 'buyers',
    element: <BuyersPage />,
  },
];
