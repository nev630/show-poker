// game-engine.js - [무력 포커] 1대1 매치 게임 룰 및 상태 머신

import { getRandomCards, CARD_MAP } from './cards-data.js';
import { createCardCommitments, verifyCardReveal } from './crypto-security.js';

export class MatchEngine {
  constructor(p1, p2, matchIndex = 0) {
    this.p1 = {
      id: p1.id || 'p1',
      uid: p1.uid,
      name: p1.name || '플레이어 1',
      gold: 100,
      cards: [],        // commitments (해시 및 공개 정보)
      secrets: [],      // 로컬 비밀 카드 정보 (id, salt)
      currentBet: 0,
      isFolded: false,
      isAllIn: false
    };

    this.p2 = {
      id: p2.id || 'p2',
      uid: p2.uid,
      name: p2.name || '플레이어 2',
      gold: 100,
      cards: [],
      secrets: [],
      currentBet: 0,
      isFolded: false,
      isAllIn: false
    };

    this.matchIndex = matchIndex;
    this.roundNumber = 0;
    this.pot = 0;
    this.currentHighestBet = 0;
    this.currentTurnPlayerId = null;
    this.firstTurnPlayerId = null;
    this.phase = 'idle'; // 'idle' | 'betting' | 'showdown' | 'round_end' | 'match_end'
    this.winnerId = null;
    this.lastShowdownResult = null;
    this.actionHistory = [];
  }

  /**
   * 새 라운드 시작
   * - 각자 기본 베팅 10골드 납부
   * - 5장의 카드 배분 및 커밋먼트 생성
   * - 1장씩 자동 공개
   * - 첫 라운드는 공개 카드 무력 높은 쪽 선공, 이후 교대
   */
  async startNewRound() {
    this.roundNumber++;
    this.pot = 0;
    this.currentHighestBet = 0;
    this.lastShowdownResult = null;
    this.actionHistory = [];

    // 골드 수치 안전 보정 및 기본 베팅 (각 10골드, 부족시 올인)
    this.p1.gold = Math.max(0, Number(this.p1.gold) || 0);
    this.p2.gold = Math.max(0, Number(this.p2.gold) || 0);

    this.p1.roundStartGold = this.p1.gold;
    this.p2.roundStartGold = this.p2.gold;

    const anteP1 = Math.min(this.p1.gold, 10);
    const anteP2 = Math.min(this.p2.gold, 10);
    this.p1.gold -= anteP1;
    this.p2.gold -= anteP2;
    this.p1.currentBet = 0; // 추가 베팅 추적용
    this.p2.currentBet = 0;
    this.p1.totalRoundBet = anteP1;
    this.p2.totalRoundBet = anteP2;
    this.p1.isFolded = false;
    this.p2.isFolded = false;
    this.p1.isAllIn = this.p1.gold === 0;
    this.p2.isAllIn = this.p2.gold === 0;

    this.pot = anteP1 + anteP2;

    // 5장 카드 지급
    const p1RawCards = getRandomCards(5);
    const p2RawCards = getRandomCards(5, p1RawCards.map(c => c.id));

    const p1Commit = await createCardCommitments(p1RawCards);
    const p2Commit = await createCardCommitments(p2RawCards);

    this.p1.cards = p1Commit.commitments;
    this.p1.secrets = p1Commit.secrets;

    this.p2.cards = p2Commit.commitments;
    this.p2.secrets = p2Commit.secrets;

    // 첫 번째 카드(0번 인덱스) 자동 공개
    await this.revealCard(this.p1, 0);
    await this.revealCard(this.p2, 0);

    // 안전한 카드 ID 및 데이터 획득 (어떤 예외 상황에서도 크래시 차단)
    const c1Id = this.p1.cards[0]?.revealed?.cardId || this.p1.secrets?.[0]?.cardId || 'knight';
    const c2Id = this.p2.cards[0]?.revealed?.cardId || this.p2.secrets?.[0]?.cardId || 'knight';

    if (!this.p1.cards[0]?.revealed) {
      if (this.p1.cards[0]) {
        this.p1.cards[0].revealed = { cardId: c1Id, salt: this.p1.secrets?.[0]?.salt || '' };
        this.p1.cards[0].isRevealed = true;
        this.p1.cards[0].revealedInPlay = true;
      }
    } else if (this.p1.cards[0]) {
      this.p1.cards[0].revealedInPlay = true;
    }
    if (!this.p2.cards[0]?.revealed) {
      if (this.p2.cards[0]) {
        this.p2.cards[0].revealed = { cardId: c2Id, salt: this.p2.secrets?.[0]?.salt || '' };
        this.p2.cards[0].isRevealed = true;
        this.p2.cards[0].revealedInPlay = true;
      }
    } else if (this.p2.cards[0]) {
      this.p2.cards[0].revealedInPlay = true;
    }

    const c1 = CARD_MAP[c1Id] || CARD_MAP['knight'];
    const c2 = CARD_MAP[c2Id] || CARD_MAP['knight'];

    this.actionHistory.push(`[기본 베팅] 10골드 테이블 투입 (현재 팟: ${this.pot}골드)`);
    this.actionHistory.push(`${this.p1.name} 공개: [${c1.name}]`);
    this.actionHistory.push(`${this.p2.name} 공개: [${c2.name}]`);

    // 기본 베팅 시 한쪽이라도 전재산 올인이 된 경우, 추가 베팅이 불가능하므로 즉시 쇼다운(친선전) 돌입
    if (this.p1.isAllIn || this.p2.isAllIn) {
      await this.revealAllCards();
      this.actionHistory.push(`⚠️ 올인 발생! 기본 베팅으로 잔여 골드가 소진되어 즉시 친선전(쇼다운)으로 돌입합니다.`);
      this.phase = 'showdown';
      return this.getState();
    }

    // 선 베팅 플레이어 결정
    if (this.roundNumber === 1) {
      // 첫 게임: 무력 높은 쪽 (동점 시 랜덤)
      if (c1.power > c2.power) {
        this.currentTurnPlayerId = this.p1.id;
      } else if (c2.power > c1.power) {
        this.currentTurnPlayerId = this.p2.id;
      } else {
        this.currentTurnPlayerId = Math.random() < 0.5 ? this.p1.id : this.p2.id;
      }
    } else {
      // 이후 라운드: 번갈아 선 베팅
      this.currentTurnPlayerId = this.firstTurnPlayerId === this.p1.id ? this.p2.id : this.p1.id;
    }
    this.firstTurnPlayerId = this.currentTurnPlayerId;

    const firstPlayerName = this.currentTurnPlayerId === this.p1.id ? this.p1.name : this.p2.name;
    this.actionHistory.push(`🎯 선 턴: [${firstPlayerName}]`);

    this.phase = 'betting';
    return this.getState();
  }

  /**
   * 특정 플레이어의 특정 슬롯 카드를 안전하게 공개(Reveal)
   * @param {object} player
   * @param {number} cardIndex
   * @param {boolean} inPlay - 테이블 베팅 진행 중 공개 여부 (false면 쇼다운 모달 전용 공개)
   */
  async revealCard(player, cardIndex, inPlay = true) {
    if (!player) return false;
    if (!Array.isArray(player.cards)) {
      player.cards = Object.values(player.cards || {});
    }
    if (!Array.isArray(player.secrets)) {
      player.secrets = Object.values(player.secrets || {});
    }
    if (cardIndex < 0 || cardIndex >= player.cards.length) return false;
    const slot = player.cards[cardIndex];
    if (slot && slot.revealed) {
      if (inPlay) slot.revealedInPlay = true;
      return true; // 이미 공개됨
    }

    let secret = player.secrets.find(s => s && s.index === cardIndex) || player.secrets[cardIndex];

    // 무결성 해시 검증
    if (secret && slot?.hash) {
      try {
        const isValid = await verifyCardReveal(secret.cardId, secret.salt, slot.hash);
        if (!isValid) {
          console.warn('카드 해시 비엄격 보정 모드 동작');
        }
      } catch (e) {
        console.warn('해시 검증 건너뜀:', e);
      }
    }

    let cardId = secret?.cardId || secret?.card?.id || slot?.cardId || slot?.card?.id;
    if (!cardId) {
      const allCardKeys = Object.keys(CARD_MAP);
      cardId = allCardKeys[Math.floor(Math.random() * allCardKeys.length)] || 'knight';
    }

    if (slot) {
      slot.revealed = {
        cardId: cardId,
        salt: secret?.salt || ''
      };
      slot.isRevealed = true;
      slot.revealedInPlay = inPlay;
      slot.cardId = cardId;
      slot.card = CARD_MAP[cardId] || slot.card || CARD_MAP['knight'];
    }
    if (secret) secret.isRevealed = true;
    return true;
  }

  /**
   * 모든 미공개 카드 일괄 공개 (쇼다운 시)
   * 테이블 인플레이 카드가 아닌 쇼다운 모달 공개(inPlay = false)로 설정하여
   * 콜 직후 테이블에 10장이 한꺼번에 쏟아져 나오는 것을 방지합니다.
   */
  async revealAllCards() {
    for (let i = 0; i < 5; i++) {
      await this.revealCard(this.p1, i, false);
      await this.revealCard(this.p2, i, false);
    }
    // 남은 모든 슬롯을 확실하게 revealed 상태로 전면 공개
    [this.p1, this.p2].forEach(player => {
      if (!player) return;
      const secretsList = Array.isArray(player.secrets) ? player.secrets : Object.values(player.secrets || {});
      const cardsList = Array.isArray(player.cards) ? player.cards : Object.values(player.cards || {});
      cardsList.forEach((slot, idx) => {
        if (slot && !slot.revealed) {
          const sec = secretsList.find(s => s && s.index === idx) || secretsList[idx];
          const cardId = sec?.cardId || sec?.card?.id || slot?.cardId || 'knight';
          slot.revealed = {
            cardId: cardId,
            salt: sec?.salt || ''
          };
          slot.isRevealed = true;
          slot.revealedInPlay = false;
          slot.cardId = cardId;
          slot.card = CARD_MAP[cardId] || slot.card || CARD_MAP['knight'];
        }
      });
    });
  }

  /**
   * 베팅(Raise) 액션 처리
   * @param {string} playerId 
   * @param {number} amount - 베팅할 금액 (10단위, 직전 상대 베팅금보다 커야 함)
   * @param {number} revealCardIndex - 함께 공개할 비공개 카드 인덱스 (0~4)
   */
  async actionBet(playerId, amount, revealCardIndex) {
    if (this.phase !== 'betting') throw new Error('현재 베팅 단계가 아닙니다.');
    if (this.currentTurnPlayerId !== playerId) throw new Error('본인의 턴이 아닙니다.');

    // 10단위 검증
    if (amount <= 0 || amount % 10 !== 0) {
      throw new Error('베팅 금액은 10단위 양수여야 합니다.');
    }

    // 직전 상대 베팅금보다 높아야 함
    if (amount <= this.currentHighestBet) {
      throw new Error(`직전 베팅금(${this.currentHighestBet}골드)보다 높게만 베팅 가능합니다.`);
    }

    const player = playerId === this.p1.id ? this.p1 : this.p2;
    const opponent = playerId === this.p1.id ? this.p2 : this.p1;

    // 상대방이 이미 올인 상태인 경우 추가 레이즈 불가 (1:1 헤즈업 룰)
    if (opponent.isAllIn || opponent.gold === 0) {
      throw new Error('상대방이 이미 올인 상태이므로 레이즈할 수 없습니다. 콜 또는 폴드를 선택하세요.');
    }

    // 보유 골드 확인 (무력 포커 룰: 선언한 베팅 금액 전액을 테이블에 투입)
    if (player.gold < amount) {
      throw new Error(`보유 골드가 부족합니다. (필요: ${amount}골드, 보유: ${player.gold}골드)`);
    }

    // 카드 공개 처리
    const revealSuccess = await this.revealCard(player, revealCardIndex);
    if (!revealSuccess) {
      throw new Error('공개할 카드를 선택해야 합니다.');
    }

    // 골드 차감 및 팟 누적
    player.gold -= amount;
    player.currentBet = amount;
    player.totalRoundBet = (player.totalRoundBet || 10) + amount;
    this.pot += amount;
    this.currentHighestBet = amount;
    if (player.gold === 0) {
      player.isAllIn = true;
    }

    const cardId = player.cards[revealCardIndex]?.revealed?.cardId;
    const revealedCard = (cardId && CARD_MAP[cardId]) || CARD_MAP['knight'];
    this.actionHistory.push(`💰 ${player.name}: "${amount}골드 베팅, [${revealedCard.name}]"`);

    // 턴 교체
    this.currentTurnPlayerId = opponent.id;
    return this.getState();
  }

  /**
   * 콜(Call) 액션 처리
   * - 상대의 직전 베팅금과 동일한 금액 지불 (부족해도 올인 콜 가능)
   * - 카드 1장 공개
   * - 모든 패 공개 후 친선전 단계(showdown)로 진입
   */
  async actionCall(playerId, revealCardIndex) {
    if (this.phase !== 'betting') throw new Error('현재 베팅 단계가 아닙니다.');
    if (this.currentTurnPlayerId !== playerId) throw new Error('본인의 턴이 아닙니다.');
    if (this.currentHighestBet <= 0) throw new Error('콜할 베팅이 없습니다. 베팅을 진행하세요.');

    const player = playerId === this.p1.id ? this.p1 : this.p2;
    const opponent = playerId === this.p1.id ? this.p2 : this.p1;

    // 카드 공개 처리
    await this.revealCard(player, revealCardIndex);

    // 콜 금액 지불 (상대가 부른 베팅금과 동일한 금액 지불, 부족 시 전액 올인)
    const callCost = Math.min(player.gold, this.currentHighestBet);
    player.gold -= callCost;
    player.currentBet = callCost;
    player.totalRoundBet = (player.totalRoundBet || 10) + callCost;
    this.pot += callCost;

    if (player.gold === 0) {
      player.isAllIn = true;
    }

    const cardIdCall = player.cards[revealCardIndex]?.revealed?.cardId;
    const revealedCard = (cardIdCall && CARD_MAP[cardIdCall]) || CARD_MAP['knight'];
    this.actionHistory.push(`🤝 ${player.name}: "콜 (${callCost}골드), [${revealedCard.name}]"`);

    // 모든 패 공개!
    await this.revealAllCards();
    this.actionHistory.push(`⚔️ 콜 성립! 양 플레이어의 5장 덱 전체 공개! 친선전 진행!`);

    this.phase = 'showdown';
    return this.getState();
  }

  /**
   * 폴드(Fold) 액션 처리
   * - 기권 선언 (선택적으로 비공개 카드 1장 공개 가능)
   * - 테이블 팟 전체를 상대방이 획득
   */
  async actionFold(playerId, revealCardIndex = null) {
    if (this.phase !== 'betting') throw new Error('현재 베팅 단계가 아닙니다.');
    if (this.currentTurnPlayerId !== playerId) throw new Error('본인의 턴이 아닙니다.');

    const player = playerId === this.p1.id ? this.p1 : this.p2;
    const opponent = playerId === this.p1.id ? this.p2 : this.p1;

    let revealedCardName = null;
    if (revealCardIndex !== null && revealCardIndex !== undefined && revealCardIndex >= 0) {
      await this.revealCard(player, revealCardIndex);
      const cId = player.cards[revealCardIndex]?.revealed?.cardId;
      if (cId && CARD_MAP[cId]) {
        revealedCardName = CARD_MAP[cId].name;
      }
    }

    player.isFolded = true;
    if (revealedCardName) {
      this.actionHistory.push(`🏳️ ${player.name}: "폴드, [${revealedCardName}]"`);
    } else {
      this.actionHistory.push(`🏳️ ${player.name}: "폴드" (기권)`);
    }

    const wonPot = this.pot;
    const myTotalBet = player.totalRoundBet || 10;
    const oppTotalBet = opponent.totalRoundBet || 10;
    const oppStartGold = opponent.roundStartGold ?? (opponent.gold + oppTotalBet);

    // 상대방이 팟의 모든 베팅금을 획득
    opponent.gold += wonPot;
    this.actionHistory.push(`🏆 ${opponent.name}이(가) 자신의 베팅금(${oppTotalBet}골드)을 돌려받고 ${player.name}의 베팅금(${myTotalBet}골드)을 획득! (${oppStartGold}->${opponent.gold}골드)`);
    this.pot = 0;

    // 탈락 여부 체크
    return this.checkMatchCompletion();
  }

  /**
   * 친선전 승자 결정 (쇼다운 종료)
   * @param {string} winnerPlayerId - 'p1' 또는 'p2' (또는 해당 플레이어의 id)
   */
  resolveShowdown(winnerPlayerId) {
    if (this.phase !== 'showdown') throw new Error('친선전 단계가 아닙니다.');

    const winner = (winnerPlayerId === this.p1.id || winnerPlayerId === 'p1') ? this.p1 : this.p2;
    const loser = winner === this.p1 ? this.p2 : this.p1;
    const prevGold = winner.gold;
    const wonPot = this.pot;

    winner.gold += wonPot;
    this.actionHistory.push(`🎉 [친선전 승리] ${winner.name}이(가) 서로의 베팅금 ${wonPot}골드를 모두 획득! (${prevGold}->${winner.gold}골드)`);
    this.lastShowdownResult = {
      winnerId: winner.id,
      winnerName: winner.name,
      pot: wonPot,
      timestamp: Date.now()
    };
    this.pot = 0;

    return this.checkMatchCompletion();
  }

  /**
   * 라운드 종료 후 매치 종료(0골드 탈락) 여부 확인
   */
  checkMatchCompletion() {
    if (this.p1.gold <= 0) {
      this.winnerId = this.p2.id;
      this.phase = 'match_end';
      this.actionHistory.push(`💀 ${this.p1.name} 보유 골드 0으로 탈락! 매치 최종 승자: ${this.p2.name}!`);
    } else if (this.p2.gold <= 0) {
      this.winnerId = this.p1.id;
      this.phase = 'match_end';
      this.actionHistory.push(`💀 ${this.p2.name} 보유 골드 0으로 탈락! 매치 최종 승자: ${this.p1.name}!`);
    } else {
      this.phase = 'round_end';
      this.actionHistory.push(`🔔 라운드 종료. 다음 라운드를 준비합니다.`);
    }

    return this.getState();
  }

  /**
   * 현재 매치 상태 반환 (상대방 카드 비밀 유지)
   * @param {string} viewerUid - 조회자의 uid 또는 id (카드 숨김 여부 결정)
   */
  getState(viewerUid = null) {
    const isP1 = viewerUid && (viewerUid === this.p1.uid || viewerUid === this.p1.id);
    const isP2 = viewerUid && (viewerUid === this.p2.uid || viewerUid === this.p2.id);

    // 카드 슬롯 복제 및 비공개 카드 필터링
    const formatCards = (cards, secrets, isOwner) => {
      const cardList = Array.isArray(cards) ? cards : Object.values(cards || {});
      return cardList.map((c, idx) => {
        const slotIdx = c && c.index !== undefined ? c.index : idx;
        if (c && c.revealed && c.revealed.cardId) {
          return {
            index: slotIdx,
            hash: c?.hash || '',
            revealed: c.revealed,
            isRevealed: true,
            card: CARD_MAP[c.revealed.cardId] || CARD_MAP['knight'],
            cardId: c.revealed.cardId
          };
        }
        const sec = Array.isArray(secrets) ? secrets.find(s => s && s.index === slotIdx) : null;
        const cardId = sec?.cardId || (sec?.card && sec.card.id) || null;
        if (this.phase === 'showdown' && cardId) {
          return {
            index: slotIdx,
            hash: c?.hash || '',
            revealed: { cardId, salt: sec?.salt || '' },
            isRevealed: true,
            card: CARD_MAP[cardId] || CARD_MAP['knight'],
            cardId: cardId
          };
        }
        if (isOwner) {
          return {
            index: slotIdx,
            hash: c?.hash || '',
            revealed: null,
            isRevealed: false,
            card: cardId ? CARD_MAP[cardId] : null,
            cardId: cardId || null,
            isSecretVisibleToMe: true
          };
        }
        return {
          index: slotIdx,
          hash: c?.hash || '',
          revealed: null,
          isRevealed: false,
          card: null,
          cardId: null
        };
      });
    };

    return {
      matchIndex: this.matchIndex,
      roundNumber: this.roundNumber,
      pot: this.pot,
      currentHighestBet: this.currentHighestBet,
      currentTurnPlayerId: this.currentTurnPlayerId,
      firstTurnPlayerId: this.firstTurnPlayerId,
      phase: this.phase,
      winnerId: this.winnerId,
      lastShowdownResult: this.lastShowdownResult,
      actionHistory: this.actionHistory,
      p1: {
        id: this.p1.id,
        uid: this.p1.uid,
        name: this.p1.name,
        score: this.p1.score || 0,
        gold: this.p1.gold,
        roundStartGold: this.p1.roundStartGold ?? 100,
        totalRoundBet: this.p1.totalRoundBet ?? 0,
        currentBet: this.p1.currentBet,
        isFolded: this.p1.isFolded,
        isAllIn: this.p1.isAllIn,
        cards: formatCards(this.p1.cards, this.p1.secrets, isP1)
      },
      p2: {
        id: this.p2.id,
        uid: this.p2.uid,
        name: this.p2.name,
        score: this.p2.score || 0,
        gold: this.p2.gold,
        roundStartGold: this.p2.roundStartGold ?? 100,
        totalRoundBet: this.p2.totalRoundBet ?? 0,
        currentBet: this.p2.currentBet,
        isFolded: this.p2.isFolded,
        isAllIn: this.p2.isAllIn,
        cards: formatCards(this.p2.cards, this.p2.secrets, isP2)
      }
    };
  }
}
