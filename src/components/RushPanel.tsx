import { useGame } from '../app/GameContext';
import {
  completedSaleLabel,
  describeRushActivity,
  formatMoney,
  rushClock,
  type RushSpeed,
} from '../game';
import { VENUES } from '../content/gameContent';

/** Stable completeness contract shared by the live dashboard and its interaction tests. */
export const SERVICE_DASHBOARD_FIELDS = [
  'time',
  'cash',
  'revenue',
  'served',
  'lost',
  'queue',
  'satisfaction',
  'reputation',
  'event',
  'pause',
  'speed',
] as const;

export type ServiceDashboardField = (typeof SERVICE_DASHBOARD_FIELDS)[number];

/** Live service metrics and pause/speed controls. */
export function RushPanel(): React.JSX.Element {
  const { command, game } = useGame();
  if (!game?.rush) return <></>;
  const { rush } = game;
  const progress = Math.round((rush.tick / rush.durationTicks) * 100);
  const lastSale = rush.recentActivity.findLast((event) => event.type === 'sale');
  const lastWalkaway = rush.recentActivity.findLast((event) => event.type === 'walkaway');
  const recentActivity = rush.recentActivity.slice(-6);
  const satisfaction =
    rush.stats.served > 0
      ? `${String(Math.round(rush.stats.satisfactionTotal / rush.stats.served))}/100`
      : 'No ratings yet';
  const latestDecision = rush.resolvedEvents.at(-1)?.summary;
  const eventStatus = rush.pendingEvent
    ? `Decision open: ${rush.pendingEvent.title}`
    : latestDecision
      ? `Latest decision: ${latestDecision}`
      : 'No active service decision';

  return (
    <>
      <section
        className="panel rush-panel rush-dashboard"
        aria-labelledby="rush-title"
        data-service-section="dashboard"
      >
        <div className="panel-heading rush-dashboard-heading">
          <div>
            <p className="eyebrow">Service rush · {VENUES[game.venueId].shortName}</p>
            <h2 id="rush-title">The laneway is moving</h2>
          </div>
          <strong className="rush-clock" data-dashboard-field="time">
            <span className="sr-only">Service time </span>
            {rushClock(game)}
          </strong>
        </div>
        <div
          aria-label={`Rush ${progress}% complete`}
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={progress}
          className="progress-track"
          role="progressbar"
        >
          <span style={{ width: `${progress}%` }} />
        </div>
        <dl className="rush-metrics">
          <DashboardMetric field="cash" label="Cash" value={formatMoney(game.cashCents)} />
          <DashboardMetric
            field="revenue"
            label="Revenue"
            value={formatMoney(rush.stats.revenueCents)}
          />
          <DashboardMetric field="served" label="Served" value={String(rush.stats.served)} />
          <DashboardMetric field="lost" label="Lost" value={String(rush.stats.abandoned)} />
          <DashboardMetric field="queue" label="Queue" value={String(rush.queue.length)} />
          <DashboardMetric field="satisfaction" label="Satisfaction" value={satisfaction} />
          <DashboardMetric
            field="reputation"
            label="Reputation"
            value={`${String(game.reputation)}/100`}
          />
          <div className="rush-event-status" data-dashboard-field="event">
            <dt>Event</dt>
            <dd>{eventStatus}</dd>
          </div>
        </dl>

        <div className="rush-controls" aria-label="Rush controls">
          <button
            aria-pressed={rush.isPaused}
            className="button"
            data-dashboard-field="pause"
            onClick={() => command({ type: 'togglePause' })}
            type="button"
          >
            {rush.isPaused ? 'Resume' : 'Pause'}
          </button>
          <div
            className="speed-controls"
            data-dashboard-field="speed"
            role="group"
            aria-label="Service speed"
          >
            {([1, 2, 4] as RushSpeed[]).map((speed) => (
              <button
                aria-pressed={rush.speed === speed}
                className={rush.speed === speed ? 'is-active' : ''}
                key={speed}
                onClick={() => command({ type: 'setSpeed', speed })}
                type="button"
              >
                {speed}×
              </button>
            ))}
          </div>
        </div>
      </section>
      <section
        className="panel rush-activity"
        aria-labelledby="rush-activity-title"
        data-service-section="activity"
      >
        <div className="rush-activity-heading">
          <p className="eyebrow">Live activity</p>
          <h2 id="rush-activity-title">What is happening now</h2>
        </div>
        <p className="service-note">
          {rush.activeService
            ? `Making ${rush.activeService.customer.order.drinkId.replace(/([A-Z])/g, ' $1').toLowerCase()} for ${rush.activeService.customer.segment}.`
            : rush.queue.length > 0
              ? 'Calling the next order.'
              : 'A rare quiet second in the laneway.'}
        </p>
        {lastSale ? (
          <p aria-atomic="true" aria-live="polite" className="last-sale-note">
            Last sale: {completedSaleLabel(lastSale)} — {formatMoney(lastSale.priceCents)} actual
            charge.
          </p>
        ) : null}
        {lastWalkaway ? (
          <p className="last-walkaway-note" data-reason={lastWalkaway.reason}>
            Latest walkaway: {describeRushActivity(lastWalkaway)}
          </p>
        ) : null}
        {recentActivity.length > 0 ? (
          <ol aria-label="Recent rush activity" className="explanation-list">
            {recentActivity.map((event) => (
              <li key={event.id}>{describeRushActivity(event)}</li>
            ))}
          </ol>
        ) : (
          <p className="empty-note">No service activity has been recorded yet.</p>
        )}
      </section>
    </>
  );
}

function DashboardMetric({
  field,
  label,
  value,
}: {
  readonly field: Exclude<ServiceDashboardField, 'event' | 'pause' | 'speed' | 'time'>;
  readonly label: string;
  readonly value: string;
}): React.JSX.Element {
  return (
    <div data-dashboard-field={field}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
