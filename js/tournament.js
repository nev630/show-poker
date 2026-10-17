// tournament.js - 8인 1:1 토너먼트 브래킷 관리 모듈

export function createInitialTournament(playerSlots = []) {
  // 8명의 슬롯 초기화
  const players = Array.from({ length: 8 }, (_, i) => {
    const slot = playerSlots[i];
    if (slot) {
      return {
        score: 0,
        ...slot
      };
    }
    return {
      id: null,
      name: `대기자 ${i + 1}`,
      uid: null,
      score: 0,
      isBot: false,
      isReady: false
    };
  });

  // 7개의 매치 구조 (8강 4경기, 4강 2경기, 결승 1경기)
  const matches = [
    // 8강 (Quarterfinals)
    { id: 'm1', round: '8강 1경기', p1Idx: 0, p2Idx: 1, winnerIdx: null, status: 'ready', matchIndex: 0 },
    { id: 'm2', round: '8강 2경기', p1Idx: 2, p2Idx: 3, winnerIdx: null, status: 'ready', matchIndex: 1 },
    { id: 'm3', round: '8강 3경기', p1Idx: 4, p2Idx: 5, winnerIdx: null, status: 'ready', matchIndex: 2 },
    { id: 'm4', round: '8강 4경기', p1Idx: 6, p2Idx: 7, winnerIdx: null, status: 'ready', matchIndex: 3 },

    // 4강 (Semifinals)
    { id: 'm5', round: '4강 1경기', p1Idx: null, p2Idx: null, winnerIdx: null, status: 'waiting', matchIndex: 4, fromMatches: ['m1', 'm2'] },
    { id: 'm6', round: '4강 2경기', p1Idx: null, p2Idx: null, winnerIdx: null, status: 'waiting', matchIndex: 5, fromMatches: ['m3', 'm4'] },

    // 결승 (Finals)
    { id: 'm7', round: '👑 결승전', p1Idx: null, p2Idx: null, winnerIdx: null, status: 'waiting', matchIndex: 6, fromMatches: ['m5', 'm6'] }
  ];

  return {
    players,
    matches,
    currentMatchIndex: 0,
    status: 'lobby', // 'lobby' | 'ongoing' | 'finished'
    champion: null
  };
}

/**
 * 특정 매치의 승자를 결정하고 브래킷을 전진시킴
 * @param {Object} tournament 
 * @param {number} matchIndex 
 * @param {number} winningPlayerIdx - players 배열의 index
 */
export function advanceTournament(tournament, matchIndex, winningPlayerIdx) {
  const match = tournament.matches[matchIndex];
  if (!match) return tournament;

  match.winnerIdx = winningPlayerIdx;
  match.status = 'finished';

  // 다음 라운드 매치에 승자 배치
  if (matchIndex === 0) {
    tournament.matches[4].p1Idx = winningPlayerIdx;
  } else if (matchIndex === 1) {
    tournament.matches[4].p2Idx = winningPlayerIdx;
  } else if (matchIndex === 2) {
    tournament.matches[5].p1Idx = winningPlayerIdx;
  } else if (matchIndex === 3) {
    tournament.matches[5].p2Idx = winningPlayerIdx;
  } else if (matchIndex === 4) {
    tournament.matches[6].p1Idx = winningPlayerIdx;
  } else if (matchIndex === 5) {
    tournament.matches[6].p2Idx = winningPlayerIdx;
  } else if (matchIndex === 6) {
    // 결승 승자
    tournament.champion = tournament.players[winningPlayerIdx];
    tournament.status = 'finished';
  }

  // 4강, 결승전 매치 준비 상태 갱신
  tournament.matches.forEach(m => {
    if (m.status === 'waiting' && m.p1Idx !== null && m.p2Idx !== null) {
      m.status = 'ready';
    }
  });

  // 다음 진행할 활성 매치 인덱스로 자동 갱신
  const nextActiveIdx = getNextActiveMatchIndex(tournament);
  if (nextActiveIdx !== -1) {
    tournament.currentMatchIndex = nextActiveIdx;
  }

  return tournament;
}

/**
 * 다음 진행할 활성 매치 인덱스를 찾음
 */
export function getNextActiveMatchIndex(tournament) {
  if (!tournament || !Array.isArray(tournament.matches)) return -1;
  for (let i = 0; i < tournament.matches.length; i++) {
    const m = tournament.matches[i];
    if (m && (m.status === 'ongoing' || m.status === 'ready')) {
      return i;
    }
  }
  return -1;
}
