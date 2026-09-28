import { CAMPAIGN_RULES } from '../content/gameContent';
import { LANE_IDS, STATION_IDS } from './serviceStations';
import type { AchievementId, CampaignRecord, GameState, MetaProgress } from './types';

export const ACHIEVEMENT_DETAILS: Record<AchievementId, { name: string; description: string }> = {
  cafeFounder: {
    name: 'Coffee Hall Founder',
    description:
      'Win a 40-day campaign from cart to department-store coffee hall and unlock endless mode, a wattle awning, and Rainy Season.',
  },
  goldenCup: {
    name: 'Golden Cup',
    description: 'Win with 85 reputation and a 50% cash buffer; unlock Festival Week and Neon Cup.',
  },
  hardLessons: {
    name: 'Hard Lessons',
    description: 'Record a bankruptcy. The lesson is permanent; the economic penalty is not.',
  },
  departmentInstitution: {
    name: 'Department Institution',
    description:
      'Win the 40-day campaign in the department-store coffee hall and unlock the Mosaic Floor and Brass Bay Plaques.',
  },
  threeBayConductor: {
    name: 'Three-bay Conductor',
    description:
      'Win after serving every station and both lanes on Day 40 and unlock the After-hours Glow.',
  },
};

/** Apply one terminal campaign outcome to cosmetic-only meta progression exactly once. */
export function recordCampaignOutcome(meta: MetaProgress, state: GameState): MetaProgress {
  const outcome = state.outcome;
  if (!outcome) return meta;
  const record: CampaignRecord = {
    campaignId: state.campaignId,
    difficulty: state.difficulty,
    result: outcome.type,
    day: state.day,
    cashCents: state.cashCents,
    reputation: state.reputation,
    venueId: state.venueId,
  };
  const alreadyRecorded = meta.records.some(
    (existing) =>
      existing.campaignId === record.campaignId &&
      existing.difficulty === record.difficulty &&
      existing.result === record.result &&
      existing.day === record.day,
  );
  const achievements = new Set(meta.achievements);
  const cosmetics = new Set(meta.cosmetics);
  const scenarios = new Set(meta.scenarios);
  let endlessUnlocked = meta.endlessUnlocked;

  if (outcome.type === 'victory') {
    endlessUnlocked = true;
    achievements.add('cafeFounder');
    cosmetics.add('wattleAwning');
    scenarios.add('rainySeason');
    achievements.add('departmentInstitution');
    cosmetics.add('mosaicFloor');
    cosmetics.add('brassBayPlaques');
    const finalReport = state.history.find((report) => report.day === state.day) ?? state.report;
    if (finalReport && reportServedEveryStationAndLane(finalReport)) {
      achievements.add('threeBayConductor');
      cosmetics.add('afterHoursGlow');
    }
    if (
      state.reputation >= 85 &&
      state.cashCents >= Math.round(CAMPAIGN_RULES.victoryCashCents * 1.5)
    ) {
      achievements.add('goldenCup');
      cosmetics.add('neonCup');
      scenarios.add('festivalWeek');
    }
  } else if (outcome.type === 'bankruptcy') {
    achievements.add('hardLessons');
  }

  return {
    endlessUnlocked,
    achievements: [...achievements],
    cosmetics: [...cosmetics],
    scenarios: [...scenarios],
    records: alreadyRecorded ? meta.records : [...meta.records, record].slice(-50),
  };
}

/** Prove all three stations and both lanes served without requiring impossible empty intersections. */
export function reportServedEveryStationAndLane(report: NonNullable<GameState['report']>): boolean {
  return (
    STATION_IDS.every((stationId) =>
      report.serviceAggregates.some(
        (aggregate) => aggregate.stationId === stationId && aggregate.served > 0,
      ),
    ) &&
    LANE_IDS.every((laneId) =>
      report.serviceAggregates.some(
        (aggregate) => aggregate.laneId === laneId && aggregate.served > 0,
      ),
    )
  );
}
