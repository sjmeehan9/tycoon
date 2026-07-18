import { useGame } from '../app/GameContext';
import { formatMoney } from '../game';

/** Reconciled end-of-day trading report. */
export function ReportPanel(): React.JSX.Element {
  const { command, game } = useGame();
  const report = game?.report;
  if (!game || !report) return <></>;
  return (
    <section className="panel report-panel" aria-labelledby="report-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Day {report.day} report</p>
          <h2 id="report-title">How the cart traded</h2>
        </div>
        <span className={report.netCashFlowCents >= 0 ? 'result-positive' : 'result-negative'}>
          {report.netCashFlowCents >= 0 ? 'Profitable day' : 'Cash went backwards'}
        </span>
      </div>
      <div className="report-layout">
        <table>
          <caption>Cash reconciliation</caption>
          <tbody>
            <tr>
              <th scope="row">Opening cash</th>
              <td>{formatMoney(report.openingCashCents)}</td>
            </tr>
            <tr>
              <th scope="row">Supply purchases</th>
              <td>−{formatMoney(report.purchaseCostCents)}</td>
            </tr>
            <tr>
              <th scope="row">Sales revenue</th>
              <td>+{formatMoney(report.revenueCents)}</td>
            </tr>
            <tr>
              <th scope="row">Cart operating cost</th>
              <td>−{formatMoney(report.operatingCostCents)}</td>
            </tr>
            <tr className="report-total">
              <th scope="row">Closing cash</th>
              <td>{formatMoney(report.closingCashCents)}</td>
            </tr>
          </tbody>
        </table>
        <dl className="report-stats">
          <div>
            <dt>Served</dt>
            <dd>
              {report.served}/{report.arrivals}
            </dd>
          </div>
          <div>
            <dt>Satisfaction</dt>
            <dd>{report.satisfactionPercent}%</dd>
          </div>
          <div>
            <dt>Average wait</dt>
            <dd>{report.averageWaitSeconds}s</dd>
          </div>
          <div>
            <dt>Reputation</dt>
            <dd>
              {report.reputationChange >= 0 ? '+' : ''}
              {report.reputationChange}
            </dd>
          </div>
        </dl>
      </div>
      <div className="bottleneck-card">
        <strong>Bottleneck</strong>
        <span>{report.bottleneck}</span>
      </div>
      <h3>Why it happened</h3>
      <ul className="explanation-list">
        {report.explanations.map((explanation) => (
          <li key={explanation}>{explanation}</li>
        ))}
      </ul>
      <button
        className="button button-primary"
        onClick={() => command({ type: 'closeDay' })}
        type="button"
      >
        Settle the day
      </button>
    </section>
  );
}
