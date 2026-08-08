import { useGame } from '../app/GameContext';
import { formatIngredientQuantity, ingredientCapacities } from '../game';

/** Exact live stock and weighted capacity derived from the current rush snapshot. */
export function RushStockGrid(): React.JSX.Element {
  const { game } = useGame();
  if (!game || (game.phase !== 'rush' && game.phase !== 'event')) return <></>;

  const rows = ingredientCapacities(game)
    .map((capacity, sourceIndex) => ({ capacity, sourceIndex }))
    .sort(
      (left, right) =>
        Number(right.capacity.isUsedToday) - Number(left.capacity.isUsedToday) ||
        left.sourceIndex - right.sourceIndex,
    )
    .map(({ capacity }) => capacity);

  return (
    <section className="rush-stock" aria-labelledby="rush-stock-title" data-service-section="stock">
      <div className="rush-stock-heading">
        <div>
          <p className="eyebrow">Live stock</p>
          <h2 id="rush-stock-title">What is left on the bar</h2>
        </div>
        <small>Stock reserves when service starts</small>
      </div>
      <ul aria-label="Live rush stock" className="rush-stock-grid">
        {rows.map((row) => {
          const quantity = formatIngredientQuantity(row.usableQuantity, row.unit);
          const isOutOfStock = row.usableQuantity === 0;
          return (
            <li
              className={`rush-stock-item ${isOutOfStock ? 'is-stockout' : ''}`}
              data-ingredient={row.ingredientId}
              key={row.ingredientId}
            >
              <div className="rush-stock-name">
                <strong>{row.name}</strong>
                <span>{isOutOfStock ? 'Out of stock' : 'In stock'}</span>
              </div>
              <p className="rush-stock-quantity">
                <strong>{quantity}</strong> remaining
              </p>
              <p className="rush-stock-capacity">
                {row.isUsedToday ? `~${String(row.estimatedServes ?? 0)} serves` : 'Not used today'}
              </p>
              <small className="rush-stock-expiry">{expiryLabel(row, game.day)}</small>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function expiryLabel(
  row: ReturnType<typeof ingredientCapacities>[number],
  currentDay: number,
): string {
  if (!row.earliestExpiry) return 'No stock currently held';
  const quantity = formatIngredientQuantity(row.earliestExpiry.quantity, row.unit);
  if (row.earliestExpiry.day === currentDay) {
    return `${quantity} expires after this Day ${String(currentDay)} rush`;
  }
  return `${quantity} expires after Day ${String(row.earliestExpiry.day)} rush`;
}
