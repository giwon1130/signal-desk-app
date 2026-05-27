# signal-desk-app v2.0.0 — Spec

> Status: **DRAFT (2026-05-27)** · 합의 후 Phase 0 부터 점진 구현
> Owner: Giwon · 검토: 본 spec 의 모든 결정 포인트는 코딩 시작 전 사용자 합의 필요

## 1. 배경

v1.0.0 ([Release](https://github.com/giwon1130/signal-desk-app/releases/tag/v1.0.0)) 은 KR + US 시장을 다 다루지만 한 사용자에게 양쪽이 동등하게 노출되어 정보가 과부하. 시장 선호(marketPreference) 가 ambient 콘텐츠만 필터링 — 탭 구조·메인 화면·온보딩은 모두 BOTH 기준. KR-only 사용자는 미장 정보를 매번 무시해야 하고, US-only 사용자는 한국 정보를 매번 무시해야 함.

**v2.0.0 목표**: "내 시장만 보는 깔끔한 도구" — 사용자 프로필별로 메인 흐름이 달라지고, 정보 밀도·디자인이 프로 트레이더 도구처럼 단단해짐.

## 2. 핵심 디자인 결정 (사용자 합의 완료, 5/27)

| # | 결정 | 선택 |
|---|---|---|
| 1 | 시장 분기 깊이 | **온보딩 + 탭/메인화면 프로필 별 다르게** |
| 2 | UI/UX 톤 | **디자인 시스템 + 정보 구조 모두 갈아엎음 (v2.0.0)** |
| 3 | 작업 방식 | **Spec → 합의 → 점진 구현** (본 문서) |
| 4 | 탭 구조 | **3탭으로 단순화** (현재 5탭 → 오늘 / 종목 / AI) |
| 5 | 디자인 톤 | **대시보드 프로** (Bloomberg/키움 HTS 계열) |

## 3. 시장 프로필 모델

### 3 프로필
- **KR-only** (`marketPreference = 'KR'`): 한국 시장 중심. 미장은 KR 영향 거시만 작게.
- **US-only** (`marketPreference = 'US'`): 미국 시장 중심. KR 정보 거의 노출 안 함.
- **BOTH** (`marketPreference = 'BOTH'`): 양쪽 동등.

### 데이터 모델 영향
- `signal_desk_alert_preferences.market_preference` 컬럼 그대로 사용 (V17 마이그레이션 — 이미 있음).
- 추가 컬럼 불필요.
- 백엔드 API 시그니처 변경 없음. 프론트가 같은 데이터를 다르게 조립.

## 4. 온보딩 흐름 (신규)

첫 실행 + `marketPreference` 미설정 사용자 (1.0 → 2.0 업그레이드 사용자는 기존 값 유지 → 온보딩 스킵).

```
[Step 1] 시작 화면
  로고 + "Signal Desk — 내 시장에 맞춰진 투자 데스크" + 시작 버튼

[Step 2] 시장 선택 (필수)
  세 카드:
   🇰🇷 한국 시장
      "KOSPI/KOSDAQ · DART 공시 · 외인·기관 수급 중심"
   🇺🇸 미국 시장
      "NASDAQ/S&P · SEC EDGAR · Yahoo movers 중심"
   🌍 둘 다
      "양쪽 시장을 균형 있게"

[Step 3] 알림 권한 (선택)
  "장 시작/공시/위험도 알림 받을래?" + 시스템 권한 다이얼로그
  → 거절해도 진행 가능

[Step 4] 관심 종목 시드 (선택)
  추천 종목 6~8개 (프로필별 다름):
   KR: 삼성전자, SK하이닉스, NAVER, 카카오, ...
   US: NVDA, MSFT, AAPL, TSLA, ...
  탭으로 한 번에 관심 등록. 건너뛰기 가능.

[완료] 홈으로 진입
```

**기존 사용자 마이그레이션**:
- 앱 업데이트 후 첫 실행 시 `marketPreference` 가 있으면 → 온보딩 스킵, 바로 새 v2 홈
- 알림 토글들도 그대로 유지 (DB 호환)
- 1회성 토스트: "v2.0 — 시장 프로필에 맞춰 화면이 새로워졌어요. 설정에서 언제든 변경"

## 5. 탭 구조 (5 → 3)

### 현재 (v1)
`Today / Home / Market / Stocks / AI` — 정보 겹침 큼 (Today/Home/Market 모두 시장 분위기 + 손익 + 이벤트 노출)

### v2 (3탭)

| 탭 | 핵심 질문 | 흡수한 v1 탭 |
|---|---|---|
| **오늘** | "지금 시장에 무슨 일이 일어나고 있나" | Today + Home + Market |
| **종목** | "내 종목 어떻게 가고 있나" | Stocks |
| **AI** | "AI 가 뭘 추천하나 + 액션 뭐 해야 하나" | AI (Playbook + Scorecard) |

### "오늘" 탭 — 프로필별 컴포지션

**KR-only**:
```
1. 모닝 브리프 hero (08:30 KST) — 시간대별 자동 전환
2. KOSPI/KOSDAQ 지수 + 합성 위험도 (가로 카드)
3. DART 공시 — 보유/관심 종목 hit (Top 5)
4. 외인/기관 수급 상위
5. 다가오는 이벤트 (FOMC/CPI 도 KR 영향 큰 거시만)
6. 미장 영향 거시 미니 카드 (NASDAQ ±, VIX) — 작게
```

**US-only**:
```
1. 이브닝 브리프 hero (06:30 KST) — 시간대별 자동 전환
2. NASDAQ/S&P/VIX + 합성 위험도 (가로 카드)
3. SEC EDGAR 공시 — 보유/관심 종목 hit (Top 5)
4. Yahoo top gainers/losers
5. Finnhub 실적 캘린더 (이번 주)
6. 다가오는 이벤트 (FOMC/CPI/PCE)
```

**BOTH**:
```
1. 시간대별 자동 모닝/이브닝 브리프 hero
2. 양쪽 시장 지수 (좌 KR / 우 US) + 합성 위험도
3. 공시 (DART + SEC 통합 피드)
4. 양쪽 top movers (각 3개씩)
5. 통합 이벤트 캘린더
```

### "종목" 탭

공통 구조 + 프로필 필터:
```
- 종목 탐색 (검색 + 필터: 프로필에 따라 default 시장 KR/US/ALL)
- 내 보유 (실시간 KR 시세, US 마감가)
- 내 관심
- 종목 상세 모달 (변경 없음)
```

### "AI" 탭

```
- 마켓 종합 인사이트 (Gemini, 글로벌)
- 오늘 액션 아이템 (프로필 무관, 본인 워크스페이스 기반)
- 오늘의 AI 픽 (백엔드 marketPreference 필터 → 프로필 맞춤)
- 숨은 시그널 (본인 종목 기반, KR + US 통합)
- (선택) Scorecard 토글 — 성적표 서브탭
```

## 6. 디자인 시스템 — 대시보드 프로 톤

### Palette (다크 기본, 라이트도 제공)

**다크 (기본)**:
```
bg:       #0a0d12  (거의 검정, 약간 푸른 회색)
surface:  #131820
surfaceAlt: #1c2330
border:   #2a3445
ink:      #e8eef5
inkSub:   #a1adbf
inkMuted: #6b7689
accent:   #4ade80  (mint green — KR 상승)
down:     #f87171  (KR 하락 = 빨간 → 파랑으로 매핑은 utility 함수에서)
warn:     #fbbf24
purple:   #c084fc  (AI)
```

**라이트**: 현재 v1 라이트 톤 단단하게 (회색 계열 변동 폭 줄임).

### Typography
- 본문: 시스템 sans (현재 그대로)
- 숫자: `font-variant: tabular-nums` 전역 적용 (이미 일부 사용 중)
- 헤더 영문: 0.5~2.0 letter-spacing (현재 패턴 강화)
- 폰트 크기 계층 단단하게:
  - hero: 22 (현재 20)
  - title: 14
  - body: 12
  - caption: 11
  - meta: 10 (대문자 + 스페이싱)

### Spacing
- 카드 borderRadius: 14 → **8**
- 카드 padding: 14 → **12**
- 섹션 gap: 14 → **10**
- 정보 밀도 높이기 — 한 화면에 더 많이.

### 아이콘
- lucide-react-native 그대로 (1.0 도 사용 중)
- strokeWidth 통일: 2.5

### 차트
- Sparkline 곳곳에 적극 배치 (현재 일부만)
- CandleVolumeChart 컬러 단단하게 (mint green / soft red)
- 진입가/손절/목표가 라인 차트에 오버레이

## 7. 정보 구조 원칙

1. **타임스탬프 항상** — 모든 카드 상단에 `data as of HH:mm` 노출
2. **숫자 우선** — 텍스트보다 숫자/차트 비중 높임
3. **컴팩트 카드** — 한 화면 스크롤 줄임 (less scroll, more density)
4. **delta 항상 색 + 부호** — `+1.23%` / `-2.34%` 일관
5. **CTA 분리** — 카드 하단 우측에 단일 액션 (예: "관심 추가", "상세 보기")
6. **빈 상태도 디자인** — 데이터 0 일 때도 잘 보여줘야 함 (현재 일부만)

## 8. 알림 — v2 변화 거의 없음

알림 모달 v1.0 의 정리된 카드 분리(`AlertToggleRow` 등) 그대로 활용. 새 디자인 토큰만 적용.

## 9. 배포 전략

### 버전
- 본 spec 구현체 = **v2.0.0**
- 1.0.x 는 main 의 hotfix 트랙으로 살림 (긴급 패치만)

### Branch
- `v2` 신규 long-lived branch 에서 작업
- v2 완성 + Beta 검증 후 main 으로 squash merge
- v2.0.0 GitHub Release 와 EAS Build N 으로 정식 출시

### TestFlight
- v2 작업 중에는 `production-v2` EAS profile 별도
- TestFlight 외부 테스터 그룹 "v2 Beta" 신설
- 기존 v1 TestFlight 그룹은 그대로 유지 (안정성 보장)

### Rollback
- v2.0.0 출시 후 critical bug 시 ASC 에서 v1.0.0 빌드로 노출 롤백 가능
- DB 마이그레이션은 v2 에서 추가하지 않음 — `signal_desk_alert_preferences` 현재 스키마 충분

## 10. 구현 단계 (Phase)

### Phase 0 — 디자인 시스템 재구축 (1~2일 작업, 코드 변경만)
- 새 다크 팔레트 / 라이트 팔레트 (PALETTES 재정의)
- borderRadius / spacing / typography 토큰 정리
- v1 컴포넌트는 그대로 두되 새 토큰 적용 시 자동 반영되는지 검증
- **출력물**: `src/theme.tsx` 전면 개정, 시각적 회귀는 임시 OK (Phase 1+ 에서 잡음)

### Phase 1 — 3탭 + 시장 프로필 구조
- 탭 5 → 3 정리 (Today/Home/Market 통합 → "오늘")
- App.tsx 의 데이터 흐름 재배치
- 온보딩은 아직 X — 기존 marketPreference 그대로 사용
- **출력물**: 동작하는 3탭, 프로필별 컨텐츠 분기 구현

### Phase 2 — 온보딩 흐름
- OnboardingScreen 5단계 구현
- AsyncStorage 키 `signal:onboarding:completed`
- 기존 marketPreference 있으면 자동 스킵
- 추천 종목 시드 데이터 정의
- **출력물**: 신규 사용자 첫 진입 시 온보딩 → 홈

### Phase 3 — 각 탭 v2 컨텐츠 디테일
- "오늘" 탭 프로필별 카드 컴포지션
- "종목" 탭 정보 밀도 개선
- "AI" 탭 Scorecard 통합
- 새 디자인 시스템 100% 적용
- **출력물**: 완성형 v2 화면 전부

### Phase 4 — Beta 검증
- EAS `production-v2` 프로필로 빌드
- TestFlight v2 Beta 그룹 배포
- 사용자 직접 사용 검증 (모닝/이브닝 1주일)
- 발견 이슈 hotfix
- **출력물**: 검증된 v2

### Phase 5 — v2.0.0 정식 출시
- `v2` branch → main squash merge
- GitHub Release v2.0.0 생성
- 기존 v1 TestFlight 그룹에도 자동 노출
- v1 → v2 마이그레이션 토스트 1회
- **출력물**: 모든 사용자 v2

## 11. 위험 + 완화

| 위험 | 완화 |
|---|---|
| 5탭 → 3탭 시 일부 기능 진입점 사라짐 | Phase 1 에서 각 v1 탭 콘텐츠 매핑 표 작성 후 검증 |
| 디자인 시스템 변경으로 시각적 회귀 다수 | Phase 0 후 일주일 시각 비교, 발견 이슈 Phase 1+ 에서 |
| 기존 사용자 혼란 | 마이그레이션 토스트 + 설정에서 v1 레이아웃 토글 (검토 필요) |
| 작업 분량 큼 (전체 화면 갈아엎음) | Phase 별 분리 — 각 Phase 완료 시 동작은 유지 |
| Beta 검증 기간 main 과 v2 분기 | Long-lived `v2` branch — main hotfix 는 cherry-pick |

## 12. 미결 결정 (Phase 0 시작 전 추가 합의)

- [x] **다크모드 default 여부** — **다크 기본** (설정에서 라이트/시스템 전환 가능, v1 사용자에겐 1회 토스트 안내)
- [x] **추천 종목 시드** — **시총 상위 고정** 방식
  - KR: 삼성전자(005930), SK하이닉스(000660), NAVER(035420), 카카오(035720), 현대차(005380), LG에너지솔루션(373220)
  - US: NVDA, MSFT, AAPL, GOOGL, AMZN, TSLA
  - BOTH: KR 3 (삼성전자/SK하이닉스/NAVER) + US 3 (NVDA/MSFT/AAPL)
- [x] **온보딩 스킵 옵션** — **시장 선택(Step 2) 필수, 알림 권한(Step 3)·종목 시드(Step 4)는 스킵 가능**
- [x] **v1 레이아웃 토글** — **제공 안 함**. critical 거부감 발생 시 ASC 노출 롤백으로 대응 (코드 평행 유지 X)
- [x] **차트 라이브러리** — **현재 자체 구현 (Sparkline + CandleVolumeChart) 유지**. 디자인 톤만 단단하게 재조정. zoom/pan/crosshair 욕심나면 Phase 4 이후 재평가
- [x] **종목 탭 정렬·필터** — **드롭다운 정렬 (손익순/등락률/이름순/등록순 4종) + 시장 필터 칩 (KR/US/ALL)**. 웹 DataTable 의 헤더 클릭 정렬은 유지

## 13. 본 spec 의 다음 액션

1. 사용자가 본 spec 검토 + 12 섹션의 미결 결정 답변
2. Phase 0 시작 — `v2` branch cut + 디자인 시스템 재구축
3. 각 Phase 완료 시 본 spec 의 해당 섹션 업데이트 (진행 상황 반영)

---
**관련 메모리**: [project-signal-desk-market-architecture](https://github.com/giwon1130/signal-desk-app/blob/main/docs/v2-spec.md) — 3-layer 모델 + ambient/personal 필터 규칙은 v2 에서도 유지 (탭 구조만 바뀜).
