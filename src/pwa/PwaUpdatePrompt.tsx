import { useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

import { useGame } from '../app/GameContext';

/** Register the release service worker and require a verified save before activating an update. */
export function PwaUpdatePrompt(): React.JSX.Element | null {
  const { checkpointSave, game } = useGame();
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
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
  const serviceActive = game?.phase === 'rush' || game?.phase === 'event';

  const acceptUpdate = async (): Promise<void> => {
    setUpdateError(null);
    if (serviceActive) return;
    if (!checkpointSave()) {
      setUpdateError('The local checkpoint was not verified. Export a save before updating.');
      return;
    }
    setIsUpdating(true);
    try {
      await updateServiceWorker(true);
    } catch (error) {
      setIsUpdating(false);
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
        {serviceActive ? (
          <p id="pwa-update-service-status">
            Service is active, so this version will stay in control. Finish service before choosing
            whether to save and update.
          </p>
        ) : (
          <p>
            Keep playing on this version, or save a verified checkpoint and update now. Updates only
            activate after you choose them at a safe point.
          </p>
        )}
        {updateError ? <p role="alert">{updateError}</p> : null}
        <div className="pwa-notice-actions">
          <button className="button" onClick={() => setNeedRefresh(false)} type="button">
            Keep playing
          </button>
          <button
            aria-describedby={serviceActive ? 'pwa-update-service-status' : undefined}
            className="button button-primary"
            disabled={serviceActive || isUpdating}
            onClick={() => void acceptUpdate()}
            type="button"
          >
            {serviceActive
              ? 'Finish service to update'
              : isUpdating
                ? 'Saving and updating…'
                : 'Save and update'}
          </button>
        </div>
      </aside>
    );
  }

  if (offlineReady) {
    return (
      <div className="pwa-notice" role="status">
        <strong>Ready for offline play</strong>
        <p>The complete game is cached on this device. Saves remain in this browser.</p>
        <button className="button" onClick={() => setOfflineReady(false)} type="button">
          Got it
        </button>
      </div>
    );
  }

  if (registrationError) {
    return (
      <div className="pwa-notice" role="status">
        <strong>Online-only for now</strong>
        <p>{registrationError}</p>
        <button className="button" onClick={() => setRegistrationError(null)} type="button">
          Dismiss
        </button>
      </div>
    );
  }

  return null;
}
