import { CART_IMPROVEMENT_COST_CENTS } from '../content/phase1';
import { useGame } from '../app/GameContext';
import { formatMoney } from '../game';

/** Between-day improvement and continuation controls. */
export function ReinvestPanel(): React.JSX.Element {
  const { command, game } = useGame();
  if (!game) return <></>;
  const hasSign = game.improvements.includes('street-sign');
  const canAfford = game.cashCents >= CART_IMPROVEMENT_COST_CENTS;
  return (
    <section className="panel reinvest-panel" aria-labelledby="reinvest-title">
      <p className="eyebrow">After close</p>
      <h2 id="reinvest-title">Reinvest or call it a night</h2>
      <p>
        The till holds <strong>{formatMoney(game.cashCents)}</strong>. Stock carries into tomorrow;
        purchases in the next morning plan top it up.
      </p>
      <article className={`upgrade-card ${hasSign ? 'is-owned' : ''}`}>
        <div aria-hidden="true" className="upgrade-icon">
          ↗
        </div>
        <div>
          <h3>Hand-painted street sign</h3>
          <p>A little more passing trade and a slightly smoother service path.</p>
          <strong>{hasSign ? 'Owned' : formatMoney(CART_IMPROVEMENT_COST_CENTS)}</strong>
        </div>
        {!hasSign ? (
          <button
            className="button"
            disabled={!canAfford}
            onClick={() => command({ type: 'buyImprovement', improvementId: 'street-sign' })}
            type="button"
          >
            Buy sign
          </button>
        ) : null}
      </article>
      <button
        className="button button-primary"
        onClick={() => command({ type: 'startNextDay' })}
        type="button"
      >
        Plan Day {game.day + 1}
      </button>
    </section>
  );
}
