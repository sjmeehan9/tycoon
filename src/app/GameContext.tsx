import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import {
  createCampaign,
  dispatchGameCommand,
  type GameCommand,
  type GameState,
  type MetaProgress,
  type Preferences,
} from '../game';
import {
  BrowserSaveStore,
  SaveStoreError,
  createDefaultMeta,
  createDefaultPreferences,
  createSaveEnvelope,
} from '../persistence/saveStore';

interface GameContextValue {
  game: GameState | null;
  preferences: Preferences;
  meta: MetaProgress;
  hasSave: boolean;
  message: string | null;
  startCampaign: (seed: number) => void;
  continueCampaign: () => void;
  command: (command: GameCommand) => void;
  clearMessage: () => void;
  resetCampaign: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

/** Own the browser adapter and route all player actions through typed engine commands. */
export function GameProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [initial] = useState(loadInitialSave);
  const storeRef = useRef<BrowserSaveStore | null>(initial.store);
  const loadedRunRef = useRef<GameState | null>(initial.run);
  const [game, setGame] = useState<GameState | null>(null);
  const [preferences] = useState(initial.preferences);
  const [meta] = useState(initial.meta);
  const [hasSave, setHasSave] = useState(Boolean(initial.run));
  const [message, setMessage] = useState<string | null>(initial.warning);

  const persist = useCallback(
    (nextGame: GameState | null, nextPreferences = preferences, nextMeta = meta) => {
      if (!storeRef.current) return;
      try {
        storeRef.current.save(createSaveEnvelope(nextGame, nextPreferences, nextMeta));
        loadedRunRef.current = nextGame;
        setHasSave(Boolean(nextGame));
      } catch (error) {
        setMessage(
          error instanceof SaveStoreError
            ? error.message
            : 'Autosave failed. The game is continuing with the current in-memory state.',
        );
      }
    },
    [meta, preferences],
  );

  const startCampaign = useCallback(
    (seed: number) => {
      const nextGame = createCampaign({ seed });
      setGame(nextGame);
      persist(nextGame);
      setMessage('A fresh cart campaign is ready. Plan Day 1, then open the laneway.');
    },
    [persist],
  );

  const continueCampaign = useCallback(() => {
    if (!loadedRunRef.current) {
      setMessage('There is no saved campaign to continue.');
      return;
    }
    setGame(loadedRunRef.current);
    setMessage('Your last autosave has been restored.');
  }, []);

  const command = useCallback(
    (nextCommand: GameCommand) => {
      setGame((current) => {
        if (!current) return current;
        try {
          const next = dispatchGameCommand(current, nextCommand);
          const phaseChanged = next.phase !== current.phase;
          const checkpoint = next.rush && next.rush.tick % 20 === 0;
          const controlCheckpoint =
            nextCommand.type === 'togglePause' || nextCommand.type === 'setSpeed';
          if (phaseChanged || checkpoint || controlCheckpoint || next.phase !== 'rush')
            persist(next);
          setMessage(null);
          return next;
        } catch (error) {
          setMessage(
            error instanceof Error ? error.message : 'That action could not be completed.',
          );
          return current;
        }
      });
    },
    [persist],
  );

  const gamePhase = game?.phase;
  const rushPaused = game?.rush?.isPaused;
  const rushSpeed = game?.rush?.speed;
  useEffect(() => {
    if (gamePhase !== 'rush' || rushPaused || !rushSpeed) return undefined;
    const interval = window.setInterval(() => command({ type: 'advanceTick' }), 250 / rushSpeed);
    return () => window.clearInterval(interval);
  }, [command, gamePhase, rushPaused, rushSpeed]);

  const resetCampaign = useCallback(() => {
    storeRef.current?.clear();
    loadedRunRef.current = null;
    setGame(null);
    setHasSave(false);
    setMessage('The local campaign was cleared.');
  }, []);

  const value = useMemo<GameContextValue>(
    () => ({
      game,
      preferences,
      meta,
      hasSave,
      message,
      startCampaign,
      continueCampaign,
      command,
      clearMessage: () => setMessage(null),
      resetCampaign,
    }),
    [
      game,
      preferences,
      meta,
      hasSave,
      message,
      startCampaign,
      continueCampaign,
      command,
      resetCampaign,
    ],
  );
  return <GameContext value={value}>{children}</GameContext>;
}

interface InitialSave {
  store: BrowserSaveStore | null;
  run: GameState | null;
  preferences: Preferences;
  meta: MetaProgress;
  warning: string | null;
}

function loadInitialSave(): InitialSave {
  try {
    const store = new BrowserSaveStore();
    const loaded = store.load();
    return {
      store,
      run: loaded.envelope?.activeRun ?? null,
      preferences: loaded.envelope?.preferences ?? createDefaultPreferences(),
      meta: loaded.envelope?.meta ?? createDefaultMeta(),
      warning: loaded.warning,
    };
  } catch {
    return {
      store: null,
      run: null,
      preferences: createDefaultPreferences(),
      meta: createDefaultMeta(),
      warning: 'Browser storage is unavailable. You can still play, but this run may not persist.',
    };
  }
}

/** Access the current game controller. */
export function useGame(): GameContextValue {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be rendered inside GameProvider.');
  return context;
}
