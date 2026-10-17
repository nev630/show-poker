// battle-sim.js - 5장 카드 웹 자체 무력 배틀 시뮬레이터
// 클래시 로얄 친선전을 인게임에서 하지 않고 웹에서 바로 승부를 낼 때 사용할 수 있는 재미있는 시뮬레이터입니다.

import { CARD_MAP } from './cards-data.js';

export function calculateDeckStats(cardIds) {
  let totalPower = 0;
  let totalCost = 0;
  let typeCounts = {
    tank: 0,
    melee: 0,
    ranged: 0,
    flying: 0,
    spell: 0,
    fast: 0,
    swarm: 0,
    building: 0
  };

  cardIds.forEach(id => {
    const card = CARD_MAP[id];
    if (card) {
      totalPower += card.power;
      totalCost += card.cost;
      if (typeCounts[card.type] !== undefined) {
        typeCounts[card.type]++;
      }
    }
  });

  return { totalPower, totalCost, typeCounts };
}

/**
 * 5 vs 5 카드 덱 무력 대결 시뮬레이션
 * @param {Array<string>} deckA - 플레이어 A 카드 ID 목록 (5장)
 * @param {Array<string>} deckB - 플레이어 B 카드 ID 목록 (5장)
 * @param {string} nameA 
 * @param {string} nameB 
 * @returns {Object} { winner: 'A' | 'B', logs: Array<string>, scoreA: number, scoreB: number }
 */
export function simulateBattle(deckA, deckB, nameA = "플레이어 A", nameB = "플레이어 B") {
  const statsA = calculateDeckStats(deckA);
  const statsB = calculateDeckStats(deckB);

  const logs = [];
  logs.push(`⚔️ [친선 결전 시작] ${nameA} vs ${nameB}`);
  logs.push(`📊 기본 무력 합계: ${nameA} (${statsA.totalPower}) vs ${nameB} (${statsB.totalPower})`);

  let scoreA = statsA.totalPower;
  let scoreB = statsB.totalPower;

  // 상성 및 특수 시너지 체크
  // 1. 공중 vs 대공(원거리)
  if (statsA.typeCounts.flying > 0 && statsB.typeCounts.ranged === 0) {
    scoreA += 2;
    logs.push(`🦅 ${nameA}의 공중 유닛이 제공권을 장악하여 무력 +2 보너스!`);
  }
  if (statsB.typeCounts.flying > 0 && statsA.typeCounts.ranged === 0) {
    scoreB += 2;
    logs.push(`🦅 ${nameB}의 공중 유닛이 제공권을 장악하여 무력 +2 보너스!`);
  }

  // 2. 스펠(주문) vs 스웜(물량)
  if (statsA.typeCounts.spell > 0 && statsB.typeCounts.swarm > 0) {
    scoreA += 2;
    logs.push(`💥 ${nameA}의 광역 주문이 ${nameB}의 물량 병력을 소탕! (+2)`);
  }
  if (statsB.typeCounts.spell > 0 && statsA.typeCounts.swarm > 0) {
    scoreB += 2;
    logs.push(`💥 ${nameB}의 광역 주문이 ${nameA}의 물량 병력을 소탕! (+2)`);
  }

  // 3. 탱커 + 딜러 조합 시너지
  if (statsA.typeCounts.tank > 0 && (statsA.typeCounts.ranged > 0 || statsA.typeCounts.fast > 0)) {
    scoreA += 1;
    logs.push(`🛡️ ${nameA}의 탱커-딜러 환상적인 전선 유지! (+1)`);
  }
  if (statsB.typeCounts.tank > 0 && (statsB.typeCounts.ranged > 0 || statsB.typeCounts.fast > 0)) {
    scoreB += 1;
    logs.push(`🛡️ ${nameB}의 탱커-딜러 환상적인 전선 유지! (+1)`);
  }

  // 4. 엘릭서 정제소 장기전 보너스
  if (deckA.includes('elixir_collector')) {
    scoreA += 2;
    logs.push(`⚡ ${nameA}의 엘릭서 정제소 가동으로 무한 엘릭서 펌핑! (+2)`);
  }
  if (deckB.includes('elixir_collector')) {
    scoreB += 2;
    logs.push(`⚡ ${nameB}의 엘릭서 정제소 가동으로 무한 엘릭서 펌핑! (+2)`);
  }

  // 치열한 전투 주사위 (약간의 크리티컬 요소)
  const rollA = Math.floor(Math.random() * 3);
  const rollB = Math.floor(Math.random() * 3);
  scoreA += rollA;
  scoreB += rollB;

  if (rollA > 0) logs.push(`🎲 ${nameA}의 크리티컬 전술 적중! (+${rollA})`);
  if (rollB > 0) logs.push(`🎲 ${nameB}의 크리티컬 전술 적중! (+${rollB})`);

  let winner = 'A';
  if (scoreB > scoreA) {
    winner = 'B';
  } else if (scoreA === scoreB) {
    // 동점일 경우 코스트 효율(평균 코스트가 낮은 쪽) 또는 랜덤
    winner = statsA.totalCost <= statsB.totalCost ? 'A' : 'B';
    logs.push(`⚖️ 동점 상황 발생! 코스트 효율성 판정으로 결정!`);
  }

  const winnerName = winner === 'A' ? nameA : nameB;
  logs.push(`🏆 최종 무력 점수: ${nameA} [${scoreA}] vs [${scoreB}] ${nameB}`);
  logs.push(`🎉 승자: [${winnerName}]!`);

  return {
    winner,
    winnerName,
    scoreA,
    scoreB,
    logs
  };
}
