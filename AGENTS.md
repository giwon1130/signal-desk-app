# Signal Desk App — Agent Notes

React Native (Expo) 모바일 앱. Spring Boot 백엔드(`../signal-desk-api`)와 짝.

## 앱 목적 (반드시 먼저 읽기)

사용자 워크플로:
1. **장 시작 전** — 오늘 장이 어떨지 추측한다 (Today 탭)
2. **장중** — 매수할만한 단타 후보를 본다 (Today 탭 단타 픽)
3. **보유 중** — 언제 매도할지 가이드를 받는다 (Today 탭 보유 모니터)

이 흐름이 모든 UX 판단의 1차 기준. 새 화면을 추가할 때도 "이 셋 중 어디에 도움이 되는가"를 먼저 답할 것.

## 현재 탭 구조

```
오늘 (Today)  → 장 상태 + 뉴스 sentiment + 장전 브리핑 + 단타 픽 + 보유 모니터
홈   (Home)    → KPI 대시보드 (탭하면 해당 영역으로 이동)
시장 (Market)  → D/W/M 캔들 차트 + 시장요약/실험지표/관심종목 시그널
종목 (Stocks)  → 검색 + 상세 + 관심종목/보유 등록
AI   (AI)      → 추천·실행 로그
```

## 용어 (반드시 일관성 유지)

| 용어 | 정의 |
|------|------|
| **관심종목** | 추적만 함. 매수가/수량 없음. (`WatchItem`, `/api/v1/workspace/watchlist`) |
| **실제 보유 종목 / 포트폴리오** | 매수가·수량 입력해서 손익률 계산하는 진짜 보유. (`HoldingPosition`, `/api/v1/workspace/portfolio`) |
| **즐겨찾기** | ❌ 사용 금지. 과거 잔재. 모두 "관심종목"으로 통일됨. |
| **이상징후** | ❌ 사용 금지. "관심종목 시그널"로 통일됨. |

## 등록·해제 UX 원칙

- **관심종목**: 종목 검색 카드의 핀(`+ 관심종목` ↔ `× 해제`)으로 한 탭에 토글. 폼 입력 없음.
  - 추가 위치: 검색 카드, 상세 큰 버튼
  - 해제 위치: 위와 동일 + 홈 관심종목 요약 행의 우측 × + 종목 탭 "내 관심종목" 리스트의 "해제"
- **보유 등록**: 종목 상세의 "실제 보유 종목으로 등록" 인라인 폼. 매수가·수량만 입력 → 등록/수정/삭제. 현재가는 라이브 시세에서 자동 채움.

## 휴장(주말/공휴일) 모드

- 백엔드가 `MarketSummaryData.tradingDayStatus`로 `{ krOpen, usOpen, isWeekend, isHoliday, headline, nextTradingDay, advice }` 내려줌.
- Today 탭 상단에 강조 배너 표시 (주말=노랑, 휴장=빨강).
- 단타 픽/보유 모니터 카피가 "휴장 중 — 시나리오 점검" 모드로 자동 전환.

## 알림 (로컬 알림 only)

서버 푸시 인프라 없이 **디바이스 로컬 알림**으로만 동작. baby-log 패턴 차용.

- 구현: `src/hooks/useMarketReminder.ts` + `src/components/ReminderSettingsModal.tsx`
- 헤더의 종(🔔) 아이콘 → 모달에서 토글
- 매일 반복 (`Notifications.SchedulableTriggerInputTypes.DAILY`):
  - 🇰🇷 한국장: 09:00 KST
  - 🇺🇸 미국장: 23:30 KST (EST/EDT 평균)
  - "몇 분 전" 옵션: 5/10/15/30/60
- AsyncStorage 키: `reminder.krOpen.enabled`, `reminder.usOpen.enabled`, `reminder.minutesBefore`
- 부팅 시 `useMarketReminderBootstrap(!!user)`이 권한 확인 + 켜진 알림 재예약 (App.tsx)

**한계 (의도된 단순화)**:
- 시그널 발생/P&L 임계 돌파 같은 **이벤트 기반 푸시는 미지원**. APNs Key + 백엔드 `device_token` 테이블 + 발신 엔드포인트가 필요해서 유료 Apple Developer 계정 붙기 전엔 안 함.
- expo-notifications **plugin은 app.json에서 제거**된 상태. Personal Team이 push entitlement(`aps-environment`)를 못 사인하기 때문. 모듈 자체는 autolink돼서 로컬 스케줄링은 정상.

## 차트 시맨틱

각 캔들 = 1 단위.
- `D` = 일봉 (30개)
- `W` = 주봉 (20개)
- `M` = 월봉 (12개)

캔들 탭하면 OHLC + 거래량 툴팁. (`src/components/CandleVolumeChart.tsx`)

## 실험 지표 (Pentagon Pizza Index 등)

- 시장 탭 → 실험 지표 카드 → 항목 탭 → 모달로 정의·계산식·출처 표시
- 백엔드에서 `description`/`methodology` 필드를 같이 내려줌 (`AlternativeSignalService.kt`)
- 매매 근거로 단독 사용 금지 (모달 하단 면책 명시)

## 디렉터리

```
App.tsx                   # 셸 + 상태 + 라우팅
src/
  api.ts                  # 모든 백엔드 호출
  api/auth.ts             # 인증 전용
  types.ts                # 도메인 타입 (백엔드와 1:1 매칭)
  styles.ts               # 모든 스타일
  theme.tsx               # 라이트/다크 팔레트
  utils.ts, utils/        # 포매팅, haptic, 색상 헬퍼
  hooks/                  # useToast, useLivePrices
  components/             # 재사용 (Toast, AuthScreen, CandleVolumeChart, Skeleton)
  tabs/                   # TodayTab, HomeTab, MarketTab, StocksTab, AITab
```

## 작업 규약

- **타입 먼저**: 백엔드 응답 변경 시 `src/types.ts`부터 갱신. `npx tsc --noEmit` 깨끗해야 commit.
- **새 텍스트는 한국어**: 사용자가 한국어 사용. 인용·라벨·메시지 모두 자연스러운 반말체 ("~해", "~봐").
- **이모지·문서 자동생성 금지**: 사용자가 명시 요청 시에만.
- **Pressable 중첩 주의**: 탭 안에 토글 핀 같은 구조 만들 때 hitSlop과 위치로 충돌 회피.

## 개발 환경 셋업

요구사항: Node 20+, Xcode 15+ (iOS), CocoaPods, 실기기 또는 시뮬레이터.

```bash
npm install                           # 의존성

# 시뮬레이터/기기에서 개발 빌드 (네이티브 모듈 변경 시 필요)
npx expo run:ios

# JS만 변경했고 이미 한 번 네이티브 빌드를 한 상태라면 Metro만
npm start                             # 또는 npx expo start

# 타입 체크 (commit 전 필수)
npx tsc --noEmit
```

네이티브 의존성/`app.json` 변경(예: 새 Expo plugin, URL scheme 추가, bundle id 변경) 후엔:

```bash
npx expo prebuild --clean -p ios      # ios/ 폴더 재생성
cd ios && pod install && cd ..
npx expo run:ios                      # 다시 네이티브 빌드
```

## 환경변수

`EXPO_PUBLIC_*`만 런타임에서 `process.env`로 읽힌다.

| 키 | 기본값 | 비고 |
|----|-------|------|
| `EXPO_PUBLIC_API_BASE_URL` | `https://signal-desk-api-production.up.railway.app` | 백엔드 주소 |

로컬 백엔드를 붙일 때 (실기기에서 `localhost`는 기기 자신을 가리키므로 PC IP 사용):

```bash
EXPO_PUBLIC_API_BASE_URL=http://192.168.x.x:8091 npm start
```

## OAuth (Google) 연동

소셜 로그인은 `@react-native-google-signin/google-signin` 네이티브 SDK 사용. Expo Auth Session/web flow가 아니다.

설정 파일별 책임:

| 파일 | 무엇이 들어가야 하나 |
|------|---------------------|
| `app.json > expo.scheme` | 앱 스킴 (`signaldesk`) |
| `app.json > expo.extra.googleClientIdWeb` | **백엔드가 idToken을 검증할 때 audience가 되는 값**. Web 클라이언트 ID. 필수. |
| `app.json > expo.extra.googleClientIdIos` | iOS 클라이언트 ID. 네이티브 SDK가 이걸로 idToken 발급. |
| `app.json > plugins["@react-native-google-signin/google-signin"].iosUrlScheme` | iOS reverse-DNS URL scheme (`com.googleusercontent.apps.<IOS_CLIENT_ID>`). prebuild 시 Info.plist에 자동 등록. |

흐름:
1. 앱에서 `GoogleSignin.signIn()` → `idToken` 획득 (`src/api/socialAuth.ts`)
2. `apiGoogleOAuth(idToken)` → `POST /auth/oauth/google` (`src/api/auth.ts`)
3. 백엔드가 `tokeninfo`로 검증 + 자체 JWT 반환
4. JWT는 `AsyncStorage`에 저장 (`src/api/auth.ts`)

OAuth가 깨졌을 때 체크 순서:
1. `Info.plist`에 reverse-DNS URL scheme이 있는가? (`ios/signaldeskapp/Info.plist`의 `CFBundleURLSchemes`)
2. 없거나 다르면 `npx expo prebuild --clean -p ios` 후 재빌드.
3. Google Cloud Console에서 iOS 클라이언트의 bundle id가 `com.anonymous.signal-desk-app`과 일치하는지.
4. 백엔드 `JDBC_DATABASE_URL`이 설정돼 있는지 (파일 모드에선 `/auth/*` 404).

## 빌드·배포 (실기기)

```bash
# 연결된 실기기 UDID 확인
xcrun xctrace list devices

# Release로 실기기 설치
npx expo run:ios --device 00008150-0003452E0A28401C --configuration Release
```

CocoaPods가 UTF-8 로케일 에러(`Encoding::CompatibilityError`)를 내면 `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8` 환경변수로 다시 시도.

### ⚠️ Personal Apple Developer Team 함정

**Personal Team은 Push Notifications capability를 못 사인함**. 그런데 expo-notifications 모듈이 autolink되면서 매번 `ios/signaldeskapp/signaldeskapp.entitlements`에 `aps-environment` 키를 박아넣음 → 사인 실패.

`ios/`는 gitignore라서 `expo prebuild --clean -p ios` 돌릴 때마다 entitlements가 재생성됨. 그래서 prebuild 후엔 매번 수동으로 비워야 함:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
  </dict>
</plist>
```

유료 개발자 계정으로 옮기면 이 단계 불필요.

스토어 배포 단계는 아직 정해두지 않음 — 추후 EAS Build 또는 Xcode Archive로 추가 예정.

## 최근 변경 (역순)

| 커밋 | 요약 |
|------|------|
| `4af807d` | 장 시작 로컬 알림 (KR/US, 분 전 옵션) — 헤더 종 아이콘 → 모달 토글 |
| `3b07e0c` | 종목 상세/포트폴리오 편집을 슬라이드업 모달로 통일 |
| `feb5d4d` | 보유 종목 등록 인라인 폼 + 관심종목 해제 UX 명확화 |
| `98bfe06` | 즐겨찾기→관심종목 통일 / 실험지표 모달 / 휴장 모드 / 홈 KPI 탭 이동 |
| `0059703` | Today 탭 신설, Home 슬림화, 시장 탭 확장 |
| `93342b0` | 캔들 탭하면 OHLC 툴팁 |
| `d3d3824` | Google 로그인 네이티브 SDK로 교체 (앱 크래시 수정) |
