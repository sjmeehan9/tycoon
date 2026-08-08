/** Public simulation API for application code and tests. */
export {
  ARRIVAL_DEMAND_ENGINE_INFLUENCES,
  advanceTick,
  adjustPlanPrice,
  adjustPlanPurchase,
  buyEquipment,
  buyImprovement,
  candidatePoolForDay,
  closeDay,
  continueEndless,
  createCampaign,
  demandRate,
  dispatchGameCommand,
  equipmentPreparationMultiplier,
  hireStaff,
  MAX_REPORT_CHARGE_GROUPS,
  MAX_REPORT_CHARGE_PRICE_CENTS,
  MIN_REPORT_CHARGE_PRICE_CENTS,
  operationalEffects,
  prepareDay,
  promoteVenue,
  purchaseCost,
  resolveEvent,
  serviceQueueCapacity,
  setRushSpeed,
  startNextDay,
  startRush,
  togglePause,
} from './engine';
export { GameRuleError } from './errors';
export {
  CANDIDATES_PER_DAY,
  LEGACY_STAFF_NAMES,
  MAX_STAFF_NAME_DAY,
  RESERVED_STAFF_NAME_COUNT,
  STAFF_NAME_NAMESPACE_SIZE,
  STAFF_NAMES_PER_TIER,
  SUPPORTED_CANDIDATE_NAME_COUNT,
  candidateStaffName,
  candidateStaffOrdinal,
  reservedStaffName,
  staffNameAtOrdinal,
} from './staffNames';
export {
  baseDrinkChoiceWeight,
  drinkWeatherChoiceMultiplier,
  milkForDraw,
  milkProbabilities,
  ORDER_CHOICE_DEMAND_ENGINE_INFLUENCES,
  segmentForDraw,
  sizeForDraw,
  sizeProbabilities,
} from './demandModel';
export {
  applyDemandInfluence,
  DEMAND_INFLUENCES,
  DEMAND_INFLUENCE_IDS,
  DIFFICULTY_DEVIATION_MULTIPLIERS,
} from './demandInfluences';
export type {
  ArrivalDemandInfluenceId,
  DemandInfluenceApplication,
  DemandInfluenceDefinition,
  DemandInfluenceDomain,
  DemandInfluenceId,
  OrderChoiceDemandInfluenceId,
} from './demandInfluences';
export { formatIngredientQuantity, ingredientCapacities, weightedIngredientUse } from './capacity';
export type { IngredientCapacity } from './capacity';
export { ACHIEVEMENT_DETAILS, recordCampaignOutcome } from './meta';
export {
  addPlannedPurchases,
  batchExpiryDay,
  completeIngredientTotals,
  consumeIngredientsLifo,
  earliestInventoryExpiry,
  expireInventoryAfterRush,
  extendInventoryRefrigeration,
  hasIngredients,
  ingredientQuantity,
  inventoryFromLegacyTotals,
  inventoryTotals,
  plannedPurchaseTotals,
  refrigerationExtensionDays,
} from './inventory';
export {
  campaignRecordsByDifficulty,
  canOpen,
  completedSaleLabel,
  describeRushActivity,
  DIFFICULTY_DESCRIPTIONS,
  DIFFICULTY_LABELS,
  formatMoney,
  rushClock,
  selectedSupplyCost,
  stockedInventory,
  venueLabel,
} from './selectors';
export type * from './types';
