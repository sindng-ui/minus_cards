# 🗺️ APP_MAP.md - Minus Cards Architecture & Interface Map

이 문서는 **Minus Cards (3~4인 모바일 네트워크 심리전 카드 게임)** 프로젝트의 모든 파일, 컴포넌트, 훅 및 핵심 인터페이스를 관리합니다. 성능을 저하시키는 CSS `blur` 필터를 일절 사용하지 않고 메모이제이션(`React.memo`, `useMemo`, `useCallback`)으로 최적화되어 있습니다.

---

## 1. 디렉토리 및 파일 구조 (Directory Structure)

| 파일 경로 | 줄 수 | 역할 및 설명 |
| :--- | :---: | :--- |
| `important/PROJECT_RULES.md` | ~30 | 프로젝트 핵심 규칙 (Blur 금지, 700줄 제한, 게임 룰 요약) |
| `.gitignore` | ~45 | Git 형상 관리 제외 대상 설정 (node_modules, dist, 환경변수, OS/IDE 캐시 등) |
| `capacitor.config.ts` | ~15 | Capacitor 안드로이드 네이티브 앱 메타데이터 설정 (`com.minuscards.familygame`, '마이너스 카드') |
| `android/` | 폴더 | Capacitor 기반 생성된 Android Studio 네이티브 Gradle 프로젝트 |
| `minus-cards.apk` | 바이너리 | **최종 빌드된 안드로이드 설치 APK 파일** (약 4.07MB, 스마트폰에 즉시 설치 가능) |
| `docs/apk_implementation_plan.md` | ~35 | Android APK 빌드 및 오락실 원터치 자동 방 찾기 구현 계획서 |
| `docs/implementation_plan.md` | ~110 | 초기 설계 및 확정 룰 구현 계획서 |
| `docs/test_result.txt` | ~35 | 타입스크립트 빌드, Capacitor 동기화 및 APK 빌드 검증 결과 |
| `src/types/game.ts` | ~100 | 게임 상태(`GameState`), 플레이어(`Player`), 설정(`GameSettings`), 턴 히스토리(`TurnHistoryItem`), 네트워크 메시지(`NetworkMessage`), 방 정보(`RoomDiscoveryInfo`) 타입 정의 |
| `src/utils/gameLogic.ts` | ~165 | 3~35 덱 셔플 및 2~9장 제외, 연속 숫자 그룹화(`groupConsecutiveCards`), 점수/동점자 판정(`calculateFinalRankings`), 4색 카드 테마 |
| `src/utils/soundEngine.ts` | ~165 | Web Audio API 기반 신디사이저 사운드 엔진 (`playCoinPass`, `playCardTake`, `playDiceRoll`, `playEmojiPop`, `playVictoryFanfare`) |
| `src/utils/peerConfig.ts` | ~85 | 모바일 LTE/5G 통신사 방화벽(Symmetric NAT) 돌파용 글로벌 STUN/TURN 릴레이 서버 설정(`PEER_CONFIG`), 카톡 URL 쿼리/해시 이중 파서(`extractRoomCodeFromUrl`), 방장 소켓 생존 감시 헬퍼(`ensureHostPeerAlive`) |
| `src/utils/roomDiscovery.ts` | ~135 | **오락실 스타일 고정 슬롯(SLOT1~5) 실시간 방 자동 스캔 및 메타데이터 질의/응답 프로토콜** (`scanAvailableRooms`, `getDiscoverySlotId`) |
| `src/components/DiscoveredRoomList.tsx` | ~130 | **로비 최상단 실시간 열린 방 목록 UI** (`[👑 방장이름님의 방 (1/4명) · 즉시 입장하기]`) |
| `src/hooks/useNetworkGame.ts` | ~943 | PeerJS 기반 방장/참가자 P2P 동기화, 자동 슬롯 개설, 워치독 및 턴 제어 (**⚠️ 900줄 초과: 훅 분리 리팩토링 대상**) |
| `src/components/CardView.tsx` | ~160 | 상/하단 양면 숫자 표기 카드(`SingleCard`) 및 50% 세로 반겹침 그룹 스택(`HalfOverlapCardGroups`) |
| `src/components/RubyCoin.tsx` | ~90 | 영롱하게 빛나는 빨간 루비 코인(`RubyCoin`) 및 중앙 코인 더미(`CenterCoinPile` - 고정 높이 52px 유지) |
| `src/components/LobbyScreen.tsx` | ~555 | 로비 화면 (상단 오락실 자동 방 목록 노출, 방 개설, 자동 재연결, AI 봇 슬롯 등) |
| `src/components/DicePhaseModal.tsx` | ~115 | 주사위 2개 동시 굴리기 및 동점자 발생 시 동점자끼리 재굴림 연출 모달 |
| `src/components/PlayerSeat.tsx` | ~80 | 상대방 플레이어 좌석 (`OpponentSeat` - 3인 좌/우, 4인 좌/상/우 배치용) |
| `src/components/EmojiOverlay.tsx` | ~90 | 실시간 감정 표현 스탬프 발사 메뉴, 팝업 토스트 및 사운드 음소거 토글 |
| `src/components/ResultModal.tsx` | ~165 | 최종 순위표(동점 시 코인 다수 승리 반영), 안전 딜레이(1.2초) 적용, **제외되었던 히든 카드(2~9장) 공개** 모달 |
| `src/components/TableAnimations.tsx` | ~175 | 전역 화면 플라잉 액션 컴포넌트 (`fixed inset-0` 전역 뷰포트 좌표계 적용, 코인 투척 감속 모션, 카드 획득 및 코인 카스케이드 연출) |
| `src/components/GameBoard.tsx` | ~320 | 모바일 100dvh 3~4인 메인 게임 테이블 (중앙 카드 Y축 위치 완전 고정, 상단/하단 영역 고정 높이 격리, 실시간 액션 애니메이션 연동) |
| `src/App.tsx` | ~65 | 로비 화면(`LobbyScreen`)과 본 게임 보드(`GameBoard`) 라우팅 컨테이너 |

---

## 2. 핵심 모듈 인터페이스 (Key Interfaces)

### 2.1 `src/types/game.ts`
- `GamePhase`: `'LOBBY' | 'DICE_ORDER' | 'PLAYING' | 'FINISHED'`
- `GameSettings`: `{ excludedCount: number; coinVisibility: 'PUBLIC' | 'HIDDEN' }`
- `Player`: `{ id, name, isHost, isBot?, coins, cards: number[], turnOrder, diceRoll?, connected }`
- `GameState`: 방 코드, 현재 페이즈, 플레이어 목록, 남은 덱 장수(`deckCount`), 공개 카드(`currentCard`), 쌓인 코인(`centerCoins`), 현재 턴 플레이어(`currentTurnPlayerId`), 주사위 동점 대상자(`diceTiedPlayerIds`), 종료 시 공개되는 제외 카드(`hiddenExcludedCards`) 포함.
- `RoomDiscoveryInfo`: `{ roomId: string; hostName: string; playerCount: number; maxPlayers: number; isGameStarted: boolean; slotIndex: number; }`

### 2.2 `src/utils/roomDiscovery.ts`
- `DISCOVERY_SLOTS_COUNT = 5`: 가족 채널 고정 슬롯 5개
- `getDiscoverySlotId(slotIndex: number)` -> `string`: `minus-cards-room-slot-${slotIndex}` 반환
- `scanAvailableRooms(myPeerId?: string)` -> `Promise<RoomDiscoveryInfo[]>`: 슬롯들을 비동기로 ping/query하여 활성화된 방 정보 배열을 실시간 반환.

### 2.3 `src/components/DiscoveredRoomList.tsx`
- Props: `{ discoveredRooms: RoomDiscoveryInfo[]; isScanning: boolean; onRefresh: () => void; onJoinRoom: (roomId: string) => void; }`

### 2.4 `src/hooks/useNetworkGame.ts`
- `useNetworkGame()` 반환 인터페이스:
  - 상태: `myPlayerId`, `myName`, `isHost`, `connectionStatus`, `errorMessage`, `gameState`, `activeEmojis`, `discoveredRooms`, `isScanningRooms`
  - 액션: `createRoom`, `joinRoom`, `refreshDiscoveredRooms`, `updateSettings`, `addBotPlayer`, `removePlayer`, `startGame`, `rollMyDice`, `passTurnWithCoin`, `takeCenterCard`, `sendEmoji`, `returnToLobby`
