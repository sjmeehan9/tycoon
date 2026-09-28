import { useCallback, useState, type ChangeEvent } from 'react';

import { handleTabListKeyDown } from '../accessibility/keyboard';
import { useModalFocus } from '../accessibility/useModalFocus';
import { CAMPAIGN_RULES, COSMETIC_DETAILS } from '../content/gameContent';
import { useGame } from '../app/GameContext';
import {
  ACHIEVEMENT_DETAILS,
  campaignRecordsByDifficulty,
  DIFFICULTY_DESCRIPTIONS,
  DIFFICULTY_LABELS,
  formatMoney,
  venueLabel,
  type CampaignRecord,
  type Difficulty,
  type Preferences,
} from '../game';
import { ReportView } from './ReportPanel';

type ToolSection = 'settings' | 'reports' | 'records' | 'help' | 'save';

/** Reachable reports, settings, records, help, save transfer, and recovery dialog. */
export function GameTools(): React.JSX.Element {
  const {
    exportSave,
    game,
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
  const [selectedReportDay, setSelectedReportDay] = useState<number | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const closeDialog = useCallback(() => setIsOpen(false), []);
  const dialogRef = useModalFocus<HTMLElement>({ active: isOpen, onEscape: closeDialog });
  const history = game?.history ?? [];
  const selectedReport =
    history.find((report) => report.day === selectedReportDay) ?? history.at(-1) ?? null;
  const recordsByDifficulty = campaignRecordsByDifficulty(meta);

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
                  ['reports', 'Reports'],
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

            {section === 'reports' ? (
              <ToolSectionPanel id="reports" title="Settled day reports">
                <p className="field-help">
                  Reopen any settled result retained in this campaign. Historical reports are
                  read-only and never settle the current day.
                </p>
                {history.length > 0 && selectedReport ? (
                  <div className="report-history-layout">
                    <nav aria-label="Campaign report history" className="report-history-list">
                      {[...history].reverse().map((report) => (
                        <button
                          aria-pressed={selectedReport.day === report.day}
                          className="button report-history-button"
                          key={report.day}
                          onClick={() => setSelectedReportDay(report.day)}
                          type="button"
                        >
                          <strong>Day {report.day}</strong>
                          <span>{formatMoney(report.revenueCents)} revenue</span>
                        </button>
                      ))}
                    </nav>
                    <ReportView
                      key={selectedReport.day}
                      mode="historical"
                      report={selectedReport}
                    />
                  </div>
                ) : (
                  <p className="empty-note">
                    No settled reports yet. Finish a day to save it here.
                  </p>
                )}
              </ToolSectionPanel>
            ) : null}

            {section === 'records' ? (
              <ToolSectionPanel id="records" title="Records and unlocks">
                <p>
                  Endless mode:{' '}
                  <strong>{meta.endlessUnlocked ? 'Unlocked' : 'Win once to unlock'}</strong>
                </p>
                <p className="field-help">
                  Achievements, scenarios, cosmetics, and endless mode are shared across
                  difficulties. They never add an economic bonus.
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
                <h4>Cosmetics</h4>
                <div className="achievement-list cosmetic-list">
                  {meta.cosmetics.map((cosmetic) => (
                    <article key={cosmetic}>
                      <strong>{COSMETIC_DETAILS[cosmetic].name}</strong>
                      <small>{COSMETIC_DETAILS[cosmetic].description} Presentation only.</small>
                    </article>
                  ))}
                </div>
                {(['standard', 'hard'] as const).map((difficulty) => (
                  <section
                    aria-labelledby={`records-${difficulty}-title`}
                    className="difficulty-records"
                    key={difficulty}
                  >
                    <h4 id={`records-${difficulty}-title`}>
                      {DIFFICULTY_LABELS[difficulty]} records
                    </h4>
                    <DifficultyRecordList
                      difficulty={difficulty}
                      records={recordsByDifficulty[difficulty]}
                    />
                  </section>
                ))}
              </ToolSectionPanel>
            ) : null}

            {section === 'help' ? (
              <ToolSectionPanel id="help" title="How to run the laneway">
                <ol className="help-list">
                  <li>Plan a focused menu, prices, beans, stock, dial-in, and scheduled team.</li>
                  <li>Open for 75 seconds; pause or accelerate while staff serve automatically.</li>
                  <li>
                    Resolve up to two seeded rush choices, then use the report to find the exact
                    demand and service causes captured at settlement.
                  </li>
                  <li>
                    Invest in three equipment tiers and promote cart → kiosk → cafe → department
                    store, where four physical hall upgrades become available.
                  </li>
                  <li>
                    On Day {CAMPAIGN_RULES.durationDays}, finish with the department-store coffee
                    hall, {formatMoney(CAMPAIGN_RULES.victoryCashCents)}, and{' '}
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
                  <HelpTopic summary="Standard and Hard difficulty">
                    <strong>Standard:</strong> {DIFFICULTY_DESCRIPTIONS.standard}{' '}
                    <strong>Hard:</strong> {DIFFICULTY_DESCRIPTIONS.hard} Difficulty is chosen
                    independently from scenario and cannot change after campaign creation.
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
                  Version 1–3 files retain only sound, ambience, and reduced-motion settings; their
                  campaign progress is intentionally reset at the v4 boundary.
                </p>
              </ToolSectionPanel>
            ) : null}
          </section>
        </div>
      ) : null}
    </>
  );
}

function DifficultyRecordList({
  difficulty,
  records,
}: {
  difficulty: Difficulty;
  records: CampaignRecord[];
}): React.JSX.Element {
  if (records.length === 0) {
    return <p className="empty-note">No {DIFFICULTY_LABELS[difficulty]} outcomes yet.</p>;
  }
  return (
    <div className="record-list">
      {records.map((record) => (
        <article key={`${record.difficulty}-${record.campaignId}-${record.result}-${record.day}`}>
          <strong className="capitalize">{record.result.replace(/([A-Z])/g, ' $1')}</strong>
          <span>
            Day {record.day} · {venueLabel(record.venueId)} · {formatMoney(record.cashCents)} · rep{' '}
            {record.reputation}
          </span>
        </article>
      ))}
    </div>
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
