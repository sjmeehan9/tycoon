import { useId } from 'react';

import { useGame } from '../app/GameContext';
import {
  CAMPAIGN_RULES,
  DRINK_MAP,
  EQUIPMENT,
  EQUIPMENT_IDS,
  IMPROVEMENTS,
  INGREDIENT_DETAILS,
  INGREDIENT_IDS,
  TICKS_PER_SECOND,
  VENUES,
} from '../content/gameContent';
import {
  completedSaleLabel,
  DIFFICULTY_LABELS,
  formatIngredientQuantity,
  formatMoney,
  STATION_DETAILS,
  type DayReport,
  type EventChoiceEffect,
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
          <p className="eyebrow">
            Day {report.day} report · {DIFFICULTY_LABELS[report.difficulty]}
          </p>
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
            <div>
              <dl className="report-stats">
                <ReportMetric label="Served" value={`${report.served}/${report.arrivals}`} />
                <ReportMetric label="Satisfaction" value={`${report.satisfactionPercent}%`} />
                <ReportMetric label="Average wait" value={`${report.averageWaitSeconds}s`} />
                <ReportMetric
                  label="Reputation"
                  value={`${report.reputationChange >= 0 ? '+' : ''}${report.reputationChange}`}
                />
              </dl>
              <p className="reputation-soft-ceiling-note" role="note">
                Positive settlement gains pause at {CAMPAIGN_RULES.reputationSoftCeiling}
                reputation; losses still apply.
              </p>
            </div>
          </div>

          <ServiceEvidence report={report} titleId={`service-evidence-title-${instanceId}`} />
          <CauseEvidence report={report} titleId={`cause-evidence-title-${instanceId}`} />
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

function CauseEvidence({
  report,
  titleId,
}: {
  report: DayReport;
  titleId: string;
}): React.JSX.Element {
  const snapshot = report.causeSnapshot;
  if (!snapshot) {
    return (
      <section aria-labelledby={titleId} className="report-cause-evidence">
        <h3 id={titleId}>Trading causes</h3>
        <p className="cause-unavailable" role="note">
          Cause detail is unavailable for this older report. No historical operating choices were
          reconstructed.
        </p>
      </section>
    );
  }
  return (
    <section aria-labelledby={titleId} className="report-cause-evidence">
      <h3 id={titleId}>Trading causes</h3>
      <p>
        Captured at settlement for the {VENUES[snapshot.venueId].shortName}; reopening this report
        never reads the current plan.
      </p>
      <dl className="report-cause-grid">
        <ReportMetric
          label="Dial-in and beans"
          value={`${snapshot.plan.dialIn} · ${snapshot.plan.beanId}`}
        />
        <ReportMetric
          label="Queue pressure"
          value={`Peak ${snapshot.wait.peakQueue}/${snapshot.wait.queueCapacity} · ${snapshot.wait.totalWaitTicks} wait ticks`}
        />
        <ReportMetric
          label="Operating cost"
          value={`${formatMoney(snapshot.equipment.venueOperatingCostCents)} venue + ${formatMoney(snapshot.equipment.equipmentOperatingCostCents)} equipment`}
        />
        <ReportMetric
          label="Express menu"
          value={
            snapshot.plan.expressDrinkIds.length > 0
              ? snapshot.plan.expressDrinkIds.join(', ')
              : 'None'
          }
        />
      </dl>
      <h4>Menu and prices</h4>
      <ul aria-label="Captured menu prices" className="cause-list captured-menu-list">
        {snapshot.plan.menu.map(({ drinkId, priceCents }) => (
          <li key={drinkId}>
            <strong>{DRINK_MAP.get(drinkId)?.name ?? drinkId}</strong>
            <span>{formatMoney(priceCents)}</span>
          </li>
        ))}
      </ul>
      <div className="report-cause-columns">
        <div>
          <h4>Scheduled team</h4>
          {snapshot.staffing.length > 0 ? (
            <ul className="cause-list">
              {snapshot.staffing.map((member) => (
                <li key={member.staffId}>
                  <strong>{member.name}</strong> · {member.role} · speed {member.speed}, skill{' '}
                  {member.skill}, {member.trait} ·{' '}
                  {member.stationId ? STATION_DETAILS[member.stationId].label : 'unassigned'} ·{' '}
                  {formatMoney(member.wageCents)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-note">Owner-operated; no staff wages.</p>
          )}
        </div>
        <div>
          <h4>Installed operation</h4>
          <ul className="cause-list">
            {EQUIPMENT_IDS.filter((id) => snapshot.equipment.levels[id] > 0).map((id) => (
              <li key={id}>
                {EQUIPMENT[id].name} level {snapshot.equipment.levels[id]}
              </li>
            ))}
            {snapshot.equipment.improvements.map((id) => (
              <li key={id}>{IMPROVEMENTS[id].name}</li>
            ))}
          </ul>
        </div>
      </div>
      <h4>Resolved service events</h4>
      {snapshot.events.length > 0 ? (
        <ul className="cause-list event-cause-list">
          {snapshot.events.map((event) => (
            <li key={event.eventId}>
              <strong>
                {event.title}: {event.choiceLabel}
              </strong>
              <span>{event.choiceDescription}</span>
              <dl
                aria-label={`${event.title} resolved effect values`}
                className="event-effect-grid"
              >
                <EventEffect label="Cash" value={formatSignedMoney(event.effect.cashCents ?? 0)} />
                <EventEffect
                  label="Arrivals"
                  value={formatSignedNumber(event.effect.addCustomers ?? 0)}
                />
                <EventEffect
                  label="Demand"
                  value={`×${formatMultiplier(event.effect.demandMultiplier ?? 1)}`}
                />
                <EventEffect
                  label="Quality"
                  value={formatSignedNumber(event.effect.qualityBonus ?? 0)}
                />
                <EventEffect
                  label="Reputation"
                  value={formatSignedNumber(event.effect.reputation ?? 0)}
                />
              </dl>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty-note">No service event occurred on this day.</p>
      )}
    </section>
  );
}

function EventEffect({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function formatSignedNumber(value: number): string {
  if (value === 0) return '0';
  return `${value > 0 ? '+' : '−'}${Math.abs(value)}`;
}

function formatMultiplier(value: EventChoiceEffect['demandMultiplier']): string {
  return String(value ?? 1);
}

function ServiceEvidence({
  report,
  titleId,
}: {
  report: DayReport;
  titleId: string;
}): React.JSX.Element {
  return (
    <section aria-labelledby={titleId} className="service-evidence">
      <h3 id={titleId}>Station and lane service</h3>
      <p>
        Completed job identities reconcile once to {report.served} served customers and{' '}
        {formatMoney(report.revenueCents)} revenue. Staffing and equipment show the topology
        captured when that rush opened.
      </p>
      <div className="service-evidence-scroll" tabIndex={0}>
        <table>
          <caption>Canonical service settlement by station and lane</caption>
          <thead>
            <tr>
              <th scope="col">Station</th>
              <th scope="col">Lane</th>
              <th scope="col">Coverage</th>
              <th scope="col">Jobs</th>
              <th scope="col">Revenue</th>
              <th scope="col">Average wait</th>
              <th scope="col">Satisfaction</th>
            </tr>
          </thead>
          <tbody>
            {report.serviceAggregates.map((aggregate) => {
              const averageWait =
                aggregate.served > 0
                  ? Math.round(
                      (aggregate.totalWaitTicks / aggregate.served / TICKS_PER_SECOND) * 10,
                    ) / 10
                  : 0;
              const satisfaction =
                aggregate.served > 0
                  ? Math.round(aggregate.satisfactionTotal / aggregate.served)
                  : 0;
              return (
                <tr
                  data-lane-id={aggregate.laneId}
                  data-station-id={aggregate.stationId}
                  key={`${aggregate.stationId}:${aggregate.laneId}`}
                >
                  <th scope="row">{STATION_DETAILS[aggregate.stationId].label}</th>
                  <td>{aggregate.laneId === 'express' ? 'Express' : 'Normal'}</td>
                  <td>
                    {aggregate.assignedStaffIds.length} staff · {aggregate.equipmentIds.length}{' '}
                    equipment
                  </td>
                  <td>{aggregate.completedJobIds.length}</td>
                  <td>{formatMoney(aggregate.revenueCents)}</td>
                  <td>{averageWait}s</td>
                  <td>{aggregate.served > 0 ? `${satisfaction}%` : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
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
