import {
  CAMPAIGN_RULES,
  DRINK_MAP,
  PURCHASE_PACKAGES,
  RUSH_DURATION_TICKS,
  STAFF_ROLE_DETAILS,
  TICKS_PER_SECOND,
  VENUES,
} from '../content/gameContent';
import { operationalEffects, purchaseCost, staffRoleOperationalEffect } from './engine';
import { ingredientQuantity } from './inventory';
import type {
  CampaignRecord,
  CompletedSaleActivity,
  Difficulty,
  GameState,
  MetaProgress,
  ReportChargeGroup,
  RushActivityEvent,
  StaffMember,
  VenueId,
} from './types';

/** Player-facing immutable difficulty names. */
export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  standard: 'Standard',
  hard: 'Hard',
};

/** Concise accessible explanation shared by creation, onboarding, and help. */
export const DIFFICULTY_DESCRIPTIONS: Record<Difficulty, string> = {
  standard:
    'A balanced campaign with stronger price sensitivity; other demand factors use their original tuning.',
  hard: 'Every supported demand factor reacts more strongly in either direction, so each operating decision matters more.',
};

/** Return completed campaign records partitioned by their immutable difficulty. */
export function campaignRecordsByDifficulty(
  meta: Pick<MetaProgress, 'records'>,
): Record<Difficulty, CampaignRecord[]> {
  return {
    standard: meta.records.filter((record) => record.difficulty === 'standard'),
    hard: meta.records.filter((record) => record.difficulty === 'hard'),
  };
}

/** Format integer cents as Australian dollars. */
export function formatMoney(cents: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

/** Return the configured player-facing venue name for records and status copy. */
export function venueLabel(venueId: VenueId): string {
  return VENUES[venueId].shortName;
}

/** Describe the exact role value supplied by one candidate or hired team member. */
export function staffRoleValue(member: StaffMember): string {
  const config = STAFF_ROLE_DETAILS[member.role];
  const effect = staffRoleOperationalEffect(member);
  if (effect.operation === 'coordinationReliability') {
    return `Cuts department coordination and reliability workload by ${effect.reductionTicks} ticks, subject to a one-tick minimum.`;
  }
  if (effect.operation === 'handoffWorkload') {
    return `Cuts department replenishment and handoff workload by ${effect.reductionTicks} ticks without changing stock.`;
  }
  return config.description;
}

/** Return exact observable department-role effects for the current daily schedule. */
export function workforceAppliedEffectLabels(state: GameState): string[] {
  if (state.venueId !== 'departmentStore') return [];
  const effects = operationalEffects(state);
  const scheduledIds = new Set(state.plan.scheduledStaffIds);
  const scheduled = state.staff.filter((member) => scheduledIds.has(member.id));
  const managerCount = scheduled.filter((member) => member.role === 'manager').length;
  const runnerCount = scheduled.filter((member) => member.role === 'runner').length;
  return [
    `${managerCount} Manager${managerCount === 1 ? '' : 's'}: ${effects.managerReductionTicks}-tick reduction; ${effects.coordinationReliabilityDelayTicks} coordination/reliability ticks remain per order.`,
    `${runnerCount} Runner${runnerCount === 1 ? '' : 's'}: ${effects.runnerReductionTicks}-tick reduction; ${effects.handoffWorkloadDelayTicks} replenishment/handoff ticks remain per order.`,
  ];
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
  return (
    state.phase === 'planning' &&
    selectedSupplyCost(state) <= state.cashCents - CAMPAIGN_RULES.overdraftFloorCents
  );
}

/** Format the configured drink, size, and milk represented by an actual sale. */
export function completedSaleLabel(
  sale: Pick<CompletedSaleActivity | ReportChargeGroup, 'drinkId' | 'size' | 'milk'>,
): string {
  const drink = DRINK_MAP.get(sale.drinkId);
  const size = sale.size === 'large' ? 'Large' : 'Regular';
  const milk = sale.milk === 'none' ? '' : ` ${sale.milk}`;
  return `${size}${milk} ${drink?.name ?? sale.drinkId}`;
}

/** Describe one engine observation without relying on colour, motion, or iconography. */
export function describeRushActivity(event: RushActivityEvent): string {
  const customer = `${segmentLabel(event.segment)} customer ${event.customerId}`;
  if (event.type === 'arrival') return `${customer} arrived.`;
  if (event.type === 'serviceStarted') {
    return `${customer} started ${orderLabel(event)} service.`;
  }
  if (event.type === 'sale') {
    return `${customer} received ${completedSaleLabel(event)} and paid ${formatMoney(event.priceCents)}.`;
  }
  const reasons: Record<typeof event.reason, string> = {
    patience: 'left after waiting too long',
    queueFull: 'left because the queue was full',
    stockout: 'left because their order was out of stock',
    rushEnded: 'left when the rush ended',
  };
  return `${customer} ${reasons[event.reason]}.`;
}

function orderLabel(order: Pick<CompletedSaleActivity, 'drinkId' | 'size' | 'milk'>): string {
  const drink = DRINK_MAP.get(order.drinkId);
  const size = order.size === 'large' ? 'large' : 'regular';
  const milk = order.milk === 'none' ? '' : ` ${order.milk}`;
  return `${size}${milk} ${drink?.name ?? order.drinkId}`;
}

function segmentLabel(segment: RushActivityEvent['segment']): string {
  if (segment === null) return 'Legacy';
  return segment.charAt(0).toUpperCase() + segment.slice(1);
}

/** Return only inventory entries available through the Phase 1 supplier. */
export function stockedInventory(
  state: GameState,
): Array<{ label: string; amount: number; unit: string }> {
  return PURCHASE_PACKAGES.map((item) => ({
    label: item.label.split(' · ')[0] ?? item.label,
    amount: ingredientQuantity(state.inventory, item.ingredientId),
    unit: item.unit,
  }));
}
