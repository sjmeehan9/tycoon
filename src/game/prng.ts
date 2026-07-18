/** Result of one deterministic pseudo-random draw. */
export interface RandomDraw {
  state: number;
  value: number;
}

/**
 * Advance a serializable xorshift32 generator.
 *
 * The all-zero input is normalized so every numeric campaign seed is usable.
 */
export function nextRandom(inputState: number): RandomDraw {
  let state = inputState === 0 ? 0x6d2b79f5 : inputState >>> 0;
  state ^= state << 13;
  state ^= state >>> 17;
  state ^= state << 5;
  const normalized = state >>> 0;
  return { state: normalized, value: normalized / 0x1_0000_0000 };
}

/** Draw a deterministic integer from an inclusive range. */
export function randomInt(state: number, minimum: number, maximum: number): RandomDraw {
  const draw = nextRandom(state);
  return {
    state: draw.state,
    value: Math.floor(draw.value * (maximum - minimum + 1)) + minimum,
  };
}
