import {
  CART_IMPROVEMENT_COST_CENTS,
  EQUIPMENT,
  EQUIPMENT_IDS,
  VENUE_PROMOTIONS,
  VENUES,
} from '../content/gameContent';
import { useGame } from '../app/GameContext';
import { formatMoney, type EquipmentId, type VenueId } from '../game';

const VENUE_ORDER: VenueId[] = ['cart', 'kiosk', 'cafe'];

/** Between-day equipment, venue promotion, legacy upgrade, and continuation controls. */
export function ReinvestPanel(): React.JSX.Element {
  const { command, game } = useGame();
  if (!game) return <></>;
  const hasSign = game.improvements.includes('street-sign');
  const promotion = game.venueId === 'cafe' ? null : VENUE_PROMOTIONS[game.venueId];
  const missingPromotionEquipment = promotion
    ? Object.entries(promotion.requiredEquipment).filter(
        ([id, level]) => game.equipment[id as EquipmentId] < level,
      )
    : [];
  const canPromote = Boolean(
    promotion &&
    game.cashCents >= promotion.costCents &&
    game.reputation >= promotion.reputationRequired &&
    missingPromotionEquipment.length === 0,
  );

  return (
    <section className="panel reinvest-panel" aria-labelledby="reinvest-title">
      <p className="eyebrow">After close</p>
      <h2 id="reinvest-title">Reinvest or call it a night</h2>
      <p>
        The till holds <strong>{formatMoney(game.cashCents)}</strong>. Stock carries into tomorrow;
        purchases in the next morning plan top it up.
      </p>

      <h3>Equipment workshop</h3>
      <div className="equipment-grid">
        {EQUIPMENT_IDS.map((equipmentId) => {
          const config = EQUIPMENT[equipmentId];
          const currentLevel = game.equipment[equipmentId];
          const currentTier = currentLevel > 0 ? config.tiers[currentLevel - 1] : null;
          const nextTier = config.tiers[currentLevel];
          const venueReady = nextTier
            ? VENUE_ORDER.indexOf(game.venueId) >= VENUE_ORDER.indexOf(nextTier.requiresVenue)
            : true;
          return (
            <article className={`equipment-card ${nextTier ? '' : 'is-owned'}`} key={equipmentId}>
              <div>
                <span className="level-badge">Level {currentLevel}/2</span>
                <h4>{config.name}</h4>
                <p>{config.description}</p>
                <small>
                  {currentTier ? `Current: ${currentTier.effect}` : 'Current: owner setup'}
                </small>
                {nextTier ? (
                  <small>
                    Next: {nextTier.name} · {nextTier.effect} ·{' '}
                    {formatMoney(nextTier.operatingCostCents)}/day running cost
                  </small>
                ) : (
                  <small>Fully upgraded</small>
                )}
              </div>
              {nextTier ? (
                <button
                  className="button"
                  disabled={!venueReady || game.cashCents < nextTier.costCents}
                  onClick={() => command({ type: 'buyEquipment', equipmentId })}
                  type="button"
                >
                  {venueReady
                    ? `Buy ${config.name} level ${nextTier.level} · ${formatMoney(nextTier.costCents)}`
                    : `Requires ${VENUES[nextTier.requiresVenue].shortName}`}
                </button>
              ) : null}
            </article>
          );
        })}
      </div>

      {promotion ? (
        <article className="promotion-card">
          <div>
            <p className="eyebrow">Next venue</p>
            <h3>Promote to {VENUES[promotion.to].shortName}</h3>
            <p>{VENUES[promotion.to].description}</p>
            <ul>
              <li className={game.cashCents >= promotion.costCents ? 'met' : ''}>
                {formatMoney(promotion.costCents)} available
              </li>
              <li className={game.reputation >= promotion.reputationRequired ? 'met' : ''}>
                {promotion.reputationRequired} reputation
              </li>
              {Object.entries(promotion.requiredEquipment).map(([id, level]) => (
                <li className={game.equipment[id as EquipmentId] >= level ? 'met' : ''} key={id}>
                  {EQUIPMENT[id as EquipmentId].name} level {level}
                </li>
              ))}
            </ul>
          </div>
          <button
            className="button button-primary"
            disabled={!canPromote}
            onClick={() => command({ type: 'promoteVenue' })}
            type="button"
          >
            Promote to {VENUES[promotion.to].shortName}
          </button>
        </article>
      ) : (
        <article className="promotion-card is-owned">
          <h3>Flagship venue complete</h3>
          <p>The full specialty cafe is open; future investment is equipment and team depth.</p>
        </article>
      )}

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
            disabled={game.cashCents < CART_IMPROVEMENT_COST_CENTS}
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
