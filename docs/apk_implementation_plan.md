# Minus Cards - Android APK & 오락실 자동 방 찾기 구현 계획서

## 1. 목표 (Objective)
1. **안드로이드 설치 파일(`minus-cards.apk`) 직접 생성**:
   - 외부 웹 호스팅(Netlify 등)이나 카카오톡 링크 공유 없이, 가족들이 각자 스마트폰에 동일한 `minus-cards.apk` 앱을 설치하여 바로 실행할 수 있도록 패키징합니다.
2. **오락실 스타일 '열려 있는 방 자동 찾기' (One-Touch Room Discovery)**:
   - 앱을 켜면 누가 방을 열었는지 자동으로 검색되어 화면에 **`🟢 [방장이름님의 방 (현재인원/4명) - 터치하여 입장]`** 목록이 실시간으로 표시됩니다.
   - 방 코드나 비밀번호를 입력할 필요 없이, 화면에 뜬 가족의 방을 터치 한 번만 하면 0.1초 만에 즉시 입장됩니다.

---

## 2. 세부 구현 설계 (Technical Design)

### 2.1 오락실 자동 방 탐색 프로토콜 (`src/utils/roomDiscovery.ts`)
- **고정 가족 채널 슬롯 (Slot 1 ~ Slot 5)**:
  - 방장이 `[내가 새 방 열기]`를 누르면 `minus-cards-v1-room-SLOT1` ~ `SLOT5` 중 비어 있는 슬롯에 방을 개설합니다.
  - 참가자들이 앱을 켜고 대기실에 있으면, 백그라운드 스캐너가 슬롯들을 스캔하여 현재 열려 있는 방의 메타데이터(`ROOM_INFO_QUERY` -> `ROOM_INFO_RESPONSE`: 방장 닉네임, 현재 인원수, 최대 인원, 방 코드, 게임 진행 여부)를 받아옵니다.
- **실시간 방 목록 UI (`src/components/LobbyScreen.tsx`)**:
  - 로비 최상단에 **`📡 현재 열려 있는 게임방`** 섹션을 배치합니다.
  - 열려 있는 방이 있으면 초록색 카드로 **`[👑 큰형님의 방 (1/4명) · 즉시 입장하기]`** 버튼이 크게 나타나며, 터치 즉시 해당 방으로 입장합니다.

### 2.2 Capacitor 안드로이드 프로젝트 구성 (`capacitor.config.ts`, `android/`)
- **패키지 설정**:
  - App ID: `com.minuscards.familygame`
  - App Name: `마이너스 카드`
- **안드로이드 최적화**:
  - `AndroidManifest.xml`: `INTERNET`, `ACCESS_NETWORK_STATE` 권한 및 세로 모드 고정(`android:screenOrientation="portrait"`), 클리어텍스트/WebRTC 권한 설정.
  - 모바일 상태바/네비게이션바 영역(`safe-area`) 대응 및 뒤로가기 버튼으로 실수로 앱이 꺼지지 않도록 보호.

### 2.3 PC에서 즉시 `minus-cards.apk` 파일 빌드
- 현재 PC에 **OpenJDK 17**이 이미 설치되어 있음을 확인했습니다.
- 무거운 Android Studio 전체를 설치할 필요 없이, Google 공식 경량 **Android Command-Line Tools**로 필수 빌드 패키지(`platforms;android-34`, `build-tools;34.0.0`)만 자동 구성한 뒤 `./gradlew assembleDebug`를 실행하여,
- 프로젝트 루트 폴더에 가족 단톡방으로 바로 보낼 수 있는 **`minus-cards.apk`** 완제품 파일을 생성합니다.
