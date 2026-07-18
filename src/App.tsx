import { useGame } from './app/GameContext';
import { EventDialog } from './components/EventDialog';
import { GameHeader } from './components/GameHeader';
import { Planner } from './components/Planner';
import { ReinvestPanel } from './components/ReinvestPanel';
import { ReportPanel } from './components/ReportPanel';
import { RushPanel } from './components/RushPanel';
import { TitleScreen } from './components/TitleScreen';
import { CanvasScene } from './scene/CanvasScene';
import { VENUES } from './content/gameContent';

/** Root game composition. */
export default function App(): React.JSX.Element {
  const { clearMessage, game, message } = useGame();
  if (!game) {
    return (
      <>
        {message ? <GlobalMessage message={message} onClose={clearMessage} /> : null}
        <TitleScreen />
      </>
    );
  }

  return (
    <div className="app-shell">
      <GameHeader />
      {message ? <GlobalMessage message={message} onClose={clearMessage} /> : null}
      <main className="game-layout">
        <div className="scene-column">
          <CanvasScene />
          <section className="scene-caption" aria-label="Current venue">
            <strong>{VENUES[game.venueId].name}</strong>
            <span>{VENUES[game.venueId].description}</span>
          </section>
        </div>
        <div className="control-column">
          {game.phase === 'planning' ? <Planner /> : null}
          {game.phase === 'rush' || game.phase === 'event' ? <RushPanel /> : null}
          {game.phase === 'report' ? <ReportPanel /> : null}
          {game.phase === 'reinvest' ? <ReinvestPanel /> : null}
        </div>
      </main>
      <footer className="game-footer">
        Autosaved locally · no account · deterministic seed {game.seed}
      </footer>
      <EventDialog />
    </div>
  );
}

function GlobalMessage({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}): React.JSX.Element {
  return (
    <div className="global-message" role="status">
      <span>{message}</span>
      <button aria-label="Dismiss message" onClick={onClose} type="button">
        ×
      </button>
    </div>
  );
}
