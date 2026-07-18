import { useGame } from '../app/GameContext';

/** Modal decision raised by a deterministic rush event. */
export function EventDialog(): React.JSX.Element | null {
  const { command, game } = useGame();
  const event = game?.rush?.pendingEvent;
  if (game?.phase !== 'event' || !event) return null;
  return (
    <div className="dialog-backdrop">
      <section
        aria-describedby="event-description"
        aria-labelledby="event-title"
        aria-modal="true"
        className="event-dialog"
        role="dialog"
      >
        <p className="eyebrow">Laneway decision</p>
        <h2 id="event-title">{event.title}</h2>
        <p id="event-description">{event.description}</p>
        <div className="event-choices">
          {event.choices.map((choice) => (
            <button
              className="choice-button"
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
