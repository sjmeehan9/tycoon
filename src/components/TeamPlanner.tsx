import {
  STAFF_ROLE_DETAILS,
  STAFF_ROLE_LABELS,
  STAFF_TRAIT_DETAILS,
  VENUES,
  staffRoleAvailableAtVenue,
  workforceCapacityFor,
} from '../content/gameContent';
import { useGame } from '../app/GameContext';
import {
  STATION_DETAILS,
  STATION_IDS,
  formatMoney,
  serviceConfigFor,
  staffRoleValue,
  staffStationCompatible,
  workforceAppliedEffectLabels,
  type StationId,
} from '../game';

/** Hiring pool and daily team scheduling controls used by the morning planner. */
export function TeamPlanner(): React.JSX.Element {
  const { command, game } = useGame();
  if (!game) return <></>;
  const capacity = workforceCapacityFor(game.venueId);
  const scheduled = new Set(game.plan.scheduledStaffIds);
  const scheduleFull = scheduled.size >= capacity.scheduleCapacity;
  const rosterFull = game.staff.length >= capacity.rosterCapacity;
  const appliedEffects = workforceAppliedEffectLabels(game);
  const wageCost = game.staff
    .filter((member) => scheduled.has(member.id))
    .reduce((total, member) => total + member.wageCents, 0);

  const toggleSchedule = (staffId: string): void => {
    const alreadyScheduled = scheduled.has(staffId);
    const scheduledStaffIds = alreadyScheduled
      ? game.plan.scheduledStaffIds.filter((id) => id !== staffId)
      : [...game.plan.scheduledStaffIds, staffId];
    const stationAssignments = Object.fromEntries(
      STATION_IDS.map((stationId) => [
        stationId,
        game.plan.stationAssignments[stationId].filter((id) => id !== staffId),
      ]),
    ) as Record<StationId, string[]>;
    if (!alreadyScheduled) {
      const member = game.staff.find(({ id }) => id === staffId);
      const compatibleStations = member
        ? serviceConfigFor(game.venueId).stationIds.filter((stationId) =>
            staffStationCompatible(member.role, stationId, game.venueId),
          )
        : [];
      const selectedStation = compatibleStations.reduce<StationId | null>((selected, stationId) => {
        if (!selected) return stationId;
        return stationAssignments[stationId].length < stationAssignments[selected].length
          ? stationId
          : selected;
      }, null);
      if (selectedStation) stationAssignments[selectedStation].push(staffId);
    }
    command({ type: 'prepareDay', patch: { scheduledStaffIds, stationAssignments } });
  };

  const assignStation = (staffId: string, stationId: StationId): void => {
    const stationAssignments = Object.fromEntries(
      STATION_IDS.map((candidate) => [
        candidate,
        game.plan.stationAssignments[candidate].filter((id) => id !== staffId),
      ]),
    ) as Record<StationId, string[]>;
    stationAssignments[stationId].push(staffId);
    command({ type: 'prepareDay', patch: { stationAssignments } });
  };

  return (
    <div className="team-planner">
      <div className="team-summary">
        <div>
          <strong>
            Daily team · {game.plan.scheduledStaffIds.length}/{capacity.scheduleCapacity} scheduled
          </strong>
          <small>
            Roster · {game.staff.length}/{capacity.rosterCapacity} employed
          </small>
        </div>
        <span>{formatMoney(wageCost)} payroll at close</span>
      </div>
      {scheduleFull ? (
        <p className="capacity-note" id="schedule-capacity-note" role="status">
          Daily schedule full: {VENUES[game.venueId].shortName} accepts up to{' '}
          {capacity.scheduleCapacity} people. Uncheck someone before scheduling another.
        </p>
      ) : null}
      {appliedEffects.length > 0 ? (
        <ul aria-label="Applied department workforce effects" className="workforce-effects">
          {appliedEffects.map((label) => (
            <li key={label}>{label}</li>
          ))}
        </ul>
      ) : null}
      {game.staff.length > 0 ? (
        <div className="staff-grid" aria-label="Hired staff">
          {game.staff.map((member) => {
            const selectedStation = STATION_IDS.find((stationId) =>
              game.plan.stationAssignments[stationId].includes(member.id),
            );
            return (
              <article
                className={`staff-card ${scheduled.has(member.id) ? 'is-selected' : ''}`}
                key={member.id}
              >
                <label className="staff-schedule-control">
                  <input
                    aria-describedby={
                      scheduleFull && !scheduled.has(member.id)
                        ? 'schedule-capacity-note'
                        : undefined
                    }
                    checked={scheduled.has(member.id)}
                    disabled={scheduleFull && !scheduled.has(member.id)}
                    onChange={() => toggleSchedule(member.id)}
                    type="checkbox"
                  />
                  <span>
                    <strong>{member.name}</strong>
                    <small>
                      {STAFF_ROLE_LABELS[member.role]} · speed {member.speed} · skill {member.skill}
                    </small>
                    <small>
                      {STAFF_TRAIT_DETAILS[member.trait].name}:{' '}
                      {STAFF_TRAIT_DETAILS[member.trait].effect}
                    </small>
                    <small>{staffRoleValue(member)}</small>
                    <small>{formatMoney(member.wageCents)} per day</small>
                  </span>
                </label>
                {scheduled.has(member.id) && game.venueId === 'departmentStore' ? (
                  <label className="station-assignment-control">
                    <span>Service station</span>
                    <select
                      aria-label={`${member.name} service station`}
                      onChange={(event) =>
                        assignStation(member.id, event.target.value as StationId)
                      }
                      value={selectedStation}
                    >
                      {serviceConfigFor(game.venueId).stationIds.map((stationId) => (
                        <option
                          disabled={!staffStationCompatible(member.role, stationId, game.venueId)}
                          key={stationId}
                          value={stationId}
                        >
                          {STATION_DETAILS[stationId].label}
                        </option>
                      ))}
                    </select>
                    <small>Only role-compatible stations can be selected.</small>
                  </label>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : (
        <p className="empty-note">
          {game.venueId === 'departmentStore'
            ? 'Department stations require hired, scheduled staff with compatible assignments before service can start. Hire below to build station coverage.'
            : 'The owner is covering the active espresso station. Hire below to build a team.'}
        </p>
      )}

      <h3>Today’s candidates</h3>
      <div className="candidate-grid">
        {game.candidateStaff.map((candidate) => {
          const eligible = staffRoleAvailableAtVenue(candidate.role, game.venueId);
          const reasonId = `candidate-reason-${candidate.id}`;
          return (
            <article className="candidate-card" key={candidate.id}>
              <div>
                <strong>{candidate.name}</strong>
                <small>
                  {STAFF_ROLE_LABELS[candidate.role]} · speed {candidate.speed} · skill{' '}
                  {candidate.skill}
                </small>
                <small>
                  {STAFF_TRAIT_DETAILS[candidate.trait].name} —{' '}
                  {STAFF_TRAIT_DETAILS[candidate.trait].effect}
                </small>
                <small>{staffRoleValue(candidate)}</small>
                <small>{formatMoney(candidate.wageCents)} per scheduled day</small>
                {!eligible || rosterFull ? (
                  <small className="candidate-restriction" id={reasonId}>
                    {!eligible
                      ? `${STAFF_ROLE_DETAILS[candidate.role].label} hiring unlocks at the Department Store Coffee Hall.`
                      : `Roster full at ${capacity.rosterCapacity} people.`}
                  </small>
                ) : null}
              </div>
              <button
                aria-describedby={!eligible || rosterFull ? reasonId : undefined}
                className="button"
                disabled={!eligible || rosterFull}
                onClick={() => command({ type: 'hireStaff', candidateId: candidate.id })}
                type="button"
              >
                Hire {candidate.name}
              </button>
            </article>
          );
        })}
      </div>
      {game.candidateStaff.length === 0 ? (
        <p className="empty-note">
          Today’s candidate list is empty. A fresh pool arrives tomorrow.
        </p>
      ) : null}
    </div>
  );
}
