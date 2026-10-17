// app.js - 무력 포커 메인 컨트롤러 및 UI 바인딩

import { fb, ref, set, get, update, onValue, onDisconnect, runTransaction, getStoredFirebaseConfig, saveFirebaseConfig, clearFirebaseConfig } from './firebase-config.js';
import { MatchEngine } from './game-engine.js';
import { createInitialTournament, advanceTournament, getNextActiveMatchIndex } from './tournament.js';
import { CARDS_DATA, CARD_MAP } from './cards-data.js';
import { sounds } from './sound.js';
import { simulateBattle } from './battle-sim.js';
import { sanitizeInput, escapeHtml } from './crypto-security.js';

// ================= 글로벌 상태 =================
const state = {
  view: 'lobby',           // 'lobby' | 'tournament' | 'duel'
  roomId: null,
  isHost: false,
  isDemo: false,
  myPlayerIndex: null,     // 토너먼트 0~7 슬롯 중 내 위치 (null이면 관전자)
  nickname: sessionStorage.getItem('muryeok_nickname') || '',
  tournament: null,
  activeMatchEngine: null,
  selectedCardToReveal: null,
  pendingAction: null,     // { type: 'bet', amount } | { type: 'call' }
  firebaseUnsub: null,
  privateHandUnsub: null,
  lastDealtRound: parseInt(sessionStorage.getItem('muryeok_last_dealt_round'), 10) || null,
  lastDealtKey: sessionStorage.getItem('muryeok_last_dealt_key') || null,
  dealCountdownInterval: null,
  revealedCardKeys: new Set(),
  selectedCardToPlayIndex: null,
  previousEnginePhase: null,
  activeShowdownKey: null,
  showdownTransitionTimer: null,
  isShowdownAnimating: false,
  showdownAnimTimers: [],
  isBotThinking: false,
  savedMatchSecrets: {},
  myPrivateSecrets: null,
  myPrivateSecretsMatchIndex: null,
  myPrivateSecretsRoundNumber: null,
  lastRenderedDuelRound: null,
  lastRenderedDuelMatch: null,
  botShowdownAutoTimer: null
};

// ================= DOM 엘리먼트 캐싱 =================
const el = {
  // Views
  viewLobby: document.getElementById('view-lobby'),
  viewTournament: document.getElementById('view-tournament'),
  viewDuel: document.getElementById('view-duel'),

  // Header & Global
  roomStatusBadge: document.getElementById('room-status-badge'),
  roomCodeDisplay: document.getElementById('room-code-display'),
  btnCopyLink: document.getElementById('btn-copy-link'),
  btnLeaveRoom: document.getElementById('btn-leave-room'),
  btnRules: document.getElementById('btn-rules'),
  btnSound: document.getElementById('btn-sound'),
  soundIcon: document.getElementById('sound-icon'),
  btnFirebaseSettings: document.getElementById('btn-firebase-settings'),
  firebaseStatusLabel: document.getElementById('firebase-status-label'),

  // Lobby
  inputNickname: document.getElementById('input-nickname'),
  tabJoin: document.getElementById('tab-join'),
  tabCreate: document.getElementById('tab-create'),
  formJoin: document.getElementById('form-join'),
  formCreate: document.getElementById('form-create'),
  inputRoomCode: document.getElementById('input-room-code'),
  inputRoomTitle: document.getElementById('input-room-title'),
  btnActionJoin: document.getElementById('btn-action-join'),
  btnActionCreate: document.getElementById('btn-action-create'),
  btnQuickDemo: document.getElementById('btn-quick-demo'),

  // Tournament
  tourRoomTitle: document.getElementById('tour-room-title'),
  tourStatusPill: document.getElementById('tour-status-pill'),
  hostControls: document.getElementById('host-controls'),
  btnFillBots: document.getElementById('btn-fill-bots'),
  btnManageSlots: document.getElementById('btn-manage-slots'),
  btnShuffleBracket: document.getElementById('btn-shuffle-bracket'),
  btnStartTournament: document.getElementById('btn-start-tournament'),
  bracketRound8: document.getElementById('bracket-round-8'),
  bracketRound4: document.getElementById('bracket-round-4'),
  bracketFinalMatch: document.getElementById('bracket-final-match'),
  championShowcase: document.getElementById('champion-showcase'),
  championName: document.getElementById('champion-name'),

  // Duel
  btnBackToBracket: document.getElementById('btn-back-to-bracket'),
  duelRoundLabel: document.getElementById('duel-round-label'),
  duelLastBet: document.getElementById('duel-last-bet'),
  duelFirstPlayer: document.getElementById('duel-first-player'),
  oppName: document.getElementById('opp-name'),
  oppTurnBadge: document.getElementById('opp-turn-badge'),
  oppGold: document.getElementById('opp-gold'),
  oppCurrentBet: document.getElementById('opp-current-bet'),
  oppHandContainer: document.getElementById('opp-hand-container'),
  oppTableCards: document.getElementById('opp-table-cards'),
  tablePotDisplay: document.getElementById('table-pot-display'),
  tableStatusBanner: document.getElementById('table-status-banner'),
  actionAnnouncementLayer: document.getElementById('action-announcement-layer'),
  meName: document.getElementById('me-name'),
  meGold: document.getElementById('me-gold'),
  meCurrentBet: document.getElementById('me-current-bet'),
  myTurnIndicator: document.getElementById('my-turn-indicator'),
  meTableCards: document.getElementById('me-table-cards'),
  meHandContainer: document.getElementById('me-hand-container'),
  meHandTitle: document.getElementById('me-hand-title'),
  bettingControls: document.getElementById('betting-controls'),
  betSlider: document.getElementById('bet-slider'),
  betSliderVal: document.getElementById('bet-slider-val'),
  btnQuickMin: document.getElementById('btn-quick-min'),
  btnQuick20: document.getElementById('btn-quick-20'),
  btnQuick50: document.getElementById('btn-quick-50'),
  btnQuickAllin: document.getElementById('btn-quick-allin'),
  btnActionFold: document.getElementById('btn-action-fold'),
  btnActionCall: document.getElementById('btn-action-call'),
  btnActionBet: document.getElementById('btn-action-bet'),
  callBtnText: document.getElementById('call-btn-text'),
  betBtnText: document.getElementById('bet-btn-text'),
  duelLogsList: document.getElementById('duel-logs-list'),

  // Modals
  modalDealCards: document.getElementById('modal-deal-cards'),
  dealRoundTitle: document.getElementById('deal-round-title'),
  dealCardsDeckContainer: document.getElementById('deal-cards-deck-container'),
  dealCountdownText: document.getElementById('deal-countdown-text'),
  btnConfirmDeal: document.getElementById('btn-confirm-deal'),

  modalRevealCard: document.getElementById('modal-reveal-card'),
  revealCardOptions: document.getElementById('reveal-card-options'),
  btnCancelReveal: document.getElementById('btn-cancel-reveal'),

  modalShowdown: document.getElementById('modal-showdown'),
  showdownTotalPot: document.getElementById('showdown-total-pot'),
  showdownVsPot: document.getElementById('showdown-vs-pot-val'),
  showdownP1Name: document.getElementById('showdown-p1-name'),
  showdownP1Cards: document.getElementById('showdown-p1-cards'),
  showdownP1Bet: document.getElementById('showdown-p1-bet-val'),
  showdownP2Name: document.getElementById('showdown-p2-name'),
  showdownP2Cards: document.getElementById('showdown-p2-cards'),
  showdownP2Bet: document.getElementById('showdown-p2-bet-val'),
  showdownSideP1Name: document.getElementById('showdown-side-p1-name'),
  showdownSideP1Bet: document.getElementById('showdown-side-p1-bet'),
  showdownSideP2Name: document.getElementById('showdown-side-p2-name'),
  showdownSideP2Bet: document.getElementById('showdown-side-p2-bet'),
  showdownSideReward: document.getElementById('showdown-side-reward'),
  battleSimLogBox: document.getElementById('battle-sim-log-box'),
  btnAutoBattle: document.getElementById('btn-auto-battle'),
  btnWinP1: document.getElementById('btn-win-p1'),
  btnWinP2: document.getElementById('btn-win-p2'),
  btnWinP1Label: document.getElementById('btn-win-p1-label'),
  btnWinP2Label: document.getElementById('btn-win-p2-label'),
  showdownWinnerBanner: document.getElementById('showdown-winner-banner'),
  showdownWinnerBannerText: document.getElementById('showdown-winner-text'),
  btnSpectatorLeaveShowdown: document.getElementById('btn-spectator-leave-showdown'),
  modalMatchWinner: document.getElementById('modal-match-winner'),
  matchWinnerTitle: document.getElementById('match-winner-title'),
  matchWinnerSubtitle: document.getElementById('match-winner-subtitle'),

  modalRules: document.getElementById('modal-rules'),
  btnCloseRules: document.getElementById('btn-close-rules'),

  modalManageSlots: document.getElementById('modal-manage-slots'),
  btnCloseManageSlots: document.getElementById('btn-close-manage-slots'),
  btnDoneManageSlots: document.getElementById('btn-done-manage-slots'),
  manageSlotsList: document.getElementById('manage-slots-list'),

  modalFirebase: document.getElementById('modal-firebase'),
  btnCloseFirebase: document.getElementById('btn-close-firebase'),
  fbApiKey: document.getElementById('fb-api-key'),
  fbDbUrl: document.getElementById('fb-db-url'),
  fbProjectId: document.getElementById('fb-project-id'),
  btnSaveFirebase: document.getElementById('btn-save-firebase'),
  btnResetFirebase: document.getElementById('btn-reset-firebase'),

  // Unit Library (유닛 도감)
  btnCardList: document.getElementById('btn-card-list'),
  btnLobbyCardList: document.getElementById('btn-lobby-card-list'),
  modalCardList: document.getElementById('modal-card-list'),
  btnCloseCardList: document.getElementById('btn-close-card-list'),
  cardListCount: document.getElementById('card-list-count'),
  cardSearchInput: document.getElementById('card-search-input'),
  btnClearSearch: document.getElementById('btn-clear-search'),
  cardRarityFilters: document.getElementById('card-rarity-filters'),
  cardListGrid: document.getElementById('card-list-grid'),
  cardListEmpty: document.getElementById('card-list-empty'),

  // Unit Detail Modal (유닛 상세 정보)
  modalCardDetail: document.getElementById('modal-card-detail'),
  btnCloseCardDetail: document.getElementById('btn-close-card-detail'),
  btnConfirmCardDetail: document.getElementById('btn-confirm-card-detail'),
  cardDetailTitle: document.getElementById('card-detail-title'),
  cardDetailPreviewContainer: document.getElementById('card-detail-preview-container'),
  cardDetailId: document.getElementById('card-detail-id'),
  cardDetailName: document.getElementById('card-detail-name'),
  cardDetailTags: document.getElementById('card-detail-tags'),
  cardDetailDesc: document.getElementById('card-detail-desc')
};

// ================= 초기화 =================
async function initApp() {
  // 이전 버전의 localStorage 잔여 닉네임 완전 파기 (사이트를 껐다 켜면 닉네임 초기화)
  try {
    localStorage.removeItem('muryeok_nickname');
  } catch (e) {}

  if (el.inputNickname) {
    const sessionNick = sessionStorage.getItem('muryeok_nickname') || '';
    el.inputNickname.value = sessionNick;
    state.nickname = sessionNick;
  }

  // URL 파라미터 파싱 (?room=XXXX) 또는 세션 저장소에서 방 코드 복원 (새로고침 시 진행 중 방 유지)
  const urlParams = new URLSearchParams(window.location.search);
  const roomParam = (urlParams.get('room') || sessionStorage.getItem('muryeok_room_id') || '').trim().toUpperCase();

  if (roomParam && el.inputRoomCode) {
    el.inputRoomCode.value = roomParam;
    state.roomId = roomParam;
  }

  // Firebase 연결 시도
  const fbConfig = getStoredFirebaseConfig();
  if (fbConfig) {
    try {
      await fb.init(fbConfig);
      updateFirebaseStatusBadge(true);
    } catch (e) {
      console.warn('Firebase 자동 연결 실패:', e);
      updateFirebaseStatusBadge(false);
    }
  } else {
    updateFirebaseStatusBadge(false);
  }

  bindEvents();
  lucide.createIcons();
  startBackgroundCardImageWarmup();

  // 방 코드 복원 및 자동 재입장 시도
  if (roomParam) {
    if (roomParam === 'DEMO') {
      restoreDemoSession();
    } else if (fb.isInitialized) {
      const newUrl = new URL(window.location.href);
      if (newUrl.searchParams.get('room') !== roomParam) {
        newUrl.searchParams.set('room', roomParam);
        window.history.replaceState(null, '', newUrl.toString());
      }
      setTimeout(() => {
        handleJoinRoom();
      }, 150);
    }
  }
}

function updateFirebaseStatusBadge(connected) {
  if (!el.firebaseStatusLabel) return;
  if (connected) {
    el.firebaseStatusLabel.textContent = 'Firebase 연결됨';
    el.firebaseStatusLabel.classList.add('text-emerald-400');
  } else {
    el.firebaseStatusLabel.textContent = '데모 / 미연결';
    el.firebaseStatusLabel.classList.remove('text-emerald-400');
  }
}

// ================= 이벤트 리스너 바인딩 =================
function bindEvents() {
  // 사운드 토글
  el.btnSound.addEventListener('click', () => {
    const isMuted = sounds.toggleMute();
    el.soundIcon.setAttribute('data-lucide', isMuted ? 'volume-x' : 'volume-2');
    el.soundIcon.className = `w-4 h-4 ${isMuted ? 'text-slate-500' : 'text-emerald-400'}`;
    lucide.createIcons();
  });

  // 규칙 모달
  el.btnRules.addEventListener('click', () => el.modalRules.classList.remove('hidden'));
  el.btnCloseRules.addEventListener('click', () => el.modalRules.classList.add('hidden'));

  // 유닛 도감 모달
  if (el.btnCardList) el.btnCardList.addEventListener('click', openCardListModal);
  if (el.btnLobbyCardList) el.btnLobbyCardList.addEventListener('click', openCardListModal);
  if (el.btnCloseCardList) el.btnCloseCardList.addEventListener('click', closeCardListModal);
  if (el.modalCardList) {
    el.modalCardList.addEventListener('click', (e) => {
      if (e.target === el.modalCardList) closeCardListModal();
    });
  }

  // 유닛 검색창
  if (el.cardSearchInput) {
    el.cardSearchInput.addEventListener('input', (e) => {
      cardCollectionFilter.search = e.target.value;
      if (el.btnClearSearch) {
        el.btnClearSearch.classList.toggle('hidden', !e.target.value);
      }
      renderCardList();
    });
  }
  if (el.btnClearSearch) {
    el.btnClearSearch.addEventListener('click', () => {
      if (el.cardSearchInput) el.cardSearchInput.value = '';
      cardCollectionFilter.search = '';
      el.btnClearSearch.classList.add('hidden');
      renderCardList();
      if (el.cardSearchInput) el.cardSearchInput.focus();
    });
  }

  // 희귀도 필터
  if (el.cardRarityFilters) {
    el.cardRarityFilters.addEventListener('click', (e) => {
      const btn = e.target.closest('.card-filter-btn');
      if (!btn) return;
      const rarity = btn.dataset.rarity;
      if (!rarity) return;

      el.cardRarityFilters.querySelectorAll('.card-filter-btn').forEach(b => {
        b.classList.remove('active');
      });
      btn.classList.add('active');

      cardCollectionFilter.rarity = rarity;
      renderCardList();
    });
  }

  // 유닛 상세 모달
  if (el.btnCloseCardDetail) el.btnCloseCardDetail.addEventListener('click', closeCardDetailModal);
  if (el.btnConfirmCardDetail) el.btnConfirmCardDetail.addEventListener('click', closeCardDetailModal);
  if (el.modalCardDetail) {
    el.modalCardDetail.addEventListener('click', (e) => {
      if (e.target === el.modalCardDetail) closeCardDetailModal();
    });
  }

  // 참가자 / 자리 관리 모달
  if (el.btnManageSlots) el.btnManageSlots.addEventListener('click', openManageSlotsModal);
  if (el.btnCloseManageSlots) el.btnCloseManageSlots.addEventListener('click', closeManageSlotsModal);
  if (el.btnDoneManageSlots) el.btnDoneManageSlots.addEventListener('click', closeManageSlotsModal);
  if (el.modalManageSlots) {
    el.modalManageSlots.addEventListener('click', (e) => {
      if (e.target === el.modalManageSlots) closeManageSlotsModal();
    });
  }

  // ESC 단축키
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (el.modalCardDetail && !el.modalCardDetail.classList.contains('hidden')) {
        closeCardDetailModal();
      } else if (el.modalCardList && !el.modalCardList.classList.contains('hidden')) {
        closeCardListModal();
      } else if (el.modalManageSlots && !el.modalManageSlots.classList.contains('hidden')) {
        closeManageSlotsModal();
      } else if (el.modalRules && !el.modalRules.classList.contains('hidden')) {
        el.modalRules.classList.add('hidden');
      } else if (el.modalFirebase && !el.modalFirebase.classList.contains('hidden')) {
        el.modalFirebase.classList.add('hidden');
      }
    }
  });

  // Firebase 모달
  if (el.btnFirebaseSettings) {
    el.btnFirebaseSettings.addEventListener('click', () => {
      const cfg = getStoredFirebaseConfig() || {};
      el.fbApiKey.value = cfg.apiKey || '';
      el.fbDbUrl.value = cfg.databaseURL || '';
      el.fbProjectId.value = cfg.projectId || '';
      el.modalFirebase.classList.remove('hidden');
    });
  }
  if (el.btnCloseFirebase) {
    el.btnCloseFirebase.addEventListener('click', () => el.modalFirebase.classList.add('hidden'));
  }

  el.btnSaveFirebase.addEventListener('click', async () => {
    const config = {
      apiKey: el.fbApiKey.value.trim(),
      databaseURL: el.fbDbUrl.value.trim(),
      projectId: el.fbProjectId.value.trim()
    };
    if (!config.apiKey || !config.databaseURL) {
      alert('API Key와 Database URL을 입력해주세요.');
      return;
    }
    saveFirebaseConfig(config);
    try {
      await fb.init(config);
      updateFirebaseStatusBadge(true);
      el.modalFirebase.classList.add('hidden');
      alert('Firebase 연결 성공!');
    } catch (err) {
      alert('Firebase 연결 실패: ' + err.message);
    }
  });

  el.btnResetFirebase.addEventListener('click', () => {
    if (confirm('Firebase 설정을 초기화하시겠습니까?')) {
      clearFirebaseConfig();
      updateFirebaseStatusBadge(false);
      el.modalFirebase.classList.add('hidden');
    }
  });

  // 초대 링크 복사
  el.btnCopyLink.addEventListener('click', () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?room=${state.roomId}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert(`초대 링크가 복사되었습니다!\n${shareUrl}`);
    });
  });

  // 로비 탭 전환
  el.tabJoin.addEventListener('click', () => {
    el.tabJoin.className = 'py-2 text-xs font-bold rounded-lg transition bg-amber-500 text-slate-950 shadow';
    el.tabCreate.className = 'py-2 text-xs font-bold rounded-lg transition text-slate-400 hover:text-white';
    el.formJoin.classList.remove('hidden');
    el.formCreate.classList.add('hidden');
  });

  el.tabCreate.addEventListener('click', () => {
    el.tabCreate.className = 'py-2 text-xs font-bold rounded-lg transition bg-amber-500 text-slate-950 shadow';
    el.tabJoin.className = 'py-2 text-xs font-bold rounded-lg transition text-slate-400 hover:text-white';
    el.formCreate.classList.remove('hidden');
    el.formJoin.classList.add('hidden');
  });

  // 방 참가 버튼 및 엔터키
  el.btnActionJoin.addEventListener('click', handleJoinRoom);
  el.inputRoomCode.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleJoinRoom();
  });

  // 방 생성 버튼 및 엔터키
  el.btnActionCreate.addEventListener('click', handleCreateRoom);
  el.inputRoomTitle.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleCreateRoom();
  });

  // 로컬 데모 모드 시작 버튼 (제거 시 안전 가드)
  if (el.btnQuickDemo) {
    el.btnQuickDemo.addEventListener('click', handleStartDemo);
  }

  // 호스트 토너먼트 컨트롤
  el.btnFillBots.addEventListener('click', handleFillBots);
  el.btnShuffleBracket.addEventListener('click', handleShuffleBracket);
  el.btnStartTournament.addEventListener('click', handleStartTournament);

  // 대진표 복귀
  el.btnBackToBracket.addEventListener('click', () => showView('tournament'));

  // 베팅 슬라이더
  el.betSlider.addEventListener('input', (e) => {
    el.betSliderVal.textContent = `${e.target.value} G`;
    el.betBtnText.textContent = `베팅 (${e.target.value}G)`;
  });

  // 베팅 퀵버튼 (올인 버튼 등)
  if (el.btnQuickMin) el.btnQuickMin.addEventListener('click', () => adjustBetBy(10));
  if (el.btnQuick20) el.btnQuick20.addEventListener('click', () => adjustBetBy(20));
  if (el.btnQuick50) el.btnQuick50.addEventListener('click', () => adjustBetBy(50));
  if (el.btnQuickAllin) el.btnQuickAllin.addEventListener('click', setAllInBet);

  // 1:1 대결 액션 버튼
  el.btnActionBet.addEventListener('click', () => {
    triggerButtonFeedback(el.btnActionBet);
    promptBetAction();
  });
  el.btnActionCall.addEventListener('click', () => {
    triggerButtonFeedback(el.btnActionCall);
    promptCallAction();
  });
  el.btnActionFold.addEventListener('click', () => {
    triggerButtonFeedback(el.btnActionFold);
    handleFoldAction();
  });

  // 카드 공개 팝업 취소
  el.btnCancelReveal.addEventListener('click', () => el.modalRevealCard.classList.add('hidden'));

  // 쇼다운(친선전) 모달 승자 판정
  el.btnWinP1.addEventListener('click', () => resolveShowdownWinner('p1'));
  el.btnWinP2.addEventListener('click', () => resolveShowdownWinner('p2'));
  if (el.btnAutoBattle) {
    el.btnAutoBattle.addEventListener('click', handleAutoBattleSimulation);
  }
  if (el.btnSpectatorLeaveShowdown) {
    el.btnSpectatorLeaveShowdown.addEventListener('click', () => {
      closeShowdownModalInstantly();
      showView('tournament');
      renderTournamentView();
    });
  }

  // 방 나가기
  if (el.btnLeaveRoom) {
    el.btnLeaveRoom.addEventListener('click', async () => {
      const msg = state.isHost 
        ? '방장(호스트)이 방을 나가면 현재 방이 완전히 삭제되고 모든 참가자가 로비로 자동 퇴장됩니다.\n정말 방을 나가시겠습니까?' 
        : '현재 방을 나가고 로비로 돌아가시겠습니까?';
      if (confirm(msg)) {
        await leaveCurrentRoom(true);
      }
    });
  }

  // 5장 덱 지급 모달 닫기
  if (el.btnConfirmDeal) {
    el.btnConfirmDeal.addEventListener('click', closeDealCardsModal);
  }

  // 빈 공간 클릭 시 손패 카드 포커싱 해제
  document.addEventListener('click', (e) => {
    if (e.target.closest('.hand-card-wrapper') || e.target.closest('#betting-controls') || e.target.closest('.modal-container') || e.target.closest('.btn-action-3d')) {
      return;
    }
    deselectFocusedCard();
  });
}

// ================= 손패 카드 포커싱 해제 헬퍼 =================
function deselectFocusedCard() {
  if (state.selectedCardToPlayIndex !== null) {
    state.selectedCardToPlayIndex = null;
    document.querySelectorAll('.hand-card-wrapper.hand-card-selected').forEach(w => {
      w.classList.remove('hand-card-selected');
    });
  }
}

// ================= 뷰 전환 =================
function showView(viewName) {
  state.view = viewName;
  el.viewLobby.classList.add('hidden');
  el.viewTournament.classList.add('hidden');
  el.viewDuel.classList.add('hidden');

  // 대결(duel) 화면을 벗어날 때는 쇼다운 결전 모달 및 매치 승리 축하창을 즉시 완전히 정리
  if (viewName !== 'duel') {
    closeShowdownModalInstantly();
    hideMatchWinnerCelebration();
  }

  if (viewName === 'lobby') {
    el.viewLobby.classList.remove('hidden');
    el.roomStatusBadge.classList.add('hidden');
    sessionStorage.removeItem('muryeok_current_view');
  } else if (viewName === 'tournament') {
    el.viewTournament.classList.remove('hidden');
    el.roomStatusBadge.classList.remove('hidden');
    el.roomStatusBadge.classList.add('flex');
    sessionStorage.setItem('muryeok_current_view', 'tournament');
    renderTournamentView();
  } else if (viewName === 'duel') {
    el.viewDuel.classList.remove('hidden');
    el.roomStatusBadge.classList.remove('hidden');
    el.roomStatusBadge.classList.add('flex');
    sessionStorage.setItem('muryeok_current_view', 'duel');
    renderDuelView();
  }
  lucide.createIcons();
}

function getNickname() {
  const inputVal = el.inputNickname.value.trim();
  const stored = sessionStorage.getItem('muryeok_nickname');
  const name = sanitizeInput(inputVal || stored) || '도전자_' + Math.floor(Math.random() * 900 + 100);
  state.nickname = name;
  sessionStorage.setItem('muryeok_nickname', name);
  try {
    localStorage.removeItem('muryeok_nickname');
  } catch (e) {}
  return name;
}

async function leaveCurrentRoom(isExplicitLeave = true) {
  const currentRoomId = state.roomId;
  const wasHost = state.isHost;
  const isOnline = !state.isDemo && fb.isInitialized && currentRoomId;

  // 1. 등록된 모든 타이머 / 인터벌 정리
  if (state.participantShowdownCloseTimer) {
    clearTimeout(state.participantShowdownCloseTimer);
    state.participantShowdownCloseTimer = null;
  }
  if (state.dealCountdownInterval) {
    clearInterval(state.dealCountdownInterval);
    state.dealCountdownInterval = null;
  }
  if (state.showdownTransitionTimer) {
    clearTimeout(state.showdownTransitionTimer);
    state.showdownTransitionTimer = null;
  }
  if (roundTransitionTimeout) {
    clearTimeout(roundTransitionTimeout);
    roundTransitionTimeout = null;
  }
  if (state.showdownAnimTimers && state.showdownAnimTimers.length) {
    state.showdownAnimTimers.forEach(t => clearTimeout(t));
    state.showdownAnimTimers = [];
  }
  state.isStartingNextRound = false;
  state.isResolvingShowdown = false;
  state.isMatchEnding = false;
  state.isShowdownAnimating = false;

  // 2. 모든 열린 모달 닫기
  if (el.modalDealCards) el.modalDealCards.classList.add('hidden');
  if (el.modalRevealCard) el.modalRevealCard.classList.add('hidden');
  closeShowdownModalInstantly();
  hideMatchWinnerCelebration();
  closeCardDetailModal();
  closeCardListModal();
  if (el.modalRules) el.modalRules.classList.add('hidden');
  if (el.modalManageSlots) el.modalManageSlots.classList.add('hidden');
  if (el.modalFirebase) el.modalFirebase.classList.add('hidden');

  // 3. 리스너 해제
  if (state.firebaseUnsub) {
    try { state.firebaseUnsub(); } catch (e) {}
    state.firebaseUnsub = null;
  }
  if (state.privateHandUnsub) {
    try { state.privateHandUnsub(); } catch (e) {}
    state.privateHandUnsub = null;
  }

  // 4. Firebase 방 삭제 혹은 참가자 슬롯 비우기 (사용자가 직접 나가는 경우)
  if (isExplicitLeave && isOnline) {
    try {
      const roomRef = ref(fb.db, `rooms/${currentRoomId}`);
      if (wasHost) {
        try { onDisconnect(roomRef).cancel(); } catch (e) {}
        await set(roomRef, null);
        console.log(`[호스트 퇴장] 방 [${currentRoomId}] 완전 삭제 완료`);
      } else if (state.myPlayerIndex !== null) {
        try {
          const slotRef = ref(fb.db, `rooms/${currentRoomId}/tournament/players/${state.myPlayerIndex}`);
          await set(slotRef, { name: '', elo: 0, uid: '', isReady: false, chips: 1000 });
          console.log(`[참가자 퇴장] 슬롯 ${state.myPlayerIndex + 1} 비우기 완료`);
        } catch (e) {
          console.warn('참가자 슬롯 초기화 실패:', e);
        }
      }
    } catch (err) {
      console.warn('방 나가기 Firebase 동기화 오류:', err);
    }
  }

  // 5. 로컬 상태 초기화
  state.roomId = null;
  state.isHost = false;
  state.isDemo = false;
  state.tournament = null;
  state.activeMatchEngine = null;
  state.myPlayerIndex = null;
  state.myPrivateSecrets = null;
  state.myPrivateSecretsMatchIndex = null;
  state.myPrivateSecretsRoundNumber = null;
  state.lastDealtKey = null;
  state.lastDealtRound = null;
  state.lastRenderedDuelRound = null;
  state.lastRenderedDuelMatch = null;
  state.savedMatchSecrets = {};
  state.revealedCardKeys.clear();
  state.selectedCardToReveal = null;
  state.selectedCardToPlayIndex = null;
  state.pendingAction = null;
  state.activeShowdownKey = null;

  // 6. 세션 스토리지 정리
  sessionStorage.removeItem('muryeok_room_id');
  sessionStorage.removeItem('muryeok_current_view');
  sessionStorage.removeItem('muryeok_is_host');
  sessionStorage.removeItem('muryeok_last_dealt_round');
  sessionStorage.removeItem('muryeok_last_dealt_key');
  sessionStorage.removeItem('muryeok_demo_state');

  // 7. URL 파라미터 정리 및 로비 뷰 표시
  window.history.replaceState(null, '', window.location.pathname);
  showView('lobby');
}

function saveDemoState() {
  if (!state.isDemo) return;
  try {
    const payload = {
      tournament: state.tournament,
      matchIndex: state.activeMatchEngine?.matchIndex,
      roundNumber: state.activeMatchEngine?.roundNumber,
      pot: state.activeMatchEngine?.pot,
      currentHighestBet: state.activeMatchEngine?.currentHighestBet,
      currentTurnPlayerId: state.activeMatchEngine?.currentTurnPlayerId,
      firstTurnPlayerId: state.activeMatchEngine?.firstTurnPlayerId,
      phase: state.activeMatchEngine?.phase,
      winnerId: state.activeMatchEngine?.winnerId,
      actionHistory: state.activeMatchEngine?.actionHistory,
      p1: state.activeMatchEngine?.p1,
      p2: state.activeMatchEngine?.p2,
      myPlayerIndex: state.myPlayerIndex,
      view: state.view
    };
    sessionStorage.setItem('muryeok_demo_state', JSON.stringify(payload));
  } catch (e) {
    console.warn('데모 상태 저장 오류:', e);
  }
}

function restoreDemoSession() {
  const rawDemo = sessionStorage.getItem('muryeok_demo_state');
  if (rawDemo) {
    try {
      const d = JSON.parse(rawDemo);
      state.isDemo = true;
      state.isHost = true;
      state.roomId = 'DEMO';
      state.tournament = d.tournament;
      state.myPlayerIndex = d.myPlayerIndex ?? 0;
      el.roomCodeDisplay.textContent = 'DEMO';
      el.tourRoomTitle.textContent = '로컬 시뮬레이션 토너먼트';

      if (d.roundNumber && d.roundNumber > 0) {
        const match = state.tournament?.matches?.[d.matchIndex || 0];
        const p1 = state.tournament.players[match.p1Idx];
        const p2 = state.tournament.players[match.p2Idx];
        state.activeMatchEngine = new MatchEngine(p1, p2, d.matchIndex || 0);
        state.activeMatchEngine.roundNumber = d.roundNumber;
        state.activeMatchEngine.pot = d.pot;
        state.activeMatchEngine.currentHighestBet = d.currentHighestBet;
        state.activeMatchEngine.currentTurnPlayerId = d.currentTurnPlayerId;
        state.activeMatchEngine.firstTurnPlayerId = d.firstTurnPlayerId;
        state.activeMatchEngine.phase = d.phase;
        state.activeMatchEngine.winnerId = d.winnerId;
        state.activeMatchEngine.actionHistory = d.actionHistory || [];
        state.activeMatchEngine.p1 = d.p1;
        state.activeMatchEngine.p2 = d.p2;
      }

      const savedView = sessionStorage.getItem('muryeok_current_view') || d.view || 'tournament';
      showView(savedView);
      if (savedView === 'duel') {
        renderDuelView();
        if (d.phase === 'round_end' || d.phase === 'match_end') {
          checkNextRoundOrMatchEnd();
        }
      } else {
        renderTournamentView();
      }
      return;
    } catch (e) {
      console.warn('데모 세션 복원 실패:', e);
    }
  }
  handleStartDemo();
}

async function handleCreateRoom() {
  const name = getNickname();
  const title = sanitizeInput(el.inputRoomTitle.value.trim()) || `${name}의 무력 포커`;
  const code = Math.random().toString(36).substring(2, 6).toUpperCase();

  state.roomId = code;
  state.isHost = true;
  sessionStorage.setItem('muryeok_room_id', code);
  sessionStorage.setItem('muryeok_is_host', 'true');
  const newUrl = new URL(window.location.href);
  newUrl.searchParams.set('room', code);
  window.history.replaceState(null, '', newUrl.toString());

  el.roomCodeDisplay.textContent = code;
  el.tourRoomTitle.textContent = title;

  // Firebase 연결 여부 확인
  if (fb.isInitialized) {
    state.isDemo = false;
    // 호스트는 플레이어가 아닌 주최자/관전자이므로 8개 슬롯 모두 참가자용으로 비워둠!
    const initialTour = createInitialTournament([]);
    state.tournament = initialTour;
    state.myPlayerIndex = null;

    try {
      const roomRef = ref(fb.db, `rooms/${code}`);
      await set(roomRef, {
        metadata: {
          hostUid: fb.getUid(),
          hostName: name,
          title: title,
          createdAt: Date.now()
        },
        tournament: initialTour
      });

      // 호스트 비정상 접속 종료 시(창 닫기 등) 방 자동 삭제 등록
      try {
        onDisconnect(roomRef).remove();
      } catch (discErr) {
        console.warn('onDisconnect 등록 실패:', discErr);
      }

      listenToFirebaseRoom(code);
      showView('tournament');
    } catch (err) {
      console.error('방 생성 Firebase 동기화 실패:', err);
      const switchLocal = confirm(`Firebase 서버에 방 생성을 완료하지 못했습니다.\n(원인: ${err.message || 'Permission Denied / 네트워크'})\n\nFirebase 콘솔의 Realtime Database 규칙을 확인해주세요.\n\n지금 바로 오프라인/로컬 토너먼트로 시작하시겠습니까?`);
      if (switchLocal) {
        state.isDemo = true;
        const localTour = createInitialTournament([]);
        state.tournament = localTour;
        state.myPlayerIndex = null;
        saveDemoState();
        showView('tournament');
      }
    }
  } else {
    // 오프라인 / 로컬 모드
    state.isDemo = true;
    const initialTour = createInitialTournament([]);
    state.tournament = initialTour;
    state.myPlayerIndex = null;
    saveDemoState();
    showView('tournament');
  }
}

async function handleJoinRoom() {
  const code = (el.inputRoomCode.value.trim() || state.roomId || '').toUpperCase();
  if (!code) {
    alert('방 코드를 입력해주세요.');
    el.inputRoomCode.focus();
    return;
  }

  const name = getNickname();
  state.roomId = code;
  sessionStorage.setItem('muryeok_room_id', code);
  const newUrl = new URL(window.location.href);
  newUrl.searchParams.set('room', code);
  window.history.replaceState(null, '', newUrl.toString());

  el.roomCodeDisplay.textContent = code;

  if (fb.isInitialized) {
    state.isDemo = false;
    const btn = el.btnActionJoin;
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i><span>방 입장 중...</span>`;
    lucide.createIcons();

    // 타임아웃 가드 (6초 후 복구)
    setTimeout(() => {
      if (state.view === 'lobby' && btn) {
        btn.disabled = false;
        btn.innerHTML = originalText;
        lucide.createIcons();
      }
    }, 6000);

    try {
      listenToFirebaseRoom(code);
    } catch (err) {
      btn.disabled = false;
      btn.innerHTML = originalText;
      lucide.createIcons();
      alert('방 입장 중 오류가 발생했습니다: ' + err.message);
    }
  } else {
    alert('Firebase가 아직 설정되지 않았습니다. [로컬 시뮬레이션 모드]로 시작하거나 상단 Firebase 설정을 완료해주세요.');
  }
}

function handleStartDemo() {
  const name = getNickname();
  state.roomId = 'DEMO';
  state.isHost = true;
  state.isDemo = true;
  sessionStorage.setItem('muryeok_room_id', 'DEMO');
  const newUrl = new URL(window.location.href);
  newUrl.searchParams.set('room', 'DEMO');
  window.history.replaceState(null, '', newUrl.toString());

  el.roomCodeDisplay.textContent = 'DEMO';
  el.tourRoomTitle.textContent = '로컬 시뮬레이션 토너먼트';

  // 1명 본인 + 7명의 AI 봇 자동 생성
  const botNames = ['광기의 해골', '골렘 마스터', '발키리 여왕', '나무꾼 잭', '화염 마법사', '호그 장인', '페카 학살자'];
  const players = [
    { id: 'p1', name: name, uid: 'local_me', isBot: false, isReady: true }
  ];
  for (let i = 0; i < 7; i++) {
    players.push({
      id: `bot_${i + 1}`,
      name: botNames[i],
      uid: `bot_uid_${i + 1}`,
      isBot: true,
      isReady: true
    });
  }

  state.tournament = createInitialTournament(players);
  state.myPlayerIndex = 0;
  saveDemoState();
  showView('tournament');
}

// ================= AI 봇 판별 헬퍼 =================
function isPlayerBot(playerSlot, playerState) {
  if (!playerSlot && !playerState) return false;
  return Boolean(
    playerSlot?.isBot ||
    playerSlot?.uid?.startsWith('bot_') ||
    playerSlot?.id?.startsWith('bot_') ||
    playerState?.isBot ||
    playerState?.uid?.startsWith('bot_') ||
    playerState?.id?.startsWith('bot_')
  );
}

// ================= 카드 상태 파싱 헬퍼 (공개/비공개 및 본인 카드 복원) =================
function parsePlayerCards(cards, secrets, isOwner) {
  const cardList = Array.isArray(cards) ? cards : Object.values(cards || {});
  const secretsList = Array.isArray(secrets) ? secrets : Object.values(secrets || {});
  return cardList.map((c, i) => {
    const slotIdx = (c && c.index !== undefined) ? c.index : i;
    const isRevealed = !!(c && c.revealed && c.revealed.cardId);
    let cardId = null;
    if (isRevealed) {
      cardId = c.revealed.cardId;
    } else if (isOwner && secretsList.length > 0) {
      const sec = secretsList.find(s => s && s.index === slotIdx);
      cardId = sec?.cardId || sec?.card?.id || null;
    }
    return {
      index: slotIdx,
      hash: c?.hash || '',
      isRevealed: isRevealed,
      revealedInPlay: c?.revealedInPlay !== undefined ? !!c.revealedInPlay : isRevealed,
      revealed: c?.revealed || null,
      cardId: cardId,
      card: (cardId && CARD_MAP[cardId]) ? CARD_MAP[cardId] : null
    };
  });
}

// ================= Firebase 실시간 동기화 =================
function listenToFirebaseRoom(roomId) {
  if (state.firebaseUnsub) {
    state.firebaseUnsub();
  }
  if (state.privateHandUnsub) {
    state.privateHandUnsub();
  }

  const roomRef = ref(fb.db, `rooms/${roomId}`);
  state.firebaseUnsub = onValue(roomRef, async (snapshot) => {
    // 버튼 상태 복구
    if (el.btnActionJoin) {
      el.btnActionJoin.disabled = false;
      el.btnActionJoin.innerHTML = `<i data-lucide="log-in" class="w-5 h-5"></i><span>방 입장하기</span>`;
      lucide.createIcons();
    }

    const data = snapshot.val();
    if (!data || data.metadata?.status === 'closed') {
      const wasInRoom = state.view !== 'lobby';
      const wasHost = state.isHost;
      await leaveCurrentRoom(false);
      if (wasInRoom && !wasHost) {
        alert('방장(호스트)이 방을 나가서 방이 자동으로 종료되었습니다.\n로비로 이동합니다.');
      } else if (!wasInRoom && !wasHost) {
        alert(`방 코드 [${roomId}]를 찾을 수 없거나 이미 종료된 방입니다.\n방 코드를 다시 확인해주세요.`);
      }
      return;
    }

    state.tournament = data.tournament;
    el.tourRoomTitle.textContent = data.metadata?.title || '무력 포커 아레나';
    state.isHost = (data.metadata?.hostUid === fb.getUid()) || (sessionStorage.getItem('muryeok_is_host') === 'true');

    // 호스트의 경우 연결 유지 중 disconnect 시 방 자동 삭제 재등록
    if (state.isHost) {
      try {
        onDisconnect(roomRef).remove();
      } catch (e) {}
    }

    // 내 슬롯 위치 확인
    const myUid = fb.getUid();
    const prevPlayerIndex = state.myPlayerIndex;
    state.myPlayerIndex = state.tournament.players.findIndex(p => p && p.uid === myUid);
    if (state.myPlayerIndex === -1) state.myPlayerIndex = null; // 아직 슬롯 미할당

    // 방장에 의해 슬롯에서 추방된 경우 감지 (이전에 슬롯에 등록되어 있었는데 호스트가 uid를 제거한 경우)
    if (!state.isHost && prevPlayerIndex !== null && state.myPlayerIndex === null) {
      alert('방장(호스트)에 의해 토너먼트에서 퇴장(추방)되었습니다.\n로비로 이동합니다.');
      await leaveCurrentRoom(false);
      return;
    }

    // 참가자가 방에 처음 들어왔고 아직 슬롯에 등록되지 않았다면, 비어있는 첫 슬롯에 자동 참가
    if (!state.isHost && state.myPlayerIndex === null && prevPlayerIndex === null && (state.tournament.status === 'lobby' || !state.tournament.status)) {
      const emptySlotIdx = state.tournament.players.findIndex(p => !p || !p.uid);
      if (emptySlotIdx !== -1) {
        console.log(`[자동 참가] 빈 슬롯 ${emptySlotIdx + 1}번에 참가자 등록`);
        claimPlayerSlot(emptySlotIdx, true); // true = 자동 등록 모드 (중복 alert 억제)
      }
    }

    // 1:1 매치가 진행 중이면 매치 상태 동기화
    if (data.matchState && data.matchState.roundNumber > 0) {
      if (!state.activeMatchEngine || state.activeMatchEngine.matchIndex !== data.matchState.matchIndex) {
        const match = state.tournament?.matches?.[data.matchState.matchIndex];
        if (match) {
          const p1 = state.tournament.players[match.p1Idx];
          const p2 = state.tournament.players[match.p2Idx];
          state.activeMatchEngine = new MatchEngine(p1, p2, data.matchState.matchIndex);
        }
      }

      if (state.activeMatchEngine) {
        const myUid = fb.getUid();
        const curMatch = data.matchState.matchIndex;
        const curRound = data.matchState.roundNumber;
        const isNewRound = (state.activeMatchEngine.roundNumber !== curRound || state.activeMatchEngine.matchIndex !== curMatch);

        const p1Uid = data.matchState.p1?.uid || state.activeMatchEngine.p1.uid;
        const p2Uid = data.matchState.p2?.uid || state.activeMatchEngine.p2.uid;
        const currentMatch = state.tournament?.matches?.[curMatch];

        const isP1Owner = (p1Uid === myUid || state.myPlayerIndex === currentMatch?.p1Idx);
        const isP2Owner = (p2Uid === myUid || state.myPlayerIndex === currentMatch?.p2Idx);

        // 이전 라운드의 만료된 secrets가 새 라운드에 유출되지 않도록 새 라운드 전환 시 초기화
        let localSecretsP1 = isNewRound ? [] : (state.activeMatchEngine.p1.secrets || []);
        let localSecretsP2 = isNewRound ? [] : (state.activeMatchEngine.p2.secrets || []);

        const roundKeyP1 = `${curMatch}_${curRound}_p1`;
        const roundKeyP2 = `${curMatch}_${curRound}_p2`;
        if ((!localSecretsP1 || localSecretsP1.length === 0) && state.savedMatchSecrets[roundKeyP1]) {
          localSecretsP1 = state.savedMatchSecrets[roundKeyP1];
        }
        if ((!localSecretsP2 || localSecretsP2.length === 0) && state.savedMatchSecrets[roundKeyP2]) {
          localSecretsP2 = state.savedMatchSecrets[roundKeyP2];
        }

        // 로컬에 수신된 본인의 비공개 secrets가 현재 매치 및 라운드와 일치할 때만 주입
        const isMySecretsValid = state.myPrivateSecrets && state.myPrivateSecrets.length >= 5 &&
          (!state.myPrivateSecretsRoundNumber || state.myPrivateSecretsRoundNumber === curRound) &&
          (state.myPrivateSecretsMatchIndex === undefined || state.myPrivateSecretsMatchIndex === curMatch);

        if (isP1Owner && isMySecretsValid) {
          localSecretsP1 = state.myPrivateSecrets;
          state.savedMatchSecrets[roundKeyP1] = state.myPrivateSecrets;
        }
        if (isP2Owner && isMySecretsValid) {
          localSecretsP2 = state.myPrivateSecrets;
          state.savedMatchSecrets[roundKeyP2] = state.myPrivateSecrets;
        }

        state.activeMatchEngine.roundNumber = curRound;
        state.activeMatchEngine.pot = data.matchState.pot;
        state.activeMatchEngine.currentHighestBet = data.matchState.currentHighestBet;
        state.activeMatchEngine.currentTurnPlayerId = data.matchState.currentTurnPlayerId;
        state.activeMatchEngine.firstTurnPlayerId = data.matchState.firstTurnPlayerId;
        state.activeMatchEngine.phase = data.matchState.phase;
        state.activeMatchEngine.winnerId = data.matchState.winnerId || null;
        state.activeMatchEngine.lastShowdownResult = data.matchState.lastShowdownResult || null;
        state.activeMatchEngine.actionHistory = data.matchState.actionHistory || [];

        state.activeMatchEngine.p1 = {
          ...data.matchState.p1,
          cards: parsePlayerCards(data.matchState.p1?.cards, localSecretsP1, isP1Owner),
          secrets: localSecretsP1
        };
        state.activeMatchEngine.p2 = {
          ...data.matchState.p2,
          cards: parsePlayerCards(data.matchState.p2?.cards, localSecretsP2, isP2Owner),
          secrets: localSecretsP2
        };

        // 쇼다운 단계인 경우 본인 비밀패 및 로컬 secrets를 통해 모든 미공개 슬롯을 즉시 100% 공개로 승격
        if (data.matchState.phase === 'showdown') {
          [state.activeMatchEngine.p1, state.activeMatchEngine.p2].forEach((p, pIdx) => {
            const isOwner = (pIdx === 0 && isP1Owner) || (pIdx === 1 && isP2Owner);
            const secrets = Array.isArray(p.secrets) ? p.secrets : Object.values(p.secrets || {});
            p.cards.forEach((slot, i) => {
              if (!slot.revealed) {
                const sec = secrets.find(s => s && s.index === i) || secrets[i];
                if (sec && (sec.cardId || (sec.card && sec.card.id))) {
                  const cId = sec.cardId || sec.card.id;
                  slot.revealed = { cardId: cId, salt: sec.salt || '' };
                  slot.isRevealed = true;
                  slot.revealedInPlay = false;
                  slot.cardId = cId;
                  slot.card = CARD_MAP[cId] || slot.card || CARD_MAP['knight'];
                }
              }
            });
          });

          // 방장(호스트)인 경우: 참가자 및 관전자들이 10장 덱을 즉시 확인할 수 있도록 roundSecrets 보강 동기화
          if (state.isHost) {
            const rKey = `${data.matchState.matchIndex}_${data.matchState.roundNumber}`;
            const roundSecretRef = ref(fb.db, `rooms/${state.roomId}/roundSecrets/${rKey}`);
            const p1Sec = (localSecretsP1 && localSecretsP1.length >= 5) ? localSecretsP1 : state.savedMatchSecrets[roundKeyP1];
            const p2Sec = (localSecretsP2 && localSecretsP2.length >= 5) ? localSecretsP2 : state.savedMatchSecrets[roundKeyP2];
            if ((p1Sec && p1Sec.length >= 5) || (p2Sec && p2Sec.length >= 5)) {
              set(roundSecretRef, sanitizeForFirebase({
                p1Secrets: p1Sec || [],
                p2Secrets: p2Sec || []
              })).catch(() => {});
            }
          }
        }

        // 1:1 매치 상태 동기화 완료 후: 현재 턴이 AI 봇이고 본인이 호스트라면 봇 액션 실행!
        if (state.isHost && state.activeMatchEngine && state.activeMatchEngine.phase === 'betting') {
          const match = state.tournament?.matches?.[state.activeMatchEngine.matchIndex];
          if (match) {
            const p1 = state.tournament.players[match.p1Idx];
            const p2 = state.tournament.players[match.p2Idx];
            const curTurnId = state.activeMatchEngine.currentTurnPlayerId;
            const isP1Bot = isPlayerBot(p1, state.activeMatchEngine.p1);
            const isP2Bot = isPlayerBot(p2, state.activeMatchEngine.p2);
            const isBotTurn = (curTurnId === state.activeMatchEngine.p1.id && isP1Bot) ||
                              (curTurnId === state.activeMatchEngine.p2.id && isP2Bot);
            if (isBotTurn) {
              checkBotTurn();
            }
          }
        }
      }
    }

    // 참가자 관리 모달이 열려 있다면 최신 슬롯 상태 갱신
    if (el.modalManageSlots && !el.modalManageSlots.classList.contains('hidden')) {
      renderManageSlotsModal();
    }

    // 화면 뷰 전환 및 렌더링
    const savedView = sessionStorage.getItem('muryeok_current_view');
    if (state.view === 'lobby') {
      // 로비에서 방에 접속/복원된 경우 대기실 또는 경기 뷰로 즉시 이동
      if (data.tournament?.status === 'ongoing' && data.matchState && data.matchState.roundNumber > 0) {
        const activeMatch = state.tournament.matches[state.tournament.currentMatchIndex];
        const isMatchPlayer = activeMatch && (state.myPlayerIndex === activeMatch.p1Idx || state.myPlayerIndex === activeMatch.p2Idx);
        if (savedView === 'duel' || isMatchPlayer || state.isHost) {
          showView('duel');
          renderDuelView();
        } else {
          showView('tournament');
          renderTournamentView();
        }
      } else {
        showView('tournament');
        renderTournamentView();
      }
    } else if (state.view === 'tournament') {
      // 진행 중인 매치가 시작되었으면 대결 뷰로 자동 이동 (호스트 및 해당 매치 출전자)
      if (data.tournament?.status === 'ongoing' && data.matchState && data.matchState.roundNumber > 0) {
        const activeMatch = state.tournament.matches[state.tournament.currentMatchIndex];
        if (activeMatch && (state.isHost || state.myPlayerIndex === activeMatch.p1Idx || state.myPlayerIndex === activeMatch.p2Idx)) {
          showView('duel');
          renderDuelView();
          return;
        }
      }
      renderTournamentView();
    } else if (state.view === 'duel') {
      renderDuelView();
    }

    // 원격 또는 로컬에서 쇼다운 결과가 동기화된 경우 (관전자 및 참가자 화면 실시간 축하 연출)
    if ((data.matchState?.phase === 'round_end' || data.matchState?.phase === 'match_end') && data.matchState?.lastShowdownResult) {
      const res = data.matchState.lastShowdownResult;
      if (el.modalShowdown && !el.modalShowdown.classList.contains('hidden')) {
        showInModalShowdownVictory(res.winnerName, res.pot);
        // 참가자 및 관전자: 1.5초간 승리 연출을 감상한 후 모달 자동 정리 (중복 패킷 타이머 재설정 방지)
        if (!state.isHost) {
          if (!state.participantShowdownCloseTimer) {
            state.participantShowdownCloseTimer = setTimeout(() => {
              state.participantShowdownCloseTimer = null;
              closeShowdownModalInstantly();
            }, 1500);
          }
        }
      }
    }

    // 다음 라운드(베팅 단계)로 이미 전환되었는데 쇼다운 모달이 열려 있다면 즉시 닫기
    if (data.matchState?.phase === 'betting' && el.modalShowdown && !el.modalShowdown.classList.contains('hidden')) {
      closeShowdownModalInstantly();
    }

    // 원격 또는 로컬에서 라운드 종료/매치 종료 상태가 동기화되면 다음 라운드/대진표 진행 감지
    if (data.matchState?.phase === 'round_end' || data.matchState?.phase === 'match_end') {
      checkNextRoundOrMatchEnd();
    }
  }, (error) => {
    console.error('Firebase 방 구독 오류:', error);
    alert(`방에 접속할 수 없습니다: ${error.message}`);
    if (el.btnActionJoin) {
      el.btnActionJoin.disabled = false;
      el.btnActionJoin.innerHTML = `<i data-lucide="log-in" class="w-5 h-5"></i><span>방 입장하기</span>`;
      lucide.createIcons();
    }
    showView('lobby');
  });

  // 본인 비공개 패 전용 수신 리스너 (본인 UID의 패만 수신)
  const myUid = fb.getUid();
  const privateRef = ref(fb.db, `rooms/${roomId}/privateHands/${myUid}`);
  state.privateHandUnsub = onValue(privateRef, (snap) => {
    const val = snap.val();
    if (!val) return;

    let incomingSecrets = [];
    let incMatch = null;
    let incRound = null;

    if (Array.isArray(val)) {
      incomingSecrets = val;
    } else if (val && val.secrets) {
      incomingSecrets = Array.isArray(val.secrets) ? val.secrets : Object.values(val.secrets);
      incMatch = val.matchIndex;
      incRound = val.roundNumber;
    } else if (typeof val === 'object') {
      incomingSecrets = Object.values(val);
    }

    if (state.activeMatchEngine) {
      const curMatch = state.activeMatchEngine.matchIndex;
      const curRound = state.activeMatchEngine.roundNumber;
      if (incRound !== null && curRound > 0 && incRound !== curRound) {
        // 만료된 이전 라운드 secrets이 뒤늦게 도착한 경우 무시
        return;
      }
      if (incMatch !== null && incMatch !== curMatch) {
        return;
      }
    }

    state.myPrivateSecrets = incomingSecrets;
    state.myPrivateSecretsMatchIndex = incMatch ?? state.activeMatchEngine?.matchIndex ?? 0;
    state.myPrivateSecretsRoundNumber = incRound ?? state.activeMatchEngine?.roundNumber ?? 1;

    if (state.activeMatchEngine) {
      const curMatch = state.activeMatchEngine.matchIndex;
      const curRound = state.activeMatchEngine.roundNumber;
      const match = state.tournament?.matches?.[curMatch];
      const isP1 = state.activeMatchEngine.p1.uid === myUid || (match && state.myPlayerIndex === match.p1Idx);
      const isP2 = state.activeMatchEngine.p2.uid === myUid || (match && state.myPlayerIndex === match.p2Idx);

      const targetKey = isP1 ? 'p1' : (isP2 ? 'p2' : null);
      if (targetKey) {
        state.savedMatchSecrets[`${curMatch}_${curRound}_${targetKey}`] = state.myPrivateSecrets;
      }

      if (isP1) {
        state.activeMatchEngine.p1.secrets = state.myPrivateSecrets;
        state.activeMatchEngine.p1.cards = parsePlayerCards(state.activeMatchEngine.p1.cards, state.myPrivateSecrets, true);
      } else if (isP2) {
        state.activeMatchEngine.p2.secrets = state.myPrivateSecrets;
        state.activeMatchEngine.p2.cards = parsePlayerCards(state.activeMatchEngine.p2.cards, state.myPrivateSecrets, true);
      }

      // 비밀 패가 도착했을 때 이번 라운드 덱 지급 모달을 아직 보지 못했다면 즉시 오픈!
      const curDealtKey = `${curMatch}_${curRound}`;
      if (state.view === 'duel' && curRound > 0 && state.lastDealtKey !== curDealtKey && state.myPrivateSecrets.length >= 5) {
        state.lastDealtKey = curDealtKey;
        state.lastDealtRound = curRound;
        sessionStorage.setItem('muryeok_last_dealt_key', curDealtKey);
        sessionStorage.setItem('muryeok_last_dealt_round', curRound.toString());
        state.revealedCardKeys.clear();
        openDealCardsModal(true);
      }

      if (state.view === 'duel') {
        renderDuelView();
      }
    }
  });
}

function sanitizeForFirebase(obj) {
  if (obj === undefined) return null;
  if (obj === null) return null;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForFirebase(item));
  }
  const clean = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      clean[key] = sanitizeForFirebase(val);
    } else {
      clean[key] = null;
    }
  }
  return clean;
}

function cleanCards(cards) {
  const cardList = Array.isArray(cards) ? cards : Object.values(cards || {});
  return cardList.map((c, idx) => {
    const slotIdx = (c && c.index !== undefined) ? c.index : idx;
    const cardObj = {
      index: slotIdx,
      hash: c?.hash || ''
    };
    if (c?.revealedInPlay) {
      cardObj.revealedInPlay = true;
    }
    const cardId = c?.revealed?.cardId || (c?.isRevealed ? c.cardId : null);
    if (cardId) {
      cardObj.revealed = {
        cardId: cardId,
        salt: c?.revealed?.salt || ''
      };
      cardObj.cardId = cardId;
      cardObj.isRevealed = true;
    }
    return cardObj;
  });
}

async function syncTournamentToFirebase() {
  if (state.isDemo || !fb.isInitialized || !state.roomId) return;
  try {
    const tourRef = ref(fb.db, `rooms/${state.roomId}/tournament`);
    await set(tourRef, sanitizeForFirebase(state.tournament));
  } catch (err) {
    console.error('토너먼트 동기화 오류:', err);
  }
}

async function syncMatchToFirebase() {
  if (state.isDemo || !fb.isInitialized || !state.roomId || !state.activeMatchEngine) return;
  const engine = state.activeMatchEngine;

  const currentMatch = state.tournament?.matches?.[engine.matchIndex];
  const myUid = fb.getUid();
  const isP1 = (engine.p1.uid === myUid || state.myPlayerIndex === currentMatch?.p1Idx);
  const isP2 = (engine.p2.uid === myUid || state.myPlayerIndex === currentMatch?.p2Idx);

  // 동기화 권한 판별:
  // 1. 방장(호스트)은 모든 상태(베팅, 쇼다운, 라운드/매치 종료) 동기화 가능
  // 2. 출전 선수는 본인 턴에서 진행한 액션(베팅, 콜에 의한 showdown 전이, 폴드에 의한 round_end 전이) 동기화 가능
  // 3. 관전자 및 비출전자는 동기화 차단
  if (!state.isHost && !isP1 && !isP2) {
    return;
  }

  try {
    // 호스트인 경우 로컬 캐시에 최신 라운드 secrets 즉시 보존
    if (state.isHost) {
      if (engine.p1.secrets && engine.p1.secrets.length > 0) {
        state.savedMatchSecrets[`${engine.matchIndex}_${engine.roundNumber}_p1`] = engine.p1.secrets;
      }
      if (engine.p2.secrets && engine.p2.secrets.length > 0) {
        state.savedMatchSecrets[`${engine.matchIndex}_${engine.roundNumber}_p2`] = engine.p2.secrets;
      }
    }

    // 쇼다운 단계에서는 접근 가능한 모든 secrets를 통해 5장 전체를 revealed로 공개
    if (engine.phase === 'showdown') {
      [engine.p1, engine.p2].forEach(p => {
        if (!p || !p.cards) return;
        const secrets = Array.isArray(p.secrets) ? p.secrets : Object.values(p.secrets || {});
        p.cards.forEach((slot, i) => {
          if (!slot.revealed) {
            const sec = secrets.find(s => s && s.index === i) || secrets[i];
            if (sec && (sec.cardId || (sec.card && sec.card.id))) {
              slot.revealed = {
                cardId: sec.cardId || sec.card.id,
                salt: sec.salt || ''
              };
              slot.isRevealed = true;
              slot.cardId = sec.cardId || sec.card.id;
            }
          }
        });
      });

      // 본인 비밀 패가 있다면 본인 슬롯도 즉시 revealed로 전면 공개
      if (state.myPrivateSecrets && state.myPrivateSecrets.length >= 5) {
        const targetPlayer = isP1 ? engine.p1 : (isP2 ? engine.p2 : null);
        if (targetPlayer && targetPlayer.cards) {
          targetPlayer.cards.forEach((slot, i) => {
            if (!slot.revealed) {
              const sec = state.myPrivateSecrets.find(s => s && s.index === i) || state.myPrivateSecrets[i];
              if (sec && (sec.cardId || (sec.card && sec.card.id))) {
                const cId = sec.cardId || sec.card.id;
                slot.revealed = {
                  cardId: cId,
                  salt: sec.salt || ''
                };
                slot.isRevealed = true;
                slot.cardId = cId;
              }
            }
          });
        }
      }
    }

    const matchRef = ref(fb.db, `rooms/${state.roomId}/matchState`);
    const rawMatchData = {
      matchIndex: engine.matchIndex ?? 0,
      roundNumber: engine.roundNumber ?? 1,
      pot: engine.pot ?? 0,
      currentHighestBet: engine.currentHighestBet ?? 0,
      currentTurnPlayerId: engine.currentTurnPlayerId || null,
      firstTurnPlayerId: engine.firstTurnPlayerId || null,
      phase: engine.phase || 'betting',
      winnerId: engine.winnerId || null,
      lastShowdownResult: engine.lastShowdownResult || null,
      actionHistory: engine.actionHistory || [],
      p1: {
        id: engine.p1.id || 'p1',
        uid: engine.p1.uid || '',
        name: engine.p1.name || '선수 1',
        gold: typeof engine.p1.gold === 'number' ? engine.p1.gold : 100,
        currentBet: typeof engine.p1.currentBet === 'number' ? engine.p1.currentBet : 0,
        totalRoundBet: typeof engine.p1.totalRoundBet === 'number' ? engine.p1.totalRoundBet : (engine.p1.currentBet || 10),
        isFolded: !!engine.p1.isFolded,
        isAllIn: !!engine.p1.isAllIn,
        cards: cleanCards(engine.p1.cards)
      },
      p2: {
        id: engine.p2.id || 'p2',
        uid: engine.p2.uid || '',
        name: engine.p2.name || '선수 2',
        gold: typeof engine.p2.gold === 'number' ? engine.p2.gold : 100,
        currentBet: typeof engine.p2.currentBet === 'number' ? engine.p2.currentBet : 0,
        totalRoundBet: typeof engine.p2.totalRoundBet === 'number' ? engine.p2.totalRoundBet : (engine.p2.currentBet || 10),
        isFolded: !!engine.p2.isFolded,
        isAllIn: !!engine.p2.isAllIn,
        cards: cleanCards(engine.p2.cards)
      },
      updatedAt: Date.now()
    };

    const sanitized = sanitizeForFirebase(rawMatchData);
    await set(matchRef, sanitized);

    // 호스트인 경우: 각 플레이어의 비공개 secrets를 각자의 전용 경로로 안전하게 전달
    if (state.isHost) {
      if (engine.p1.uid && engine.p1.secrets && engine.p1.secrets.length > 0) {
        const p1SecretRef = ref(fb.db, `rooms/${state.roomId}/privateHands/${engine.p1.uid}`);
        await set(p1SecretRef, sanitizeForFirebase({
          matchIndex: engine.matchIndex,
          roundNumber: engine.roundNumber,
          secrets: engine.p1.secrets,
          updatedAt: Date.now()
        }));
      }
      if (engine.p2.uid && engine.p2.secrets && engine.p2.secrets.length > 0) {
        const p2SecretRef = ref(fb.db, `rooms/${state.roomId}/privateHands/${engine.p2.uid}`);
        await set(p2SecretRef, sanitizeForFirebase({
          matchIndex: engine.matchIndex,
          roundNumber: engine.roundNumber,
          secrets: engine.p2.secrets,
          updatedAt: Date.now()
        }));
      }

      // 쇼다운(전면 공개) 단계에 진입했을 때 roundSecrets를 안전하게 게시
      if (engine.phase === 'showdown') {
        const roundSecretRef = ref(fb.db, `rooms/${state.roomId}/roundSecrets/${engine.matchIndex}_${engine.roundNumber}`);
        const p1Sec = (engine.p1.secrets && engine.p1.secrets.length >= 5) ? engine.p1.secrets : (state.savedMatchSecrets[`${engine.matchIndex}_${engine.roundNumber}_p1`] || []);
        const p2Sec = (engine.p2.secrets && engine.p2.secrets.length >= 5) ? engine.p2.secrets : (state.savedMatchSecrets[`${engine.matchIndex}_${engine.roundNumber}_p2`] || []);
        if (p1Sec.length >= 5 || p2Sec.length >= 5) {
          await set(roundSecretRef, sanitizeForFirebase({
            p1Secrets: p1Sec,
            p2Secrets: p2Sec
          }));
        }
      }
    }

    // 비-호스트 참가자가 콜을 하여 쇼다운에 진입했을 때: 본인 secrets를 roundSecrets에 공개
    if (!state.isHost && engine.phase === 'showdown' && state.myPrivateSecrets && state.myPrivateSecrets.length >= 5) {
      const isSecretsForCurRound = (!state.myPrivateSecretsRoundNumber || state.myPrivateSecretsRoundNumber === engine.roundNumber);
      if (isSecretsForCurRound) {
        const secretField = isP1 ? 'p1Secrets' : (isP2 ? 'p2Secrets' : null);
        if (secretField) {
          const roundPartRef = ref(fb.db, `rooms/${state.roomId}/roundSecrets/${engine.matchIndex}_${engine.roundNumber}/${secretField}`);
          await set(roundPartRef, sanitizeForFirebase(state.myPrivateSecrets));
        }
      }
    }
  } catch (err) {
    console.error('Firebase 매치 동기화 오류:', err);
  }
}

// ================= 토너먼트 뷰 렌더링 =================
function renderTournamentView() {
  const tour = state.tournament;
  if (!tour) return;

  // 호스트 전용 컨트롤 표시/숨김
  if (state.isHost) {
    el.hostControls.classList.remove('hidden');
    el.hostControls.classList.add('flex');
    if (el.btnFillBots) {
      if (tour.status === 'ongoing') {
        el.btnFillBots.classList.add('hidden');
      } else {
        el.btnFillBots.classList.remove('hidden');
      }
    }
    if (el.btnShuffleBracket) {
      if (tour.status === 'ongoing') {
        el.btnShuffleBracket.classList.add('hidden');
      } else {
        el.btnShuffleBracket.classList.remove('hidden');
      }
    }
    if (el.btnStartTournament) {
      if (tour.status === 'lobby') {
        el.btnStartTournament.innerHTML = `<i data-lucide="play" class="w-4 h-4 fill-current"></i><span>토너먼트 시작</span>`;
      } else if (tour.status === 'ongoing') {
        const activeIdx = tour.currentMatchIndex;
        const activeMatch = tour.matches[activeIdx];
        const roundName = activeMatch ? activeMatch.round : '다음 경기';
        el.btnStartTournament.innerHTML = `<i data-lucide="tv" class="w-4 h-4 text-emerald-300"></i><span>[${roundName}] 중계/진행</span>`;
      } else if (tour.status === 'finished') {
        el.btnStartTournament.innerHTML = `<i data-lucide="trophy" class="w-4 h-4 text-amber-400"></i><span>토너먼트 완료</span>`;
      }
    }
  } else {
    el.hostControls.classList.add('hidden');
    el.hostControls.classList.remove('flex');
  }

  // 상태 뱃지
  if (tour.status === 'lobby') {
    el.tourStatusPill.textContent = '참가자 모집 중';
    el.tourStatusPill.className = 'text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30';
  } else if (tour.status === 'ongoing') {
    el.tourStatusPill.textContent = '토너먼트 진행 중';
    el.tourStatusPill.className = 'text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse';
  } else if (tour.status === 'finished') {
    el.tourStatusPill.textContent = '토너먼트 완료';
    el.tourStatusPill.className = 'text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30';
  }

  // 내 참가 슬롯 뱃지 업데이트
  const mySlotBadge = document.getElementById('my-slot-badge');
  if (mySlotBadge) {
    if (state.isHost) {
      mySlotBadge.textContent = '👑 방장 (주최자/중계 관전)';
      mySlotBadge.className = 'text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold';
      mySlotBadge.classList.remove('hidden');
    } else if (state.myPlayerIndex !== null) {
      mySlotBadge.textContent = `내 슬롯: ${state.myPlayerIndex + 1}번 (${state.tournament.players[state.myPlayerIndex]?.name || '나'})`;
      mySlotBadge.className = 'text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold';
      mySlotBadge.classList.remove('hidden');
    } else {
      mySlotBadge.textContent = '관전자 모드';
      mySlotBadge.className = 'text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700';
      mySlotBadge.classList.remove('hidden');
    }
  }

  // 호스트 전용 컨트롤 표시/숨김
  if (el.hostControls) {
    if (state.isHost) {
      el.hostControls.classList.remove('hidden');
    } else {
      el.hostControls.classList.add('hidden');
    }
  }

  // 8강전 (4경기) 렌더링
  el.bracketRound8.innerHTML = '<div class="text-xs font-black text-slate-400 uppercase tracking-widest text-center mb-1">8강전 (1:1 포커)</div>';
  for (let i = 0; i < 4; i++) {
    el.bracketRound8.appendChild(createMatchCard(tour.matches[i], i));
  }

  // 4강전 (2경기) 렌더링
  el.bracketRound4.innerHTML = '<div class="text-xs font-black text-slate-400 uppercase tracking-widest text-center mb-1">4강 준결승</div>';
  for (let i = 4; i < 6; i++) {
    el.bracketRound4.appendChild(createMatchCard(tour.matches[i], i));
  }

  // 결승전 (1경기) 렌더링
  el.bracketFinalMatch.innerHTML = '';
  el.bracketFinalMatch.appendChild(createMatchCard(tour.matches[6], 6));

  // 챔피언 트로피 표시
  if (tour.champion) {
    el.championShowcase.classList.remove('hidden');
    el.championName.textContent = tour.champion.name;
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    sounds.playWin();
  } else {
    el.championShowcase.classList.add('hidden');
  }

  lucide.createIcons();
}

function createMatchCard(match, matchIndex) {
  const card = document.createElement('div');
  const isActive = state.tournament.status === 'ongoing' && state.tournament.currentMatchIndex === matchIndex;
  card.className = `bracket-node p-3 rounded-xl cursor-pointer ${isActive ? 'active-match' : ''}`;

  const p1 = match.p1Idx !== null ? state.tournament.players[match.p1Idx] : null;
  const p2 = match.p2Idx !== null ? state.tournament.players[match.p2Idx] : null;

  const isP1Win = match.winnerIdx !== null && match.winnerIdx === match.p1Idx;
  const isP2Win = match.winnerIdx !== null && match.winnerIdx === match.p2Idx;

  const myUid = fb.getUid();
  const isP1Mine = p1 && p1.uid === myUid;
  const isP2Mine = p2 && p2.uid === myUid;

  const p1NameSafe = escapeHtml(p1?.name || '');
  const p2NameSafe = escapeHtml(p2?.name || '');

  const p1NameDisplay = p1 && p1.uid 
    ? `<span class="truncate whitespace-nowrap flex items-center gap-1 max-w-[125px] font-bold ${isP1Mine ? 'text-amber-300' : 'text-slate-200'}"><span>${p1NameSafe}</span>${isP1Mine ? '<span class="text-[9px] px-1 py-0.2 bg-amber-500/25 text-amber-300 rounded border border-amber-500/40">나</span>' : ''}</span>`
    : (matchIndex < 4 
        ? (!state.isHost && state.myPlayerIndex === null 
            ? `<button class="btn-claim-slot text-amber-400 hover:underline font-bold" data-idx="${match.p1Idx}">[슬롯 ${match.p1Idx+1} 참가]</button>` 
            : `<span class="text-slate-500 text-[11px] italic">슬롯 ${match.p1Idx+1} 대기 중</span>`)
        : '미정');

  const p2NameDisplay = p2 && p2.uid 
    ? `<span class="truncate whitespace-nowrap flex items-center gap-1 max-w-[125px] font-bold ${isP2Mine ? 'text-amber-300' : 'text-slate-200'}"><span>${p2NameSafe}</span>${isP2Mine ? '<span class="text-[9px] px-1 py-0.2 bg-amber-500/25 text-amber-300 rounded border border-amber-500/40">나</span>' : ''}</span>`
    : (matchIndex < 4 
        ? (!state.isHost && state.myPlayerIndex === null 
            ? `<button class="btn-claim-slot text-amber-400 hover:underline font-bold" data-idx="${match.p2Idx}">[슬롯 ${match.p2Idx+1} 참가]</button>` 
            : `<span class="text-slate-500 text-[11px] italic">슬롯 ${match.p2Idx+1} 대기 중</span>`)
        : '미정');

  const p1KickBtn = (state.isHost && p1 && p1.uid && (state.tournament.status === 'lobby' || !state.tournament.status))
    ? `<button class="btn-card-kick p-0.5 text-slate-500 hover:text-rose-400 rounded transition flex-shrink-0" data-slot="${match.p1Idx}" title="퇴장(추방)"><i data-lucide="user-x" class="w-3.5 h-3.5"></i></button>`
    : '';

  const p2KickBtn = (state.isHost && p2 && p2.uid && (state.tournament.status === 'lobby' || !state.tournament.status))
    ? `<button class="btn-card-kick p-0.5 text-slate-500 hover:text-rose-400 rounded transition flex-shrink-0" data-slot="${match.p2Idx}" title="퇴장(추방)"><i data-lucide="user-x" class="w-3.5 h-3.5"></i></button>`
    : '';

  card.innerHTML = `
    <div class="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-2">
      <span>${match.round}</span>
      <span class="text-[10px] px-1.5 py-0.5 rounded ${
        match.status === 'finished' ? 'bg-slate-700 text-slate-300' :
        match.status === 'ongoing' ? 'bg-emerald-500/20 text-emerald-400 font-bold animate-pulse' :
        match.status === 'ready' ? 'bg-amber-500/20 text-amber-400 font-bold' : 'bg-slate-800 text-slate-500'
      }">
        ${match.status === 'finished' ? '종료' : match.status === 'ongoing' ? '▶ 진행 중 (클릭)' : match.status === 'ready' ? '대결 준비' : '대기'}
      </span>
    </div>
    <div class="space-y-1.5 text-xs">
      <div class="flex items-center justify-between p-1.5 rounded ${isP1Mine ? 'ring-1 ring-amber-400/50 bg-slate-900/90' : isP1Win ? 'bg-emerald-950/60 border border-emerald-500/50 font-bold text-emerald-300' : 'bg-slate-900/60 text-slate-200'}">
        ${p1NameDisplay}
        <div class="flex items-center gap-1">
          ${p1KickBtn}
          ${isP1Win ? '<i data-lucide="trophy" class="w-3.5 h-3.5 text-emerald-400 flex-shrink-0"></i>' : ''}
        </div>
      </div>
      <div class="flex items-center justify-between p-1.5 rounded ${isP2Mine ? 'ring-1 ring-amber-400/50 bg-slate-900/90' : isP2Win ? 'bg-emerald-950/60 border border-emerald-500/50 font-bold text-emerald-300' : 'bg-slate-900/60 text-slate-200'}">
        ${p2NameDisplay}
        <div class="flex items-center gap-1">
          ${p2KickBtn}
          ${isP2Win ? '<i data-lucide="trophy" class="w-3.5 h-3.5 text-emerald-400 flex-shrink-0"></i>' : ''}
        </div>
      </div>
    </div>
  `;

  // 클릭 시 해당 매치로 진입
  card.addEventListener('click', (e) => {
    const kickBtn = e.target.closest('.btn-card-kick');
    if (kickBtn) {
      e.stopPropagation();
      const slotIdx = parseInt(kickBtn.dataset.slot, 10);
      handleKickPlayer(slotIdx);
      return;
    }
    if (e.target.classList.contains('btn-claim-slot')) {
      const slotIdx = parseInt(e.target.dataset.idx, 10);
      claimPlayerSlot(slotIdx);
      return;
    }
    if (match.status === 'ready' || match.status === 'ongoing' || match.status === 'finished') {
      if (match.status === 'ready' && !state.isHost && !state.isDemo) {
        alert('방장(호스트)이 토너먼트/경기를 시작할 때까지 대기해주세요.');
        return;
      }
      startOrViewMatch(matchIndex);
    }
  });

  return card;
}

async function claimPlayerSlot(slotIdx, isAuto = false) {
  if (state.isHost) {
    if (!isAuto) alert('방장(호스트)은 경기 진행 및 중계자이며, 선수로 참가하지 않습니다.');
    return;
  }
  if (state.myPlayerIndex !== null) {
    if (!isAuto) alert('이미 참가 슬롯을 보유하고 있습니다.');
    return;
  }
  const name = getNickname();
  const playerInfo = {
    id: `p_${slotIdx + 1}`,
    name: name,
    uid: fb.getUid(),
    isBot: false,
    isReady: true
  };
  state.tournament.players[slotIdx] = playerInfo;
  state.myPlayerIndex = slotIdx;

  if (!state.isDemo && fb.isInitialized && state.roomId) {
    try {
      const slotRef = ref(fb.db, `rooms/${state.roomId}/tournament/players/${slotIdx}`);
      await set(slotRef, playerInfo);
    } catch (e) {
      console.warn('슬롯 등록 Firebase 동기화 실패:', e);
    }
  }
  renderTournamentView();
}

function handleFillBots() {
  if (!state.isHost) return;
  const botNames = ['해골 군주', '화염 드래곤', '프린스 기사단', '로얄 호그스', '암흑 마녀', '엘릭서 장인', '도끼 광전사'];
  let botIdx = 0;
  state.tournament.players.forEach((p, i) => {
    if (!p || !p.uid) {
      state.tournament.players[i] = {
        id: `bot_${i + 1}`,
        name: botNames[botIdx % botNames.length],
        uid: `bot_uid_${i + 1}`,
        isBot: true,
        isReady: true
      };
      botIdx++;
    }
  });
  syncTournamentToFirebase();
  renderTournamentView();
}

function handleShuffleBracket() {
  if (!state.isHost) return;
  const players = [...state.tournament.players].sort(() => Math.random() - 0.5);
  state.tournament.players = players;
  syncTournamentToFirebase();
  renderTournamentView();
}

// ================= 참가자 자리 배치 및 퇴장 관리 =================
function openManageSlotsModal() {
  if (!el.modalManageSlots) return;
  renderManageSlotsModal();
  el.modalManageSlots.classList.remove('hidden');
  lucide.createIcons();
}

function closeManageSlotsModal() {
  if (!el.modalManageSlots) return;
  el.modalManageSlots.classList.add('hidden');
}

function renderManageSlotsModal() {
  if (!el.manageSlotsList || !state.tournament) return;
  const players = state.tournament.players || [];

  el.manageSlotsList.innerHTML = '';

  for (let i = 0; i < 8; i++) {
    const p = players[i];
    const matchNum = Math.floor(i / 2) + 1;
    const isPlayer1 = (i % 2 === 0);
    const hasPlayer = p && p.uid;
    const isBot = p?.isBot;

    const row = document.createElement('div');
    row.className = `p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
      hasPlayer 
        ? (isBot ? 'bg-slate-800/80 border-cyan-500/30' : 'bg-slate-800/90 border-amber-500/40 shadow-sm') 
        : 'bg-slate-950/60 border-slate-800 text-slate-500'
    }`;

    // 옵션 리스트 (다른 슬롯 선택)
    let swapOptions = `<option value="">자리 이동...</option>`;
    for (let j = 0; j < 8; j++) {
      if (j !== i) {
        const otherP = players[j];
        const otherName = otherP && otherP.uid ? otherP.name : '빈 슬롯';
        swapOptions += `<option value="${j}">${j + 1}번으로 이동 (${otherName})</option>`;
      }
    }

    row.innerHTML = `
      <div class="flex items-center gap-2.5 min-w-0">
        <div class="w-7 h-7 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center font-black text-xs text-amber-400 flex-shrink-0">
          ${i + 1}
        </div>
        <div class="min-w-0">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="text-xs font-bold text-white truncate max-w-[130px] sm:max-w-[180px]">
              ${hasPlayer ? escapeHtml(p.name) : '<span class="text-slate-500 italic">빈 슬롯 (대기 중)</span>'}
            </span>
            ${hasPlayer 
              ? (isBot 
                  ? '<span class="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">AI 봇</span>' 
                  : '<span class="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">시청자</span>') 
              : ''}
          </div>
          <div class="text-[10px] text-slate-400">
            8강 ${matchNum}경기 (${isPlayer1 ? '선수 1' : '선수 2'})
          </div>
        </div>
      </div>

      <div class="flex items-center gap-1.5 flex-shrink-0">
        ${hasPlayer ? `
          <select class="select-slot-swap bg-slate-900 text-slate-200 border border-slate-700 rounded-lg px-2 py-1 text-[11px] font-semibold focus:outline-none focus:border-amber-400 cursor-pointer" data-source-slot="${i}">
            ${swapOptions}
          </select>
          <button class="btn-slot-kick px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-lg text-[11px] font-bold transition flex items-center gap-1 active:scale-95" data-slot="${i}" title="퇴장(추방)">
            <i data-lucide="user-minus" class="w-3 h-3"></i>
            <span>퇴장</span>
          </button>
        ` : `
          <button class="btn-slot-add-bot px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 rounded-lg text-[11px] font-bold transition flex items-center gap-1 active:scale-95" data-slot="${i}">
            <i data-lucide="bot" class="w-3 h-3"></i>
            <span>봇 배치</span>
          </button>
        `}
      </div>
    `;

    // 이벤트 리스너
    const selectSwap = row.querySelector('.select-slot-swap');
    if (selectSwap) {
      selectSwap.addEventListener('change', (e) => {
        const targetSlot = parseInt(e.target.value, 10);
        if (!isNaN(targetSlot)) {
          handleSwapSlots(i, targetSlot);
        }
      });
    }

    const btnKick = row.querySelector('.btn-slot-kick');
    if (btnKick) {
      btnKick.addEventListener('click', () => {
        handleKickPlayer(i);
      });
    }

    const btnAddBot = row.querySelector('.btn-slot-add-bot');
    if (btnAddBot) {
      btnAddBot.addEventListener('click', () => {
        handleAddBotToSlot(i);
      });
    }

    el.manageSlotsList.appendChild(row);
  }

  lucide.createIcons();
}

function handleSwapSlots(slotA, slotB) {
  if (!state.isHost) return;
  if (slotA < 0 || slotA >= 8 || slotB < 0 || slotB >= 8 || slotA === slotB) return;

  const temp = state.tournament.players[slotA];
  state.tournament.players[slotA] = state.tournament.players[slotB];
  state.tournament.players[slotB] = temp;

  syncTournamentToFirebase();
  renderTournamentView();
  renderManageSlotsModal();
  sounds.playCardFlip();
}

function handleKickPlayer(slotIdx) {
  if (!state.isHost) return;
  if (slotIdx < 0 || slotIdx >= 8) return;
  const target = state.tournament.players[slotIdx];
  if (!target || !target.uid) return;

  const name = target.name || `슬롯 ${slotIdx + 1}`;
  if (!confirm(`정말 [${name}] 님을 해당 슬롯에서 퇴장(추방)시키겠습니까?`)) return;

  state.tournament.players[slotIdx] = {
    id: null,
    name: `대기자 ${slotIdx + 1}`,
    uid: null,
    score: 0,
    isBot: false,
    isReady: false
  };

  syncTournamentToFirebase();
  renderTournamentView();
  renderManageSlotsModal();
  sounds.playFold();
}

function handleAddBotToSlot(slotIdx) {
  if (!state.isHost) return;
  if (slotIdx < 0 || slotIdx >= 8) return;
  const botNames = ['해골 군주', '화염 드래곤', '프린스 기사단', '로얄 호그스', '암흑 마녀', '엘릭서 장인', '도끼 광전사', '미니언 대장'];
  state.tournament.players[slotIdx] = {
    id: `bot_${slotIdx + 1}`,
    name: botNames[slotIdx % botNames.length],
    uid: `bot_uid_${slotIdx + 1}`,
    isBot: true,
    isReady: true
  };
  syncTournamentToFirebase();
  renderTournamentView();
  renderManageSlotsModal();
  sounds.playCardFlip();
}

function handleStartTournament() {
  if (!state.isHost) return;
  if (state.tournament.status === 'ongoing') {
    startOrViewMatch(state.tournament.currentMatchIndex);
    return;
  }
  if (state.tournament.status === 'finished') {
    alert('이미 완료된 토너먼트입니다.');
    return;
  }
  const unfilled = state.tournament.players.filter(p => !p || !p.uid);
  if (unfilled.length > 0) {
    if (confirm(`아직 빈 슬롯이 ${unfilled.length}개 있습니다. 빈자리를 AI 봇으로 채우고 시작하시겠습니까?`)) {
      handleFillBots();
    } else {
      return;
    }
  }

  state.tournament.status = 'ongoing';
  state.tournament.currentMatchIndex = 0;
  syncTournamentToFirebase();
  renderTournamentView();

  // 첫 매치로 이동 및 개시
  startOrViewMatch(0);
}

// ================= 1:1 대결 진입 및 엔진 연결 =================
async function startOrViewMatch(matchIndex) {
  const match = state.tournament?.matches?.[matchIndex];
  if (!match || match.p1Idx === null || match.p2Idx === null) return;

  const p1 = state.tournament.players[match.p1Idx];
  const p2 = state.tournament.players[match.p2Idx];

  state.tournament.currentMatchIndex = matchIndex;

  // 새로운 매치로 진입 시 덱 지급 상태 및 연출 키 초기화
  if (!state.activeMatchEngine || state.activeMatchEngine.matchIndex !== matchIndex) {
    state.lastDealtRound = null;
    state.lastDealtKey = null;
    state.lastRenderedDuelRound = null;
    state.lastRenderedDuelMatch = null;
    sessionStorage.removeItem('muryeok_last_dealt_round');
    sessionStorage.removeItem('muryeok_last_dealt_key');
    state.revealedCardKeys.clear();
  }

  // 이미 해당 매치가 활성화되어 라운드가 진행 중인 경우 화면만 이동
  if (state.activeMatchEngine && state.activeMatchEngine.matchIndex === matchIndex && state.activeMatchEngine.roundNumber > 0) {
    showView('duel');
    renderDuelView();
    if (state.isHost || state.isDemo) {
      setTimeout(() => {
        checkBotTurn();
      }, 400);
    }
    return;
  }

  // 참가자 및 관전자인 경우: 호스트의 Firebase 동기화 상태를 확인하고 화면 이동
  if (!state.isHost && !state.isDemo) {
    if (match.status !== 'ongoing' && (!state.activeMatchEngine || state.activeMatchEngine.roundNumber === 0)) {
      alert('방장(호스트)이 경기를 시작할 때까지 잠시 기다려주세요.');
      return;
    }
    showView('duel');
    renderDuelView();
    return;
  }

  // 호스트 또는 로컬 데모: 매치가 종료되지 않은 상태라면 매치 개시 및 첫 라운드 진행
  if (match.status !== 'finished') {
    match.status = 'ongoing';
    state.activeMatchEngine = new MatchEngine(p1, p2, matchIndex);
    await state.activeMatchEngine.startNewRound();
    const curRound = state.activeMatchEngine.roundNumber;
    if (state.activeMatchEngine.p1.secrets?.length > 0) {
      state.savedMatchSecrets[`${matchIndex}_${curRound}_p1`] = state.activeMatchEngine.p1.secrets;
    }
    if (state.activeMatchEngine.p2.secrets?.length > 0) {
      state.savedMatchSecrets[`${matchIndex}_${curRound}_p2`] = state.activeMatchEngine.p2.secrets;
    }

    const myUid = fb.getUid();
    const isP1 = (state.activeMatchEngine.p1.uid && myUid === state.activeMatchEngine.p1.uid) || (state.myPlayerIndex === match.p1Idx);
    const isP2 = (state.activeMatchEngine.p2.uid && myUid === state.activeMatchEngine.p2.uid) || (state.myPlayerIndex === match.p2Idx);
    if (isP1) {
      state.myPrivateSecrets = state.activeMatchEngine.p1.secrets;
      state.myPrivateSecretsMatchIndex = matchIndex;
      state.myPrivateSecretsRoundNumber = curRound;
    } else if (isP2) {
      state.myPrivateSecrets = state.activeMatchEngine.p2.secrets;
      state.myPrivateSecretsMatchIndex = matchIndex;
      state.myPrivateSecretsRoundNumber = curRound;
    } else if (state.isDemo) {
      state.myPrivateSecrets = state.activeMatchEngine.p1.secrets;
      state.myPrivateSecretsMatchIndex = matchIndex;
      state.myPrivateSecretsRoundNumber = curRound;
    }

    await syncMatchToFirebase();
    await syncTournamentToFirebase();
    saveDemoState();
  }

  showView('duel');
  sounds.playCardFlip();

  // 만약 첫 턴 플레이어가 봇이라면 AI 액션 트리거
  if (state.isHost || state.isDemo) {
    setTimeout(() => {
      checkBotTurn();
    }, 500);
  }
}

// ================= 버튼 인터랙션 및 실시간 액션 알림 애니메이션 =================
function triggerButtonFeedback(btn) {
  if (!btn) return;
  btn.classList.add('btn-action-pressed');
  setTimeout(() => btn.classList.remove('btn-action-pressed'), 180);
}

function getPlayerTablePosition(playerName, isMe, actionType) {
  // 중립 액션인 경우 정가운데(center) 반환
  if (actionType === 'showdown' || actionType === 'neutral') {
    return 'center';
  }

  const engine = state.activeMatchEngine;
  if (!engine) return isMe ? 'bottom' : 'top';

  const myUid = fb.getUid();
  const match = state.tournament ? state.tournament.matches[engine.matchIndex] : null;
  const isP2 = (engine.p2.uid && myUid === engine.p2.uid) || (match && state.myPlayerIndex === match.p2Idx);

  // 테이블 렌더링 기준:
  // isP2일 때: p2가 아래(bottom), p1이 위(top)
  // isP1이거나 spectator일 때: p1이 아래(bottom), p2가 위(top)
  const bottomName = isP2 ? engine.p2.name : engine.p1.name;
  const topName = isP2 ? engine.p1.name : engine.p2.name;

  if (playerName) {
    if (playerName === bottomName) return 'bottom';
    if (playerName === topName) return 'top';
  }

  return isMe ? 'bottom' : 'top';
}

function showActionAnnouncement(playerName, actionType, amount, isMe = false) {
  const container = el.actionAnnouncementLayer || document.getElementById('action-announcement-layer');
  if (!container) return;

  // 기존 진행 중인 액션 뱃지 제거 (겹침 방지)
  const existing = container.querySelectorAll('.action-announcement-badge');
  existing.forEach(b => b.remove());

  const badge = document.createElement('div');
  const typeClass = actionType === 'allin' ? 'badge-allin' 
                  : actionType === 'call' ? 'badge-call' 
                  : actionType === 'fold' ? 'badge-fold' 
                  : 'badge-bet';

  // 액션을 취한 선수의 위치 (아래쪽: pos-bottom, 위쪽: pos-top, 중립: pos-center)
  const pos = getPlayerTablePosition(playerName, isMe, actionType);
  const posClass = pos === 'center' ? 'pos-center' : (pos === 'top' ? 'pos-top' : 'pos-bottom');

  badge.className = `action-announcement-badge ${typeClass} ${posClass}`;

  let emoji = '🔥';
  let text = '베팅!';
  if (actionType === 'call') {
    emoji = '⚔️';
    text = '콜!';
  } else if (actionType === 'allin') {
    emoji = '💥';
    text = 'ALL-IN!';
  } else if (actionType === 'fold') {
    emoji = '🏳️';
    text = '폴드!';
  } else if (actionType === 'showdown') {
    emoji = '⚔️';
    text = 'SHOWDOWN!';
  }

  const safePlayerName = escapeHtml(playerName || '');
  let subText = '';
  if (pos === 'center') {
    subText = '대결 현황';
  } else if (isMe || pos === 'bottom') {
    subText = isMe ? '나의 액션 ⬆' : `${safePlayerName}의 액션 ⬆`;
  } else {
    subText = `${safePlayerName}의 액션 ⬇`;
  }

  const amountHtml = amount ? `<span class="action-badge-amount">${actionType === 'bet' ? '+' : ''}${amount}G</span>` : '';

  badge.innerHTML = `
    <div class="action-badge-sub">${subText}</div>
    <div class="action-badge-main">
      <span class="action-badge-emoji">${emoji}</span>
      <span class="action-badge-text">${text}</span>
      ${amountHtml}
    </div>
  `;

  container.appendChild(badge);

  // 사운드 시각적 조화 및 애니메이션 종료 후 DOM 정리
  setTimeout(() => {
    if (badge && badge.parentNode) {
      badge.parentNode.removeChild(badge);
    }
  }, 1400);
}

function checkAndAnnounceRemoteAction(actionStr) {
  if (!actionStr) return;
  if (actionStr.includes('골드 베팅')) {
    const m = actionStr.match(/(?:💰\s*)?(.*?):\s*"(\d+)골드 베팅/);
    if (m) {
      const name = m[1].trim();
      const amount = parseInt(m[2], 10);
      showActionAnnouncement(name, 'bet', amount, false);
    }
  } else if (actionStr.includes('콜 (')) {
    const m = actionStr.match(/(?:🤝\s*)?(.*?):\s*"콜 \((\d+)골드\)/);
    if (m) {
      const name = m[1].trim();
      const amount = parseInt(m[2], 10);
      showActionAnnouncement(name, 'call', amount, false);
    }
  } else if (actionStr.includes('폴드')) {
    const m = actionStr.match(/(?:🏳️\s*)?(.*?):\s*"폴드"/);
    if (m) {
      const name = m[1].trim();
      showActionAnnouncement(name, 'fold', null, false);
    }
  }
}

// ================= 1:1 포커 대결 뷰 렌더링 (rAF 배치로 60FPS 보장 & 깜빡임 차단) =================
let duelViewRafId = null;
function renderDuelView() {
  if (duelViewRafId) cancelAnimationFrame(duelViewRafId);
  duelViewRafId = requestAnimationFrame(() => {
    duelViewRafId = null;
    renderDuelViewSync();
  });
}

function renderDuelViewSync() {
  const engine = state.activeMatchEngine;
  if (!engine) return;

  const myUid = fb.getUid();
  const match = state.tournament ? state.tournament.matches[engine.matchIndex] : null;

  // 내가 P1인지 P2인지 판별
  const isP1 = (engine.p1.uid && myUid === engine.p1.uid) || (match && state.myPlayerIndex === match.p1Idx);
  const isP2 = (engine.p2.uid && myUid === engine.p2.uid) || (match && state.myPlayerIndex === match.p2Idx);
  const isSpectator = !isP1 && !isP2;

  // viewerUid 결정 (본인 카드 공개 및 상대방 비밀 보호)
  const viewerUid = isP1 ? (engine.p1.uid || engine.p1.id) : (isP2 ? (engine.p2.uid || engine.p2.id) : 'spectator');
  const matchData = engine.getState(viewerUid);

  // 헤더 정보
  el.duelRoundLabel.textContent = `${match ? match.round : 'MATCH'} - ROUND ${matchData.roundNumber}`;
  el.duelLastBet.textContent = `${matchData.currentHighestBet} G`;
  el.duelFirstPlayer.textContent = matchData.firstTurnPlayerId === matchData.p1.id ? matchData.p1.name : matchData.p2.name;

  const me = isP2 ? matchData.p2 : matchData.p1;
  const opp = isP2 ? matchData.p1 : matchData.p2;

  // 새 라운드 시작 감지 시 DOM 컨테이너 초기화
  if (state.lastRenderedDuelRound !== matchData.roundNumber || state.lastRenderedDuelMatch !== matchData.matchIndex) {
    state.lastRenderedDuelRound = matchData.roundNumber;
    state.lastRenderedDuelMatch = matchData.matchIndex;
    if (el.meHandContainer) el.meHandContainer.innerHTML = '';
    if (el.oppHandContainer) el.oppHandContainer.innerHTML = '';
    if (el.meTableCards) el.meTableCards.innerHTML = '';
    if (el.oppTableCards) el.oppTableCards.innerHTML = '';
  }

  // 새 라운드 시작 감지 시 5장 덱 지급 모달 자동 오픈 & 공개 카드 키 초기화 (새로고침 시 중복 팝업 방지)
  const curDealtKey = `${matchData.matchIndex}_${matchData.roundNumber}`;
  if (matchData.roundNumber && state.lastDealtKey !== curDealtKey) {
    if (!isSpectator) {
      const isMySecretCurrent = state.myPrivateSecrets && state.myPrivateSecrets.length >= 5 &&
        (!state.myPrivateSecretsRoundNumber || state.myPrivateSecretsRoundNumber === matchData.roundNumber);
      const hasEngineSecrets = me.secrets && me.secrets.length >= 5;

      if (isMySecretCurrent || hasEngineSecrets) {
        state.lastDealtKey = curDealtKey;
        state.lastDealtRound = matchData.roundNumber;
        sessionStorage.setItem('muryeok_last_dealt_key', curDealtKey);
        sessionStorage.setItem('muryeok_last_dealt_round', matchData.roundNumber.toString());
        state.revealedCardKeys.clear();
        openDealCardsModal(true);
      }
    } else {
      state.lastDealtKey = curDealtKey;
      state.lastDealtRound = matchData.roundNumber;
      sessionStorage.setItem('muryeok_last_dealt_key', curDealtKey);
      sessionStorage.setItem('muryeok_last_dealt_round', matchData.roundNumber.toString());
      state.revealedCardKeys.clear();
    }
  }

  const specPanel = document.getElementById('spectator-broadcast-panel');
  const mePanel = document.getElementById('me-action-panel');

  // 상대방 정보 & 본인(또는 선수1/선수2) 정보 표시
  if (isSpectator) {
    el.oppName.textContent = `${opp.name} (선수 2)`;
    el.meName.textContent = `${me.name} (선수 1)`;
    el.oppGold.textContent = opp.gold;
    el.meGold.textContent = me.gold;
    el.oppCurrentBet.textContent = `(베팅: ${opp.currentBet}G)`;
    el.meCurrentBet.textContent = `(베팅: ${me.currentBet}G)`;

    const turnName = matchData.currentTurnPlayerId === matchData.p1.id ? matchData.p1.name : matchData.p2.name;
    const safeTurnName = escapeHtml(turnName || '');
    el.myTurnIndicator.innerHTML = `<span>📺 실시간 관전: [${safeTurnName}] 턴</span>`;
    el.myTurnIndicator.className = 'text-xs sm:text-sm font-bold px-3 sm:px-4 py-1.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 animate-pulse whitespace-nowrap shadow-md';
    
    el.bettingControls.classList.add('hidden');
    if (specPanel) specPanel.classList.remove('hidden');
    el.oppTurnBadge.classList.add('hidden');
    if (mePanel) mePanel.classList.remove('ring-2', 'ring-emerald-500/80', 'shadow-[0_0_30px_rgba(16,185,129,0.35)]');
  } else {
    el.oppName.textContent = opp.name;
    el.meName.textContent = me.name;
    el.oppGold.textContent = opp.gold;
    el.meGold.textContent = me.gold;
    el.oppCurrentBet.textContent = `(베팅: ${opp.currentBet}G)`;
    el.meCurrentBet.textContent = `(베팅: ${me.currentBet}G)`;

    const isOppTurn = matchData.currentTurnPlayerId === opp.id && matchData.phase === 'betting';
    if (isOppTurn) {
      el.oppTurnBadge.innerHTML = '<span class="inline-block w-2 h-2 rounded-full bg-amber-400 animate-ping mr-1"></span><span>⚡ 상대 턴</span>';
      el.oppTurnBadge.className = 'text-[9px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/25 text-amber-300 border border-amber-400/80 animate-pulse whitespace-nowrap flex items-center shadow-[0_0_12px_rgba(245,158,11,0.4)] flex-shrink-0';
      el.oppTurnBadge.classList.remove('hidden');
    } else {
      el.oppTurnBadge.classList.add('hidden');
    }

    const isMyTurn = matchData.currentTurnPlayerId === me.id && matchData.phase === 'betting';
    if (isMyTurn) {
      el.myTurnIndicator.innerHTML = '<span class="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping mr-1.5"></span><span>🔥 내 턴! 액션 선택</span>';
      el.myTurnIndicator.className = 'text-[11px] sm:text-xs font-black px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-emerald-500/25 text-emerald-300 border-2 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.5)] animate-pulse whitespace-nowrap flex items-center flex-shrink-0';
      el.bettingControls.classList.remove('opacity-50', 'pointer-events-none');
      if (mePanel) {
        mePanel.classList.add('ring-2', 'ring-emerald-500/80', 'shadow-[0_0_35px_rgba(16,185,129,0.35)]');
      }
    } else {
      el.myTurnIndicator.innerHTML = '<span>⏳ 상대방 턴 대기</span>';
      el.myTurnIndicator.className = 'text-[11px] sm:text-xs font-bold px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 whitespace-nowrap shadow-sm flex items-center flex-shrink-0';
      el.bettingControls.classList.add('opacity-50', 'pointer-events-none');
      if (mePanel) {
        mePanel.classList.remove('ring-2', 'ring-emerald-500/80', 'shadow-[0_0_35px_rgba(16,185,129,0.35)]');
      }
    }

    el.bettingControls.classList.remove('hidden');
    if (specPanel) specPanel.classList.add('hidden');
  }

  // 팟 및 상태
  el.tablePotDisplay.textContent = `${matchData.pot} G`;
  if (matchData.phase === 'round_end') {
    const isReferee = Boolean(state.isHost || state.isDemo);
    el.tableStatusBanner.innerHTML = `
      <div class="flex items-center justify-center gap-2 flex-wrap">
        <span>🔔 라운드 종료! 잠시 후 다음 라운드가 시작됩니다...</span>
        ${isReferee ? `
        <button id="btn-force-next-round" class="px-2.5 py-0.5 text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded shadow cursor-pointer transition transform active:scale-95 animate-pulse">
          바로 시작 ⏩
        </button>` : ''}
      </div>
    `;
    const forceBtn = document.getElementById('btn-force-next-round');
    if (forceBtn && isReferee) {
      forceBtn.onclick = (e) => {
        e.stopPropagation();
        if (roundTransitionTimeout) clearTimeout(roundTransitionTimeout);
        state.isStartingNextRound = false;
        executeStartNextRound();
      };
    }
  } else {
    el.tableStatusBanner.textContent = matchData.actionHistory[matchData.actionHistory.length - 1] || '베팅이 진행 중입니다.';
  }

  // 원격/상대방 액션 발생 시 애니메이션 알림 동기화
  if (matchData.actionHistory && Array.isArray(matchData.actionHistory)) {
    const curLen = matchData.actionHistory.length;
    if (state.lastActionHistoryLength !== undefined && curLen > state.lastActionHistoryLength) {
      const lastAction = matchData.actionHistory[curLen - 1];
      const timeSinceLocal = Date.now() - (state.lastLocalActionTimestamp || 0);
      if (timeSinceLocal > 1200 && lastAction) {
        checkAndAnnounceRemoteAction(lastAction);
      }
    }
    state.lastActionHistoryLength = curLen;
  }

  // 베팅 슬라이더 범위 조정 (직전 상대 베팅금 + 10 이상, 최대 본인 보유 골드 한도)
  const minBet = matchData.currentHighestBet + 10;
  const maxBet = me.gold;
  el.betSlider.min = minBet;
  el.betSlider.max = Math.max(minBet, maxBet);
  el.betSlider.value = Math.min(Math.max(minBet, parseInt(el.betSlider.value, 10) || minBet), Math.max(minBet, maxBet));
  el.betSliderVal.textContent = `${el.betSlider.value} G`;
  el.betBtnText.textContent = `베팅 (${el.betSlider.value}G)`;

  // 콜 가능 여부 및 금액 계산 (상대가 부른 베팅금과 동일한 금액 지불, 부족 시 올인)
  const isFirstBetOfRound = matchData.currentHighestBet <= 0;
  const callCost = Math.min(me.gold, matchData.currentHighestBet);

  if (isFirstBetOfRound) {
    el.callBtnText.textContent = '콜 불가';
    el.btnActionCall.disabled = true;
    el.btnActionCall.classList.add('opacity-40', 'cursor-not-allowed');
  } else {
    el.callBtnText.textContent = `콜 (${callCost}G)`;
    el.btnActionCall.disabled = false;
    el.btnActionCall.classList.remove('opacity-40', 'cursor-not-allowed');
  }

  // 레이즈(추가 베팅) 가능 여부 판정 (올인 상대 레이즈 불가, 자금 부족 시 불가)
  const canRaise = (minBet <= maxBet) && !opp.isAllIn && (opp.gold > 0);
  if (!canRaise) {
    el.btnActionBet.disabled = true;
    el.btnActionBet.classList.add('opacity-40', 'cursor-not-allowed');
    el.betSlider.disabled = true;
    if (el.btnQuickMin) el.btnQuickMin.disabled = true;
    if (el.btnQuick20) el.btnQuick20.disabled = true;
    if (el.btnQuick50) el.btnQuick50.disabled = true;
    if (el.btnQuickAllin) el.btnQuickAllin.disabled = true;
  } else {
    el.btnActionBet.disabled = false;
    el.btnActionBet.classList.remove('opacity-40', 'cursor-not-allowed');
    el.betSlider.disabled = false;
    if (el.btnQuickMin) el.btnQuickMin.disabled = false;
    if (el.btnQuick20) el.btnQuick20.disabled = false;
    if (el.btnQuick50) el.btnQuick50.disabled = false;
    if (el.btnQuickAllin) el.btnQuickAllin.disabled = false;
  }

  // 상대방 카드: 테이블 위 공개 카드 vs 손패 비공개 카드 분리 (쇼다운 전체 공개 패가 테이블에 한꺼번에 쏟아지는 것 방지)
  const oppCards = Array.isArray(opp.cards) ? opp.cards : Object.values(opp.cards || {});
  const oppRevealed = oppCards.filter(s => s && (s.revealedInPlay ?? s.isRevealed));
  const oppUnrevealed = oppCards.filter(s => s && !(s.revealedInPlay ?? s.isRevealed));

  // 내 카드: 테이블 위 공개 카드 vs 손패 비공개 카드 분리
  const meCards = Array.isArray(me.cards) ? me.cards : Object.values(me.cards || {});
  const meRevealed = meCards.filter(s => s && (s.revealedInPlay ?? s.isRevealed));
  const meUnrevealed = meCards.filter(s => s && !(s.revealedInPlay ?? s.isRevealed));

  // 활성 카드 이미지 선제적 프리로드
  preloadCardList(oppRevealed);
  preloadCardList(meRevealed);
  preloadCardList(meUnrevealed);

  // 1. 테이블 위 공개 카드 렌더링 (깜빡임 없는 점진적 추가)
  renderTableCards(el.oppTableCards, oppRevealed, true);
  renderTableCards(el.meTableCards, meRevealed, false);

  // 2. 손패 비공개 카드 렌더링 (기존 DOM 재사용으로 이미지 리로드 방지)
  renderOppHandCards(el.oppHandContainer, oppUnrevealed);
  renderMyHandCards(el.meHandContainer, meUnrevealed, !isSpectator);

  // 실시간 로그 업데이트 (내용이 같으면 DOM 교체 스킵 및 XSS 방어)
  const logsHtml = matchData.actionHistory.slice(-8).map(log => `<div>${escapeHtml(log)}</div>`).join('');
  if (el.duelLogsList.innerHTML !== logsHtml) {
    el.duelLogsList.innerHTML = logsHtml;
    el.duelLogsList.scrollTop = el.duelLogsList.scrollHeight;
  }

  // 쇼다운 단계 진입 시 모달 띄우기 (콜 -> 쇼다운 자연스러운 전환 애니메이션 연출)
  if (matchData.phase === 'showdown') {
    handleShowdownPhaseEntry(matchData);
  } else if (matchData.phase !== 'round_end' && matchData.phase !== 'match_end') {
    closeShowdownModalInstantly();
  }

  // 직전 엔진 단계 기록
  state.previousEnginePhase = matchData.phase;
}

// ================= 이미지 프리로딩 & 캐시 시스템 (깜빡임 원천 차단) =================
const imagePreloadCache = new Set();
function preloadCardImage(url) {
  if (!url || imagePreloadCache.has(url)) return;
  imagePreloadCache.add(url);
  const img = new Image();
  img.decoding = 'async';
  img.src = url;
}

function preloadCardList(cards) {
  if (!cards) return;
  const list = Array.isArray(cards) ? cards : Object.values(cards);
  list.forEach(c => {
    const url = c?.image || (c?.card && c.card.image) || (c?.cardId && CARD_MAP[c.cardId]?.image);
    if (url) preloadCardImage(url);
  });
}

function startBackgroundCardImageWarmup() {
  const allCards = Object.values(CARD_MAP);
  let idx = 0;
  const batchSize = 12;

  function loadNextBatch() {
    const end = Math.min(idx + batchSize, allCards.length);
    for (let i = idx; i < end; i++) {
      if (allCards[i]?.image) {
        preloadCardImage(allCards[i].image);
      }
    }
    idx = end;
    if (idx < allCards.length) {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(loadNextBatch, { timeout: 1000 });
      } else {
        setTimeout(loadNextBatch, 100);
      }
    }
  }

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(loadNextBatch, { timeout: 2000 });
  } else {
    setTimeout(loadNextBatch, 400);
  }
}

// ================= 공통 카드 DOM 생성기 (인라인 카드 렌더링 & Eager 디코딩) =================
function createCardElement(cardData, isFlipped = true, slamClass = '') {
  const cardEl = document.createElement('div');
  cardEl.className = `poker-card ${isFlipped ? 'flipped' : ''} ${slamClass}`.trim();
  if (cardData?.id) {
    cardEl.setAttribute('data-card-id', cardData.id);
  }

  let frontHtml = '';
  if (cardData) {
    preloadCardImage(cardData.image);
    frontHtml = `
      <div class="card-front rarity-${cardData.rarity} flex flex-col justify-between">
        <div class="card-art-box">
          <img src="${cardData.image}" alt="${cardData.name}" class="card-official-img" loading="eager" decoding="async">
        </div>
        <div class="card-name-banner">
          <div class="card-title-text">${cardData.name}</div>
          <div class="card-type-tag">${TYPE_LABELS[cardData.type] || cardData.type}</div>
        </div>
      </div>
    `;
  }

  const backHtml = `
    <div class="card-back">
      <div class="card-back-pattern">
        <i data-lucide="shield" class="w-6 h-6 sm:w-8 sm:h-8 text-indigo-400/40 mb-1"></i>
        <span class="text-[9px] font-black text-indigo-300/40 uppercase tracking-widest font-cinzel">POKER</span>
      </div>
    </div>
  `;

  cardEl.innerHTML = `
    <div class="card-inner">
      ${backHtml}
      ${frontHtml}
    </div>
  `;

  return cardEl;
}

// ================= 테이블 위 공개 카드 렌더링 (깜빡임 방지 DOM Reconciliation) =================
function renderTableCards(container, revealedSlots, isOpponent = false) {
  if (!container) return;

  if (!revealedSlots || revealedSlots.length === 0) {
    if (!container.querySelector('.table-slot-placeholder')) {
      container.innerHTML = '<div class="table-slot-placeholder text-slate-500/40 text-[10px] font-bold"><span>대기</span></div>';
    }
    return;
  }

  const placeholder = container.querySelector('.table-slot-placeholder');
  if (placeholder) {
    placeholder.remove();
  }

  const currentKeys = new Set();
  revealedSlots.forEach((slot, idx) => {
    const cardId = slot.cardId || (slot.card && slot.card.id) || (slot.revealed && slot.revealed.cardId) || `card_${idx}`;
    const uniqueKey = `${isOpponent ? 'opp' : 'me'}_r${state.lastDealtRound || 1}_s${slot.index ?? idx}_${cardId}`;
    currentKeys.add(uniqueKey);

    let existingItem = container.querySelector(`.table-card-item[data-card-key="${uniqueKey}"]`);
    if (!existingItem) {
      let slamClass = '';
      if (!state.revealedCardKeys.has(uniqueKey)) {
        state.revealedCardKeys.add(uniqueKey);
        slamClass = isOpponent ? 'opp-card-just-played' : 'card-just-played';
        sounds.playCardFlip();
      }

      const cardData = slot.card || CARD_MAP[cardId];
      const cardItem = document.createElement('div');
      cardItem.className = 'table-card-item';
      cardItem.setAttribute('data-card-key', uniqueKey);

      const cardEl = createCardElement(cardData, true, slamClass);
      cardItem.appendChild(cardEl);
      container.appendChild(cardItem);
    }
  });

  // 이전 라운드 등 유효하지 않은 카드만 안전하게 제거
  const items = container.querySelectorAll('.table-card-item');
  items.forEach(item => {
    const key = item.getAttribute('data-card-key');
    if (key && !currentKeys.has(key)) {
      item.remove();
    }
  });
}

// ================= 내 손패 비공개 카드 렌더링 (깜빡임 방지 DOM Reconciliation) =================
function renderMyHandCards(container, unrevealedSlots, isOwner = true) {
  if (!container) return;

  const count = unrevealedSlots.length;
  if (el.meHandTitle) {
    if (count === 0) {
      el.meHandTitle.textContent = '내 손패 (모든 카드가 테이블에 공개되었습니다)';
    } else {
      el.meHandTitle.textContent = `내 손패 (${count}장 남음)`;
    }
  }

  if (count === 0) {
    container.innerHTML = '';
    return;
  }

  const currentSlotIndices = new Set();
  const fanIdx = Math.min(Math.max(count, 1), 4);

  unrevealedSlots.forEach((slot, i) => {
    currentSlotIndices.add(slot.index);
    const posIdx = Math.min(i, 3);
    const targetFanClass = `hand-fan-${fanIdx}-${posIdx}`;
    const isSelected = state.selectedCardToPlayIndex === slot.index;

    let wrapper = container.querySelector(`.hand-card-wrapper[data-slot-index="${slot.index}"]`);
    const cardData = slot.card;

    if (wrapper) {
      // 1. 이미 마운트된 카드는 DOM/이미지를 파괴하지 않고 클래스만 갱신
      wrapper.className = `hand-card-wrapper ${targetFanClass} ${isSelected ? 'hand-card-selected' : ''}`;
      const currentCardId = wrapper.getAttribute('data-card-id');
      const newCardId = cardData ? cardData.id : 'secret';
      if (currentCardId !== newCardId) {
        wrapper.setAttribute('data-card-id', newCardId);
        wrapper.innerHTML = '';
        const cardEl = createCardElement(cardData, isOwner && !!cardData, '');
        wrapper.appendChild(cardEl);
      }
    } else {
      // 2. 신규 카드만 생성
      wrapper = document.createElement('div');
      wrapper.setAttribute('data-slot-index', slot.index);
      wrapper.setAttribute('data-card-id', cardData ? cardData.id : 'secret');
      wrapper.className = `hand-card-wrapper ${targetFanClass} ${isSelected ? 'hand-card-selected' : ''}`;

      const isFlipped = isOwner && cardData;
      const cardEl = createCardElement(cardData, isFlipped, '');

      if (isOwner) {
        wrapper.title = `${cardData ? cardData.name : '카드'} (클릭하여 베팅/콜 시 제출 카드로 지정)`;
        wrapper.addEventListener('click', (e) => {
          e.stopPropagation();
          sounds.playCardFlip();
          if (state.selectedCardToPlayIndex === slot.index) {
            state.selectedCardToPlayIndex = null;
            wrapper.classList.remove('hand-card-selected');
          } else {
            state.selectedCardToPlayIndex = slot.index;
            container.querySelectorAll('.hand-card-wrapper').forEach(w => w.classList.remove('hand-card-selected'));
            wrapper.classList.add('hand-card-selected');
          }

          if (state.pendingAction) {
            executePendingAction(slot.index);
          }
        });
      }

      wrapper.appendChild(cardEl);
      container.appendChild(wrapper);
    }
  });

  // 손에서 빠져나간 카드만 DOM에서 제거
  const existingWrappers = container.querySelectorAll('.hand-card-wrapper');
  existingWrappers.forEach(w => {
    const sIdx = parseInt(w.getAttribute('data-slot-index'), 10);
    if (!currentSlotIndices.has(sIdx)) {
      w.remove();
    }
  });
}

// ================= 상대방 손패 비공개 카드 렌더링 =================
function renderOppHandCards(container, unrevealedSlots) {
  if (!container) return;

  const count = unrevealedSlots.length;
  if (count === 0) {
    container.innerHTML = '';
    return;
  }

  const fanIdx = Math.min(Math.max(count, 1), 4);

  // 개수가 줄어든 경우 초과분 제거
  while (container.children.length > count) {
    container.lastElementChild.remove();
  }

  // 부족한 경우 뒷면 카드 추가
  while (container.children.length < count) {
    const wrapper = document.createElement('div');
    const cardEl = document.createElement('div');
    cardEl.className = 'poker-card';
    cardEl.innerHTML = `
      <div class="card-inner">
        <div class="card-back">
          <div class="card-back-pattern">
            <i data-lucide="shield" class="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400/30 mb-0.5"></i>
            <span class="text-[7px] sm:text-[8px] font-black text-indigo-300/30 uppercase tracking-widest font-cinzel">POKER</span>
          </div>
        </div>
      </div>
    `;
    wrapper.appendChild(cardEl);
    container.appendChild(wrapper);
  }

  // 각 카드의 부채꼴 각도 클래스 갱신
  Array.from(container.children).forEach((wrapper, i) => {
    const posIdx = Math.min(i, 3);
    wrapper.className = `opp-hand-wrapper opp-fan-${fanIdx}-${posIdx}`;
  });
}

// ================= 쇼다운 모달용 카드 렌더링 =================
function renderCards(container, cardSlots, forceFlipped = false) {
  if (!container) return;
  if (!cardSlots || !Array.isArray(cardSlots)) {
    container.innerHTML = '';
    return;
  }

  const existingCards = Array.from(container.children);
  const canReuse = existingCards.length === cardSlots.length;

  cardSlots.forEach((slot, idx) => {
    const cardId = slot.card?.id || slot.cardId || slot.revealed?.cardId;
    const cardData = slot.card || (cardId && CARD_MAP[cardId]) || CARD_MAP['knight'];
    const isFlipped = forceFlipped || !!slot.isRevealed;

    if (canReuse) {
      const existingEl = existingCards[idx];
      const prevCardId = existingEl.getAttribute('data-card-id');
      const prevFlipped = existingEl.classList.contains('flipped');

      if (prevCardId === cardData.id && prevFlipped === !!isFlipped) {
        return; // 동일한 상태면 DOM 재생성 스킵 (깜빡임 0)
      }
      const newCardEl = createCardElement(cardData, isFlipped);
      container.replaceChild(newCardEl, existingEl);
    } else {
      if (idx === 0) container.innerHTML = '';
      const newCardEl = createCardElement(cardData, isFlipped);
      container.appendChild(newCardEl);
    }
  });
}

// ================= 5장 덱 지급 및 확인 모달 =================
function openDealCardsModal(autoCountdown = true) {
  const engine = state.activeMatchEngine;
  if (!engine) return;

  const myUid = fb.getUid();
  const match = state.tournament ? state.tournament.matches[engine.matchIndex] : null;
  const isP1 = (engine.p1.uid && myUid === engine.p1.uid) || (match && state.myPlayerIndex === match.p1Idx);
  const isP2 = (engine.p2.uid && myUid === engine.p2.uid) || (match && state.myPlayerIndex === match.p2Idx);
  if (!isP1 && !isP2) return; // 관전자는 덱 모달 띄우지 않음

  const me = isP2 ? engine.p2 : engine.p1;
  const curRound = engine.roundNumber;
  const curMatch = engine.matchIndex;
  const pKey = isP2 ? 'p2' : 'p1';
  const savedKey = `${curMatch}_${curRound}_${pKey}`;

  let secrets = null;
  if (state.savedMatchSecrets?.[savedKey] && state.savedMatchSecrets[savedKey].length >= 5) {
    secrets = state.savedMatchSecrets[savedKey];
  } else if (state.myPrivateSecrets && state.myPrivateSecrets.length >= 5 &&
      (!state.myPrivateSecretsRoundNumber || state.myPrivateSecretsRoundNumber === curRound)) {
    secrets = state.myPrivateSecrets;
  } else if (me.secrets && me.secrets.length >= 5) {
    secrets = me.secrets;
  }

  // 5장의 카드 데이터 취합
  const cards5 = [];
  const secretsList = Array.isArray(secrets) ? secrets : Object.values(secrets || {});
  const cardsList = Array.isArray(me.cards) ? me.cards : Object.values(me.cards || {});
  for (let i = 0; i < 5; i++) {
    let cardId = null;
    const sec = secretsList.find(s => s && s.index === i);
    if (sec && sec.cardId) cardId = sec.cardId;
    else if (sec && sec.card && sec.card.id) cardId = sec.card.id;

    if (!cardId && cardsList[i]) {
      const c = cardsList[i];
      if (c.revealed && c.revealed.cardId) cardId = c.revealed.cardId;
      else if (c.cardId) cardId = c.cardId;
      else if (c.card && c.card.id) cardId = c.card.id;
    }

    const cardData = (cardId && CARD_MAP[cardId]) ? CARD_MAP[cardId] : null;
    if (cardData) {
      cards5.push(cardData);
    }
  }

  // 5장의 카드 데이터가 완전히 준비되지 않은 경우엔 엉뚱한 기본 카드를 보여주지 않고 대기
  if (cards5.length < 5) {
    return;
  }

  if (el.dealRoundTitle) {
    el.dealRoundTitle.textContent = `ROUND ${engine.roundNumber || 1} 카드 덱 지급`;
  }
  if (el.dealCardsDeckContainer) {
    el.dealCardsDeckContainer.innerHTML = '';
    cards5.forEach((cardData, idx) => {
      preloadCardImage(cardData.image);
      const cardEl = createCardElement(cardData, true, `deal-anim-${idx}`);
      el.dealCardsDeckContainer.appendChild(cardEl);

      // 순차 딜링 사운드 효과
      setTimeout(() => {
        sounds.playCardFlip();
      }, 50 + idx * 150);
    });
  }

  // 이전 타이머 정리
  if (state.dealCountdownInterval) {
    clearInterval(state.dealCountdownInterval);
    state.dealCountdownInterval = null;
  }

  if (autoCountdown) {
    let timeLeft = 4;
    if (el.btnConfirmDeal) {
      el.btnConfirmDeal.innerHTML = `
        <i data-lucide="check-circle-2" class="w-4 h-4"></i>
        <span>패 확인 완료 & 게임 시작 (<span id="deal-countdown-text">${timeLeft}</span>초)</span>
      `;
    }
    state.dealCountdownInterval = setInterval(() => {
      timeLeft--;
      const cdSpan = document.getElementById('deal-countdown-text');
      if (cdSpan) cdSpan.textContent = `${timeLeft}`;
      if (timeLeft <= 0) {
        closeDealCardsModal();
      }
    }, 1000);
  } else {
    if (el.btnConfirmDeal) {
      el.btnConfirmDeal.innerHTML = `
        <i data-lucide="x" class="w-4 h-4"></i>
        <span>확인 완료 (창 닫기)</span>
      `;
    }
  }

  if (el.modalDealCards) {
    el.modalDealCards.classList.remove('hidden');
  }
  lucide.createIcons();
}

function closeDealCardsModal() {
  if (state.dealCountdownInterval) {
    clearInterval(state.dealCountdownInterval);
    state.dealCountdownInterval = null;
  }
  if (el.modalDealCards) {
    el.modalDealCards.classList.add('hidden');
  }
}

// ================= 베팅 컨트롤 조정 =================
function adjustBetBy(increment) {
  const current = parseInt(el.betSlider.value, 10);
  const min = parseInt(el.betSlider.min, 10);
  const max = parseInt(el.betSlider.max, 10);
  const nextVal = Math.min(Math.max(current + increment, min), max);
  el.betSlider.value = nextVal;
  el.betSliderVal.textContent = `${nextVal} G`;
  el.betBtnText.textContent = `베팅 (${nextVal}G)`;
}

function setAllInBet() {
  const max = parseInt(el.betSlider.max, 10);
  el.betSlider.value = max;
  el.betSliderVal.textContent = `${max} G`;
  el.betBtnText.textContent = `올인 (${max}G)`;
}

// ================= 베팅 / 콜 / 폴드 액션 흐름 =================
function promptBetAction() {
  const amount = parseInt(el.betSlider.value, 10);
  state.pendingAction = { type: 'bet', amount };
  if (state.selectedCardToPlayIndex !== null) {
    const idx = state.selectedCardToPlayIndex;
    state.selectedCardToPlayIndex = null;
    executePendingAction(idx);
    return;
  }
  openRevealCardModal();
}

function promptCallAction() {
  state.pendingAction = { type: 'call' };
  if (state.selectedCardToPlayIndex !== null) {
    const idx = state.selectedCardToPlayIndex;
    state.selectedCardToPlayIndex = null;
    executePendingAction(idx);
    return;
  }
  openRevealCardModal();
}

async function handleFoldAction() {
  if (!confirm('정말로 폴드(기권)하시겠습니까? 현재 테이블의 베팅금을 모두 잃게 됩니다.')) return;
  const engine = state.activeMatchEngine;
  const myUid = fb.getUid();
  const match = state.tournament ? state.tournament.matches[engine.matchIndex] : null;
  const isP2 = (engine.p2.uid && myUid === engine.p2.uid) || (match && state.myPlayerIndex === match.p2Idx);
  const me = isP2 ? engine.p2 : engine.p1;

  state.lastLocalActionTimestamp = Date.now();
  showActionAnnouncement(me.name, 'fold', null, true);
  sounds.playFold();
  await engine.actionFold(engine.currentTurnPlayerId);
  await syncMatchToFirebase();
  saveDemoState();
  renderDuelView();
  checkNextRoundOrMatchEnd();
}

// 카드 선택 팝업 열기
function openRevealCardModal() {
  const engine = state.activeMatchEngine;
  if (!engine) return;

  const myUid = fb.getUid();
  const match = state.tournament ? state.tournament.matches[engine.matchIndex] : null;
  const isP2 = (engine.p2.uid && myUid === engine.p2.uid) || (match && state.myPlayerIndex === match.p2Idx);
  const me = isP2 ? engine.p2 : engine.p1;

  // 비공개 카드만 추출
  const meCardsList = Array.isArray(me.cards) ? me.cards : Object.values(me.cards || {});
  const unrevealed = meCardsList.map((c, i) => ({ ...c, originalIndex: (c && c.index !== undefined) ? c.index : i })).filter(c => !c.revealed);

  if (unrevealed.length === 0) {
    // 이미 모든 카드가 공개된 상태라면 0번으로 진행
    executePendingAction(0);
    return;
  }

  el.revealCardOptions.innerHTML = '';
  const curRound = engine.roundNumber;
  const curMatch = engine.matchIndex;
  const pKey = isP2 ? 'p2' : 'p1';
  const savedKey = `${curMatch}_${curRound}_${pKey}`;

  let secrets = null;
  if (state.savedMatchSecrets?.[savedKey] && state.savedMatchSecrets[savedKey].length > 0) {
    secrets = state.savedMatchSecrets[savedKey];
  } else if (state.myPrivateSecrets && state.myPrivateSecrets.length > 0 &&
      (!state.myPrivateSecretsRoundNumber || state.myPrivateSecretsRoundNumber === curRound)) {
    secrets = state.myPrivateSecrets;
  } else if (me.secrets && me.secrets.length > 0) {
    secrets = me.secrets;
  }
  const secretsList = Array.isArray(secrets) ? secrets : Object.values(secrets || {});
  unrevealed.forEach((slot) => {
    // 1) secrets에서 찾기 -> 2) revealed -> 3) slot cardId -> 4) CARD_MAP
    let cardId = null;
    const sec = secretsList.find(s => s && s.index === slot.originalIndex);
    if (sec && sec.cardId) cardId = sec.cardId;
    else if (sec && sec.card && sec.card.id) cardId = sec.card.id;
    if (!cardId && slot.revealed && slot.revealed.cardId) cardId = slot.revealed.cardId;
    if (!cardId && slot.cardId) cardId = slot.cardId;
    if (!cardId && slot.card && slot.card.id) cardId = slot.card.id;

    const cardData = CARD_MAP[cardId] || CARD_MAP['knight'];

    const optBtn = document.createElement('div');
    optBtn.className = `reveal-choice-card rarity-${cardData.rarity} relative flex flex-col justify-between overflow-hidden shadow-2xl transition transform hover:scale-105 active:scale-95 cursor-pointer`;
    optBtn.innerHTML = `
      <div class="card-art-box"><img src="${cardData.image}" alt="${cardData.name}" class="card-official-img" loading="lazy"></div>
      <div class="card-name-banner">
        <div class="card-title-text">${cardData.name}</div>
        <div class="card-type-tag">${TYPE_LABELS[cardData.type] || cardData.type}</div>
      </div>
    `;

    optBtn.addEventListener('click', () => {
      el.modalRevealCard.classList.add('hidden');
      executePendingAction(slot.originalIndex);
    });

    el.revealCardOptions.appendChild(optBtn);
  });

  el.modalRevealCard.classList.remove('hidden');
  lucide.createIcons();
}

async function executePendingAction(revealCardIndex) {
  const engine = state.activeMatchEngine;
  const action = state.pendingAction;
  if (!action) return;

  try {
    const myUid = fb.getUid();
    const match = state.tournament ? state.tournament.matches[engine.matchIndex] : null;
    const isP2 = (engine.p2.uid && myUid === engine.p2.uid) || (match && state.myPlayerIndex === match.p2Idx);
    const me = isP2 ? engine.p2 : engine.p1;

    state.lastLocalActionTimestamp = Date.now();

    if (action.type === 'bet') {
      const isAllIn = (action.amount >= me.gold);
      showActionAnnouncement(me.name, isAllIn ? 'allin' : 'bet', action.amount, true);
      sounds.playChip();
      await engine.actionBet(engine.currentTurnPlayerId, action.amount, revealCardIndex);
    } else if (action.type === 'call') {
      const callCost = Math.min(me.gold, engine.currentHighestBet);
      const isAllIn = (callCost >= me.gold);
      showActionAnnouncement(me.name, isAllIn ? 'allin' : 'call', callCost, true);
      sounds.playCall();
      await engine.actionCall(engine.currentTurnPlayerId, revealCardIndex);
    }
    await syncMatchToFirebase();
    saveDemoState();
    renderDuelView();
    if (state.isHost || state.isDemo) {
      setTimeout(() => {
        if (state.activeMatchEngine && state.activeMatchEngine.phase === 'betting') {
          checkBotTurn();
        }
      }, 500);
    }
  } catch (err) {
    alert(err.message);
  } finally {
    state.pendingAction = null;
  }
}

// ================= AI 봇 턴 자동 처리 =================
async function checkBotTurn() {
  if (!state.isHost && !state.isDemo) return;
  const engine = state.activeMatchEngine;
  if (!engine || engine.phase !== 'betting') return;
  if (state.isBotThinking) return;

  const currentTurnId = engine.currentTurnPlayerId;
  const currentTurnPlayer = currentTurnId === engine.p1.id ? engine.p1 : engine.p2;
  const opponent = currentTurnId === engine.p1.id ? engine.p2 : engine.p1;

  // 봇 여부 판별 (Firebase 직렬화 및 slot/engine 속성 복합 검증)
  const match = state.tournament?.matches?.[engine.matchIndex];
  if (!match) return;
  const p1Slot = state.tournament.players[match.p1Idx];
  const p2Slot = state.tournament.players[match.p2Idx];
  const isP1Bot = isPlayerBot(p1Slot, engine.p1);
  const isP2Bot = isPlayerBot(p2Slot, engine.p2);
  const isBot = (currentTurnId === engine.p1.id && isP1Bot) || (currentTurnId === engine.p2.id && isP2Bot);

  if (!isBot) return;

  state.isBotThinking = true;

  // 봇 딜레이 (0.9초 적절한 긴장감)
  el.tableStatusBanner.textContent = `🤖 ${currentTurnPlayer.name} 님이 생각 중입니다...`;
  setTimeout(async () => {
    try {
      if (!state.activeMatchEngine || state.activeMatchEngine.phase !== 'betting') return;
      if (state.activeMatchEngine.currentTurnPlayerId !== currentTurnId) return;

      // 미공개 카드 중 1장 선택
      const unrevealedIdxs = currentTurnPlayer.cards
        .map((c, i) => (!c.revealed ? i : null))
        .filter(i => i !== null);
      const revealIdx = (unrevealedIdxs.length > 0)
        ? unrevealedIdxs[Math.floor(Math.random() * unrevealedIdxs.length)]
        : 0;

      const highestBet = engine.currentHighestBet;
      const botGold = currentTurnPlayer.gold;
      const minRaise = highestBet + 10;
      const canRaise = (minRaise <= botGold) && !opponent.isAllIn && (opponent.gold > 0);

      // AI 결정 휴리스틱
      // 1. 상대가 높은 베팅을 걸었을 때 (50G 이상) 카드가 약하면 가끔 폴드
      if (highestBet >= 50 && Math.random() < 0.2) {
        showActionAnnouncement(currentTurnPlayer.name, 'fold', null, false);
        sounds.playFold();
        await engine.actionFold(currentTurnId);
        await syncMatchToFirebase();
        saveDemoState();
        renderDuelView();
        checkNextRoundOrMatchEnd();
        return;
      }

      // 2. 콜 가능한 상황이고 베팅이 있으면 상황에 따라 레이즈 또는 콜
      if (highestBet > 0) {
        if (canRaise && Math.random() < 0.35) {
          // 레이즈 (minRaise 또는 한 단계 더 높은 베팅)
          const raiseAmount = (botGold >= minRaise + 10 && Math.random() < 0.3) ? (minRaise + 10) : minRaise;
          const isAllIn = (raiseAmount >= botGold);
          showActionAnnouncement(currentTurnPlayer.name, isAllIn ? 'allin' : 'bet', raiseAmount, false);
          sounds.playChip();
          await engine.actionBet(currentTurnId, raiseAmount, revealIdx);
        } else {
          // 콜
          const callCost = Math.min(botGold, highestBet);
          const isAllIn = (callCost >= botGold);
          showActionAnnouncement(currentTurnPlayer.name, isAllIn ? 'allin' : 'call', callCost, false);
          sounds.playCall();
          await engine.actionCall(currentTurnId, revealIdx);
        }
      } else {
        // 첫 베팅: 10 또는 20골드 베팅
        const betAmount = Math.min(botGold, Math.random() < 0.5 ? 10 : 20);
        const isAllIn = (betAmount >= botGold);
        showActionAnnouncement(currentTurnPlayer.name, isAllIn ? 'allin' : 'bet', betAmount, false);
        sounds.playChip();
        await engine.actionBet(currentTurnId, betAmount, revealIdx);
      }

      await syncMatchToFirebase();
      saveDemoState();
      renderDuelView();
    } catch (err) {
      console.error('[AI Bot] Action execution error:', err);
    } finally {
      state.isBotThinking = false;
    }

    // 락 해제 후 베팅 단계가 계속 진행 중이고 다음 턴도 봇이라면 연속 실행!
    if (state.isHost || state.isDemo) {
      setTimeout(() => {
        if (state.activeMatchEngine && state.activeMatchEngine.phase === 'betting') {
          checkBotTurn();
        }
      }, 500);
    }
  }, 900);
}

// ================= 쇼다운 진입 전 10장 카드 완전 복원 및 검증 시스템 =================

/**
 * 10장의 쇼다운 카드 중 아직 데이터가 미복원된 슬롯이 있는지 엄격 검사
 */
function hasMissingShowdownCards(matchData) {
  if (!matchData?.p1?.cards || !matchData?.p2?.cards) return true;
  const p1Cards = Array.isArray(matchData.p1.cards) ? matchData.p1.cards : Object.values(matchData.p1.cards);
  const p2Cards = Array.isArray(matchData.p2.cards) ? matchData.p2.cards : Object.values(matchData.p2.cards);
  if (p1Cards.length < 5 || p2Cards.length < 5) return true;
  const p1Missing = p1Cards.some(c => !c || !c.card || !c.cardId || (c.cardId === 'knight' && !c.isRevealed));
  const p2Missing = p2Cards.some(c => !c || !c.card || !c.cardId || (c.cardId === 'knight' && !c.isRevealed));
  return p1Missing || p2Missing;
}

/**
 * 쇼다운 모달 오픈 전 모든 10장의 카드 데이터를 100% 온전하게 복원
 * (비밀 패, roundSecrets, Firebase matchState 다중 복원 경로 지원)
 */
async function ensureAllCardsRevealedForShowdown(matchData) {
  const engine = state.activeMatchEngine;
  if (!matchData) return matchData;

  const myUid = fb.getUid();
  const match = state.tournament ? state.tournament.matches[matchData.matchIndex] : null;
  const isP1 = (matchData.p1?.uid && myUid === matchData.p1.uid) || (match && state.myPlayerIndex === match.p1Idx);
  const isP2 = (matchData.p2?.uid && myUid === matchData.p2.uid) || (match && state.myPlayerIndex === match.p2Idx);

  const curRound = matchData.roundNumber;
  const curMatch = matchData.matchIndex;

  // 1. 본인 카드인 경우 state.myPrivateSecrets를 통해 즉시 복원 (현재 라운드 일치 확인)
  const isMySecretsValid = state.myPrivateSecrets && state.myPrivateSecrets.length >= 5 &&
    (!state.myPrivateSecretsRoundNumber || state.myPrivateSecretsRoundNumber === curRound);

  if (isP1 && isMySecretsValid) {
    matchData.p1.cards = matchData.p1.cards.map((c, i) => {
      const sec = state.myPrivateSecrets.find(s => s && s.index === i) || state.myPrivateSecrets[i];
      const cardId = (c.revealed && c.revealed.cardId) || sec?.cardId || sec?.card?.id || c.cardId;
      return {
        ...c,
        index: i,
        isRevealed: true,
        cardId: cardId,
        card: (cardId && CARD_MAP[cardId]) || c.card || CARD_MAP['knight']
      };
    });
  }
  if (isP2 && isMySecretsValid) {
    matchData.p2.cards = matchData.p2.cards.map((c, i) => {
      const sec = state.myPrivateSecrets.find(s => s && s.index === i) || state.myPrivateSecrets[i];
      const cardId = (c.revealed && c.revealed.cardId) || sec?.cardId || sec?.card?.id || c.cardId;
      return {
        ...c,
        index: i,
        isRevealed: true,
        cardId: cardId,
        card: (cardId && CARD_MAP[cardId]) || c.card || CARD_MAP['knight']
      };
    });
  }

  // 2. 엔진 인스턴스에 secrets가 존재하는 경우 (호스트 또는 로컬 데모)
  if (engine) {
    if (engine.p1?.secrets && engine.p1.secrets.length > 0) {
      matchData.p1.cards = matchData.p1.cards.map((c, i) => {
        const sec = engine.p1.secrets.find(s => s && s.index === i) || engine.p1.secrets[i];
        const cardId = (c.revealed && c.revealed.cardId) || sec?.cardId || sec?.card?.id || c.cardId;
        return {
          ...c,
          index: i,
          isRevealed: true,
          cardId: cardId,
          card: (cardId && CARD_MAP[cardId]) || c.card || CARD_MAP['knight']
        };
      });
    }
    if (engine.p2?.secrets && engine.p2.secrets.length > 0) {
      matchData.p2.cards = matchData.p2.cards.map((c, i) => {
        const sec = engine.p2.secrets.find(s => s && s.index === i) || engine.p2.secrets[i];
        const cardId = (c.revealed && c.revealed.cardId) || sec?.cardId || sec?.card?.id || c.cardId;
        return {
          ...c,
          index: i,
          isRevealed: true,
          cardId: cardId,
          card: (cardId && CARD_MAP[cardId]) || c.card || CARD_MAP['knight']
        };
      });
    }
  }

  // 3. 미공개 카드가 남아있다면 Firebase의 roundSecrets에서 조회하여 100% 복원
  const p1Missing = matchData.p1.cards.some(c => !c.card || !c.cardId || !c.isRevealed);
  const p2Missing = matchData.p2.cards.some(c => !c.card || !c.cardId || !c.isRevealed);
  if ((p1Missing || p2Missing) && fb.isInitialized && state.roomId) {
    try {
      const key = `${matchData.matchIndex}_${matchData.roundNumber}`;
      const roundSecretSnap = await get(ref(fb.db, `rooms/${state.roomId}/roundSecrets/${key}`));
      const rSecrets = roundSecretSnap.val();
      if (rSecrets) {
        if (rSecrets.p1Secrets) {
          const list = Array.isArray(rSecrets.p1Secrets) ? rSecrets.p1Secrets : Object.values(rSecrets.p1Secrets);
          if (engine) engine.p1.secrets = list;
          matchData.p1.cards = matchData.p1.cards.map((c, i) => {
            const sec = list.find(s => s && s.index === i) || list[i];
            const cardId = (c.revealed && c.revealed.cardId) || sec?.cardId || sec?.card?.id || c.cardId;
            return {
              ...c,
              index: i,
              isRevealed: true,
              cardId: cardId,
              card: (cardId && CARD_MAP[cardId]) || c.card || CARD_MAP['knight']
            };
          });
        }
        if (rSecrets.p2Secrets) {
          const list = Array.isArray(rSecrets.p2Secrets) ? rSecrets.p2Secrets : Object.values(rSecrets.p2Secrets);
          if (engine) engine.p2.secrets = list;
          matchData.p2.cards = matchData.p2.cards.map((c, i) => {
            const sec = list.find(s => s && s.index === i) || list[i];
            const cardId = (c.revealed && c.revealed.cardId) || sec?.cardId || sec?.card?.id || c.cardId;
            return {
              ...c,
              index: i,
              isRevealed: true,
              cardId: cardId,
              card: (cardId && CARD_MAP[cardId]) || c.card || CARD_MAP['knight']
            };
          });
        }
      }
    } catch (e) {
      console.warn('roundSecrets 복원 시도 실패:', e);
    }
  }

  // 4. Firebase matchState/p1, p2 카드가 이미 revealed 되어있는 경우 추가 보강
  if (fb.isInitialized && state.roomId && (matchData.p1.cards.some(c => !c.card || !c.cardId) || matchData.p2.cards.some(c => !c.card || !c.cardId))) {
    try {
      const matchSnap = await get(ref(fb.db, `rooms/${state.roomId}/matchState`));
      const mVal = matchSnap.val();
      if (mVal) {
        ['p1', 'p2'].forEach(pKey => {
          if (mVal[pKey]?.cards) {
            const fbCards = Array.isArray(mVal[pKey].cards) ? mVal[pKey].cards : Object.values(mVal[pKey].cards);
            matchData[pKey].cards = matchData[pKey].cards.map((c, i) => {
              const fbC = fbCards[i];
              const cardId = c.cardId || c.card?.id || fbC?.revealed?.cardId || fbC?.cardId;
              return {
                ...c,
                index: i,
                isRevealed: true,
                cardId: cardId,
                card: (cardId && CARD_MAP[cardId]) || c.card || CARD_MAP['knight']
              };
            });
          }
        });
      }
    } catch (e) {
      console.warn('matchState 추가 복원 시도 실패:', e);
    }
  }

  // 5. 엔진 인스턴스에도 복원된 카드를 반영하여 불일치 방지
  if (engine) {
    if (matchData.p1?.cards) {
      matchData.p1.cards.forEach((c, i) => {
        if (engine.p1.cards[i] && c.cardId) {
          engine.p1.cards[i].revealed = { cardId: c.cardId, salt: '' };
          engine.p1.cards[i].isRevealed = true;
          engine.p1.cards[i].cardId = c.cardId;
          engine.p1.cards[i].card = c.card;
        }
      });
    }
    if (matchData.p2?.cards) {
      matchData.p2.cards.forEach((c, i) => {
        if (engine.p2.cards[i] && c.cardId) {
          engine.p2.cards[i].revealed = { cardId: c.cardId, salt: '' };
          engine.p2.cards[i].isRevealed = true;
          engine.p2.cards[i].cardId = c.cardId;
          engine.p2.cards[i].card = c.card;
        }
      });
    }
  }

  // 6. 모든 카드 이미지 선제적 프리로드 (이미지 팝인 방지)
  preloadCardList(matchData.p1.cards);
  preloadCardList(matchData.p2.cards);

  return matchData;
}

// ================= 친선전 (쇼다운) 전환 및 모달 애니메이션 시스템 =================

/**
 * 쇼다운 모달 및 관련 애니메이션 상태 즉각 완전 정리 및 닫기
 */
function closeShowdownModalInstantly() {
  state.activeShowdownKey = null;
  state.isShowdownAnimating = false;
  if (state.botShowdownAutoTimer) {
    clearTimeout(state.botShowdownAutoTimer);
    state.botShowdownAutoTimer = null;
  }
  if (state.participantShowdownCloseTimer) {
    clearTimeout(state.participantShowdownCloseTimer);
    state.participantShowdownCloseTimer = null;
  }
  if (state.showdownTransitionTimer) {
    clearTimeout(state.showdownTransitionTimer);
    state.showdownTransitionTimer = null;
  }
  if (state.showdownAnimTimers) {
    state.showdownAnimTimers.forEach(t => clearTimeout(t));
    state.showdownAnimTimers = [];
  }
  if (el.modalShowdown) {
    el.modalShowdown.classList.remove('showdown-modal-active');
    el.modalShowdown.classList.add('hidden');
  }
  if (el.showdownWinnerBanner) {
    el.showdownWinnerBanner.classList.add('hidden');
  }
}

/**
 * 쇼다운 모달 내부 승리 축하 배너 표시 (호스트 및 관전자 공통)
 */
function showInModalShowdownVictory(winnerName, wonPot) {
  const refereeControls = document.getElementById('showdown-referee-controls');
  const spectatorNotice = document.getElementById('showdown-spectator-notice');

  if (refereeControls) refereeControls.classList.add('hidden');
  if (spectatorNotice) spectatorNotice.classList.add('hidden');

  if (el.showdownWinnerBanner && el.showdownWinnerBannerText) {
    el.showdownWinnerBannerText.textContent = `🏆 ${winnerName} 친선전 승리! (+${wonPot}G 획득)`;
    el.showdownWinnerBanner.classList.remove('hidden');
  }

  if (sounds && typeof sounds.playWin === 'function') {
    sounds.playWin();
  }
  if (typeof confetti === 'function') {
    try { confetti({ particleCount: 75, spread: 65, origin: { y: 0.5 } }); } catch (e) {}
  }
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

/**
 * 매치 승리 축하 글로벌 모달 표시 (논블로킹 & 초고속 전환)
 */
function showMatchWinnerCelebration(winnerName) {
  if (el.modalMatchWinner) {
    if (el.matchWinnerTitle) el.matchWinnerTitle.textContent = `🏆 ${winnerName} 매치 승리!`;
    if (el.matchWinnerSubtitle) el.matchWinnerSubtitle.textContent = `${winnerName} 님이 상대방의 골드를 모두 획득하고 다음 라운드로 진출합니다!`;
    el.modalMatchWinner.classList.remove('hidden');
    el.modalMatchWinner.classList.remove('pointer-events-none');
    void el.modalMatchWinner.offsetWidth;
    el.modalMatchWinner.classList.remove('opacity-0');
    el.modalMatchWinner.classList.add('opacity-100');
    try { sounds.playWin(); } catch (e) {}
    try { if (typeof confetti === 'function') confetti({ particleCount: 110, spread: 80, origin: { y: 0.45 } }); } catch (e) {}
    try { if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons(); } catch (e) {}
  }
}

/**
 * 매치 승리 축하 글로벌 모달 숨김
 */
function hideMatchWinnerCelebration() {
  if (el.modalMatchWinner) {
    el.modalMatchWinner.classList.add('pointer-events-none');
    el.modalMatchWinner.classList.remove('opacity-100');
    el.modalMatchWinner.classList.add('opacity-0');
    setTimeout(() => {
      el.modalMatchWinner.classList.add('hidden');
    }, 300);
  }
}

/**
 * 쇼다운 단계 진입 핸들러 (콜 직후 자연스러운 연결 및 애니메이션 연출)
 */
function handleShowdownPhaseEntry(matchData) {
  const showdownKey = `${matchData.matchIndex || 0}_r${matchData.roundNumber || 0}`;
  const isFreshEntry = (state.activeShowdownKey !== showdownKey);
  const wasBetting = (state.previousEnginePhase === 'betting');

  state.activeShowdownKey = showdownKey;

  if (isFreshEntry) {
    if (wasBetting) {
      // 콜 직후: 테이블에서 '콜!' 팝업과 테이블 공개 카드가 충분히 노출된 뒤
      // 쇼다운 예고 배너가 등장하고 모달이 부드럽게 페이드인 되도록 1.4초 딜레이
      triggerShowdownTransitionBanner();

      if (state.showdownTransitionTimer) clearTimeout(state.showdownTransitionTimer);
      state.showdownTransitionTimer = setTimeout(async () => {
        state.showdownTransitionTimer = null;
        await resolveAndOpenShowdownModal(true);
      }, 1400);
      return;
    } else {
      // 새로고침이나 관전 등으로 이미 쇼다운 상태인 경우 즉시 온전하게 표시 (애니메이션 대기 없이)
      resolveAndOpenShowdownModal(false);
      return;
    }
  }

  // 모달이 열려있고 애니메이션 연출 중이 아닐 때만 내용 실시간 갱신 (중간에 DOM이 흔들리지 않도록 보호)
  if (!state.showdownTransitionTimer && !state.isShowdownAnimating && !el.modalShowdown.classList.contains('hidden')) {
    updateShowdownModalContent(state.activeMatchEngine?.getState() || matchData, false);
  }
}

/**
 * 쇼다운에 필요한 모든 10장 카드를 100% 복원한 뒤 쇼다운 모달을 오픈
 */
async function resolveAndOpenShowdownModal(isFresh = true) {
  const engine = state.activeMatchEngine;
  if (!engine) return;

  // 1. 최신 matchData 획득
  let matchData = engine.getState();

  // 2. 미공개 카드가 남아있다면 secrets 또는 Firebase roundSecrets에서 100% 복원
  matchData = await ensureAllCardsRevealedForShowdown(matchData);

  // 3. 만약 여전히 상대 카드가 비어있다면 Firebase roundSecrets 재시도 (최대 3회 폴링)
  let retries = 0;
  while (retries < 3 && hasMissingShowdownCards(matchData) && fb.isInitialized && state.roomId) {
    await new Promise(r => setTimeout(r, 200));
    matchData = await ensureAllCardsRevealedForShowdown(matchData);
    retries++;
  }

  // 4. 쇼다운 모달 오픈 및 애니메이션 실행
  await openShowdownModalWithAnimation(matchData, isFresh);
}

/**
 * 테이블 위 웅장한 쇼다운 예고 전환 배너 (콜 -> 쇼다운 자연스러운 연결 브릿지)
 */
function triggerShowdownTransitionBanner() {
  const container = el.actionAnnouncementLayer || document.getElementById('action-announcement-layer');
  if (!container) return;

  // 350ms 후 콜 팝업 바로 뒤를 이어 웅장한 쇼다운 배너 등장
  setTimeout(() => {
    if (state.view !== 'duel') return;

    sounds.playCall();

    const pot = state.activeMatchEngine?.pot || 0;
    const banner = document.createElement('div');
    banner.className = 'showdown-transition-banner';
    banner.innerHTML = `
      <div class="showdown-trans-swords">⚔️</div>
      <div class="showdown-trans-title">SHOWDOWN!</div>
      <div class="showdown-trans-sub">5장 패 전체 공개 & 친선전 돌입</div>
      <div class="showdown-trans-pot">💰 총 판돈: ${pot}G</div>
    `;

    container.appendChild(banner);

    setTimeout(() => {
      if (banner && banner.parentNode) {
        banner.parentNode.removeChild(banner);
      }
    }, 1300);
  }, 350);
}

/**
 * 쇼다운 모달을 부드러운 팝인 애니메이션과 함께 표시
 */
async function openShowdownModalWithAnimation(matchData, isFresh = true) {
  await updateShowdownModalContent(matchData, isFresh);

  // 모달 표시 및 부드러운 전환 활성화
  el.modalShowdown.classList.remove('hidden');
  el.modalShowdown.classList.remove('showdown-modal-active');
  void el.modalShowdown.offsetWidth; // Force reflow
  el.modalShowdown.classList.add('showdown-modal-active');

  // 내부 카드들 순차적 3D 뒤집기 공개 애니메이션 실행
  animateShowdownDeckRows(isFresh);

  lucide.createIcons();
}

/**
 * 쇼다운 모달 내부 카드 순차적 3D 뒤집기 공개 애니메이션
 * - 모든 카드는 뒷면(card-back)으로 깔려있어 중간에 빈 구멍이 발생하지 않습니다.
 * - 1단계: 선수 1의 덱 5장 0번부터 4번까지 순차 3D 뒤집기 (0.35s ~ 1.07s)
 * - 2단계: 중앙 VS 배지 대치 펄스 & 격돌 사운드 (1.35s)
 * - 3단계: 선수 2의 덱 5장 0번부터 4번까지 순차 3D 뒤집기 (1.65s ~ 2.37s)
 * - 4단계: 심판 승자 판정 버튼 및 관전자 안내 부드러운 페이드인 (2.65s)
 */
function animateShowdownDeckRows(isFresh = true) {
  const p1Cards = el.showdownP1Cards.querySelectorAll('.poker-card');
  const p2Cards = el.showdownP2Cards.querySelectorAll('.poker-card');
  const vsBadge = el.modalShowdown.querySelector('.showdown-vs-badge');
  const refereeControls = document.getElementById('showdown-referee-controls');
  const spectatorNotice = document.getElementById('showdown-spectator-notice');

  // 이전 연출 타이머 정리
  if (state.showdownAnimTimers) {
    state.showdownAnimTimers.forEach(t => clearTimeout(t));
  }
  state.showdownAnimTimers = [];

  if (!isFresh) {
    // 관전자 중간 접속 또는 새로고침 시 딜레이 없이 즉시 온전하게 노출
    p1Cards.forEach(c => {
      c.classList.add('flipped');
      c.classList.remove('showdown-revealing');
    });
    p2Cards.forEach(c => {
      c.classList.add('flipped');
      c.classList.remove('showdown-revealing');
    });
    if (vsBadge) vsBadge.classList.remove('showdown-vs-pulse');
    const isReferee = Boolean(state.isHost || state.isDemo);
    if (isReferee) {
      if (refereeControls) {
        refereeControls.classList.remove('hidden');
        refereeControls.classList.add('showdown-controls-reveal');
      }
      if (spectatorNotice) spectatorNotice.classList.add('hidden');
    } else {
      if (refereeControls) refereeControls.classList.add('hidden');
      if (spectatorNotice) {
        spectatorNotice.classList.remove('hidden');
        spectatorNotice.classList.add('showdown-controls-reveal');
      }
    }
    state.isShowdownAnimating = false;
    return;
  }

  state.isShowdownAnimating = true;

  // 모든 카드를 확실하게 뒷면 상태로 초기화 (중간에 투명해지거나 빠지는 구멍 방지)
  p1Cards.forEach(c => {
    c.classList.remove('flipped', 'showdown-revealing');
  });
  p2Cards.forEach(c => {
    c.classList.remove('flipped', 'showdown-revealing');
  });
  if (vsBadge) vsBadge.classList.remove('showdown-vs-pulse');
  if (refereeControls) refereeControls.classList.remove('showdown-controls-reveal');
  if (spectatorNotice) spectatorNotice.classList.remove('showdown-controls-reveal');

  // 1단계: 선수 1의 덱 5장 0번부터 4번까지 순차 3D 뒤집기 공개 (0.35s ~ 1.07s)
  p1Cards.forEach((card, idx) => {
    const delay = (0.35 + idx * 0.18) * 1000;
    const t = setTimeout(() => {
      card.classList.add('flipped');
      card.classList.add('showdown-revealing');
      sounds.playCardFlip();
    }, delay);
    state.showdownAnimTimers.push(t);
  });

  // 2단계: 중앙 VS 배지 격돌 펄스 & 임팩트 사운드 (1.35s)
  if (vsBadge) {
    const tVs = setTimeout(() => {
      vsBadge.classList.remove('showdown-vs-pulse');
      void vsBadge.offsetWidth;
      vsBadge.classList.add('showdown-vs-pulse');
      if (typeof sounds.playClash === 'function') {
        sounds.playClash();
      } else {
        sounds.playCall();
      }
    }, 1350);
    state.showdownAnimTimers.push(tVs);
  }

  // 3단계: 선수 2의 덱 5장 0번부터 4번까지 순차 3D 뒤집기 공개 (1.65s ~ 2.37s)
  p2Cards.forEach((card, idx) => {
    const delay = (1.65 + idx * 0.18) * 1000;
    const t = setTimeout(() => {
      card.classList.add('flipped');
      card.classList.add('showdown-revealing');
      sounds.playCardFlip();
    }, delay);
    state.showdownAnimTimers.push(t);
  });

  // 4단계: 심판 승자 판정 버튼 및 관전자 안내문 부드러운 페이드인 (2.65s)
  const tControls = setTimeout(() => {
    const isReferee = Boolean(state.isHost || state.isDemo);
    if (isReferee) {
      if (refereeControls) {
        refereeControls.classList.remove('hidden');
        refereeControls.classList.remove('showdown-controls-reveal');
        void refereeControls.offsetWidth;
        refereeControls.classList.add('showdown-controls-reveal');
      }
      if (spectatorNotice) {
        spectatorNotice.classList.add('hidden');
        spectatorNotice.classList.remove('showdown-controls-reveal');
      }
    } else {
      if (refereeControls) {
        refereeControls.classList.add('hidden');
        refereeControls.classList.remove('showdown-controls-reveal');
      }
      if (spectatorNotice) {
        spectatorNotice.classList.remove('hidden');
        spectatorNotice.classList.remove('showdown-controls-reveal');
        void spectatorNotice.offsetWidth;
        spectatorNotice.classList.add('showdown-controls-reveal');
      }
    }
    state.isShowdownAnimating = false;
  }, 2650);
  state.showdownAnimTimers.push(tControls);

  // 안전장치 워치독: 어떤 비동기 중단이 발생하더라도 3.2초 후에는 무조건 lock 해제
  const tWatchdog = setTimeout(() => {
    state.isShowdownAnimating = false;
  }, 3200);
  state.showdownAnimTimers.push(tWatchdog);
}

/**
 * 쇼다운 모달 데이터 갱신
 */
async function updateShowdownModalContent(matchData, isFresh = false) {
  if (state.isShowdownAnimating) return; // 뒤집기 연출 중에는 DOM 간섭 차단

  // 승리 확정 처리 중이거나 이미 쇼다운 단계를 벗어난 경우 승리 배너를 덮어쓰거나 버튼을 다시 노출하지 않음
  if (state.isResolvingShowdown || (state.activeMatchEngine && state.activeMatchEngine.phase !== 'showdown')) {
    return;
  }

  if (el.showdownWinnerBanner) {
    el.showdownWinnerBanner.classList.add('hidden');
  }

  el.battleSimLogBox.classList.add('hidden');
  el.battleSimLogBox.innerHTML = '';

  el.showdownP1Name.textContent = matchData.p1.name;
  el.showdownP2Name.textContent = matchData.p2.name;

  // 친선전에 걸린 총 판돈 및 각 선수별 투입 판돈 표시 (크게 따로 표시)
  const pot = matchData.pot ?? state.activeMatchEngine?.pot ?? 0;
  const p1Bet = matchData.p1?.totalRoundBet ?? matchData.p1?.currentBet ?? Math.floor(pot / 2);
  const p2Bet = matchData.p2?.totalRoundBet ?? matchData.p2?.currentBet ?? Math.floor(pot / 2);

  if (el.showdownTotalPot) el.showdownTotalPot.textContent = `${pot} G`;
  if (el.showdownVsPot) el.showdownVsPot.textContent = `${pot} G`;
  if (el.showdownP1Bet) el.showdownP1Bet.textContent = `${p1Bet} G`;
  if (el.showdownP2Bet) el.showdownP2Bet.textContent = `${p2Bet} G`;

  if (el.showdownSideP1Name) el.showdownSideP1Name.textContent = matchData.p1.name;
  if (el.showdownSideP1Bet) el.showdownSideP1Bet.textContent = `${p1Bet} G`;
  if (el.showdownSideP2Name) el.showdownSideP2Name.textContent = matchData.p2.name;
  if (el.showdownSideP2Bet) el.showdownSideP2Bet.textContent = `${p2Bet} G`;
  if (el.showdownSideReward) el.showdownSideReward.textContent = `+${pot} G`;

  el.btnWinP1Label.textContent = `${matchData.p1.name} 승리 확정 (+${pot}G)`;
  el.btnWinP2Label.textContent = `${matchData.p2.name} 승리 확정 (+${pot}G)`;
  if (window.lucide) window.lucide.createIcons();

  await ensureAllCardsRevealedForShowdown(matchData);

  // isFresh가 true이면 모든 카드가 처음에 뒷면(card-back)으로 렌더링되고,
  // animateShowdownDeckRows에서 0번부터 4번까지 순차적으로 3D 뒤집기 연출이 진행됩니다.
  const forceFlipped = !isFresh;
  renderCards(el.showdownP1Cards, matchData.p1.cards, forceFlipped);
  renderCards(el.showdownP2Cards, matchData.p2.cards, forceFlipped);

  // 심판(호스트/로컬) 컨트롤 및 시청자 안내문 분기 (참가자 승리 확정 버튼 노출 차단: 오직 방장/데모만 심판 권한 부여)
  const isReferee = Boolean(state.isHost || state.isDemo);
  const refereeControls = document.getElementById('showdown-referee-controls');
  const spectatorWaitNotice = document.getElementById('showdown-spectator-notice');

  if (isReferee) {
    if (refereeControls) refereeControls.classList.remove('hidden');
    if (spectatorWaitNotice) spectatorWaitNotice.classList.add('hidden');
  } else {
    if (refereeControls) refereeControls.classList.add('hidden');
    if (spectatorWaitNotice) spectatorWaitNotice.classList.remove('hidden');
  }

  if (isFresh) {
    if (refereeControls) refereeControls.classList.remove('showdown-controls-reveal');
    if (spectatorWaitNotice) spectatorWaitNotice.classList.remove('showdown-controls-reveal');
  } else {
    if (refereeControls) refereeControls.classList.add('showdown-controls-reveal');
    if (spectatorWaitNotice) spectatorWaitNotice.classList.add('showdown-controls-reveal');
  }

  // 양 플레이어가 모두 AI 봇인 경우: 호스트 브라우저에서 2.5초 후 자동 무력 배틀 시뮬레이션 실행 (멈춤 없이 자율 진행)
  if (state.botShowdownAutoTimer) {
    clearTimeout(state.botShowdownAutoTimer);
    state.botShowdownAutoTimer = null;
  }
  const matchObj = state.tournament ? state.tournament.matches[matchData.matchIndex] : null;
  const p1Slot = matchObj ? state.tournament.players[matchObj.p1Idx] : null;
  const p2Slot = matchObj ? state.tournament.players[matchObj.p2Idx] : null;
  const isP1Bot = isPlayerBot(p1Slot, matchData.p1);
  const isP2Bot = isPlayerBot(p2Slot, matchData.p2);

  if (isReferee && isP1Bot && isP2Bot) {
    state.botShowdownAutoTimer = setTimeout(() => {
      state.botShowdownAutoTimer = null;
      if (state.activeMatchEngine?.phase === 'showdown' && !state.isResolvingShowdown) {
        handleAutoBattleSimulation();
      }
    }, 2500);
  }
}

/**
 * 기존 인터페이스 호환용
 */
async function showShowdownModal(matchData) {
  await openShowdownModalWithAnimation(matchData, false);
}

function handleAutoBattleSimulation() {
  const isReferee = Boolean(state.isHost || state.isDemo);
  if (!isReferee) return;

  if (state.botShowdownAutoTimer) {
    clearTimeout(state.botShowdownAutoTimer);
    state.botShowdownAutoTimer = null;
  }

  const engine = state.activeMatchEngine;
  if (!engine) return;

  const extractDeck = (player) => {
    const cards = Array.isArray(player.cards) ? player.cards : Object.values(player.cards || {});
    const secrets = Array.isArray(player.secrets) ? player.secrets : Object.values(player.secrets || {});
    const deck = [];
    for (let i = 0; i < 5; i++) {
      const c = cards[i];
      const s = secrets.find(x => x && x.index === i) || secrets[i];
      let id = null;
      if (c && c.revealed && c.revealed.cardId) id = c.revealed.cardId;
      else if (c && c.cardId) id = c.cardId;
      else if (c && c.card && c.card.id) id = c.card.id;
      else if (s && s.cardId) id = s.cardId;
      else if (s && s.card && s.card.id) id = s.card.id;
      deck.push(id || 'knight');
    }
    return deck;
  };

  const deckA = extractDeck(engine.p1);
  const deckB = extractDeck(engine.p2);

  const result = simulateBattle(deckA, deckB, engine.p1.name, engine.p2.name);

  el.battleSimLogBox.classList.remove('hidden');
  el.battleSimLogBox.innerHTML = result.logs.map(log => `<div>${log}</div>`).join('');
  el.battleSimLogBox.scrollTop = el.battleSimLogBox.scrollHeight;

  // 1.5초 후 자동 승자 처리
  setTimeout(() => {
    resolveShowdownWinner(result.winner === 'A' ? 'p1' : 'p2');
  }, 1800);
}

async function resolveShowdownWinner(winner) {
  const isReferee = Boolean(state.isHost || state.isDemo);
  if (!isReferee) {
    console.warn('[Showdown] 방장(호스트)만 승리 확정 판정을 내릴 수 있습니다.');
    return;
  }

  if (state.isResolvingShowdown) return;
  state.isResolvingShowdown = true;

  if (el.btnWinP1) el.btnWinP1.disabled = true;
  if (el.btnWinP2) el.btnWinP2.disabled = true;

  const engine = state.activeMatchEngine;
  if (!engine) {
    state.isResolvingShowdown = false;
    return;
  }

  const winPlayer = (winner === 'p1' || winner === engine.p1.id) ? engine.p1 : engine.p2;
  const wonPot = engine.pot || 0;

  try {
    // 1. 모달 내부 승리 축하 배너 즉시 표시 (심판 버튼 숨김)
    showInModalShowdownVictory(winPlayer.name, wonPot);

    // 2. 엔진 승자 처리 (phase가 round_end 또는 match_end로 전이)
    if (engine.phase === 'showdown') {
      engine.resolveShowdown(winner);
    }

    // 3. 최우선 Firebase 및 로컬 즉시 동기화 (관전자 및 참가자들에게 실시간 승자 수신)
    await syncMatchToFirebase();
    saveDemoState();

    // 4. 1.5초간 승리 연출을 감상한 후 모달 닫기 및 다음 단계 진행
    setTimeout(() => {
      closeShowdownModalInstantly();
      renderDuelView();
      checkNextRoundOrMatchEnd();
    }, 1500);
  } catch (err) {
    console.error('resolveShowdownWinner 오류 발생:', err);
    closeShowdownModalInstantly();
    renderDuelView();
    checkNextRoundOrMatchEnd();
  } finally {
    state.isResolvingShowdown = false;
    if (el.btnWinP1) el.btnWinP1.disabled = false;
    if (el.btnWinP2) el.btnWinP2.disabled = false;
  }
}

// ================= 라운드 종료 / 매치 종료 처리 =================
let roundTransitionTimeout = null;

async function executeStartNextRound() {
  const canAdvance = Boolean(state.isHost || state.isDemo);
  if (!canAdvance) return;

  const engine = state.activeMatchEngine;
  if (!engine) return;

  try {
    closeShowdownModalInstantly();
    await engine.startNewRound();

    if (engine.p1.secrets?.length > 0) {
      state.savedMatchSecrets[`${engine.matchIndex}_${engine.roundNumber}_p1`] = engine.p1.secrets;
    }
    if (engine.p2.secrets?.length > 0) {
      state.savedMatchSecrets[`${engine.matchIndex}_${engine.roundNumber}_p2`] = engine.p2.secrets;
    }

    // 플레이어가 호스트 본인이거나 데모 모드인 경우 로컬 private secrets 즉각 갱신
    const curMatch = engine.matchIndex;
    const curRound = engine.roundNumber;
    const myUid = fb.getUid();
    const match = state.tournament ? state.tournament.matches[curMatch] : null;
    const isP1 = (engine.p1.uid && myUid === engine.p1.uid) || (match && state.myPlayerIndex === match.p1Idx);
    const isP2 = (engine.p2.uid && myUid === engine.p2.uid) || (match && state.myPlayerIndex === match.p2Idx);
    if (isP1) {
      state.myPrivateSecrets = engine.p1.secrets;
      state.myPrivateSecretsMatchIndex = curMatch;
      state.myPrivateSecretsRoundNumber = curRound;
    } else if (isP2) {
      state.myPrivateSecrets = engine.p2.secrets;
      state.myPrivateSecretsMatchIndex = curMatch;
      state.myPrivateSecretsRoundNumber = curRound;
    } else if (state.isDemo) {
      state.myPrivateSecrets = engine.p1.secrets;
      state.myPrivateSecretsMatchIndex = curMatch;
      state.myPrivateSecretsRoundNumber = curRound;
    }

    await syncMatchToFirebase();
    saveDemoState();
    sounds.playCardFlip();
    renderDuelView();
    if (state.isHost || state.isDemo) {
      setTimeout(() => {
        checkBotTurn();
      }, 500);
    }
  } catch (err) {
    console.error('executeStartNextRound 오류 발생:', err);
    if (engine.phase === 'round_end') {
      engine.phase = 'betting';
      renderDuelView();
    }
  }
}

async function checkNextRoundOrMatchEnd() {
  const engine = state.activeMatchEngine;
  if (!engine) return;

  if (engine.phase === 'match_end') {
    if (state.isMatchEnding) return;
    state.isMatchEnding = true;

    const match = state.tournament?.matches?.[engine.matchIndex];
    const winningPlayerIdx = engine.winnerId === engine.p1.id ? match?.p1Idx : match?.p2Idx;
    const winnerName = engine.winnerId === engine.p1.id ? engine.p1.name : engine.p2.name;

    // 1. 호스트 또는 데모인 경우 토너먼트 상태를 즉시 진전시키고 Firebase에 최우선 동기화!
    if (state.isHost || state.isDemo) {
      if (match && winningPlayerIdx !== undefined) {
        advanceTournament(state.tournament, engine.matchIndex, winningPlayerIdx);
        syncTournamentToFirebase();
      }
      await syncMatchToFirebase();
      saveDemoState();
    }

    // 2. 쇼다운 모달 즉시 정리
    closeShowdownModalInstantly();

    // 3. 논블로킹 매치 승리 축하 모달 표시 (블로킹 alert 제거)
    showMatchWinnerCelebration(winnerName);

    // 4. 2.0초 후 대진표 뷰로 부드럽게 이동
    setTimeout(() => {
      hideMatchWinnerCelebration();
      state.isMatchEnding = false;
      showView('tournament');
      renderTournamentView();
    }, 2000);
  } else if (engine.phase === 'round_end') {
    // 이미 라운드 시작 예약 중인 경우 중복 실행 차단
    if (state.isStartingNextRound) return;

    // 진행 권한 판별: 오직 호스트(방장) 또는 로컬 데모 모드만 다음 라운드 진행 실행
    const canAdvance = Boolean(state.isHost || state.isDemo);

    if (canAdvance) {
      state.isStartingNextRound = true;
      if (roundTransitionTimeout) clearTimeout(roundTransitionTimeout);

      roundTransitionTimeout = setTimeout(async () => {
        try {
          await executeStartNextRound();
        } finally {
          state.isStartingNextRound = false;
        }
      }, 1800);
    }
  }
}

// ================= 클래시 로얄 유닛 도감 (Unit Library Modal) =================
const RARITY_LABELS = {
  common: { name: '일반', bg: 'bg-slate-700/80', text: 'text-slate-300', border: 'border-slate-500/50' },
  rare: { name: '희귀', bg: 'bg-amber-950/80', text: 'text-amber-400', border: 'border-amber-500/50' },
  epic: { name: '영웅', bg: 'bg-purple-950/80', text: 'text-purple-300', border: 'border-purple-500/50' },
  legendary: { name: '전설', bg: 'bg-cyan-950/80', text: 'text-cyan-300', border: 'border-cyan-400/50' },
  champion: { name: '챔피언', bg: 'bg-yellow-950/80', text: 'text-yellow-300', border: 'border-yellow-400/50' }
};

const TYPE_LABELS = {
  melee: '근접 전사',
  ranged: '원거리 딜러',
  swarm: '물량 / 스웜',
  tank: '탱커 / 체력',
  flying: '공중 유닛',
  fast: '돌격 / 기습',
  building: '방어 건물',
  spell: '마법 스펠'
};

let cardCollectionFilter = {
  search: '',
  rarity: 'all'
};

function openCardListModal() {
  if (!el.modalCardList) return;
  el.modalCardList.classList.remove('hidden');
  renderCardList();
  if (el.cardSearchInput) {
    el.cardSearchInput.focus();
  }
}

function closeCardListModal() {
  if (!el.modalCardList) return;
  el.modalCardList.classList.add('hidden');
}

function renderCardList() {
  if (!el.cardListGrid) return;
  el.cardListGrid.innerHTML = '';

  const query = cardCollectionFilter.search.trim().toLowerCase();
  const rarity = cardCollectionFilter.rarity;

  const filtered = CARDS_DATA.filter(card => {
    // 1. 희귀도 필터
    if (rarity !== 'all' && card.rarity !== rarity) {
      return false;
    }
    // 2. 검색어 필터 (한글 이름, 영문 ID, 설명, 타입)
    if (query) {
      const matchName = (card.name || '').toLowerCase().includes(query);
      const matchId = (card.id || '').toLowerCase().includes(query);
      const matchDesc = (card.description || '').toLowerCase().includes(query);
      const typeLabel = (TYPE_LABELS[card.type] || '').toLowerCase();
      const matchType = typeLabel.includes(query) || (card.type || '').toLowerCase().includes(query);
      if (!matchName && !matchId && !matchDesc && !matchType) {
        return false;
      }
    }
    return true;
  });

  // 카운트 배지 갱신
  if (el.cardListCount) {
    el.cardListCount.textContent = `${filtered.length} / ${CARDS_DATA.length}`;
  }

  // 검색 결과 없음 상태
  if (filtered.length === 0) {
    if (el.cardListEmpty) el.cardListEmpty.classList.remove('hidden');
    return;
  }
  if (el.cardListEmpty) el.cardListEmpty.classList.add('hidden');

  // 카드 렌더링
  filtered.forEach(card => {
    const item = document.createElement('div');
    item.className = 'collection-card-item group';
    item.setAttribute('data-card-id', card.id);

    const typeKor = TYPE_LABELS[card.type] || card.type;

    item.innerHTML = `
      <div class="poker-card flipped">
        <div class="card-inner">
          <div class="card-back"></div>
          <div class="card-front rarity-${card.rarity} flex flex-col justify-between">
            <div class="card-art-box">
              <img src="${card.image}" alt="${card.name}" class="card-official-img" loading="lazy" decoding="async">
            </div>
            <div class="card-name-banner">
              <div class="card-title-text">${card.name}</div>
              <div class="card-type-tag">${typeKor}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="mt-1 text-center w-full">
        <div class="text-[11px] font-bold text-slate-200 group-hover:text-amber-400 transition truncate">${card.name}</div>
        <div class="text-[9px] text-slate-400 font-mono truncate">${card.id}</div>
      </div>
    `;

    item.addEventListener('click', () => {
      openCardDetailModal(card.id);
    });

    el.cardListGrid.appendChild(item);
  });

  lucide.createIcons();
}

function openCardDetailModal(cardId) {
  const card = CARD_MAP[cardId];
  if (!card || !el.modalCardDetail) return;

  if (el.cardDetailTitle) el.cardDetailTitle.textContent = `${card.name} 정보`;
  if (el.cardDetailId) el.cardDetailId.textContent = `#${card.id}`;
  if (el.cardDetailName) el.cardDetailName.textContent = card.name;
  if (el.cardDetailDesc) el.cardDetailDesc.textContent = card.description || '상세 정보가 없습니다.';

  // 태그 배지 렌더링
  if (el.cardDetailTags) {
    const rarityInfo = RARITY_LABELS[card.rarity] || { name: card.rarity, bg: 'bg-slate-800', text: 'text-slate-300', border: 'border-slate-700' };
    const typeKor = TYPE_LABELS[card.type] || card.type;

    el.cardDetailTags.innerHTML = `
      <span class="px-2 py-0.5 rounded-lg text-xs font-bold ${rarityInfo.bg} ${rarityInfo.text} border ${rarityInfo.border}">
        ${rarityInfo.name}
      </span>
      <span class="px-2 py-0.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
        ${typeKor}
      </span>
    `;
  }

  // 대형 프리뷰 카드 렌더링
  if (el.cardDetailPreviewContainer) {
    preloadCardImage(card.image);
    el.cardDetailPreviewContainer.innerHTML = `
      <div class="poker-card flipped">
        <div class="card-inner">
          <div class="card-back"></div>
          <div class="card-front rarity-${card.rarity} flex flex-col justify-between">
            <div class="card-art-box">
              <img src="${card.image}" alt="${card.name}" class="card-official-img" loading="eager" decoding="async">
            </div>
            <div class="card-name-banner">
              <div class="card-title-text">${card.name}</div>
              <div class="card-type-tag">${TYPE_LABELS[card.type] || card.type}</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  el.modalCardDetail.classList.remove('hidden');
  lucide.createIcons();
}

function closeCardDetailModal() {
  if (!el.modalCardDetail) return;
  el.modalCardDetail.classList.add('hidden');
}

// 초기화 시작
document.addEventListener('DOMContentLoaded', initApp);
