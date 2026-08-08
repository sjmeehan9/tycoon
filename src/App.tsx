import { lazy, Suspense } from 'react';

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
import { PwaUpdatePrompt } from './pwa/PwaUpdatePrompt';

const LazyServiceWorld = lazy(() =>
  import('./scene/three/ServiceWorld').then(({ ServiceWorld }) => ({ default: ServiceWorld })),
);

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

  const serviceActive = game.phase === 'rush' || game.phase === 'event';

  return (
    <>
      <AudioDirector />
      <GameAnnouncer />
      <PwaUpdatePrompt />
      <div
        className={`app-shell ${serviceActive ? 'is-service' : 'is-management'}`}
        data-phase={game.phase}
      >
        <GameHeader />
        {message ? <GlobalMessage message={message} onClose={clearMessage} /> : null}
        {serviceActive ? (
          <main className="game-layout service-layout" data-game-layout="service">
            <div className="service-flow">
              <Suspense
                fallback={
                  <div
                    className="scene-frame scene-loading"
                    data-service-section="scene"
                    role="status"
                  >
                    Preparing the 3D service world…
                  </div>
                }
              >
                <LazyServiceWorld />
              </Suspense>
              <RushPanel />
              <RushStockGrid />
              <div className="control-column service-guide" tabIndex={-1}>
                <OnboardingGuide />
              </div>
            </div>
          </main>
        ) : (
          <main className="game-layout management-layout" data-game-layout="management">
            <div className="control-column management-flow" tabIndex={-1}>
              <OnboardingGuide />
              {game.phase === 'planning' ? <Planner /> : null}
              {game.phase === 'report' ? <ReportPanel /> : null}
              {game.phase === 'reinvest' ? <ReinvestPanel /> : null}
              {game.phase === 'victory' || game.phase === 'defeat' ? <EndingPanel /> : null}
            </div>
          </main>
        )}
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
