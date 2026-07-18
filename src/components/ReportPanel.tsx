import { INGREDIENT_DETAILS, INGREDIENT_IDS } from '../content/gameContent';
import { useGame } from '../app/GameContext';
import {
  completedSaleLabel,
  formatIngredientQuantity,
  formatMoney,
  type CompletedSaleActivity,
  type DayReport,
  type IngredientId,
} from '../game';

/** Reconciled end-of-day trading report. */
export function ReportPanel(): React.JSX.Element {
  const { command, game } = useGame();
  const report = game?.report;
  if (!game || !report) return <></>;
  const recentSales = game.rush?.recentActivity ?? [];
  const chargeGroups = groupSaleCharges(recentSales);
  const observedTotal = recentSales.reduce((total, sale) => total + sale.priceCents, 0);
  const includesEverySale = recentSales.length === report.served;
  const lifecycleRows = lifecycleReportRows(report);
  return (
    <section className="panel report-panel" aria-labelledby="report-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Day {report.day} report</p>
          <h2 id="report-title">How the cart traded</h2>
        </div>
        <span className={report.netCashFlowCents >= 0 ? 'result-positive' : 'result-negative'}>
          {report.netCashFlowCents >= 0 ? 'Profitable day' : 'Cash went backwards'}
        </span>
      </div>
      <div className="report-layout">
        <table>
          <caption>Cash reconciliation</caption>
          <tbody>
            <tr>
              <th scope="row">Opening cash</th>
              <td>{formatMoney(report.openingCashCents)}</td>
            </tr>
            <tr>
              <th scope="row">Supply purchases</th>
              <td>−{formatMoney(report.purchaseCostCents)}</td>
            </tr>
            <tr>
              <th scope="row">Sales revenue</th>
              <td>+{formatMoney(report.revenueCents)}</td>
            </tr>
            <tr>
              <th scope="row">Event cash adjustments</th>
              <td>
                {report.eventCashDeltaCents >= 0 ? '+' : '−'}
                {formatMoney(Math.abs(report.eventCashDeltaCents))}
              </td>
            </tr>
            <tr>
              <th scope="row">Staff wages</th>
              <td>−{formatMoney(report.wageCostCents)}</td>
            </tr>
            <tr>
              <th scope="row">Venue and equipment costs</th>
              <td>−{formatMoney(report.operatingCostCents)}</td>
            </tr>
            <tr className="report-total">
              <th scope="row">Closing cash</th>
              <td>{formatMoney(report.closingCashCents)}</td>
            </tr>
          </tbody>
        </table>
        <dl className="report-stats">
          <div>
            <dt>Served</dt>
            <dd>
              {report.served}/{report.arrivals}
            </dd>
          </div>
          <div>
            <dt>Satisfaction</dt>
            <dd>{report.satisfactionPercent}%</dd>
          </div>
          <div>
            <dt>Average wait</dt>
            <dd>{report.averageWaitSeconds}s</dd>
          </div>
          <div>
            <dt>Reputation</dt>
            <dd>
              {report.reputationChange >= 0 ? '+' : ''}
              {report.reputationChange}
            </dd>
          </div>
        </dl>
      </div>
      {recentSales.length > 0 ? (
        <section className="sale-evidence" aria-labelledby="sale-evidence-title">
          <h3 id="sale-evidence-title">Actual charges</h3>
          <ul aria-label="Recent actual sale charges" className="sale-charge-list">
            {chargeGroups.map((group) => (
              <li key={group.key}>
                <span>{completedSaleLabel(group.sale)}</span>
                <strong>
                  {group.quantity} × {formatMoney(group.sale.priceCents)} ={' '}
                  {formatMoney(group.quantity * group.sale.priceCents)}
                </strong>
              </li>
            ))}
          </ul>
          <p className="sale-observation-summary">
            {includesEverySale ? (
              <>
                All {report.served} completed sale charges total{' '}
                <strong className="sale-observation-total">{formatMoney(observedTotal)}</strong>,
                matching sales revenue.
              </>
            ) : (
              <>
                Latest {recentSales.length} of {report.served} completed sales shown; report sales
                revenue includes every completed sale.
              </>
            )}
          </p>
        </section>
      ) : null}
      <InventoryLifecycle report={report} rows={lifecycleRows} />
      <div className="bottleneck-card">
        <strong>Bottleneck</strong>
        <span>{report.bottleneck}</span>
      </div>
      <h3>Customers served</h3>
      <dl className="segment-mix">
        {(['commuter', 'student', 'enthusiast', 'regular'] as const).map((segment) => (
          <div key={segment}>
            <dt>{segment}</dt>
            <dd>{report.servedBySegment[segment] ?? 0}</dd>
          </div>
        ))}
      </dl>
      <h3>Why it happened</h3>
      <ul className="explanation-list">
        {report.explanations.map((explanation) => (
          <li key={explanation}>{explanation}</li>
        ))}
      </ul>
      <button
        className="button button-primary"
        onClick={() => command({ type: 'closeDay' })}
        type="button"
      >
        Settle the day
      </button>
    </section>
  );
}

interface LifecycleRow {
  ingredientId: IngredientId;
  opening: number;
  purchased: number;
  consumed: number;
  expired: number;
  remaining: number;
}

function InventoryLifecycle({
  report,
  rows,
}: {
  report: DayReport;
  rows: LifecycleRow[];
}): React.JSX.Element {
  if (!report.inventoryLifecycle) {
    return (
      <section className="inventory-lifecycle" aria-labelledby="inventory-lifecycle-title">
        <h3 id="inventory-lifecycle-title">Stock lifecycle</h3>
        <p className="lifecycle-unavailable">
          Lifecycle detail is unavailable for this older save. No historical stock quantities were
          reconstructed.
        </p>
      </section>
    );
  }
  const expired = rows.filter((row) => row.expired > 0);
  return (
    <section className="inventory-lifecycle" aria-labelledby="inventory-lifecycle-title">
      <h3 id="inventory-lifecycle-title">Stock lifecycle</h3>
      <p className="lifecycle-formula">Opening + bought − used − expired = rolled forward.</p>
      <div className="lifecycle-table-scroll" tabIndex={0}>
        <table>
          <caption>Inventory lifecycle reconciliation</caption>
          <thead>
            <tr>
              <th scope="col">Ingredient</th>
              <th scope="col">Opening</th>
              <th scope="col">Bought</th>
              <th scope="col">Used</th>
              <th scope="col">Expired waste</th>
              <th scope="col">Rolled</th>
              <th scope="col">Conservation check</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const details = INGREDIENT_DETAILS[row.ingredientId];
              return (
                <tr key={row.ingredientId}>
                  <th scope="row">{details.name}</th>
                  <td>{formatIngredientQuantity(row.opening, details.unit)}</td>
                  <td>{formatIngredientQuantity(row.purchased, details.unit)}</td>
                  <td>{formatIngredientQuantity(row.consumed, details.unit)}</td>
                  <td>{formatIngredientQuantity(row.expired, details.unit)}</td>
                  <td>{formatIngredientQuantity(row.remaining, details.unit)}</td>
                  <td className="lifecycle-equation">{quantityEquation(row, details.unit)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {expired.length > 0 ? (
        <p className="expiry-cause">
          <strong>Expiry cause:</strong> after the Day {report.day} rush,{' '}
          {expired
            .map((row) => {
              const details = INGREDIENT_DETAILS[row.ingredientId];
              return `${details.name} ${formatIngredientQuantity(row.expired, details.unit)}`;
            })
            .join(', ')}{' '}
          reached the inclusive last usable day and was removed before the next trading day.
        </p>
      ) : null}
    </section>
  );
}

function lifecycleReportRows(report: DayReport): LifecycleRow[] {
  const lifecycle = report.inventoryLifecycle;
  if (!lifecycle) return [];
  return INGREDIENT_IDS.map((ingredientId) => ({
    ingredientId,
    opening: lifecycle.opening[ingredientId],
    purchased: lifecycle.purchased[ingredientId],
    consumed: lifecycle.consumed[ingredientId],
    expired: lifecycle.expired[ingredientId],
    remaining: lifecycle.remaining[ingredientId],
  })).filter((row) =>
    [row.opening, row.purchased, row.consumed, row.expired, row.remaining].some(
      (quantity) => quantity > 0,
    ),
  );
}

function quantityEquation(
  row: LifecycleRow,
  unit: (typeof INGREDIENT_DETAILS)[IngredientId]['unit'],
): string {
  return `${formatIngredientQuantity(row.opening, unit)} + ${formatIngredientQuantity(row.purchased, unit)} − ${formatIngredientQuantity(row.consumed, unit)} − ${formatIngredientQuantity(row.expired, unit)} = ${formatIngredientQuantity(row.remaining, unit)}`;
}

interface SaleChargeGroup {
  key: string;
  sale: CompletedSaleActivity;
  quantity: number;
}

function groupSaleCharges(sales: CompletedSaleActivity[]): SaleChargeGroup[] {
  const groups = new Map<string, SaleChargeGroup>();
  for (const sale of sales) {
    const key = [sale.drinkId, sale.size, sale.milk, sale.priceCents].join(':');
    const existing = groups.get(key);
    groups.set(
      key,
      existing ? { ...existing, quantity: existing.quantity + 1 } : { key, sale, quantity: 1 },
    );
  }
  return [...groups.values()];
}
