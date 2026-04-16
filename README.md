# signal-desk-app

SignalDesk 모바일 앱 MVP (Expo + React Native).

## 제품 포지션
- `signal-desk-app`은 웹의 모든 기능을 옮긴 앱이 아니라, 시장 흐름과 차트, AI 추천 로그를 모바일에서 빠르게 확인하는 컴패니언 앱이다.
- 직접 입력과 상세 관리가 필요한 관심종목, 포트폴리오, 모의투자 편집은 현재 웹이 중심이다.

## 기능
- 시장 요약 탭
  - 헤더 대시보드 + 시장 상태
  - 한국/미국 장 세션 카드
  - KPI 요약 카드 + 핵심 지표 리스트
- 차트 탭
  - KR/US 시장 전환
  - 1D/1M/1Y 기간 전환
  - 캔들 + 거래량 + 이동평균선(MA5/MA20/MA60)
  - 지수별(KOSPI/KOSDAQ/NASDAQ/S&P500) 전환
- AI 로그 탭
  - 추천 브리프
  - 추천/성과 필터
  - 추천 근거/성과 실행 로그 타임라인

## 현재 API 사용 범위
- `GET /api/v1/market/summary`
- `GET /api/v1/market/sections`
- `GET /api/v1/market/ai-recommendations`
- `GET /api/v1/market/watchlist`
- `GET /api/v1/market/portfolio`

현재 앱은 위 3개 API를 중심으로 동작한다.
- 시장 요약과 장 상태
- 지수 차트
- AI 추천/성과 로그

추가 반영:
- 홈 탭에서 관심종목 요약, 포트폴리오 요약, 실험 지표, 관심종목 이상징후를 함께 노출
- 모바일에서 전체 편집보다 빠른 확인 흐름을 우선

## 실행
```bash
npm install
npm run ios
```

또는
```bash
npm run android
```

웹 미리보기:
```bash
npm run web
```

## 환경변수
Expo public env 사용:

```bash
EXPO_PUBLIC_API_BASE_URL=https://signal-desk-api-production.up.railway.app
```

기본값은 `https://signal-desk-api-production.up.railway.app`.

로컬 API로 붙여야 하면 실행 시점에 덮어쓴다:

```bash
EXPO_PUBLIC_API_BASE_URL=http://localhost:8091 npm start
```

## 참고
- iOS 시뮬레이터/실기기에서는 `localhost`가 앱 디바이스 자신을 가리킬 수 있어, 같은 네트워크의 PC IP로 바꿔야 할 수 있음.
- 현재 개발 머신 Node 버전이 낮으면 Expo/React Native 최신 버전에서 엔진 경고가 발생할 수 있음.
- 차트 렌더링은 `react-native-svg`를 사용함.
- 웹과 기능 범위를 일부러 다르게 가져가고 있으며, 모바일은 빠른 확인과 이동 중 사용성을 우선한다.
