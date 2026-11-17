import type { RouteObject } from 'react-router-dom';
import { ForecastingPage } from '../forecasting/views/ForecastingPage';
import { TransportationPage } from '../transportation/views/TransportationPage';
import { FreshnessPage } from '../freshness/views/FreshnessPage';
import { RiskPage } from '../risk/views/RiskPage';
import { PricingPage } from '../pricing/views/PricingPage';
import { SimulationPage } from '../simulation/views/SimulationPage';
import { SustainabilityPage } from '../sustainability/views/SustainabilityPage';

export const intelligenceRoutes: RouteObject[] = [
  { path: 'intelligence/forecasting', element: <ForecastingPage /> },
  { path: 'intelligence/transportation', element: <TransportationPage /> },
  { path: 'intelligence/freshness', element: <FreshnessPage /> },
  { path: 'intelligence/risk', element: <RiskPage /> },
  { path: 'intelligence/pricing', element: <PricingPage /> },
  { path: 'intelligence/simulation', element: <SimulationPage /> },
  { path: 'intelligence/sustainability', element: <SustainabilityPage /> },
];
