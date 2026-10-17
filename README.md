# 무력 포커 (Show Poker)

클래시 로얄(Clash Royale) 유닛 카드를 활용한 **8인 1대1 싱글 엘리미네이션 포커 & 친선전 토너먼트** 웹 애플리케이션입니다.

## 프로젝트 폴더 및 파일 구조

- `index.html`: 로비, 8인 토너먼트 대진표 브래킷, 1:1 포커 아레나 테이블, 카드 지급/공개/쇼다운/도감 모달 UI
- `database.rules.json`: Firebase Realtime Database 보안 규칙 설정 파일
- `css/style.css`: 아레나 테마, 글래스모피즘, 3D 액션 버튼 및 실시간 배지 애니메이션 스타일
- `css/cards.css`: 클래시 로얄 스타일 카드 프레임(일반/희귀/영웅/전설/챔피언), 부채꼴 손패 및 반응형 레이아웃
- `js/game-engine.js`: `[무력 포커]` 핵심 상태 머신 (`MatchEngine` - 기본 베팅, 선공 결정, 10단위 베팅/콜/폴드, 카드 공개 및 정산)
- `js/tournament.js`: 8인 1:1 토너먼트 브래킷 생성, 승자 진출 및 다음 활성 매치 탐색 모듈
- `js/app.js`: Firebase 실시간 멀티플레이어 동기화, AI 봇 대전, UI 렌더링 및 이벤트 컨트롤러
- `js/cards-data.js`: 클래시 로얄 전투 카드 119종 데이터 및 무작위 중복 방지 덱 추첨 유틸리티
- `js/battle-sim.js`: 5 vs 5 카드 상성·시너지 기반 웹 자동 무력 대결 시뮬레이터
- `js/crypto-security.js`: Web Crypto API(`SHA-256`) 기반 카드 커밋먼트 생성 및 위변조 검증 모듈
- `js/firebase-config.js`: Firebase Realtime Database & 익명 인증 초기화 및 연결 관리
- `js/sound.js`: Web Audio API 신디사이저 기반 효과음 시스템
