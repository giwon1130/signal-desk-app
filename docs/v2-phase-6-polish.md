# v2 Phase 6 — Polish (Beta 검증 후 진행)

> Status: **PLANNED** · v2.0.0 정식 출시 이후 점진 적용
> 의존: [v2-spec.md](./v2-spec.md) Phase 5 (정식 출시) 완료 + Beta 사용자 피드백 수집

## 배경

Phase 0~4 는 "동작하는 v2" 까지 빠르게 도달. 시각 회귀 위험과 의사결정 부담 큰 두 가지 polish 항목을 정식 출시 후로 분리.

본 문서는 Beta 후 바로 작업 시작할 수 있게 미리 정리한 spec.

## 1. 오늘 탭 정보 구조 다듬기

### 현재 (Phase 1 결과)

TodayTab 의 카드 16개:
1. 장 세션 칩 / 거래일 휴장 배너
2. 합성 위험도 hero
3. 시장 요약 지표 (Fear Meter 등)
4. 모닝/이브닝 브리프 hero
5. 보유 모니터
6. 보유 공시
7. 단타 픽
8. Top Movers KR gainers
9. Top Movers KR losers
10. Top Movers US gainers
11. Top Movers US losers
12. 관심종목 알림 리스트
13. 다가오는 이벤트
14. 개인화 브리핑
15. 뉴스 sentiment
16. 최근 알림 / 운세

스크롤 길고 정보 우선순위 흐림.

### 목표 — 12개 이하 + 명확한 우선순위

**Step A: Top Movers 4 → 1 통합 카드**

- 신규 `MoversCarousel` 컴포넌트
- 한 카드 안에 4개 탭 (KR↑ / KR↓ / US↑ / US↓)
- marketPreference 에 따라 default 탭 결정 (KR-only → KR↑)
- 4개 카드 → 1개 → **3개 절감**

**Step B: 프로필별 카드 우선순위**

KR-only:
1. 거래일 배너
2. 모닝 브리프 (장 전이라 핵심)
3. 합성 위험도
4. 보유 모니터 / 공시
5. KR Movers (default KR↑)
6. 단타 픽
7. 시장 지표 (Fear Meter 등)
8. 이벤트 / 알림 / 운세

US-only:
1. 거래일 배너
2. 이브닝 브리프 (마감 직후라 핵심)
3. 합성 위험도
4. 보유 모니터
5. US Movers (default US↑)
6. SEC 공시
7. 시장 지표
8. 이벤트 / 알림 / 운세

BOTH:
- 시간대별 자동 (08:30 KST 전후는 모닝 우선, 06:30 KST 전후는 이브닝 우선)

**Step C: Collapse default 정책**

- 항상 열림: 모닝/이브닝 hero, 합성 위험도, 보유 모니터
- Default 닫힘: 운세, 뉴스 sentiment, 최근 알림 (정보성)
- 사용자 토글 상태 AsyncStorage 저장 (`signal:v2:card-collapse:<key>`)

## 2. 디자인 토큰 마이그레이션

### 현재 상태

`src/design/tokens.ts` 의 SPACING/RADIUS/TYPO 정의됨 (Phase 0 신규).
실제 컴포넌트는 인라인 매직 넘버 (`borderRadius: 14`, `padding: 12` 등) — Phase 0 에서 토큰 자동 반영 안 됨.

### 마이그레이션 우선순위 (위험도 낮은 순)

| 순서 | 영역 | 영향 |
|---|---|---|
| 1 | `src/styles/` 의 styles 객체 → 토큰 사용 | 글로벌 스타일, 전체 영향 |
| 2 | `tabs/today_parts/*` — 가장 많이 표시되는 카드 | 시각 변화 큼, 검증 필수 |
| 3 | `tabs/stocks_parts/*` | |
| 4 | `tabs/aitab_widgets/*` | |
| 5 | `components/*` 모달들 | |
| 6 | `web/widgets/*` 웹 전용 | |

### 매핑 가이드

`tokens.ts` 의 값 → 인라인 대체:

```ts
// 기존
{ borderRadius: 14, padding: 14, gap: 10 }
// → 신규
{ borderRadius: RADIUS.m, padding: SPACING.xxl, gap: SPACING.l }
```

| 인라인 값 | 토큰 |
|---|---|
| `4` | `SPACING.xs` |
| `6` | `SPACING.s` / `RADIUS.s` |
| `8` | `SPACING.m` / `RADIUS.m` |
| `10` | `SPACING.l` / `RADIUS.l` |
| `12` | `SPACING.xl` / `RADIUS.xl` |
| `14` | `SPACING.xxl` (기존 카드 padding) |
| `16` | `SPACING['3xl']` |
| `20` | `SPACING['4xl']` |
| `999` (pill) | `RADIUS.pill` |

Typography (`fontSize` + `fontWeight` + `letterSpacing` 셋트):

```ts
// 기존
{ fontSize: 14, fontWeight: '800' }
// → 신규
{ ...TYPO.title }
```

| 인라인 fontSize | TYPO |
|---|---|
| `22` (hero) | `TYPO.hero` |
| `14` (title) | `TYPO.title` |
| `12` (body) | `TYPO.body` |
| `11` (caption) | `TYPO.caption` |
| `10` (meta + letterSpacing) | `TYPO.meta` |
| `16` (number) | `TYPO.number` |

숫자 표시 셀에 `...TABULAR_NUMS` 도 같이 spread.

### 시각 검증 체크리스트

각 카드 type 별 before/after 스크린샷:
- [ ] 합성 위험도 카드
- [ ] 모닝/이브닝 브리프 hero
- [ ] 보유 모니터 / 포지션 행
- [ ] 종목 탐색 결과 카드
- [ ] AI 픽 카드
- [ ] 알림 토글 행
- [ ] 종목 상세 모달

회귀 발견 시:
1. 인라인 → 토큰 매핑 잘못된 곳 찾기 (값 차이 표 참고)
2. 의도적 차이 (radius 14→8) 면 OK
3. 의도 아닌 차이 → 인라인 값 그대로 유지하고 토큰 정의 보강

## 3. 시각적 폴리시 후보

Beta 사용자 피드백 받고 결정:
- [ ] 차트 스파크라인 곳곳 추가 (헤더 / 카드 우측 상단)
- [ ] 컴팩트 모드 토글 (정보 밀도 ↑)
- [ ] 알림 인디케이터 (탭바 dot)
- [ ] Pull-to-refresh 애니메이션 brand accent
- [ ] 모달 트랜지션 elastic
- [ ] 로딩 상태 skeleton 도입

## 4. 작업 분량 추정

| 항목 | 분량 |
|---|---|
| 1. 오늘 탭 정보 구조 — Step A (Movers 통합) | M (반나절) |
| 1. 오늘 탭 정보 구조 — Step B (프로필별 우선순위) | M (반나절) |
| 1. 오늘 탭 정보 구조 — Step C (Collapse 정책) | S (2~3h) |
| 2. 디자인 토큰 — styles 글로벌 | M (반나절) |
| 2. 디자인 토큰 — 카드별 점진 | M~L (2~3일, 점진) |
| 3. 시각 폴리시 — 항목별 | XS~M 각각 |

전체 Phase 6 = **약 3~5일 분량**. v2.0.0 출시 후 1~2주에 걸쳐 점진 적용 권장.

## 5. 본 spec 의 다음 액션

1. v2.0.0 정식 출시 후 사용자 피드백 1주일 수집
2. 피드백 기반으로 Phase 6 항목 우선순위 재조정 (어떤 카드가 안 쓰임? 어떤 카드 우선?)
3. 본 문서의 작업 단계대로 점진 적용
4. 각 step 완료 시 본 문서 진행 상황 update
