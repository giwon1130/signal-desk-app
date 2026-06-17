# 스크린샷 캡쳐 가이드

[SHOWCASE.md](../../SHOWCASE.md) 가 참조하는 이미지들을 **이 폴더(`docs/screenshots/`)** 에 아래 파일명으로 저장하세요.

## 필요한 샷 (파일명 고정)

| 파일명 | 화면 | 추천 상태 |
|---|---|---|
| `today.png` | 오늘 탭 | 모닝/마감 브리프 Hero + 합성 위험도 카드가 보이게 |
| `stocks.png` | 종목 탭 | 보유 또는 관심종목이 몇 개 있고 손익이 보이는 상태 |
| `ai.png` | 시데 AI | 비서에게 한 질문 → 답변이 떠 있는 대화 화면 |
| `reading.png` | 리딩 탭 | 피드에 콜 글(진입가·수익률) 또는 리더 둘러보기 |
| `league.png` | 리그 탭 | 리그 상세(리더보드)나 리그 목록 |
| `web.png` | 웹(데스크톱) | 1280px+ 폭에서 3열 셸 전체 |

> 화면이 비어 보이지 않게 **로그인 + 데이터가 있는 상태**에서 찍는 게 좋습니다. (관심종목 2~3개, 보유 1~2개 정도)

---

## 방법 A — 실기기(TestFlight)에서 (가장 쉬움)
이미 TestFlight 베타가 폰에 깔려 있으니 폰에서 찍는 게 제일 깔끔합니다.
1. 앱 실행 → 각 탭에서 스크린샷(전원+볼륨업 / 홈버튼폰은 전원+홈)
2. AirDrop 또는 파일앱으로 Mac 으로 옮긴 뒤 `docs/screenshots/` 에 위 파일명으로 저장

## 방법 B — iOS 시뮬레이터에서
시뮬레이터는 이미 부팅돼 있습니다(iPhone 17). 앱을 시뮬레이터에 설치·실행해야 합니다.

```bash
cd /Volumes/Dev/Playground/signal-desk-app

# 1) 시뮬레이터용 dev 빌드 설치·실행 (최초 1회 빌드, 수 분 소요)
#    ※ Xcode 26 에서 RNCore 링커 에러가 나면: RCT_USE_PREBUILT_RNCORE=0 npx expo run:ios
npx expo run:ios

# 2) 앱에서 이메일/비밀번호로 로그인하고(시뮬레이터는 구글/카카오 OAuth 어려움)
#    관심종목 몇 개 담아 화면을 채운 뒤, 탭을 옮겨가며 캡쳐:

# (선택) 상태바를 데모용으로 깔끔하게
xcrun simctl status_bar booted override --time 9:41 --batteryState charged --batteryLevel 100

# 각 탭으로 이동한 상태에서 한 장씩:
xcrun simctl io booted screenshot docs/screenshots/today.png
xcrun simctl io booted screenshot docs/screenshots/stocks.png
xcrun simctl io booted screenshot docs/screenshots/ai.png
xcrun simctl io booted screenshot docs/screenshots/reading.png
xcrun simctl io booted screenshot docs/screenshots/league.png

# 상태바 원복
xcrun simctl status_bar booted clear
```

## 방법 C — 웹(데스크톱 셸)
1. 브라우저에서 데모 열기: https://giwon1130.github.io/signal-desk-app/
2. 창 폭을 **1280px 이상**으로 넓혀 3열 셸이 나오게
3. OS 스크린샷(맥: ⌘⇧4 → 영역 선택)으로 찍어 `docs/screenshots/web.png` 로 저장

---

캡쳐를 넣고 커밋하면 SHOWCASE.md 표에 자동으로 보입니다.
이미지가 큰 경우(>1MB) 가로 ~1080px 정도로 리사이즈하면 README 로딩이 빨라집니다.
