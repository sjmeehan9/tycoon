import { useId } from 'react';

import { useGame } from '../app/GameContext';
import { INGREDIENT_DETAILS, INGREDIENT_IDS } from '../content/gameContent';
import {
  completedSaleLabel,
  formatIngredientQuantity,
  formatMoney,
  type DayReport,
  type IngredientId,
} from '../game';

export type ReportViewMode = 'current' | 'historical';

export type ReportViewProps =
  | { mode: 'current'; onSettle: () => void; report: DayReport }
  | { mode: 'historical'; onSettle?: never; report: DayReport };

/** Reconciled report renderer whose output depends only on its explicit report value and mode. */
export function ReportView(props: ReportViewProps): React.JSX.Element {
  const { mode, report } = props;
  const instanceId = useId();
  const titleId = `report-title-${instanceId}`;
  const detailsId = `report-details-${instanceId}`;
  const isCurrent = mode === 'current';
  const lifecycleRows = lifecycleReportRows(report);
  return (
    <section
      aria-labelledby={titleId}
      className={`panel report-panel report-panel-${mode}`}
      data-report-day={report.day}
      data-report-mode={mode}
    >
      <div className="panel-heading report-heading">
        <div>
          <p className="eyebrow">Day {report.day} report</p>
          <h2 id={titleId}>
            {isCurrent ? 'How the cart traded' : `Day ${report.day} trading report`}
          </h2>
        </div>
        <span className={report.netCashFlowCents >= 0 ? 'result-positive' : 'result-negative'}>
          {report.netCashFlowCents >= 0 ? 'Profitable day' : 'Cash went backwards'}
        </span>
      </div>

      <dl aria-label={`Day ${report.day} result summary`} className="report-summary-grid">
        <ReportMetric label="Revenue" value={formatMoney(report.revenueCents)} />
        <ReportMetric label="Net cash flow" value={formatSignedMoney(report.netCashFlowCents)} />
        <ReportMetric label="Closing cash" value={formatMoney(report.closingCashCents)} />
        <ReportMetric label="Served" value={`${report.served}/${report.arrivals}`} />
        <ReportMetric label="Lost sales" value={String(report.abandoned)} />
        <ReportMetric label="Satisfaction" value={`${report.satisfactionPercent}%`} />
      </dl>

      <div className="bottleneck-card report-bottleneck">
        <strong>Bottleneck</strong>
        <span>{report.bottleneck}</span>
      </div>

      {mode === 'current' ? (
        <button
          className="button button-primary report-settle-button"
          onClick={props.onSettle}
          type="button"
        >
          Settle &amp; reinvest
        </button>
      ) : null}

      <details className="report-disclosure" id={detailsId}>
        <summary>View full Day {report.day} report</summary>
        <div className="report-full-content">
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
                  <td>{formatSignedMoney(report.eventCashDeltaCents)}</td>
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
              <ReportMetric label="Served" value={`${report.served}/${report.arrivals}`} />
              <ReportMetric label="Satisfaction" value={`${report.satisfactionPercent}%`} />
              <ReportMetric label="Average wait" value={`${report.averageWaitSeconds}s`} />
              <ReportMetric
                label="Reputation"
                value={`${report.reputationChange >= 0 ? '+' : ''}${report.reputationChange}`}
              />
            </dl>
          </div>

          <ChargeEvidence report={report} titleId={`sale-evidence-title-${instanceId}`} />
          <InventoryLifecycle
            report={report}
            rows={lifecycleRows}
            titleId={`inventory-lifecycle-title-${instanceId}`}
          />

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
        </div>
      </details>
    </section>
  );
}

/** Current-day report connected to the one canonical settlement command. */
export function ReportPanel(): React.JSX.Element {
  const { command, game } = useGame();
  const report = game?.report;
  if (!report) return <></>;
  return (
    <ReportView mode="current" onSettle={() => command({ type: 'closeDay' })} report={report} />
  );
}

function ReportMetric({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function ChargeEvidence({
  report,
  titleId,
}: {
  report: DayReport;
  titleId: string;
}): React.JSX.Element {
  const groups = report.chargeGroups;
  if (groups === undefined) {
    return (
      <section aria-labelledby={titleId} className="sale-evidence">
        <h3 id={titleId}>Actual charges</h3>
        <p className="sale-observation-summary" role="note">
          Charge breakdown unavailable for this older report.
        </p>
      </section>
    );
  }
  const quantity = groups.reduce((total, group) => total + group.quantity, 0);
  const revenueCents = groups.reduce((total, group) => total + group.revenueCents, 0);
  return (
    <section aria-labelledby={titleId} className="sale-evidence">
      <h3 id={titleId}>Actual charges</h3>
      {groups.length > 0 ? (
        <ul aria-label="Canonical sale charges" className="sale-charge-list">
          {groups.map((group) => (
            <li key={[group.drinkId, group.size, group.milk, group.priceCents].join(':')}>
              <span>{completedSaleLabel(group)}</span>
              <strong>
                {group.quantity} × {formatMoney(group.priceCents)} ={' '}
                {formatMoney(group.revenueCents)}
              </strong>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty-note">No completed sale charges were recorded.</p>
      )}
      <p className="sale-observation-summary">
        All {quantity} completed sale charges total{' '}
        <strong className="sale-observation-total">{formatMoney(revenueCents)}</strong>, matching
        sales revenue.
      </p>
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
  titleId,
}: {
  report: DayReport;
  rows: LifecycleRow[];
  titleId: string;
}): React.JSX.Element {
  if (!report.inventoryLifecycle) {
    return (
      <section aria-labelledby={titleId} className="inventory-lifecycle">
        <h3 id={titleId}>Stock lifecycle</h3>
        <p className="lifecycle-unavailable">
          Lifecycle detail is unavailable for this older save. No historical stock quantities were
          reconstructed.
        </p>
      </section>
    );
  }
  const expired = rows.filter((row) => row.expired > 0);
  return (
    <section aria-labelledby={titleId} className="inventory-lifecycle">
      <h3 id={titleId}>Stock lifecycle</h3>
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

function formatSignedMoney(cents: number): string {
  return `${cents >= 0 ? '+' : '−'}${formatMoney(Math.abs(cents))}`;
}
