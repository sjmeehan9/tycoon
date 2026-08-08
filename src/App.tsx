import { lazy, Suspense } from 'react';

import { useGame } from './app/GameContext';
import { OnboardingGuide } from './components/OnboardingGuide';
import { Planner } from './components/Planner';
import { RushPanel } from './components/RushPanel';
import { TitleScreen } from './components/TitleScreen';
import { PwaUpdatePrompt } from './pwa/PwaUpdatePrompt';

const LazyAudioDirector = lazy(() =>
  import('./audio/AudioDirector').then(({ AudioDirector }) => ({ default: AudioDirector })),
);
const LazyGameAnnouncer = lazy(() =>
  import('./accessibility/GameAnnouncer').then(({ GameAnnouncer }) => ({
    default: GameAnnouncer,
  })),
);
const LazyEventDialog = lazy(() =>
  import('./components/EventDialog').then(({ EventDialog }) => ({ default: EventDialog })),
);
const LazyEndingPanel = lazy(() =>
  import('./components/EndingPanel').then(({ EndingPanel }) => ({ default: EndingPanel })),
);
const LazyGameHeader = lazy(() =>
  import('./components/GameHeader').then(({ GameHeader }) => ({ default: GameHeader })),
);
const LazyGameTools = lazy(() =>
  import('./components/GameTools').then(({ GameTools }) => ({ default: GameTools })),
);
const LazyReinvestPanel = lazy(() =>
  import('./components/ReinvestPanel').then(({ ReinvestPanel }) => ({ default: ReinvestPanel })),
);
const LazyReportPanel = lazy(() =>
  import('./components/ReportPanel').then(({ ReportPanel }) => ({ default: ReportPanel })),
);
const LazyRushStockGrid = lazy(() =>
  import('./components/RushStockGrid').then(({ RushStockGrid }) => ({ default: RushStockGrid })),
);
const LazyServiceWorld = lazy(() =>
  import('./scene/three/ServiceWorld').then(({ ServiceWorld }) => ({ default: ServiceWorld })),
);

/** Root game composition. */
export default function App(): React.JSX.Element {
  const { clearMessage, game, message } = useGame();
  if (!game) {
    return (
      <>
        <Suspense fallback={null}>
          <LazyAudioDirector />
          <LazyGameAnnouncer />
        </Suspense>
        <PwaUpdatePrompt />
        {message ? <GlobalMessage message={message} onClose={clearMessage} /> : null}
        <TitleScreen />
        <Suspense fallback={<GameToolsLoading />}>
          <LazyGameTools />
        </Suspense>
      </>
    );
  }

  const serviceActive = game.phase === 'rush' || game.phase === 'event';

  return (
    <>
      <Suspense fallback={null}>
        <LazyAudioDirector />
        <LazyGameAnnouncer />
      </Suspense>
      <PwaUpdatePrompt />
      <div
        className={`app-shell ${serviceActive ? 'is-service' : 'is-management'}`}
        data-phase={game.phase}
      >
        <Suspense fallback={null}>
          <LazyGameHeader />
        </Suspense>
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
              <Suspense fallback={<ServiceStockLoading />}>
                <LazyRushStockGrid />
              </Suspense>
              <div className="control-column service-guide" tabIndex={-1}>
                <OnboardingGuide />
              </div>
            </div>
          </main>
        ) : (
          <main className="game-layout management-layout" data-game-layout="management">
            <div className="control-column management-flow" tabIndex={-1}>
              <OnboardingGuide />
              <Suspense fallback={<ManagementLoading />}>
                {game.phase === 'planning' ? <Planner /> : null}
                {game.phase === 'report' ? <LazyReportPanel /> : null}
                {game.phase === 'reinvest' ? <LazyReinvestPanel /> : null}
                {game.phase === 'victory' || game.phase === 'defeat' ? <LazyEndingPanel /> : null}
              </Suspense>
            </div>
          </main>
        )}
        <footer className="game-footer">
          Autosaved locally · no account · deterministic seed {game.seed}
        </footer>
        <Suspense fallback={null}>
          <LazyEventDialog />
        </Suspense>
        <Suspense fallback={<GameToolsLoading />}>
          <LazyGameTools />
        </Suspense>
      </div>
    </>
  );
}

function GameToolsLoading(): React.JSX.Element {
  return (
    <button
      aria-label="Game menu is loading"
      className="button game-tools-button"
      disabled
      type="button"
    >
      Game menu
    </button>
  );
}

function ManagementLoading(): React.JSX.Element {
  return (
    <section aria-live="polite" className="panel" role="status">
      Preparing your coffee operation…
    </section>
  );
}

function ServiceStockLoading(): React.JSX.Element {
  return (
    <section aria-live="polite" className="panel" data-service-section="stock" role="status">
      Preparing live stock…
    </section>
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
