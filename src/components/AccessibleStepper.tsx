export interface AccessibleStepperProps {
  label: string;
  value: string;
  decrementLabel: string;
  incrementLabel: string;
  decrementDisabled: boolean;
  incrementDisabled: boolean;
  onDecrement: () => void;
  onIncrement: () => void;
}

/** Semantic minus/value/plus control for exact, non-editable planner values. */
export function AccessibleStepper({
  label,
  value,
  decrementLabel,
  incrementLabel,
  decrementDisabled,
  incrementDisabled,
  onDecrement,
  onIncrement,
}: AccessibleStepperProps): React.JSX.Element {
  return (
    <div
      aria-disabled={decrementDisabled && incrementDisabled ? 'true' : undefined}
      aria-label={label}
      className="stepper"
      role="group"
    >
      <button
        aria-label={decrementLabel}
        disabled={decrementDisabled}
        onClick={onDecrement}
        type="button"
      >
        <span aria-hidden="true">−</span>
      </button>
      <output aria-atomic="true" aria-live="polite">
        <span className="sr-only">{label}: </span>
        {value}
      </output>
      <button
        aria-label={incrementLabel}
        disabled={incrementDisabled}
        onClick={onIncrement}
        type="button"
      >
        <span aria-hidden="true">+</span>
      </button>
    </div>
  );
}
