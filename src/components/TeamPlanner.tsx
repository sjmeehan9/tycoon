import {
  STAFF_ROLE_LABELS,
  STAFF_TRAIT_DETAILS,
  VENUE_STAFF_CAPACITY,
} from '../content/gameContent';
import { useGame } from '../app/GameContext';
import { formatMoney } from '../game';

/** Hiring pool and daily team scheduling controls used by the morning planner. */
export function TeamPlanner(): React.JSX.Element {
  const { command, game } = useGame();
  if (!game) return <></>;
  const capacity = VENUE_STAFF_CAPACITY[game.venueId];
  const scheduled = new Set(game.plan.scheduledStaffIds);
  const wageCost = game.staff
    .filter((member) => scheduled.has(member.id))
    .reduce((total, member) => total + member.wageCents, 0);

  const toggleSchedule = (staffId: string): void => {
    const scheduledStaffIds = scheduled.has(staffId)
      ? game.plan.scheduledStaffIds.filter((id) => id !== staffId)
      : [...game.plan.scheduledStaffIds, staffId];
    command({ type: 'prepareDay', patch: { scheduledStaffIds } });
  };

  return (
    <div className="team-planner">
      <div className="team-summary">
        <strong>
          Daily team · {game.plan.scheduledStaffIds.length}/{capacity} scheduled
        </strong>
        <span>{formatMoney(wageCost)} payroll at close</span>
      </div>
      {game.staff.length > 0 ? (
        <div className="staff-grid" aria-label="Hired staff">
          {game.staff.map((member) => (
            <label
              className={`staff-card ${scheduled.has(member.id) ? 'is-selected' : ''}`}
              key={member.id}
            >
              <input
                checked={scheduled.has(member.id)}
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
                <small>{formatMoney(member.wageCents)} per day</small>
              </span>
            </label>
          ))}
        </div>
      ) : (
        <p className="empty-note">
          The owner is covering every station. Hire below to build a team.
        </p>
      )}

      <h3>Today’s candidates</h3>
      <div className="candidate-grid">
        {game.candidateStaff.map((candidate) => (
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
              <small>{formatMoney(candidate.wageCents)} per scheduled day</small>
            </div>
            <button
              className="button"
              onClick={() => command({ type: 'hireStaff', candidateId: candidate.id })}
              type="button"
            >
              Hire {candidate.name}
            </button>
          </article>
        ))}
      </div>
      {game.candidateStaff.length === 0 ? (
        <p className="empty-note">
          Today’s candidate list is empty. A fresh pool arrives tomorrow.
        </p>
      ) : null}
    </div>
  );
}
