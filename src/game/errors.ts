/** Error raised when a player command violates the current game rules. */
export class GameRuleError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'GameRuleError';
  }
}
