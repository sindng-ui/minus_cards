# 🗺️ APP_MAP.md - Minus Cards Architecture & Interface Map

이 문서는 **Minus Cards (3~4인 모바일 네트워크 심리전 카드 게임)** 프로젝트의 모든 파일, 컴포넌트, 훅 및 핵심 인터페이스를 관리합니다. 모든 파일은 700줄 제한 규칙을 엄수하며(평균 100~380줄), 성능을 저하시키는 CSS `blur` 필터를 일절 사용하지 않고 메모이제이션(`React.memo`, `useMemo`, `useCallback`)으로 최적화되어 있습니다.

---

## 1. 디렉토리 및 파일 구조 (Directory Structure)

| 파일 경로 | 줄 수 | 역할 및 설명 |
| :--- | :---: | :--- |
| `important/PROJECT_RULES.md` | ~30 | 프로젝트 핵심 규칙 (Blur 금지, 700줄 제한, 게임 룰 요약) |
| `.gitignore` | ~45 | Git 형상 관리 제외 대상 설정 (node_modules, dist, 환경변수, OS/IDE 캐시 등) |
| `docs/implementation_plan.md` | ~110 | 초기 설계 및 확정 룰 구현 계획서 |
| `docs/test_result.txt` | ~40 | 타입스크립트 컴파일, 프로덕션 번들 빌드 및 게임 로직 검증 결과 |
| `src/types/game.ts` | ~90 | 게임 상태(`GameState`), 플레이어(`Player`), 설정(`GameSettings`), 턴 히스토리(`TurnHistoryItem` - playerId 포함), 네트워크 메시지(`NetworkMessage`) 타입 정의 |
| `src/utils/gameLogic.ts` | ~165 | 3~35 덱 셔플 및 2~9장 제외, 연속 숫자 그룹화(`groupConsecutiveCards`), 점수/동점자 판정(`calculateFinalRankings`), 4색 카드 테마 |
| `src/utils/soundEngine.ts` | ~165 | Web Audio API 기반 신디사이저 사운드 엔진 (`playCoinPass`, `playCardTake`, `playDiceRoll`, `playEmojiPop`, `playVictoryFanfare`) |
| `src/utils/peerConfig.ts` | ~85 | 모바일 LTE/5G 통신사 방화벽(Symmetric NAT) 돌파용 글로벌 STUN/TURN 릴레이 서버 설정(`PEER_CONFIG`), 카톡 URL 쿼리/해시 이중 파서(`extractRoomCodeFromUrl`), 방장 소켓 생존 감시 헬퍼(`ensureHostPeerAlive`) |
| `src/hooks/useNetworkGame.ts` | ~590 | PeerJS(WebRTC + TURN Relay) 기반 방장(Host) 서버 & 클라이언트 실시간 동기화, 3.5초 주기 방장 생존 워치독 및 자동 소켓 재생성, 참가자 6회 자동 재시도 연결(방장이 카톡에서 복귀할 때까지 대기 후 자동 입장), 주사위 동점 재굴림, AI 봇 자동 턴 처리 |
| `src/components/CardView.tsx` | ~160 | 상/하단 양면 숫자 표기 카드(`SingleCard`) 및 50% 세로 반겹침 그룹 스택(`HalfOverlapCardGroups`) |
| `src/components/RubyCoin.tsx` | ~90 | 영롱하게 빛나는 빨간 루비 코인(`RubyCoin`) 및 중앙 코인 더미(`CenterCoinPile` - 고정 높이 52px 유지) |
| `src/components/LobbyScreen.tsx` | ~410 | 방 만들기(최상단 메인 배치), 초대 메시지 및 초대 화면에서 '방 코드/암호' 표기 완전 제거(순수 원터치 입장), 카톡 복귀 시 자동 재연결, AI 봇 슬롯 지원 |
| `src/components/DicePhaseModal.tsx` | ~115 | 주사위 2개 동시 굴리기 및 동점자 발생 시 동점자끼리 재굴림 연출 모달 |
| `src/components/PlayerSeat.tsx` | ~80 | 상대방 플레이어 좌석 (`OpponentSeat` - 3인 좌/우, 4인 좌/상/우 배치용, 상단부터 빈 공간 없이 100% 꽉 채워 카드 덱을 보여주는 `justify-start` 및 `flex-1` 전체 높이 레이아웃 적용) |
| `src/components/EmojiOverlay.tsx` | ~90 | 실시간 감정 표현 스탬프 발사 메뉴, 팝업 토스트 및 사운드 음소거 토글 |
| `src/components/ResultModal.tsx` | ~165 | 최종 순위표(동점 시 코인 다수 승리 반영), 마지막 카드 터치 연타로 인한 '바로 한 판 더(주사위 굴리기)' 오작동 방지 안전 딜레이(1.2초) 적용, **제외되었던 히든 카드(2~9장) 공개** 모달 |
| `src/components/TableAnimations.tsx` | ~175 | 전역 화면 플라잉 액션 컴포넌트 (`fixed inset-0` 전역 뷰포트 좌표계 적용, 코인 투척 시 중간 급정거 버벅임을 없애고 단일 감속 이징 곡선으로 비단결처럼 부드러운 착지 모션 구현, 카드 획득 시 덱으로 비행 및 멀티 코인 카스케이드 싹쓸이 연출) |
| `src/components/GameBoard.tsx` | ~320 | 모바일 100dvh 3~4인 메인 게임 테이블 (중앙 카드 Y축 위치 완전 고정, 상단/하단 영역 고정 높이 격리, 실시간 액션 애니메이션 연동) |
| `src/App.tsx` | ~65 | 로비 화면(`LobbyScreen`)과 본 게임 보드(`GameBoard`) 라우팅 컨테이너 |

---

## 2. 핵심 모듈 인터페이스 (Key Interfaces)

### 2.1 `src/types/game.ts`
- `GamePhase`: `'LOBBY' | 'DICE_ORDER' | 'PLAYING' | 'FINISHED'`
- `GameSettings`: `{ excludedCount: number; coinVisibility: 'PUBLIC' | 'HIDDEN' }`
- `Player`: `{ id, name, isHost, isBot?, coins, cards: number[], turnOrder, diceRoll?, connected }`
- `GameState`: 방 코드, 현재 페이즈, 플레이어 목록, 남은 덱 장수(`deckCount`), 공개 카드(`currentCard`), 쌓인 코인(`centerCoins`), 현재 턴 플레이어(`currentTurnPlayerId`), 주사위 동점 대상자(`diceTiedPlayerIds`), 종료 시 공개되는 제외 카드(`hiddenExcludedCards`) 포함.

### 2.2 `src/utils/gameLogic.ts`
- `createDeckAndExcluded(excludedCount: number)` -> `{ deck: number[], excludedCards: number[] }`
- `groupConsecutiveCards(cards: number[])` -> `number[][]` (연속된 숫자를 하나의 배열로 묶음)
- `calculateCardSum(cards: number[])` -> `number` (각 연속 숫자 묶음의 최소값만 합산)
- `calculateFinalRankings(players: Player[])` -> `PlayerScoreDetail[]` (`카드합 - 코인수` 오름차순 정렬, 동점 시 보유 코인 많은 순)
- `getCardTheme(num: number)` -> `CardTheme` (1자리 에메랄드, 10자리 골드, 20자리 퍼플, 30자리 크림슨 테마 반환)

### 2.3 `src/hooks/useNetworkGame.ts`
- `useNetworkGame()` 반환 인터페이스:
  - 상태: `myPlayerId`, `myName`, `isHost`, `connectionStatus`, `errorMessage`, `gameState`, `activeEmojis`
  - 액션: `createRoom`, `joinRoom`, `updateSettings`, `addBotPlayer`, `removePlayer`, `startGame`, `rollMyDice`, `passTurnWithCoin`, `takeCenterCard`, `sendEmoji`, `returnToLobby`
