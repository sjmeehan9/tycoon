import { useModalFocus } from '../accessibility/useModalFocus';
import { useGame } from '../app/GameContext';

/** Modal decision raised by a deterministic rush event. */
export function EventDialog(): React.JSX.Element | null {
  const { command, game } = useGame();
  const event = game?.rush?.pendingEvent;
  const dialogRef = useModalFocus<HTMLElement>({
    active: game?.phase === 'event' && Boolean(event),
  });
  if (game?.phase !== 'event' || !event) return null;
  return (
    <div className="dialog-backdrop" role="presentation">
      <section
        aria-describedby="event-description"
        aria-labelledby="event-title"
        aria-modal="true"
        className="event-dialog"
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <p className="eyebrow">Laneway decision</p>
        <h2 id="event-title">{event.title}</h2>
        <p id="event-description">{event.description}</p>
        <div className="event-choices">
          {event.choices.map((choice) => (
            <button
              className="choice-button"
              data-dialog-initial-focus={event.choices[0]?.id === choice.id ? true : undefined}
              key={choice.id}
              onClick={() => command({ type: 'resolveEvent', choiceId: choice.id })}
              type="button"
            >
              <strong>{choice.label}</strong>
              <span>{choice.description}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
