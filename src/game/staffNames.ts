/** Collision-free, seed-permuted staff-name allocation for supported campaigns. */

const COMPONENT_COUNT = 64;
const PAIR_INDEX_BITS = 12;
const PAIR_INDEX_MASK = (1 << PAIR_INDEX_BITS) - 1;

/** Four candidates are displayed on every supported campaign day. */
export const CANDIDATES_PER_DAY = 4;
/** Persistence and endless-mode support end at this inclusive day. */
export const MAX_STAFF_NAME_DAY = 10_000;
/** Initial-free names available before middle initials become necessary. */
export const STAFF_NAMES_PER_TIER = COMPONENT_COUNT * COMPONENT_COUNT;
/** Sixteen disjoint tiers provide a direct-index namespace of 65,536 names. */
export const STAFF_NAME_TIER_COUNT = 16;
/** Total number of exact names addressable without sampling or stored history. */
export const STAFF_NAME_NAMESPACE_SIZE = STAFF_NAMES_PER_TIER * STAFF_NAME_TIER_COUNT;
/** Candidate slots used by four people across every supported day. */
export const SUPPORTED_CANDIDATE_NAME_COUNT = MAX_STAFF_NAME_DAY * CANDIDATES_PER_DAY;
/** Names outside candidate allocation are reserved solely for save repair. */
export const RESERVED_STAFF_NAME_COUNT = STAFF_NAME_NAMESPACE_SIZE - SUPPORTED_CANDIDATE_NAME_COUNT;

/** Curated names emitted by builds before collision-free allocation was introduced. */
export const LEGACY_STAFF_NAMES = [
  'Ari Nguyen',
  'Billie Tran',
  'Casey Morgan',
  'Dev Singh',
  'Evie Chen',
  'Frankie Russo',
  'Georgie Walker',
  'Harper Kim',
  'Indi Patel',
  'Jules Martin',
  'Kit O’Connor',
  'Lou Haddad',
] as const;

const GIVEN_NAMES = [
  'Amelia',
  'Amina',
  'Anh',
  'Arjun',
  'Ayla',
  'Banjo',
  'Bao',
  'Bianca',
  'Callum',
  'Celeste',
  'Chidi',
  'Chloe',
  'Darcy',
  'Diego',
  'Eamon',
  'Eden',
  'Elif',
  'Emma',
  'Farah',
  'Felix',
  'Freya',
  'Grace',
  'Hamish',
  'Hana',
  'Henry',
  'Imogen',
  'Isaac',
  'Isla',
  'Jamal',
  'Jasmine',
  'Kai',
  'Keira',
  'Lachlan',
  'Leila',
  'Leo',
  'Liam',
  'Lila',
  'Luca',
  'Maeve',
  'Maya',
  'Mia',
  'Mika',
  'Niamh',
  'Noah',
  'Oliver',
  'Omar',
  'Priya',
  'Quinn',
  'Rafael',
  'Ruby',
  'Samira',
  'Sienna',
  'Sofia',
  'Tahlia',
  'Tariq',
  'Theo',
  'Uma',
  'Violet',
  'William',
  'Xanthe',
  'Yara',
  'Yusuf',
  'Zoe',
  'Zuri',
] as const;

const SURNAMES = [
  'Abdullah',
  'Ahmadi',
  'Baird',
  'Baker',
  'Banerjee',
  'Brown',
  'Campbell',
  'Clarke',
  'Costa',
  'D’Souza',
  'Davies',
  'de Silva',
  'Edwards',
  'Evans',
  'Fernandez',
  'Garcia',
  'Goh',
  'Grant',
  'Green',
  'Hassan',
  'Hayashi',
  'Ibrahim',
  'Jones',
  'Kaur',
  'Kelly',
  'Khan',
  'Kowalski',
  'Kumar',
  'Lam',
  'Lee',
  'Li',
  'Lim',
  'Macdonald',
  'Mahmoud',
  'Malik',
  'McKenzie',
  'Mensah',
  'Miller',
  'Murphy',
  'Nair',
  'Nakamura',
  'O’Brien',
  'Okafor',
  'Papadopoulos',
  'Park',
  'Pereira',
  'Pham',
  'Rahman',
  'Reid',
  'Rios',
  'Robertson',
  'Sato',
  'Sharma',
  'Smith',
  'Tan',
  'Thompson',
  'Torres',
  'Vella',
  'Williams',
  'Wong',
  'Wu',
  'Yamamoto',
  'Young',
  'Zhao',
] as const;

const MIDDLE_INITIALS = [
  'A',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'J',
  'K',
  'L',
  'M',
  'N',
  'P',
  'R',
  'S',
] as const;

assertNamespaceComponents();

/** Return the direct candidate ordinal for a day and zero-based pool index. */
export function candidateStaffOrdinal(day: number, index: number): number {
  if (!Number.isInteger(day) || day < 1 || day > MAX_STAFF_NAME_DAY) {
    throw new RangeError(`Staff-name day must be an integer from 1 to ${MAX_STAFF_NAME_DAY}.`);
  }
  if (!Number.isInteger(index) || index < 0 || index >= CANDIDATES_PER_DAY) {
    throw new RangeError(`Candidate index must be an integer from 0 to ${CANDIDATES_PER_DAY - 1}.`);
  }
  return (day - 1) * CANDIDATES_PER_DAY + index;
}

/** Return one collision-free candidate name without retaining campaign history. */
export function candidateStaffName(seed: number, day: number, index: number): string {
  return staffNameAtOrdinal(seed, candidateStaffOrdinal(day, index));
}

/** Resolve any valid ordinal in the complete 65,536-name namespace. */
export function staffNameAtOrdinal(seed: number, ordinal: number): string {
  const normalizedSeed = normalizeSeed(seed);
  if (!Number.isInteger(ordinal) || ordinal < 0 || ordinal >= STAFF_NAME_NAMESPACE_SIZE) {
    throw new RangeError(
      `Staff-name ordinal must be an integer from 0 to ${STAFF_NAME_NAMESPACE_SIZE - 1}.`,
    );
  }

  const tier = Math.floor(ordinal / STAFF_NAMES_PER_TIER);
  const pairOrdinal = ordinal % STAFF_NAMES_PER_TIER;
  const pairIndex = permutedPairIndex(normalizedSeed, tier, pairOrdinal);
  const givenName = GIVEN_NAMES[Math.floor(pairIndex / COMPONENT_COUNT)];
  const surname = SURNAMES[pairIndex % COMPONENT_COUNT];
  if (!givenName || !surname) throw new Error('Staff-name namespace components are incomplete.');
  if (tier === 0) return `${givenName} ${surname}`;
  const middleInitial = MIDDLE_INITIALS[tier - 1];
  if (!middleInitial) throw new Error('Staff-name tier has no readable middle initial.');
  return `${givenName} ${middleInitial}. ${surname}`;
}

/** Return one deterministic name from the migration-only reserved ordinal range. */
export function reservedStaffName(seed: number, repairIndex: number): string {
  if (
    !Number.isInteger(repairIndex) ||
    repairIndex < 0 ||
    repairIndex >= RESERVED_STAFF_NAME_COUNT
  ) {
    throw new RangeError(
      `Staff-name repair index must be an integer from 0 to ${RESERVED_STAFF_NAME_COUNT - 1}.`,
    );
  }
  return staffNameAtOrdinal(seed, SUPPORTED_CANDIDATE_NAME_COUNT + repairIndex);
}

function permutedPairIndex(seed: number, tier: number, pairOrdinal: number): number {
  const tierKey = mix32(seed ^ Math.imul(tier + 1, 0x9e37_79b9));
  const multiplier = ((tierKey >>> 12) | 1) & PAIR_INDEX_MASK;
  const increment = mix32(tierKey ^ 0xa5a5_5a5a) & PAIR_INDEX_MASK;
  return (Math.imul(multiplier, pairOrdinal) + increment) & PAIR_INDEX_MASK;
}

function mix32(value: number): number {
  let mixed = value >>> 0;
  mixed ^= mixed >>> 16;
  mixed = Math.imul(mixed, 0x7feb_352d);
  mixed ^= mixed >>> 15;
  mixed = Math.imul(mixed, 0x846c_a68b);
  mixed ^= mixed >>> 16;
  return mixed >>> 0;
}

function normalizeSeed(seed: number): number {
  if (!Number.isFinite(seed)) throw new RangeError('Staff-name seed must be a finite number.');
  return Math.trunc(seed) >>> 0;
}

function assertNamespaceComponents(): void {
  if (
    GIVEN_NAMES.length !== COMPONENT_COUNT ||
    SURNAMES.length !== COMPONENT_COUNT ||
    MIDDLE_INITIALS.length !== STAFF_NAME_TIER_COUNT - 1
  ) {
    throw new Error(
      'Staff-name namespace must contain 64 given names, 64 surnames, and 15 initials.',
    );
  }
}
