import { useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

import { useGame } from '../app/GameContext';

/** Register the release service worker and require a verified save before activating an update. */
export function PwaUpdatePrompt(): React.JSX.Element | null {
  const { checkpointSave } = useGame();
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegisterError: (error: unknown) => {
      setRegistrationError(
        error instanceof Error
          ? `Offline support could not start: ${error.message}`
          : 'Offline support could not start in this browser.',
      );
    },
  });

  const acceptUpdate = async (): Promise<void> => {
    setUpdateError(null);
    if (!checkpointSave()) {
      setUpdateError('The local checkpoint was not verified. Export a save before updating.');
      return;
    }
    try {
      await updateServiceWorker(true);
    } catch (error) {
      setUpdateError(
        error instanceof Error
          ? `The update could not start: ${error.message}`
          : 'The update could not start. Keep playing and try again later.',
      );
    }
  };

  if (needRefresh) {
    return (
      <aside aria-labelledby="pwa-update-title" className="pwa-notice" role="alertdialog">
        <strong id="pwa-update-title">A fresh batch is ready</strong>
        <p>
          Keep playing on this version, or save a verified checkpoint and update now. The game never
          refreshes an active run automatically.
        </p>
        {updateError ? <p role="alert">{updateError}</p> : null}
        <div className="pwa-notice-actions">
          <button className="button" onClick={() => setNeedRefresh(false)} type="button">
            Keep playing
          </button>
          <button
            className="button button-primary"
            onClick={() => void acceptUpdate()}
            type="button"
          >
            Save and update
          </button>
        </div>
      </aside>
    );
  }

  if (offlineReady) {
    return (
      <aside className="pwa-notice" role="status">
        <strong>Ready for offline play</strong>
        <p>The complete game is cached on this device. Saves remain in this browser.</p>
        <button className="button" onClick={() => setOfflineReady(false)} type="button">
          Got it
        </button>
      </aside>
    );
  }

  if (registrationError) {
    return (
      <aside className="pwa-notice" role="status">
        <strong>Online-only for now</strong>
        <p>{registrationError}</p>
        <button className="button" onClick={() => setRegistrationError(null)} type="button">
          Dismiss
        </button>
      </aside>
    );
  }

  return null;
}
