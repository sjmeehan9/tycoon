import { useGame } from '../app/GameContext';
import { formatMoney } from '../game';
import { VENUES } from '../content/gameContent';

/** Concise phase-level announcements that avoid speaking every simulation tick. */
export function GameAnnouncer(): React.JSX.Element {
  const { game } = useGame();
  let announcement = 'Laneway Tycoon title screen.';
  if (game) {
    if (game.phase === 'planning') {
      announcement = `Day ${game.day} planning at the ${VENUES[game.venueId].shortName}.`;
    } else if (game.phase === 'event') {
      announcement = `Rush decision: ${game.rush?.pendingEvent?.title ?? 'choose a response'}.`;
    } else if (game.phase === 'report' && game.report) {
      announcement = `Day ${game.day} report. Served ${game.report.served} of ${game.report.arrivals}. Closing cash ${formatMoney(game.report.closingCashCents)}.`;
    } else if (game.phase === 'reinvest') {
      announcement = `Day ${game.day} settled. Reinvestment is ready.`;
    } else if (game.phase === 'victory' || game.phase === 'defeat') {
      announcement = game.outcome?.message ?? 'Campaign complete.';
    } else {
      const serviceTopology =
        game.venueId === 'departmentStore'
          ? 'Parallel espresso, brew, and cold stations plus normal and express lanes are available. The heritage hall mirrors canonical customers, staff, jobs, and departures in the semantic dashboard and activity log.'
          : 'One espresso station and its normal lane are available in the semantic dashboard.';
      announcement = `Service rush active at the ${VENUES[game.venueId].shortName}. ${serviceTopology} Scene, dashboard and controls, live activity, then stock.`;
    }
  }
  return (
    <div aria-atomic="true" aria-live="polite" className="sr-only" role="status">
      {announcement}
    </div>
  );
}
