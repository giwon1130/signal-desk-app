# signal-desk-app

SignalDesk 모바일 앱 MVP (Expo + React Native).

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
EXPO_PUBLIC_API_BASE_URL=http://localhost:8091
```

기본값은 `http://localhost:8091`.

## 참고
- iOS 시뮬레이터/실기기에서는 `localhost`가 앱 디바이스 자신을 가리킬 수 있어, 같은 네트워크의 PC IP로 바꿔야 할 수 있음.
- 현재 개발 머신 Node 버전이 낮으면 Expo/React Native 최신 버전에서 엔진 경고가 발생할 수 있음.
- 차트 렌더링은 `react-native-svg`를 사용함.
