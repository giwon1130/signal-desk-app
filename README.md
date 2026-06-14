# signal-desk-app

SignalDesk 클라이언트 — **Expo 하나로 iOS · Android · Web 을 모두 빌드**. 백엔드는 `../signal-desk-api` (Spring Boot Kotlin).

## 📚 문서

자세한 문서는 [`docs/`](docs/) 에 정리됨. 역할별 진입 경로는 [`docs/README.md`](docs/README.md) 참고.

- [제품 비전 / 용어집 / 사용자 흐름](docs/제품/) — PM / 디자이너 / 모두
- [디자인 시스템 / 컴포넌트 / 카피 가이드](docs/디자인/) — 디자이너
- [아키텍처 / 데이터 모델 / API / 프론트엔드](docs/엔지니어링/) — FE / BE
- [배포 / 환경변수 / 장애 대응 / 보안 / 비용](docs/운영/) — DevOps / 운영
- [테스트 전략](docs/품질/) — QA

자동화 에이전트(Claude 등) 용 노트는 [`AGENTS.md`](AGENTS.md).

## 플랫폼 포지션

| 플랫폼 | 배포 | 포지션 |
|--------|------|--------|
| iOS | **TestFlight 베타 운영 중** (Build #18, 2026-05-22) | Today 탭 중심의 빠른 확인용 컴패니언. 모닝 브리프 Hero, 합성 위험도 카드, 한/미 세션 칩, 보유 종목 공시, 알림 deep link. EAS 유료 플랜 |
| Android | Expo dev build | 안드로이드 TestFlight 동등 채널은 미정 |
| Web | **라이브 운영 중** — [giwon1130.github.io/signal-desk-app](https://giwon1130.github.io/signal-desk-app/) (GitHub Pages, Expo 웹 빌드). 빌드 소스 `src/web/*` | 데스크톱 3열 셸(티커 리본 + 좌 네비 + 메인 + 우 컨텍스트), Cmd+K 팔레트, AI 플레이북/성적표 |

단일 코드베이스지만 `Platform.OS === 'web'` 분기로 웹 전용 화면(`src/web/*`)을 올려 정보 밀도와 상호작용을 데스크톱에 맞춘다.

## 주요 기능

### 공용 (모바일 + 웹)
- 시장 요약: 헤더 대시보드, 한국/미국 세션 상태, KPI, 핵심 지표
- 차트: KR/US 전환, D/W/M 캔들 + 거래량 + MA5/MA20/MA60, 지수(KOSPI/KOSDAQ/NASDAQ/S&P500)
- 워크스페이스: 관심종목, 실제 보유(매수가·수량·손익), AI 추천 로그
- 뉴스 sentiment
- **합성 위험도(`compositeRisk`)** — PizzINT+VIX+뉴스 종합 1~10 (기존 Pentagon Pizza / Policy Buzz / Bar Counter-Signal 단독 카드 폐기, 합성으로 통합)
- 휴장/주말 모드 자동 전환

### 모바일 전용
- **모닝 브리프 Hero 카드** (08:30 KST) — DART 공시 + FRED 매크로 + 수급 + 뉴스 Gemini 종합
- 합성 위험도 알림 토글 (score≥8 시 08:32 KST 푸시)
- 운세 팝업 하루 1회 제한, 시작 로딩 화면(투자 명언 로테이션)
- 장 시작 로컬 알림 (KR 09:00 / US 23:30 KST, 분 전 옵션)
- 종목 상세 슬라이드업 모달
- 알림 탭 deep link (모닝 브리프/위험도/관심종목 공시)
- Google 네이티브 SDK 로그인

### 웹 전용
- **TickerRibbon** — 상단 고정 지수/세션 배지/스파크라인
- **HomeDashboard** — 섹터 히트맵, AltSignals 프로그레스 바, 단타 픽 그리드
- **StocksPage** — 정렬 가능한 테이블 + StanceTag
- **ContextSidebar** — 관심종목, 최근 AI 로그, 오늘의 운 미니 카드
- **AIWorkspace** — 두 서브탭
  - *오늘의 플레이북*: BriefingHero + ActionItem(우선도별) + Pick 카드 (관심 인라인 추가)
  - *성적표*: 승률/평균수익률/참여율 메트릭 + 놓친 픽 / 따라간 픽 / 최근 결과 테이블
- **Cmd+K CommandPalette** — 탭 이동 + 종목 점프
- **Google Sign-In (GIS)** — `EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB` 설정 시 활성

## API 의존

```
# 시장 (src/api.ts)
GET  /health
GET  /api/v1/market/summary            # newsSentiments·compositeRisk·watchAlerts·briefing 포함 (별도 news 엔드포인트 없음)
GET  /api/v1/market/sections
GET  /api/v1/market/ai-recommendations
GET  /api/v1/market/top-movers?limit
GET  /api/v1/market/stocks/search?q&market

# AI / 인사이트 / 미디어 (src/api/*)
GET  /api/v1/ai/picks                  # 오늘의 AI 픽 (공통)
GET  /api/v1/ai/signals                # 숨은 시그널 (Bearer)
GET  /api/v1/insights/today            # Gemini 시황 종합
GET  /api/v1/media/summaries/latest    # 최신 모닝/이브닝 브리프
GET  /api/v1/disclosures/recent?limit  # 보유/관심 KR 공시 (Bearer)
GET  /api/v1/events/upcoming?days      # 주요 이벤트 캘린더

# 워크스페이스 (Bearer)
GET  /api/v1/workspace/watchlist       POST /api/v1/workspace/watchlist   DELETE .../{id}
GET  /api/v1/workspace/portfolio       POST /api/v1/workspace/portfolio   DELETE .../{id}
GET  /api/v1/workspace/fortune         # 오늘의 운세

# 알림 / 디바이스 (Bearer)
GET  /api/v1/me/alert-preferences      PUT  /api/v1/me/alert-preferences  # marketPreference·eveningBrief 등
POST /api/v1/push/devices              DELETE /api/v1/push/devices/{token}
GET  /api/v1/push/alerts?limit         # 알림 이력

# 인증 (src/api/auth.ts)
POST /auth/signup                      POST /auth/login
POST /auth/oauth/google                POST /auth/oauth/kakao   # idToken/accessToken → 자체 JWT
GET  /auth/me
```

## 실행

```bash
npm install

# 모바일
npx expo run:ios                        # 실기기/시뮬레이터 (네이티브 모듈 변경 후)
npm start                               # Metro만 (JS 변경)

# 웹 (로컬 dev)
npm run web                             # expo start --web

# 타입 체크 (commit 전 필수)
npx tsc --noEmit
```

## 환경변수

`EXPO_PUBLIC_*` 만 런타임에서 `process.env` 로 읽힌다.

| 키 | 기본값 | 용도 |
|----|-------|------|
| `EXPO_PUBLIC_API_BASE_URL` | `https://signal-desk-api-production.up.railway.app` | 백엔드 주소 |
| `EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB` | (없음) | 웹 Google Sign-In. 없으면 웹에서 구글 로그인 비활성. |

로컬 백엔드에 붙일 때 (실기기는 `localhost` 대신 PC IP):

```bash
EXPO_PUBLIC_API_BASE_URL=http://192.168.x.x:8091 npm start
```

## 배포

### 웹 (라이브 운영 중)

**라이브: https://giwon1130.github.io/signal-desk-app/** — `main` 브랜치 GitHub Actions 워크플로우로 `expo export -p web` 결과를 GitHub Pages에 배포한다.

> 이전에는 Railway(`signal-desk-web` 서비스)로 배포했으나 2026-05-26 비용 정리 후 GitHub Pages(무료)로 이전했다. 옛 Vite 레포 `signal-desk-web`은 더 이상 사용하지 않는다(deprecated).

참고:
- 빌드 소스: `src/web/*` (+ `Dockerfile.web`은 nginx 정적 호스팅용으로 보존)
- Google OAuth 운영 URL을 GCP OAuth Client의 **Authorized JavaScript origins**에 등록 (trailing slash 금지)

### 모바일 (TestFlight 베타 운영 중)

```bash
# 빌드 + TestFlight 자동 제출 한 번에 (alias `sdbuild`)
npx eas build --profile production --platform ios --auto-submit
```

- 최근 빌드: Build #18 (2026-05-22, UX 피드백 반영 + 알림 모달 높이 수정)
- EAS 유료 플랜 (계정 단위, `@giwon1130`)
- ASC 앱: SignalDesk (App ID `6770443767`), Bundle ID `com.giwon.signaldesk`
- 식별자/자격증명/Gotcha는 `.claude/context.md` 참조

실기기 Debug Release(개발용):
```bash
./scripts/release.sh
./scripts/release.sh feat/foo --device <UDID>
./scripts/release.sh feat/foo --no-build
```

## 참고
- iOS 시뮬레이터/실기기에서 `localhost` 는 기기 자신 — 같은 네트워크 PC IP 사용
- 차트 렌더링은 모바일은 `react-native-svg`, 웹은 `src/web/shared.tsx` 의 인라인 SVG
- 웹·모바일 기능 범위를 일부러 다르게 가져간다. 모바일은 이동 중 확인, 웹은 분석/편집.
- 에이전트용 상세 규약은 `AGENTS.md` 참고.
