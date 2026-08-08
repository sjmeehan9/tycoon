import { useCallback, useState } from 'react';

import { useModalFocus } from '../accessibility/useModalFocus';
import { useGame } from '../app/GameContext';
import { DIFFICULTY_DESCRIPTIONS, DIFFICULTY_LABELS, type GamePhase } from '../game';

const STEPS: Record<GamePhase, { number: number; title: string; detail: string }> = {
  planning: {
    number: 1,
    title: 'Plan the morning',
    detail: 'Choose a focused menu, sensible prices, enough supplies, beans, dial-in, and team.',
  },
  rush: {
    number: 2,
    title: 'Watch service',
    detail: 'Staff make drinks automatically. Pause or change speed; the calculation stays exact.',
  },
  event: {
    number: 2,
    title: 'Make the rush call',
    detail: 'Read both consequences, choose once, and service will resume from the same tick.',
  },
  report: {
    number: 3,
    title: 'Read the causes',
    detail:
      'Reconcile cash, service, waits, satisfaction, bottlenecks, and the written explanations.',
  },
  reinvest: {
    number: 4,
    title: 'Build tomorrow',
    detail: 'Buy equipment, work toward the next venue, then plan the next trading day.',
  },
  victory: {
    number: 4,
    title: 'Campaign complete',
    detail: 'Review the outcome and choose a fresh campaign or endless mode when available.',
  },
  defeat: {
    number: 4,
    title: 'Campaign complete',
    detail: 'Review why the run closed, then start fresh with what you learned.',
  },
};

/** Skippable, replayable onboarding whose current step follows real game phases. */
export function OnboardingGuide(): React.JSX.Element | null {
  const { game, preferences, updatePreferences } = useGame();
  const [dismissedCampaignId, setDismissedCampaignId] = useState<string | null>(null);
  const introOpen = Boolean(
    game?.phase === 'planning' &&
    !preferences.onboardingComplete &&
    dismissedCampaignId !== game.campaignId,
  );
  const closeIntro = useCallback(
    () => setDismissedCampaignId(game?.campaignId ?? null),
    [game?.campaignId],
  );
  const dialogRef = useModalFocus<HTMLElement>({ active: introOpen, onEscape: closeIntro });

  if (!game || preferences.onboardingComplete) return null;
  const step = STEPS[game.phase];
  const finish = (): void => {
    setDismissedCampaignId(null);
    updatePreferences({ onboardingComplete: true });
  };
  const showCurrentStep = (): void => {
    setDismissedCampaignId(game.campaignId);
    window.requestAnimationFrame(() =>
      document.querySelector<HTMLElement>('.control-column')?.focus(),
    );
  };

  return (
    <>
      {introOpen ? (
        <div className="dialog-backdrop" role="presentation">
          <section
            aria-describedby="onboarding-description"
            aria-labelledby="onboarding-title"
            aria-modal="true"
            className="onboarding-dialog"
            ref={dialogRef}
            role="dialog"
            tabIndex={-1}
          >
            <p className="eyebrow">First shift</p>
            <h2 id="onboarding-title">Welcome to your laneway</h2>
            <p id="onboarding-description">
              Four real actions teach the whole loop: plan, serve, read the report, and reinvest.
              Nothing here changes the simulation.
            </p>
            <p className="difficulty-note">
              <strong>
                {DIFFICULTY_LABELS[game.difficulty]} difficulty is locked for this run.
              </strong>{' '}
              {DIFFICULTY_DESCRIPTIONS[game.difficulty]}
            </p>
            <ol className="onboarding-steps">
              <li>
                <strong>Plan</strong> a small menu and stock.
              </li>
              <li>
                <strong>Serve</strong> automatically and handle a rush choice.
              </li>
              <li>
                <strong>Learn</strong> from the causal report.
              </li>
              <li>
                <strong>Grow</strong> equipment and venues over the full campaign.
              </li>
            </ol>
            <div className="ending-actions">
              <button
                className="button button-primary"
                data-dialog-initial-focus
                onClick={showCurrentStep}
                type="button"
              >
                Show current step
              </button>
              <button className="button" onClick={finish} type="button">
                Skip onboarding
              </button>
            </div>
          </section>
        </div>
      ) : null}
      {!introOpen ? (
        <aside className="onboarding-guide" aria-labelledby="guide-title">
          <div>
            <p className="eyebrow">First-day guide · step {step.number}/4</p>
            <h2 id="guide-title">{step.title}</h2>
            <p>{step.detail}</p>
            <p>
              {DIFFICULTY_LABELS[game.difficulty]} mode · difficulty stays locked for this campaign.
            </p>
          </div>
          <button className="text-button" onClick={finish} type="button">
            {step.number === 4 ? 'Finish guide' : 'Skip guide'}
          </button>
        </aside>
      ) : null}
    </>
  );
}
