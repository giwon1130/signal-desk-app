# Signal Desk — 리딩(Leading Call) 기능 Spec

> Status: **DRAFT v0.1** (2026-05-29) · 미구현
> 사용자 요청: "친구들한테 종목·시황 설명하는 걸 좋아함. 정리해서 쓰면 공유되고,
> 글 속 종목이 그 시점 가격으로 자동 등록되고, 나중에 오르면 '내가 좋다고 했지?' 알림."
> 코드네임: **리딩 (Reading/Leading Call)**

---

## 1. 핵심 통찰 — Trading League 의 사촌

리딩 콜의 본질은 **"종목을 그 시점 가격으로 박제 → 시간 지나 성과 추적"** — Trading League 의 Trade 와 동일 메커니즘. 인프라 대거 재활용.

| 필요 | 재활용 자산 |
|---|---|
| 종목 시점 가격 lock | League Trade — 시세 fetch + immutable |
| 수익률 자동 추적 | League Position/Leaderboard 수익률 계산 |
| 목표 도달 알림 | WatchlistAlert + ExpoPush |
| 종목 자동 인식 | searchStocks (종목명/티커 매칭) |
| 시황 요약 보조 | Gemini (GeminiPrompts 패턴) |
| 피드 UI | League 거래 피드 |
| 코드 초대 | League joinCode |

## 2. 결정 완료 (2026-05-29)

- [x] **위치**: 독립 **5번째 탭 '리딩'** (📣 또는 Megaphone 아이콘). TabKey 확장.
- [x] **공유 범위**: **코드/링크 초대 친구만** (League joinCode 패턴 — 리더별 구독 코드)

## 3. 도메인 모델

### Leader (리더 = 콜 작성자)
- userId, displayName, bio, inviteCode (구독용 5자리)
- 통계(derived): 총 콜 수, 적중률, 평균 수익률, 팔로워 수

### Follow (구독 관계)
- leaderUserId, followerUserId, joinedAt
- 코드로 구독 (League join 과 동일 흐름)

### ReadingPost (리딩 글 = 시황/콜 묶음)
- id, leaderUserId, title, body(텍스트), createdAt, visibility
- 글 1개에 종목 콜 0~N개 (시황만 쓰면 0개, 종목 추천이면 N개)

### Call (종목 콜 — immutable)
- id, postId, market, ticker, name
- **entryPrice** (작성 시점 시세 lock — 수정 불가, 신뢰 핵심)
- entryPriceLockedAt, exchangeRate(필요시)
- targetReturnPct (선택 — "+20% 보면 좋겠다")
- status: ACTIVE / HIT(목표달성) / CLOSED(리더가 종료)
- 성과(derived): 현재가 대비 수익률

**immutable 원칙**: entryPrice 는 작성 순간 박제. 나중에 못 바꿈 → "사후에 유리하게 조작" 불가 = 리더 신뢰의 핵심.

## 4. 종목 자동 인식 (핵심 UX)

글 텍스트 → 종목 추출:
1. **티커 패턴**: 6자리 숫자(KR) / 영문 대문자 1~5자(US) 정규식
2. **종목명 매칭**: searchStocks 로 "삼성전자", "엔비디아" 같은 한글/영문명 → ticker
3. **작성자 확인 단계**: 자동 감지 후 "이 종목들 콜에 포함할까요?" 칩으로 토글 (오인식 방지 — "삼성" 이 여러 개거나 일반명사 충돌)
4. 확정 시 각 종목 현재가 fetch → entryPrice lock

예:
```
글: "삼성전자 지금 바닥. SK하이닉스도 같이 간다. NVDA는 조정 기다려"
자동 감지: [삼성전자 005930] [SK하이닉스 000660] [NVDA]
작성자: NVDA 빼고 2개만 콜로 등록 (토글) → 등록가 lock
```

## 5. 성과 추적 + "거봐" 알림

### 성과 (실시간)
- 각 Call: `(현재가 - entryPrice) / entryPrice` (League 통화/환율 로직 재활용)
- Post 전체: 콜 평균 수익률
- 피드/상세에 실시간 배지 (+12% 🟢)

### "내가 좋다고 했지?" 알림
- Call 이 **targetReturnPct 도달** 또는 **의미있는 상승(+15% 등)** 시:
  - **리더에게**: "🎯 삼성전자 +15% — 5/20 콜 적중! 자랑할 타이밍"
  - **구독자에게**: "📈 [리더] 의 삼성전자 콜 +15% 달성"
- WatchlistAlert 의 단계적 재알림(+5%p) 로직 재활용 → 스팸 방지
- 하락 시에도 정직하게: 큰 하락이면 "삼성전자 콜 -10%" (신뢰 위해 성과는 양방향 노출)

## 6. 시황 정리 (Gemini 보조)

리더가 시황 글 쓸 때:
- **초안 보조**: 오늘 코스피/환율/미금리/주요 뉴스를 Gemini 가 1차 정리 → 리더가 편집
- **구조화**: 자유 텍스트 → "시장 요약 / 주목 섹터 / 리스크" 섹션 자동 분류 (선택)
- 기존 EveningBrief/MarketInsight 의 GeminiPrompts 패턴 재활용
- ⚠️ AI 는 보조만 — 리더의 색깔(본인 의견)이 핵심. 자동 생성 글 남발 X

## 7. 신뢰도 / 통계 (리더 프로필)

콜이 박제되니 **객관적 성과 통계** 가능 — 리딩의 차별화 포인트:
- 적중률 (목표 도달 / 전체 콜)
- 평균 수익률 / 최고·최악 콜
- 활동 기간, 콜 빈도
- "이 리더 30일 평균 +8%, 적중률 65%" → 구독자가 신뢰 판단

(주의: 리딩=투자자문 경계. **면책 강하게** — "참고용, 투자 책임 본인". 수익률 보장 표현 금지)

## 8. 5탭 통합

TabKey: `today | stocks | ai | league | reading`

리딩 탭 구조:
```
[리딩 홈]
  - 내가 리더면: '새 글 쓰기' + 내 콜 성과 요약
  - 구독 중 리더들의 최신 글 피드
  - '리더 코드로 구독' 입력

[글 작성]
  - 제목 + 본문 (자유 텍스트)
  - 종목 자동 감지 → 확인 칩
  - (선택) Gemini 시황 초안 버튼
  - 게시 → 종목 가격 lock + 구독자 푸시

[글 상세]
  - 본문 + 콜 종목 카드 (entryPrice → 현재가 → 수익률)
  - 작성 후 경과 시간, 성과 추이

[리더 프로필]
  - 통계 (적중률/평균수익률) + 콜 히스토리 + 구독 버튼
```

## 9. 기존 자산 재활용 맵 (구현 효율)

| 신규 | 재활용/참고 |
|---|---|
| Call entryPrice lock | `TradeService.placeTrade` 의 시세 lock 흐름 |
| 수익률 계산 | `LeaderboardService.evaluatePosition` |
| 코드 구독 | `LeagueService.joinByCode` |
| 성과 알림 | `WatchlistAlertService` + 단계적 재알림 |
| 종목 검색/인식 | `searchStocks` + 종목명 사전 |
| 시황 Gemini | `GeminiPrompts` + `GeminiClient` (fallback chain 포함) |
| 피드 UI | `LeagueDetailModal` 거래 피드 |
| 푸시 deep link | `usePushDeepLink` (READING_CALL_HIT 타입 추가) |

## 10. MVP (V1)

포함:
- 리더/구독 (코드 초대)
- 글 작성 + 종목 자동 인식 + 가격 lock
- 구독 피드
- 콜 실시간 성과
- "거봐" 알림 (목표/큰 상승 도달)

V1 제외 (추후):
- Gemini 시황 자동 초안 (V1.1)
- 리더 통계 대시보드 (V1.1)
- 댓글/좋아요 (V2)
- 전체 공개 리더 (V2)

## 11. Phase 작업 (추정)

| Phase | 내용 | 분량 | 상태 |
|---|---|---|---|
| A | DB(V21) + 도메인 + 리포지토리 (Leader/Follow/Post/Call) | 1d | ✅ 완료 (2c753f6) |
| B | 종목 자동 인식 (텍스트 파싱 + searchStocks 매칭) | 1d | ✅ 완료 (979e984) |
| C | 글 작성/게시 API + 가격 lock + 구독 API | 1.5d | ✅ 완료 (979e984) |
| D | 피드 + 성과 추적 (수익률 derived) | 1d | ✅ 완료 (979e984) |
| E | "거봐" 알림 (스케줄러 + 푸시) | 1d | ✅ 완료 (979e984) |
| F | 앱 리딩 탭 (홈/작성) | 2.5d | ✅ 완료 (05a853e) — 상세/프로필 모달은 후속 |
| G | (V1.1) Gemini 시황 초안 + 리더 통계 | 1.5d | ⬜ 미착수 |
| H | Beta 검증 | 1~2d | ⬜ EAS 빌드 대기 |

전체 **약 10~12일** (League 와 유사 규모, 인프라 재활용으로 단축 여지).

> **배포 상태 (2026-05-29)**: 백엔드 A–E Railway 라이브(V21 마이그레이션 적용, 휴면 엔드포인트).
> 앱 F 는 v2 브랜치 커밋 완료, **EAS 빌드 미실행**(Beta 검증용 1빌드 필요).
> **운영자 설정 필수**: Railway env `SIGNAL_DESK_READING_ADMIN_USER_IDS=<owner userId>` —
> 비어있으면 모든 리더 신청이 PENDING 으로 남아 승인 불가(닭-달걀). 본인 userId 넣으면 자동 APPROVED.
>
> **후속(F 잔여)**: 리딩 글 상세 모달, 리더 프로필 모달(통계+글, 백엔드 `/leader/{id}/profile` 준비됨).

## 12. 결정 완료 (2026-05-29)

- [x] **콜 종료**: **무기한 추적 + 리더 수동 종료** (CLOSED). 목표 도달은 HIT 마킹하되 추적 계속.
- [x] **"거봐" 알림 임계**: **콜별 targetReturnPct + 기본 +15%** (리더가 목표 설정 가능, 없으면 15%)
- [x] **시황 글**: **통합 피드** (종목 0개 시황글도 콜 글과 같은 피드)
- [x] **리더 자격**: **신청/승인제** — Leader.status PENDING/APPROVED. 본인(첫 계정) 자동 APPROVED, 나머지 신청 후 승인. APPROVED 만 글 작성.
- [x] **하락 콜 알림**: **보냄 (양방향 정직)** — 큰 하락도 구독자 알림. 신뢰·투명성.
- [x] **종목 오탐**: **작성자 확인 필수** — 자동 감지 후 칩 토글로 확정.
- [x] **투자자문 면책**: **강하게** — 모든 콜/피드에 "참고용, 투자 책임 본인" 면책. 수익률 보장 표현 금지.

## 13. 다음 액션

1. §12 미결 7개 합의
2. v2(현재 진행)·League 와의 우선순위 — 리딩이 League 보다 사용자 핵심 욕구에 가까울 수 있음
3. 합의 후 Phase A 시작

---
**관련**: [mock-investment-game-spec.md](./mock-investment-game-spec.md) (League — 인프라 공유), [v2-spec.md](./v2-spec.md)
