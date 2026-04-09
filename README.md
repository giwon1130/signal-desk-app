# signal-desk-app

SignalDesk 모바일 앱 MVP (Expo + React Native).

## 기능
- 시장 요약 탭
  - 시장 상태
  - 한국/미국 장 세션 상태
  - 핵심 요약 지표
- AI 로그 탭
  - 추천 브리프
  - 추천 근거/성과 실행 로그

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
