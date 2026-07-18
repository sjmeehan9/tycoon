import { useState, type ChangeEvent } from 'react';

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
            role="dialog"
          >
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Laneway notebook</p>
                <h2 id="game-tools-title">Game menu</h2>
              </div>
              <button
                aria-label="Close game menu"
                className="button"
                onClick={() => setIsOpen(false)}
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
                  key={id}
                  onClick={() => setSection(id)}
                  role="tab"
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>

            {section === 'settings' ? (
              <ToolSectionPanel title="Settings">
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
                  Settings autosave without changing the active simulation.
                </p>
              </ToolSectionPanel>
            ) : null}

            {section === 'records' ? (
              <ToolSectionPanel title="Records and unlocks">
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
              <ToolSectionPanel title="How to run the laneway">
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
              </ToolSectionPanel>
            ) : null}

            {section === 'save' ? (
              <ToolSectionPanel title="Save transfer and recovery">
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
  title,
}: {
  children: React.ReactNode;
  title: string;
}): React.JSX.Element {
  return (
    <section className="tool-section" role="tabpanel">
      <h3>{title}</h3>
      {children}
    </section>
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
