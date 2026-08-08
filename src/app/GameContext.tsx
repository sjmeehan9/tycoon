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
  recordCampaignOutcome,
  type GameCommand,
  type GameState,
  type MetaProgress,
  type Preferences,
  type ScenarioId,
} from '../game';
import {
  BrowserSaveStore,
  SaveStoreError,
  SaveValidationError,
  createDefaultMeta,
  createDefaultPreferences,
  createSaveEnvelope,
  importEnvelope,
  serializeEnvelope,
} from '../persistence/saveStore';

export interface ExportedSave {
  filename: string;
  contents: string;
}

interface GameContextValue {
  game: GameState | null;
  preferences: Preferences;
  meta: MetaProgress;
  hasSave: boolean;
  recoveryAvailable: boolean;
  message: string | null;
  startCampaign: (seed: number, scenarioId?: ScenarioId) => void;
  continueCampaign: () => void;
  command: (command: GameCommand) => void;
  updatePreferences: (patch: Partial<Preferences>) => void;
  importSave: (serialized: string) => boolean;
  exportSave: () => ExportedSave;
  restoreBackup: () => void;
  checkpointSave: () => boolean;
  clearMessage: () => void;
  resetCampaign: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

/** Own browser persistence and route every player action through typed engine commands. */
export function GameProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [initial] = useState(loadInitialSave);
  const storeRef = useRef<BrowserSaveStore | null>(initial.store);
  const loadedRunRef = useRef<GameState | null>(initial.run);
  const preferencesRef = useRef(initial.preferences);
  const metaRef = useRef(initial.meta);
  const [game, setGame] = useState<GameState | null>(null);
  const [preferences, setPreferences] = useState(initial.preferences);
  const [meta, setMeta] = useState(initial.meta);
  const [hasSave, setHasSave] = useState(Boolean(initial.run));
  const [recoveryAvailable, setRecoveryAvailable] = useState(initial.recoveryAvailable);
  const [message, setMessage] = useState<string | null>(initial.warning);

  useEffect(() => {
    document.documentElement.dataset.reducedMotion = String(preferences.reducedMotion);
  }, [preferences.reducedMotion]);

  const persist = useCallback(
    (
      nextGame: GameState | null,
      nextPreferences = preferencesRef.current,
      nextMeta = metaRef.current,
    ) => {
      if (!storeRef.current) {
        setMessage('Browser storage is unavailable, so this checkpoint could not be verified.');
        return false;
      }
      try {
        storeRef.current.save(createSaveEnvelope(nextGame, nextPreferences, nextMeta));
        loadedRunRef.current = nextGame;
        setHasSave(Boolean(nextGame));
        setRecoveryAvailable(false);
        return true;
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : 'Autosave failed. The game is continuing with the current in-memory state.',
        );
        return false;
      }
    },
    [],
  );

  const startCampaign = useCallback(
    (seed: number, scenarioId: ScenarioId = 'lanewayClassic') => {
      if (!metaRef.current.scenarios.includes(scenarioId)) {
        setMessage('That scenario has not been unlocked yet.');
        return;
      }
      const nextGame = createCampaign({ seed, scenarioId });
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
          if (next === current) {
            setMessage(null);
            return current;
          }
          const nextMeta = recordCampaignOutcome(metaRef.current, next);
          if (nextMeta !== metaRef.current) {
            metaRef.current = nextMeta;
            setMeta(nextMeta);
          }
          const phaseChanged = next.phase !== current.phase;
          const checkpoint = next.rush && next.rush.tick % 20 === 0;
          const controlCheckpoint =
            nextCommand.type === 'togglePause' || nextCommand.type === 'setSpeed';
          if (phaseChanged || checkpoint || controlCheckpoint || next.phase !== 'rush') {
            persist(next, preferencesRef.current, nextMeta);
          }
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

  const updatePreferences = useCallback(
    (patch: Partial<Preferences>) => {
      const next = { ...preferencesRef.current, ...patch };
      preferencesRef.current = next;
      setPreferences(next);
      persist(game ?? loadedRunRef.current, next, metaRef.current);
    },
    [game, persist],
  );

  const importSave = useCallback((serialized: string): boolean => {
    try {
      const envelope = importEnvelope(serialized);
      storeRef.current?.save(envelope);
      loadedRunRef.current = envelope.activeRun;
      preferencesRef.current = envelope.preferences;
      metaRef.current = envelope.meta;
      setGame(envelope.activeRun);
      setPreferences(envelope.preferences);
      setMeta(envelope.meta);
      setHasSave(Boolean(envelope.activeRun));
      setRecoveryAvailable(false);
      setMessage(
        envelope.activeRun
          ? `Imported Day ${envelope.activeRun.day} safely.`
          : 'Imported settings and records; this file has no active campaign.',
      );
      return true;
    } catch (error) {
      setMessage(
        error instanceof SaveValidationError
          ? error.message
          : 'The selected save could not be imported safely.',
      );
      return false;
    }
  }, []);

  const exportSave = useCallback((): ExportedSave => {
    const envelope = createSaveEnvelope(
      game ?? loadedRunRef.current,
      preferencesRef.current,
      metaRef.current,
    );
    return {
      filename: `laneway-tycoon-save-${new Date().toISOString().slice(0, 10)}.json`,
      contents: serializeEnvelope(envelope),
    };
  }, [game]);

  const restoreBackup = useCallback(() => {
    try {
      if (!storeRef.current) throw new SaveStoreError('Browser storage is unavailable.');
      const envelope = storeRef.current.restoreBackup();
      loadedRunRef.current = envelope.activeRun;
      preferencesRef.current = envelope.preferences;
      metaRef.current = envelope.meta;
      setGame(envelope.activeRun);
      setPreferences(envelope.preferences);
      setMeta(envelope.meta);
      setHasSave(Boolean(envelope.activeRun));
      setRecoveryAvailable(false);
      setMessage('The last-known-good save is active again.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No backup could be restored.');
    }
  }, []);

  const gamePhase = game?.phase;
  const rushPaused = game?.rush?.isPaused;
  const rushSpeed = game?.rush?.speed;
  useEffect(() => {
    if (gamePhase !== 'rush' || rushPaused || !rushSpeed) return undefined;
    const interval = window.setInterval(() => command({ type: 'advanceTick' }), 250 / rushSpeed);
    return () => window.clearInterval(interval);
  }, [command, gamePhase, rushPaused, rushSpeed]);

  const resetCampaign = useCallback(() => {
    loadedRunRef.current = null;
    setGame(null);
    setHasSave(false);
    setRecoveryAvailable(false);
    if (storeRef.current) {
      storeRef.current.clear();
      persist(null, preferencesRef.current, metaRef.current);
    }
    setMessage('The active campaign was cleared; settings and unlocks were kept.');
  }, [persist]);

  const checkpointSave = useCallback(
    () => persist(game ?? loadedRunRef.current, preferencesRef.current, metaRef.current),
    [game, persist],
  );

  const value = useMemo<GameContextValue>(
    () => ({
      game,
      preferences,
      meta,
      hasSave,
      recoveryAvailable,
      message,
      startCampaign,
      continueCampaign,
      command,
      updatePreferences,
      importSave,
      exportSave,
      restoreBackup,
      checkpointSave,
      clearMessage: () => setMessage(null),
      resetCampaign,
    }),
    [
      game,
      preferences,
      meta,
      hasSave,
      recoveryAvailable,
      message,
      startCampaign,
      continueCampaign,
      command,
      updatePreferences,
      importSave,
      exportSave,
      restoreBackup,
      checkpointSave,
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
  recoveryAvailable: boolean;
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
      recoveryAvailable: loaded.recoveryAvailable,
    };
  } catch {
    return {
      store: null,
      run: null,
      preferences: createDefaultPreferences(),
      meta: createDefaultMeta(),
      warning: 'Browser storage is unavailable. You can still play, but this run may not persist.',
      recoveryAvailable: false,
    };
  }
}

/** Access the current game controller. */
export function useGame(): GameContextValue {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be rendered inside GameProvider.');
  return context;
}
