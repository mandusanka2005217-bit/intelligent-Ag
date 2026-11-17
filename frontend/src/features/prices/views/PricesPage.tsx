import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, TrendingUp } from 'lucide-react';
import type { Product } from '../types';
import Button from '@/core/components/Button';
import { useScenarioStore } from '@core/store/scenarioStore';
import Card from '@/shared/components/Card';
import SimulatedBadge from '@/shared/components/SimulatedBadge';
import Skeleton from '@/shared/components/Skeleton';
import { apiErrorMessage } from '@/shared/services/api-client';
import { formatCurrency, formatDate, formatDateShort } from '@/shared/utils/format';
import ScenarioBar from '@/features/scenarios/components/ScenarioBar';
import { useScenarioData } from '@/features/scenarios/hooks/useScenarios';
import PriceChart from '../components/PriceChart';
import { usePriceAnomaly } from '../hooks/usePriceAnomaly';

const PricesPage: React.FC = () => {
  const scenarioId = useScenarioStore((state) => state.scenarioId);
  const { data: scenarioData } = useScenarioData(scenarioId);
  const [product, setProduct] = useState<Product>('Tomato');

  const products = useMemo(
    () => Object.keys(scenarioData?.marketPrices ?? {}).sort((a, b) => a.localeCompare(b)) as Product[],
    [scenarioData],
  );

  const { data, isLoading, refetch, isFetching, error } = usePriceAnomaly(product);
  const recent = [...(data?.points ?? [])].slice(-8).reverse();

  const metrics = data
    ? [
        {
          label: 'Current price',
          value: `${formatCurrency(data.current.price)}/kg`,
          sub: `${data.product} · ${formatDate(data.current.date)}`,
        },
        {
          label: `Rolling mean (${data.windowDays}d)`,
          value:
            data.current.rollingMean !== null
              ? `${formatCurrency(data.current.rollingMean)}/kg`
              : '—',
          sub:
            data.current.rollingStd !== null
              ? `σ = ${formatCurrency(data.current.rollingStd)}`
              : 'baseline building',
        },
        {
          label: 'z-score',
          value: data.current.zScore !== null ? data.current.zScore.toFixed(2) : '—',
          sub: `threshold ±${data.thresholdZ}`,
        },
        {
          label: 'Scoring reference',
          value: `${formatCurrency(data.robustReference)}/kg`,
          sub: data.flagged
            ? '30-day median (anomaly flagged)'
            : 'market price used directly',
        },
        {
          label: 'Next-price estimate',
          value: data.forecast ? `${formatCurrency(data.forecast.nextPrice)}/kg` : '—',
          sub: data.forecast ? `${data.forecast.method} · ${data.forecast.windowDays}d window` : 'not available',
        },
        {
          label: 'Status',
          value: data.flagged ? 'Anomaly' : 'Normal',
          sub: data.flagged ? 'price influence capped in scoring' : 'within the tolerance band',
        },
      ]
    : [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-header__title">Prices &amp; anomalies</h2>
          <p className="page-header__subtitle">
            Rolling z-score detection over 90 simulated days of Dambulla wholesale prices.
          </p>
        </div>
        <div className="page-header__actions">
          <SimulatedBadge />
          <Button
            variant="outline"
            leftIcon={<TrendingUp size={16} />}
            onClick={() => refetch()}
            loading={isFetching && !isLoading}
          >
            Refresh
          </Button>
        </div>
      </div>

      <ScenarioBar />

      <div className="product-pills" role="tablist" aria-label="Product">
        {(products.length > 0 ? products : [product]).map((option) => (
          <button
            key={option}
            role="tab"
            aria-selected={option === product}
            className={`product-pill ${option === product ? 'product-pill--active' : ''}`}
            onClick={() => setProduct(option)}
          >
            {option}
            {scenarioData?.marketPrices[option] !== undefined && (
              <span className="product-pill__price">
                Rs {Math.round(scenarioData.marketPrices[option])}
              </span>
            )}
          </button>
        ))}
      </div>

      {error && (
        <div className="notice notice--danger" role="alert">
          {apiErrorMessage(error)}
        </div>
      )}

      {isLoading || !data ? (
        <div className="price-skeleton">
          <Skeleton height={92} />
          <Skeleton height={340} />
        </div>
      ) : (
        <>
          {data.flagged ? (
            <div className="notice notice--warning">
              <AlertTriangle size={18} />
              <div>
                <strong>
                  {data.product} price anomaly detected — z = {data.current.zScore?.toFixed(2)}
                </strong>
                <p>{data.warning}</p>
                <p>
                  Match scoring falls back to the robust reference{' '}
                  {formatCurrency(data.robustReference)}/kg and halves the price weight so one bad
                  tick cannot dominate the ranking.
                </p>
              </div>
            </div>
          ) : (
            <div className="notice notice--ok">
              <CheckCircle2 size={18} />
              <div>
                <strong>No statistically unusual move detected</strong>
                <p>
                  {data.product} is trading inside the ±{data.thresholdZ}σ rolling band, so the live
                  market price is used directly as the scoring reference.
                </p>
              </div>
            </div>
          )}

          <div className="metric-grid">
            {metrics.map((metric) => (
              <div key={metric.label} className="metric">
                <span className="metric__label">{metric.label}</span>
                <span className="metric__value">{metric.value}</span>
                <span className="metric__sub">{metric.sub}</span>
              </div>
            ))}
          </div>

          <Card
            title={`${data.product} price history`}
            subtitle={`Rolling z-score window ${data.windowDays} days · flag when |z| ≥ ${data.thresholdZ}`}
          >
            <PriceChart response={data} />
          </Card>

          <div className="price-lower-grid">
            <Card title="Recent observations" padded={false}>
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th style={{ textAlign: 'right' }}>Price</th>
                      <th style={{ textAlign: 'right' }}>z-score</th>
                      <th style={{ textAlign: 'right' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((point) => (
                      <tr key={point.date}>
                        <td>{formatDateShort(point.date)}</td>
                        <td style={{ textAlign: 'right' }}>{formatCurrency(point.price)}</td>
                        <td style={{ textAlign: 'right' }}>
                          {point.zScore !== null ? point.zScore.toFixed(2) : '—'}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {point.flagged ? (
                            <span className="pill pill--danger">Flagged</span>
                          ) : (
                            <span className="pill pill--ok">Normal</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card title="How the detector works" subtitle="Transparent and reproducible">
              <ul className="method-list">
                <li>
                  A rolling mean and standard deviation are computed over the previous{' '}
                  <strong>{data.windowDays} days</strong>, excluding the day being tested.
                </li>
                <li>
                  The current price becomes a z-score. Anything at or beyond{' '}
                  <strong>±{data.thresholdZ}</strong> is flagged.
                </li>
                <li>
                  A flagged product switches its scoring reference to the{' '}
                  <strong>30-day median</strong>
                  {data.flagged ? ` (${formatCurrency(data.robustReference)}/kg here)` : ''} and its
                  price weight is capped.
                  {data.flagged
                    ? ''
                    : ` Nothing is flagged for ${data.product} today, so its quoted market price is used directly.`}
                </li>
                <li>
                  The &ldquo;next price&rdquo; figure is a moving average, not a trained forecasting
                  model. It is shown for orientation only.
                </li>
              </ul>
              <p className="strategy-caveat">
                <Info size={14} aria-hidden="true" />
                All 90 price points are simulated. This is a demonstration of the detection logic, not
                market advice.
              </p>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default PricesPage;
