import { getCountyById } from '../data/kenyaLocations';

export const POSITIONS = {
  PRESIDENT: 'president',
  GOVERNOR: 'governor',
  SENATOR: 'senator',
  WOMAN_REPRESENTATIVE: 'woman representative',
  MEMBER_OF_PARLIAMENT: 'member of parliament',
  MCA: 'mca'
};

export const POSITION_INDEX = {
  0: POSITIONS.PRESIDENT,
  1: POSITIONS.GOVERNOR,
  2: POSITIONS.SENATOR,
  3: POSITIONS.WOMAN_REPRESENTATIVE,
  4: POSITIONS.MEMBER_OF_PARLIAMENT,
  5: POSITIONS.MCA
};

export const POSITION_NAMES = {
  [POSITIONS.PRESIDENT]: 'President',
  [POSITIONS.GOVERNOR]: 'Governor',
  [POSITIONS.SENATOR]: 'Senator',
  [POSITIONS.WOMAN_REPRESENTATIVE]: 'Woman Representative',
  [POSITIONS.MEMBER_OF_PARLIAMENT]: 'Member of Parliament',
  [POSITIONS.MCA]: 'MCA'
};

export const POSITION_ORDER = [
  POSITIONS.PRESIDENT,
  POSITIONS.GOVERNOR,
  POSITIONS.SENATOR,
  POSITIONS.WOMAN_REPRESENTATIVE,
  POSITIONS.MEMBER_OF_PARLIAMENT,
  POSITIONS.MCA
];

export const normalizeText = (value) => {
  if (!value || typeof value !== 'string') return '';
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
};

export const normalizePosition = (position) => {
  if (typeof position === 'number') {
    return POSITION_INDEX[position] || 'unknown';
  }
  const normalized = normalizeText(position);
  const positionMap = {
    'president': POSITIONS.PRESIDENT,
    'presidential': POSITIONS.PRESIDENT,
    'governor': POSITIONS.GOVERNOR,
    'gubernatorial': POSITIONS.GOVERNOR,
    'senator': POSITIONS.SENATOR,
    'senate': POSITIONS.SENATOR,
    'woman representative': POSITIONS.WOMAN_REPRESENTATIVE,
    'woman rep': POSITIONS.WOMAN_REPRESENTATIVE,
    'womanrep': POSITIONS.WOMAN_REPRESENTATIVE,
    'women representative': POSITIONS.WOMAN_REPRESENTATIVE,
    'women rep': POSITIONS.WOMAN_REPRESENTATIVE,
    'womenrep': POSITIONS.WOMAN_REPRESENTATIVE,
    'member of parliament': POSITIONS.MEMBER_OF_PARLIAMENT,
    'mp': POSITIONS.MEMBER_OF_PARLIAMENT,
    'm.p': POSITIONS.MEMBER_OF_PARLIAMENT,
    'parliament': POSITIONS.MEMBER_OF_PARLIAMENT,
    'member of county assembly': POSITIONS.MCA,
    'mca': POSITIONS.MCA,
    'county assembly': POSITIONS.MCA,
    'ward representative': POSITIONS.MCA,
    'm.c.a': POSITIONS.MCA,
  };
  if (positionMap[normalized]) {
    return positionMap[normalized];
  }
  if (normalized.includes('woman') || normalized.includes('women')) {
    return POSITIONS.WOMAN_REPRESENTATIVE;
  }
  return positionMap[normalized] || normalized;
};

export const getPositionIndex = (position) => {
  const normalized = normalizePosition(position);
  const reverseMap = {
    [POSITIONS.PRESIDENT]: 0,
    [POSITIONS.GOVERNOR]: 1,
    [POSITIONS.SENATOR]: 2,
    [POSITIONS.WOMAN_REPRESENTATIVE]: 3,
    [POSITIONS.MEMBER_OF_PARLIAMENT]: 4,
    [POSITIONS.MCA]: 5,
  };
  return reverseMap[normalized] ?? -1;
};

export const getPositionDisplayName = (position) => {
  const normalized = normalizePosition(position);
  return POSITION_NAMES[normalized] || normalized || 'Unknown';
};

export const resolveVoterCountyName = (countyValue) => {
  // Handle numeric county values (e.g., 28) - IEBC county ID
  if (typeof countyValue === 'number' && !isNaN(countyValue)) {
    const county = getCountyById(countyValue);
    return county ? county.name.toLowerCase() : '';
  }
  // Handle numeric strings (e.g., "28")
  if (typeof countyValue === 'string' && /^\d+$/.test(countyValue.trim())) {
    const county = getCountyById(parseInt(countyValue, 10));
    return county ? county.name.toLowerCase() : '';
  }
  // Handle named county (e.g., "Nakuru", "nakuru", " Nakuru ")
  if (typeof countyValue === 'string' && countyValue.trim()) {
    return normalizeText(countyValue);
  }
  return '';
};
export const candidateMatchesVoterArea = (candidate, voter) => {
  if (!voter) {
    const position = normalizePosition(candidate.position);
    return position === POSITIONS.PRESIDENT;
  }
  const candidatePosition = normalizePosition(candidate.position);
  const candidateCounty = resolveVoterCountyName(candidate.county);
  const candidateConstituency = normalizeText(candidate.constituency);
  const candidateWard = normalizeText(candidate.ward);
  const voterCounty = resolveVoterCountyName(voter.county);
  const voterConstituency = normalizeText(voter.constituency);
  const voterWard = normalizeText(voter.ward);

  switch (candidatePosition) {
    case POSITIONS.PRESIDENT:
      return true;
    case POSITIONS.GOVERNOR:
    case POSITIONS.SENATOR:
    case POSITIONS.WOMAN_REPRESENTATIVE:
      return candidateCounty === voterCounty;
    case POSITIONS.MEMBER_OF_PARLIAMENT:
      return candidateConstituency === voterConstituency && candidateCounty === voterCounty;
    case POSITIONS.MCA:
      return candidateWard === voterWard &&
             candidateConstituency === voterConstituency &&
             candidateCounty === voterCounty;
    default:
      return false;
  }
};

export const filterCandidatesForVoter = (candidates, voter) => {
  if (!candidates || !candidates.length) return [];
  return candidates.filter(candidate => candidateMatchesVoterArea(candidate, voter));
};

export const groupCandidatesByPosition = (candidates) => {
  const grouped = {};
  for (const candidate of candidates) {
    const position = normalizePosition(candidate.position);
    if (!grouped[position]) {
      grouped[position] = [];
    }
    grouped[position].push(candidate);
  }
  return grouped;
};

export const filterResultsForVoter = (candidates, voter) => {
  return filterCandidatesForVoter(candidates, voter);
};

export const getPositionCounts = (candidates) => {
  const counts = {};
  for (const candidate of candidates) {
    const position = normalizePosition(candidate.position);
    counts[position] = (counts[position] || 0) + 1;
  }
  return counts;
};

export const getCandidatesForPosition = (candidates, position) => {
  return candidates.filter(c => normalizePosition(c.position) === position);
};

export const getWinnerAreaDescription = (position, candidate) => {
  const normalized = normalizePosition(position);
  switch (normalized) {
    case POSITIONS.PRESIDENT: return 'Kenya (National)';
    case POSITIONS.GOVERNOR: return candidate.county || 'Kenya';
    case POSITIONS.SENATOR: return candidate.county || 'Kenya (Senate)';
    case POSITIONS.WOMAN_REPRESENTATIVE: return candidate.county || 'Kenya (Women Rep)';
    case POSITIONS.MEMBER_OF_PARLIAMENT: return candidate.constituency || 'Kenya';
    case POSITIONS.MCA: return candidate.ward || 'Kenya';
    default: return 'National';
  }
};

export const calculateWinnersByPosition = (candidates, voter = null) => {
  const filtered = filterCandidatesForVoter(candidates, voter);
  const winners = {};
  const grouped = {};
  for (const candidate of filtered) {
    const position = normalizePosition(candidate.position);
    if (!grouped[position]) grouped[position] = [];
    grouped[position].push(candidate);
  }
  for (const [position, posCandidates] of Object.entries(grouped)) {
    if (!posCandidates || posCandidates.length === 0) {
      winners[position] = null;
      continue;
    }
    const sorted = [...posCandidates].sort((a, b) => {
      const votesA = Number(a.voteCount || a.votes || 0);
      const votesB = Number(b.voteCount || b.votes || 0);
      return votesB - votesA;
    });
    const topVotes = Number(sorted[0].voteCount || sorted[0].votes || 0);
    const tied = sorted.filter(c => Number(c.voteCount || c.votes || 0) === topVotes).length;
    if (tied > 1 && topVotes > 0) {
      winners[position] = { isTie: true, tiedCandidates: sorted, votes: topVotes };
    } else {
      winners[position] = { isTie: false, winner: sorted[0], votes: topVotes };
    }
  }
  return winners;
};

export const formatCandidateDisplayName = (candidate, candidateIndex = null) => {
  if (!candidate) return 'Candidate';
  const pos = normalizePosition(candidate.position);
  if (pos === POSITIONS.PRESIDENT) {
    if (/^Candidate\s+\d+$/i.test(candidate.name)) {
      return candidate.name;
    }
    const num = candidateIndex !== null ? candidateIndex : (candidate.candidateNumber || candidate.blockchainId || candidate.id || 1);
    return `Candidate ${num}`;
  }
  return candidate.name || `Candidate ${candidate.id || 1}`;
};

const electionFilters = {
  formatCandidateDisplayName,
  normalizeText,
  resolveVoterCountyName,
  normalizePosition,
  getPositionIndex,
  candidateMatchesVoterArea,
  filterCandidatesForVoter,
  groupCandidatesByPosition,
  filterResultsForVoter,
  getPositionCounts,
  getCandidatesForPosition,
  getWinnerAreaDescription,
  calculateWinnersByPosition,
  getPositionDisplayName,
  POSITIONS,
  POSITION_INDEX,
  POSITION_NAMES,
  POSITION_ORDER,
};

export default electionFilters;
