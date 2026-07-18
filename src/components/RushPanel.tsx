import { useGame } from '../app/GameContext';
import {
  completedSaleLabel,
  describeRushActivity,
  formatMoney,
  rushClock,
  type RushSpeed,
} from '../game';

/** Live service metrics and pause/speed controls. */
export function RushPanel(): React.JSX.Element {
  const { command, game } = useGame();
  if (!game?.rush) return <></>;
  const { rush } = game;
  const progress = Math.round((rush.tick / rush.durationTicks) * 100);
  const lastSale = rush.recentActivity.findLast((event) => event.type === 'sale');
  const recentActivity = rush.recentActivity.slice(-6);

  return (
    <section className="panel rush-panel" aria-labelledby="rush-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Service rush</p>
          <h2 id="rush-title">The laneway is moving</h2>
        </div>
        <strong className="rush-clock">{rushClock(game)}</strong>
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
        <div>
          <dt>Queue</dt>
          <dd>{rush.queue.length}</dd>
        </div>
        <div>
          <dt>Served</dt>
          <dd>{rush.stats.served}</dd>
        </div>
        <div>
          <dt>Walked</dt>
          <dd>{rush.stats.abandoned}</dd>
        </div>
        <div>
          <dt>Sales</dt>
          <dd>{formatMoney(rush.stats.revenueCents)}</dd>
        </div>
      </dl>

      <div className="rush-controls" aria-label="Rush controls">
        <button className="button" onClick={() => command({ type: 'togglePause' })} type="button">
          {rush.isPaused ? 'Resume' : 'Pause'}
        </button>
        <div className="speed-controls" role="group" aria-label="Service speed">
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
      {recentActivity.length > 0 ? (
        <ol aria-label="Recent rush activity" className="explanation-list">
          {recentActivity.map((event) => (
            <li key={event.id}>{describeRushActivity(event)}</li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}
