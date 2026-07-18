import { useGame } from './app/GameContext';
import { AudioDirector } from './audio/AudioDirector';
import { GameAnnouncer } from './accessibility/GameAnnouncer';
import { EventDialog } from './components/EventDialog';
import { EndingPanel } from './components/EndingPanel';
import { GameHeader } from './components/GameHeader';
import { GameTools } from './components/GameTools';
import { Planner } from './components/Planner';
import { OnboardingGuide } from './components/OnboardingGuide';
import { ReinvestPanel } from './components/ReinvestPanel';
import { ReportPanel } from './components/ReportPanel';
import { RushPanel } from './components/RushPanel';
import { RushStockGrid } from './components/RushStockGrid';
import { TitleScreen } from './components/TitleScreen';
import { CanvasScene } from './scene/CanvasScene';
import { VENUES } from './content/gameContent';
import { PwaUpdatePrompt } from './pwa/PwaUpdatePrompt';

/** Root game composition. */
export default function App(): React.JSX.Element {
  const { clearMessage, game, message } = useGame();
  if (!game) {
    return (
      <>
        <AudioDirector />
        <GameAnnouncer />
        <PwaUpdatePrompt />
        {message ? <GlobalMessage message={message} onClose={clearMessage} /> : null}
        <TitleScreen />
        <GameTools />
      </>
    );
  }

  return (
    <>
      <AudioDirector />
      <GameAnnouncer />
      <PwaUpdatePrompt />
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
            {game.phase === 'rush' || game.phase === 'event' ? <RushStockGrid /> : null}
          </div>
          <div className="control-column" tabIndex={-1}>
            <OnboardingGuide />
            {game.phase === 'planning' ? <Planner /> : null}
            {game.phase === 'rush' || game.phase === 'event' ? <RushPanel /> : null}
            {game.phase === 'report' ? <ReportPanel /> : null}
            {game.phase === 'reinvest' ? <ReinvestPanel /> : null}
            {game.phase === 'victory' || game.phase === 'defeat' ? <EndingPanel /> : null}
          </div>
        </main>
        <footer className="game-footer">
          Autosaved locally · no account · deterministic seed {game.seed}
        </footer>
        <EventDialog />
        <GameTools />
      </div>
    </>
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
