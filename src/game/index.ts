/** Public simulation API for application code and tests. */
export {
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
  baseDrinkChoiceWeight,
  drinkWeatherChoiceMultiplier,
  milkForDraw,
  milkProbabilities,
  segmentForDraw,
  sizeForDraw,
  sizeProbabilities,
} from './demandModel';
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
  canOpen,
  completedSaleLabel,
  formatMoney,
  rushClock,
  selectedSupplyCost,
  stockedInventory,
} from './selectors';
export type * from './types';
