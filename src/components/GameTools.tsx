import { useCallback, useState, type ChangeEvent } from 'react';

import { handleTabListKeyDown } from '../accessibility/keyboard';
import { useModalFocus } from '../accessibility/useModalFocus';
import { CAMPAIGN_RULES } from '../content/gameContent';
import { useGame } from '../app/GameContext';
import { ACHIEVEMENT_DETAILS, formatMoney, type Preferences } from '../game';

type ToolSection = 'settings' | 'records' | 'help' | 'save';

/** Reachable settings, records, help, save transfer, and recovery dialog. */
export function GameTools(): React.JSX.Element {
  const {
    exportSave,
    importSave,
    meta,
    preferences,
    recoveryAvailable,
    resetCampaign,
    restoreBackup,
    updatePreferences,
  } = useGame();
  const [isOpen, setIsOpen] = useState(false);
  const [section, setSection] = useState<ToolSection>('settings');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const closeDialog = useCallback(() => setIsOpen(false), []);
  const dialogRef = useModalFocus<HTMLElement>({ active: isOpen, onEscape: closeDialog });

  const downloadSave = (): void => {
    const exported = exportSave();
    const url = URL.createObjectURL(new Blob([exported.contents], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = exported.filename;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > CAMPAIGN_RULES.maximumSaveBytes) {
      setImportStatus('That file exceeds the 750 KB safety limit.');
      event.target.value = '';
      return;
    }
    const imported = importSave(await file.text());
    setImportStatus(
      imported ? 'Save imported and verified.' : 'Import rejected; current data is unchanged.',
    );
    event.target.value = '';
  };

  return (
    <>
      <button className="button game-tools-button" onClick={() => setIsOpen(true)} type="button">
        Game menu
      </button>
      {isOpen ? (
        <div className="dialog-backdrop" role="presentation">
          <section
            aria-labelledby="game-tools-title"
            aria-modal="true"
            className="game-tools-dialog"
            ref={dialogRef}
            role="dialog"
            tabIndex={-1}
          >
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Laneway notebook</p>
                <h2 id="game-tools-title">Game menu</h2>
              </div>
              <button
                aria-label="Close game menu"
                className="button"
                data-dialog-initial-focus
                onClick={closeDialog}
                type="button"
              >
                Close
              </button>
            </div>
            <div aria-label="Game menu sections" className="tool-tabs" role="tablist">
              {(
                [
                  ['settings', 'Settings'],
                  ['records', 'Records'],
                  ['help', 'Help'],
                  ['save', 'Save transfer'],
                ] as const
              ).map(([id, label]) => (
                <button
                  aria-selected={section === id}
                  aria-controls={`tools-${id}-panel`}
                  id={`tools-${id}-tab`}
                  key={id}
                  onClick={() => setSection(id)}
                  onKeyDown={handleTabListKeyDown}
                  role="tab"
                  tabIndex={section === id ? 0 : -1}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>

            {section === 'settings' ? (
              <ToolSectionPanel id="settings" title="Settings">
                <PreferenceToggle
                  checked={preferences.soundEnabled}
                  label="Interface sounds"
                  name="soundEnabled"
                  onChange={updatePreferences}
                />
                <PreferenceToggle
                  checked={preferences.ambienceEnabled}
                  label="Cafe ambience"
                  name="ambienceEnabled"
                  onChange={updatePreferences}
                />
                <PreferenceToggle
                  checked={preferences.reducedMotion}
                  label="Reduce motion"
                  name="reducedMotion"
                  onChange={updatePreferences}
                />
                <p className="field-help">
                  Audio starts off and uses only bundled local files after you enable it. Settings
                  autosave without changing the active simulation.
                </p>
              </ToolSectionPanel>
            ) : null}

            {section === 'records' ? (
              <ToolSectionPanel id="records" title="Records and unlocks">
                <p>
                  Endless mode:{' '}
                  <strong>{meta.endlessUnlocked ? 'Unlocked' : 'Win once to unlock'}</strong>
                </p>
                <div className="achievement-list">
                  {meta.achievements.length > 0 ? (
                    meta.achievements.map((achievement) => (
                      <article key={achievement}>
                        <strong>{ACHIEVEMENT_DETAILS[achievement].name}</strong>
                        <small>{ACHIEVEMENT_DETAILS[achievement].description}</small>
                      </article>
                    ))
                  ) : (
                    <p className="empty-note">
                      No achievements yet. Campaign outcomes appear here.
                    </p>
                  )}
                </div>
                <div className="record-list">
                  {meta.records.map((record) => (
                    <article key={`${record.campaignId}-${record.result}-${record.day}`}>
                      <strong className="capitalize">
                        {record.result.replace(/([A-Z])/g, ' $1')}
                      </strong>
                      <span>
                        Day {record.day} · {record.venueId} · {formatMoney(record.cashCents)} · rep{' '}
                        {record.reputation}
                      </span>
                    </article>
                  ))}
                </div>
              </ToolSectionPanel>
            ) : null}

            {section === 'help' ? (
              <ToolSectionPanel id="help" title="How to run the laneway">
                <ol className="help-list">
                  <li>Plan a focused menu, prices, beans, stock, dial-in, and scheduled team.</li>
                  <li>Open for 75 seconds; pause or accelerate while staff serve automatically.</li>
                  <li>
                    Resolve rush choices, then use the report to find demand and service causes.
                  </li>
                  <li>Invest in equipment and promote cart → kiosk → cafe.</li>
                  <li>
                    On Day {CAMPAIGN_RULES.durationDays}, finish with a cafe,{' '}
                    {formatMoney(CAMPAIGN_RULES.victoryCashCents)}, and{' '}
                    {CAMPAIGN_RULES.victoryReputation} reputation.
                  </li>
                </ol>
                <p>
                  Bankruptcy occurs only after day-close cash falls below{' '}
                  {formatMoney(CAMPAIGN_RULES.overdraftFloorCents)}. Equality is safe.
                </p>
                <div className="contextual-help">
                  <HelpTopic summary="Pricing, recipes, and dial-in">
                    Price changes alter demand; modifiers add surcharges and consume their fixed
                    recipe ingredients. Speed makes cups faster, quality improves satisfaction, and
                    balanced splits the difference.
                  </HelpTopic>
                  <HelpTopic summary="Queues, reports, and progression">
                    Queue length, patience, staff, equipment, and stock decide service outcomes. The
                    report names the bottleneck and reconciles every cost before you invest or
                    promote the same business.
                  </HelpTopic>
                  <HelpTopic summary="Endings, saves, audio, and offline play">
                    Outcomes settle once. Exported JSON is portable and recovery keeps a validated
                    backup. Audio is local and opt-in. Install/offline controls appear only when the
                    browser confirms the release build is ready.
                  </HelpTopic>
                </div>
                <button
                  className="button"
                  onClick={() => {
                    updatePreferences({ onboardingComplete: false });
                    closeDialog();
                  }}
                  type="button"
                >
                  Replay onboarding
                </button>
              </ToolSectionPanel>
            ) : null}

            {section === 'save' ? (
              <ToolSectionPanel id="save" title="Save transfer and recovery">
                <div className="save-actions">
                  <button className="button" onClick={downloadSave} type="button">
                    Export save JSON
                  </button>
                  <label className="button file-button">
                    Import save JSON
                    <input
                      accept="application/json,.json"
                      aria-label="Import save JSON file"
                      onChange={(event) => void handleImport(event)}
                      type="file"
                    />
                  </label>
                  {recoveryAvailable ? (
                    <button className="button" onClick={restoreBackup} type="button">
                      Restore last-known-good save
                    </button>
                  ) : null}
                  <button className="text-button" onClick={resetCampaign} type="button">
                    Start clean (keep settings and unlocks)
                  </button>
                </div>
                {importStatus ? <p role="status">{importStatus}</p> : null}
                <p className="field-help">
                  Imports are local, size-bounded, schema-validated, and never execute file content.
                </p>
              </ToolSectionPanel>
            ) : null}
          </section>
        </div>
      ) : null}
    </>
  );
}

function ToolSectionPanel({
  children,
  id,
  title,
}: {
  children: React.ReactNode;
  id: ToolSection;
  title: string;
}): React.JSX.Element {
  return (
    <section
      aria-labelledby={`tools-${id}-tab`}
      className="tool-section"
      id={`tools-${id}-panel`}
      role="tabpanel"
      tabIndex={0}
    >
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function HelpTopic({
  children,
  summary,
}: {
  children: React.ReactNode;
  summary: string;
}): React.JSX.Element {
  return (
    <details>
      <summary>{summary}</summary>
      <p>{children}</p>
    </details>
  );
}

function PreferenceToggle({
  checked,
  label,
  name,
  onChange,
}: {
  checked: boolean;
  label: string;
  name: keyof Pick<Preferences, 'soundEnabled' | 'ambienceEnabled' | 'reducedMotion'>;
  onChange: (patch: Partial<Preferences>) => void;
}): React.JSX.Element {
  return (
    <label className="preference-row">
      <input
        checked={checked}
        onChange={(event) => onChange({ [name]: event.target.checked })}
        type="checkbox"
      />
      <span>{label}</span>
    </label>
  );
}
