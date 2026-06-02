# API 명세

> **누가 봄**: FE / 외부 통합
> **언제 봄**: 호출 코드 작성 / 디버깅 / 새 endpoint 추가 시 reference
> **단일 진실의 원천**: 백엔드 [`signal-desk-api/docs/API명세.md`](https://github.com/giwon1130/signal-desk-api/tree/main/docs)
> 이 문서는 FE 관점 요약.

## Base URL

(stub)
- 운영: `https://signal-desk-api-production.up.railway.app`
- 로컬: `http://localhost:8091` (또는 PC IP)

## 인증

(stub)
- 헤더: `Authorization: Bearer <jwt>`
- JWT 발급: `/auth/login`, `/auth/signup`, `/auth/oauth/google`, `/auth/oauth/kakao`
- 만료: 720h (30일)
- 저장: AsyncStorage `auth.token` (앱) / localStorage (웹)

## Rate Limit

(stub) IP 기반 1분 윈도우 — 초과 시 `429 Retry-After: 60`.
| 경로 | 한도 |
|------|------|
| `/auth/*` | 5 / 분 |
| `/api/v1/market/*` | 60 / 분 |
| 그 외 | 무제한 |

## 엔드포인트

### 인증
(stub)
- `POST /auth/signup` body `{ email, password, nickname }`
- `POST /auth/login` body `{ email, password }`
- `POST /auth/oauth/google` body `{ idToken }`
- `POST /auth/oauth/kakao` body `{ accessToken }`
- `GET  /auth/me` (Bearer)

### 시장
(stub)
- `GET /health` — 헬스/스토어 모드
- `GET /api/v1/market/summary` — 요약 (`marketSessions`, `tradingDayStatus`, `briefing`, `newsSentiments`, `watchAlerts`, `alternativeSignals`, `compositeRisk`). 뉴스는 별도 엔드포인트 없이 `newsSentiments` 로 내려옴.
- `GET /api/v1/market/sections` — 한·미 시장 + 차트
- `GET /api/v1/market/ai-recommendations` (Bearer optional)
- `GET /api/v1/market/stocks/search?q=...&market=KR|US|ALL&limit=20`
- `GET /api/v1/market/top-movers?limit=10` — KR KOSPI·KOSDAQ(+US) 급등/급락

### AI / 인사이트 / 미디어
(stub)
- `GET /api/v1/ai/picks` — 오늘의 AI 픽 (공통, 인증 불필요)
- `GET /api/v1/ai/signals` (Bearer) — 숨은 시그널 (공시·수급·급등락)
- `GET /api/v1/insights/today` — Gemini 시황 종합
- `GET /api/v1/media/summaries/latest` — 최신 모닝/이브닝 브리프
- `GET /api/v1/disclosures/recent?limit=30` (Bearer) — 보유/관심 KR DART 공시
- `GET /api/v1/events/upcoming?days=14` — 주요 이벤트 캘린더 (FOMC/실적/공시)

### 워크스페이스 (Bearer 필요)
(stub)
- `GET / POST / DELETE /api/v1/workspace/watchlist[/{id}]`
- `GET / POST / DELETE /api/v1/workspace/portfolio[/{id}]`
- `GET /api/v1/workspace/fortune` — 오늘의 운세 (userId + 날짜 시드)

### 알림 / 디바이스 (Bearer 필요)
(stub)
- `GET  /api/v1/me/alert-preferences` — 알림 선호 (`marketPreference`, `eveningBriefEnabled`, `compositeRiskEnabled` 등)
- `PUT  /api/v1/me/alert-preferences` body = 위 선호 전체
- `POST   /api/v1/push/devices` body `{ platform, expoToken }`
- `DELETE /api/v1/push/devices/{expoToken}`
- `GET    /api/v1/push/alerts?limit=30` — 알림 이력

### WebSocket 실시간 시세
(stub)
- `wss://.../ws/prices`
- 클라이언트 → `{ "action": "subscribe", "tickers": ["005930", "NVDA"] }`
- 서버 → 5초마다 `{ "type": "snapshot", "prices": { "005930": {...} } }`
- 시장 OPEN 시간만 broadcast (휴장 시 silent)

## 에러 코드

(stub)
| HTTP | 의미 |
|------|------|
| 400 | 잘못된 요청 (validation 등) |
| 401 | 인증 실패 / 토큰 만료 |
| 403 | CORS 차단 / 권한 없음 |
| 404 | 리소스 없음 (또는 file mode 에서 auth endpoint 비활성) |
| 429 | rate limit 초과 |
| 500 | 서버 오류 |

## 응답 wrapper

(stub) 모든 response 가 `{ success, data?, error? }`.
