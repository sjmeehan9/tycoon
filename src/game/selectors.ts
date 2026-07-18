import { PURCHASE_PACKAGES, RUSH_DURATION_TICKS, TICKS_PER_SECOND } from '../content/gameContent';
import { purchaseCost } from './engine';
import type { GameState } from './types';

/** Format integer cents as Australian dollars. */
export function formatMoney(cents: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

/** Return the selected morning supply cost. */
export function selectedSupplyCost(state: GameState): number {
  return purchaseCost(state.plan);
}

/** Return the human-readable elapsed and total rush time. */
export function rushClock(state: GameState): string {
  const tick = state.rush?.tick ?? 0;
  return `${Math.floor(tick / TICKS_PER_SECOND)} / ${RUSH_DURATION_TICKS / TICKS_PER_SECOND}s`;
}

/** Return whether the current plan can open without overspending. */
export function canOpen(state: GameState): boolean {
  return state.phase === 'planning' && selectedSupplyCost(state) <= state.cashCents;
}

/** Return only inventory entries available through the Phase 1 supplier. */
export function stockedInventory(
  state: GameState,
): Array<{ label: string; amount: number; unit: string }> {
  return PURCHASE_PACKAGES.map((item) => ({
    label: item.label.split(' · ')[0] ?? item.label,
    amount: state.inventory[item.ingredientId],
    unit: item.unit,
  }));
}
