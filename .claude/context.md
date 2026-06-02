# Context

## ⏭ 다음 작업 포커스 — v2.0.0 리팩토링
현재 앱은 **v1 5탭(today/home/market/stocks/ai)** 그대로 운영 중. 아래 작업들은 전부 출시 완료:
TodayTab 재배치 / AI 인사이트 허브(AITab) / Gemini 종합 인사이트 / 주요 이벤트 캘린더.

다음 메이저 작업은 **v1 5탭 → v2 3탭 리팩토링** (아직 시작 전, 드래프트 상태):
- 스펙: [`docs/v2-spec.md`](../docs/v2-spec.md) — 정확한 드래프트, 착수 시 먼저 정독.
- 그 전까지 v1에 얹은 출시 기능: marketPreference(KR/US/BOTH) 필터, EVENING_BRIEF 푸시+딥링크, 인트라데이/이브닝 브리프 토글.

## ui scope (v1, 현행)
- 5탭: 오늘(today) / 홈(home) / 시장(market) / 종목(stocks) / AI(ai) — `App.tsx`
- 차트: 캔들/거래량/MA5/20/60 (시장 탭)

## api
- default: `https://signal-desk-api-production.up.railway.app` (`src/api.ts`)
- local override: `EXPO_PUBLIC_API_BASE_URL=http://<PC-IP>:8091 npm start`
- 호출 코드: `src/api.ts`(market/workspace/검색/운세) + `src/api/`(ai·disclosures·events·insights·media·alertPreferences·pushDevice·auth·socialAuth)
- 전체 엔드포인트 목록은 `README.md` API 의존 섹션 / `docs/엔지니어링/API명세.md` 참조

## runtime note
- Expo 최신 스택은 Node 20.19.4+ 권장

## 배포 식별자 (iOS / TestFlight, 2026-05-18 재정비 후)

| 항목 | 값 |
|------|------|
| Expo 프로젝트 | `@giwon1130/signal-desk-app` |
| Expo projectId | `891d142e-d493-43d3-a7b1-ac7bdcf23963` |
| **현행 Bundle ID** | `com.giwon.signaldesk` |
| **현행 ASC App ID** | `6770443767` (앱 이름 `Signal Desk`) |
| Apple Team ID | `776H9NV6HT` (Giwon Im Individual, baby-log와 공용) |
| Apple ID (제출) | `gwim113000@gmail.com` |

ASC TestFlight 페이지: https://appstoreconnect.apple.com/apps/6770443767/testflight/ios

**구 ASC App (`6767399371` / `com.anonymous.signal-desk-app` / `Signal Desk — 투자 대시보드`)은 폐기 안 함** — 기존 TestFlight 테스터 보호용으로 ASC에 그대로 둠. 새 빌드는 현행 앱에만 올라감.

## 빌드 / 제출 명령

> **빌드 정책 (2026-05-20)**: 커밋마다 바로 빌드하지 말 것. 코드 변경·커밋·push 는 자유롭게,
> **EAS 빌드는 작업 묶음이 끝난 뒤 사용자에게 물어보고 승인받은 다음** 한 번에 모아서 실행한다.
> EAS 빌드는 크레딧 차감(iOS medium $2/회). Claude 가 자동으로 빌드 트리거 금지.
> 상세: 메모리 `feedback_build_batching`, 크레딧 잔액은 `reference_app_build_commands`.

```bash
# node_modules 없으면 먼저
npm install

# TestFlight까지 한 번에 (다음 빌드부터 기본)
npx eas build --profile production --platform ios --auto-submit

# 분리 실행
npx eas build --profile production --platform ios
npx eas submit --platform ios --latest --non-interactive
```

- `production` 프로필 = store distribution (TestFlight). `preview`는 ad-hoc이라 TestFlight 안 올라감
- 자격증명(Distribution Cert, Provisioning Profile, ASC API Key) 전부 EAS 서버 저장 — 추가 입력 없음
- `appVersionSource: remote` — buildNumber는 EAS가 자동 증가

## TestFlight 현황 (2026-05-22)

- 최근 production 빌드: **Build #18 (2026-05-22)** — UX 피드백 반영 + 알림 모달 높이 수정. auto-submit으로 TestFlight 자동 업로드. (README와 일치)
- TestFlight 유효 기한: 최신 빌드 + 90일
- 테스터 그룹: Internal(≤100, 리뷰 X) / External(≤10000, Public Link 가능, 첫 빌드만 Beta App Review)

## 알려진 이슈 (해결 필요, 사용자 작업)

- **Google 로그인 동의 화면 이름이 "오타쿠"로 노출**. Google Cloud Console OAuth Consent Screen App name 필드를 `Signal Desk`로 수정 필요. 같은 Google Cloud 프로젝트를 다른 토이가 공유 중일 가능성 — 깔끔하게 가려면 signal-desk 전용 GCP 프로젝트 신설 후 새 OAuth Client로 교체.
- **Bundle ID 변경 후 Google OAuth iOS Client의 Bundle ID 필드도 `com.giwon.signaldesk`로 갱신 필요** — 안 하면 Google 로그인 실패.

## Gotcha

- `node_modules`가 비어있을 수 있음 — devDependencies에 `eas-cli` 있어도 install 안 했으면 `npx eas`가 실패. `npm install` 먼저.
- 본 프로젝트는 **`app.json`** 사용 (baby-log-app은 `app.config.ts`). projectId/bundleId 수정 시 위치 다름.
- Bundle ID가 Expo 기본값 `com.anonymous.*`이라 정식 출시 단계에서 한 번 정리 필요. TestFlight 단계에선 무해.
