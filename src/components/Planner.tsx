import { PHASE_ONE_DRINKS, PURCHASE_PACKAGES } from '../content/phase1';
import { useGame } from '../app/GameContext';
import { canOpen, formatMoney, selectedSupplyCost, type DialIn, type DrinkId } from '../game';

const DIAL_OPTIONS: Array<{ id: DialIn; label: string; detail: string }> = [
  { id: 'speed', label: 'Speed', detail: 'Quicker cups, less finesse' },
  { id: 'balanced', label: 'Balanced', detail: 'A dependable middle path' },
  { id: 'quality', label: 'Quality', detail: 'Slower, more satisfying coffee' },
];

/** Morning menu, pricing, supply, and espresso dial-in controls. */
export function Planner(): React.JSX.Element {
  const { command, game } = useGame();
  if (!game) return <></>;
  const supplyCost = selectedSupplyCost(game);

  const toggleDrink = (drinkId: DrinkId): void => {
    const active = game.plan.activeMenu.includes(drinkId);
    const activeMenu = active
      ? game.plan.activeMenu.filter((id) => id !== drinkId)
      : [...game.plan.activeMenu, drinkId];
    command({ type: 'prepareDay', patch: { activeMenu } });
  };

  return (
    <section className="panel planner" aria-labelledby="planner-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Morning planning</p>
          <h2 id="planner-title">Set up the cart</h2>
        </div>
        <p className="forecast-badge">Mild · steady foot traffic</p>
      </div>

      <fieldset>
        <legend>Menu and prices · choose up to 3</legend>
        <div className="menu-grid">
          {PHASE_ONE_DRINKS.map((drink) => {
            const checked = game.plan.activeMenu.includes(drink.id);
            return (
              <div className={`menu-card ${checked ? 'is-selected' : ''}`} key={drink.id}>
                <label className="check-row">
                  <input checked={checked} onChange={() => toggleDrink(drink.id)} type="checkbox" />
                  <span>
                    <strong>{drink.name}</strong>
                    <small>{drink.description}</small>
                  </span>
                </label>
                <label className="price-field">
                  Price
                  <span>
                    $
                    <input
                      aria-label={`${drink.name} price in dollars`}
                      disabled={!checked}
                      inputMode="decimal"
                      max="12"
                      min="2.5"
                      onChange={(event) => {
                        const dollars = Number(event.target.value);
                        if (Number.isFinite(dollars)) {
                          command({
                            type: 'prepareDay',
                            patch: { pricesCents: { [drink.id]: Math.round(dollars * 100) } },
                          });
                        }
                      }}
                      step="0.1"
                      type="number"
                      value={(game.plan.pricesCents[drink.id] / 100).toFixed(2)}
                    />
                  </span>
                </label>
              </div>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend>Supply order</legend>
        <div className="supply-list">
          {PURCHASE_PACKAGES.map((item) => (
            <label className="supply-row" key={item.ingredientId}>
              <span>
                <strong>{item.label}</strong>
                <small>{formatMoney(item.costCents)} per pack</small>
              </span>
              <input
                aria-label={`${item.label} package quantity`}
                inputMode="numeric"
                max={20}
                min={0}
                onChange={(event) => {
                  const quantity = Number(event.target.value);
                  if (Number.isInteger(quantity)) {
                    command({
                      type: 'prepareDay',
                      patch: { purchases: { [item.ingredientId]: quantity } },
                    });
                  }
                }}
                type="number"
                value={game.plan.purchases[item.ingredientId]}
              />
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>Espresso dial-in</legend>
        <div className="segmented-options">
          {DIAL_OPTIONS.map((option) => (
            <label className={game.plan.dialIn === option.id ? 'is-selected' : ''} key={option.id}>
              <input
                checked={game.plan.dialIn === option.id}
                name="dial-in"
                onChange={() => command({ type: 'prepareDay', patch: { dialIn: option.id } })}
                type="radio"
              />
              <strong>{option.label}</strong>
              <small>{option.detail}</small>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="planner-total">
        <div>
          <span>Supply order</span>
          <strong>{formatMoney(supplyCost)}</strong>
          <small>{formatMoney(game.cashCents - supplyCost)} cash after buying supplies</small>
        </div>
        <button
          className="button button-primary"
          disabled={!canOpen(game)}
          onClick={() => command({ type: 'startRush' })}
          type="button"
        >
          Open the cart
        </button>
      </div>
    </section>
  );
}
