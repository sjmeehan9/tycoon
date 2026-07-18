import { describe, expect, it } from 'vitest';

import {
  LEGACY_STAFF_NAMES,
  MAX_STAFF_NAME_DAY,
  RESERVED_STAFF_NAME_COUNT,
  STAFF_NAME_NAMESPACE_SIZE,
  STAFF_NAMES_PER_TIER,
  SUPPORTED_CANDIDATE_NAME_COUNT,
  candidateStaffName,
  candidateStaffOrdinal,
  reservedStaffName,
  staffNameAtOrdinal,
} from '../../src/game';

describe('collision-free staff-name namespace', () => {
  it('exhausts all 65,536 direct ordinals without an exact-name collision', () => {
    const names = Array.from({ length: STAFF_NAME_NAMESPACE_SIZE }, (_, ordinal) =>
      staffNameAtOrdinal(2_607, ordinal),
    );

    expect(names).toHaveLength(65_536);
    expect(new Set(names).size).toBe(65_536);
    expect(names.slice(0, STAFF_NAMES_PER_TIER).every((name) => !/ [A-Z]\. /.test(name))).toBe(
      true,
    );
    expect(names.slice(STAFF_NAMES_PER_TIER).every((name) => / [A-Z]\. /.test(name))).toBe(true);
  });

  it('allocates every supported candidate slot uniquely and outside legacy names', () => {
    const names = new Set<string>();
    const legacy = new Set<string>(LEGACY_STAFF_NAMES);

    for (let day = 1; day <= MAX_STAFF_NAME_DAY; day += 1) {
      for (let index = 0; index < 4; index += 1) {
        const name = candidateStaffName(8_181, day, index);
        expect(legacy.has(name)).toBe(false);
        names.add(name);
      }
    }

    expect(names.size).toBe(SUPPORTED_CANDIDATE_NAME_COUNT);
    expect(names.size).toBe(40_000);
  });

  it('is reproducible for one seed while another seed permutes allocation', () => {
    const first = Array.from({ length: 4 }, (_, index) => candidateStaffName(77, 2_048, index));
    const repeated = Array.from({ length: 4 }, (_, index) => candidateStaffName(77, 2_048, index));
    const otherSeed = Array.from({ length: 4 }, (_, index) => candidateStaffName(78, 2_048, index));

    expect(repeated).toEqual(first);
    expect(otherSeed).not.toEqual(first);
    expect(new Set(first).size).toBe(4);
  });

  it('uses exact candidate ordinals and keeps repair names beyond slot 39,999', () => {
    expect(candidateStaffOrdinal(1, 0)).toBe(0);
    expect(candidateStaffOrdinal(1, 3)).toBe(3);
    expect(candidateStaffOrdinal(10_000, 3)).toBe(39_999);
    expect(reservedStaffName(91, 0)).toBe(staffNameAtOrdinal(91, 40_000));
    expect(reservedStaffName(91, RESERVED_STAFF_NAME_COUNT - 1)).toBe(
      staffNameAtOrdinal(91, STAFF_NAME_NAMESPACE_SIZE - 1),
    );
  });

  it('rejects unsupported days, indexes, ordinals, repair indexes, and seeds', () => {
    expect(() => candidateStaffOrdinal(0, 0)).toThrow('from 1 to 10000');
    expect(() => candidateStaffOrdinal(10_001, 0)).toThrow('from 1 to 10000');
    expect(() => candidateStaffOrdinal(1, 4)).toThrow('from 0 to 3');
    expect(() => staffNameAtOrdinal(1, -1)).toThrow('from 0 to 65535');
    expect(() => staffNameAtOrdinal(1, STAFF_NAME_NAMESPACE_SIZE)).toThrow('from 0 to 65535');
    expect(() => reservedStaffName(1, RESERVED_STAFF_NAME_COUNT)).toThrow(
      'repair index must be an integer',
    );
    expect(() => candidateStaffName(Number.NaN, 1, 0)).toThrow('seed must be a finite number');
  });
});
