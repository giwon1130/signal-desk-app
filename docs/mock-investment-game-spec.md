# Signal Desk — 친구 모의투자 게임 (Trading League)

> Status: **DRAFT v0.1** · 2026-05-27 작성 · 미구현
> 사용자 요청: "친구끼리 모의투자, 게임처럼, 매수 단가 그 시점 고정, 자본금 정해놓고 수익률 1등이 이김"
> 코드네임: **Trading League** (가칭)

---

## 1. 한 줄 요약

친구 2~10명이 같은 시작 시각·자본금으로 같은 기간 모의 매매 → 종료 시점 **순수 수익률** 1등 우승. 시세는 백엔드가 lock 해서 조작 방지, 거래 기록은 immutable.

## 2. 핵심 가치 (왜 만드나)

- **반복 진입**: 새 시즌마다 다시 와서 트레이딩 — 앱 retention ↑
- **사회적 동기**: "친구가 NVDA 잡고 +30% 갔는데 나는 안 잡았네" — 손실 X 후회만 (안전한 학습)
- **실력 측정**: 진짜 돈 위험 없이 본인 단타·중기 전략 검증
- **앱 핵심 데이터 활용**: AI 픽 / 합성 위험도 / 모닝 브리프 가 진짜 도움 되는지 게임으로 검증 (AI 픽 따라가서 이긴 사람 vs 무시한 사람)

## 3. 게임 모델

### 3.1 League (시즌) — 한 게임 단위

| 속성 | 타입 | 예 |
|---|---|---|
| `id` | UUID | |
| `name` | string | "5월 1주차" / "친구 4명 단타" |
| `hostUserId` | UUID | 생성자 |
| `joinCode` | string | "X7K2M" 5자리 (초대용 — URL 또는 카드) |
| `marketScope` | enum | KR / US / BOTH |
| `startingCapital` | bigint | 10_000_000 (1천만원, 단위 KR) |
| `startedAt` | Instant | 시작 — 이 시각부터 거래 가능 |
| `endsAt` | Instant | 종료 — 이 시각 이후 거래 불가, 자동 정산 |
| `status` | enum | DRAFT / OPEN / RUNNING / FINISHED |
| `tradingHours` | enum | MARKET_HOURS_ONLY / ALWAYS | (장중만 vs 24h)
| `fee` | double | 0.003 (0.3%) 매수/매도 수수료 |
| `tax` | double | 0.0023 (KR 매도세) — KR 만 |
| `allowShort` | bool | false (V1 X, 추후) |
| `maxPositionPct` | double | 0.30 (한 종목 최대 30% 비중 제한) |
| `createdAt` | Instant | |

상태 흐름:
```
DRAFT → (참가 모집 시작) → OPEN → (startedAt 도달) → RUNNING → (endsAt 도달) → FINISHED
       ↑                  ↑                          ↑                         ↑
   호스트가 만듦      호스트가 'open'           서버 cron                  서버 cron 정산
```

### 3.2 Participant

| 속성 | 타입 |
|---|---|
| `leagueId` | UUID |
| `userId` | UUID |
| `joinedAt` | Instant |
| `nickname` | string | 게임 안 표시명 (실명 대신 별명 가능) |
| `avatarEmoji` | string | "🦊" 같은 단일 이모지 — 가벼운 ID |
| `cashBalance` | bigint | 현재 보유 현금 (초기 = startingCapital) |
| `finalReturnRate` | double | 정산 후만 채워짐 |
| `finalRank` | int | 정산 후만 채워짐 |

unique(leagueId, userId).

### 3.3 Trade (체결 — immutable)

| 속성 | 타입 |
|---|---|
| `id` | UUID |
| `leagueId` | UUID |
| `userId` | UUID |
| `market` | enum (KR/US) |
| `ticker` | string |
| `name` | string snapshot |
| `side` | enum (BUY/SELL) |
| `quantity` | int |
| `price` | bigint | **백엔드가 fetch — 클라이언트가 못 바꿈** |
| `priceLockedAt` | Instant | 시세 잠근 시각 (백엔드 timestamp) |
| `feeAmount` | bigint | |
| `taxAmount` | bigint | |
| `notionalAmount` | bigint | price × quantity |
| `executedAt` | Instant | 백엔드 timestamp |

immutable — 한 번 INSERT 후 수정·삭제 불가. 정정은 새 trade (역방향) 으로만.

### 3.4 Position (derived — trade 합산)

매 시점 사용자별 보유:
- `quantity` = SUM(BUY) - SUM(SELL)
- `averageCost` = SUM(BUY notional) / SUM(BUY qty) — 이동평균 (FIFO 아닌 평균법)
- 현재가 = 라이브 시세 (백엔드 fetch)
- 평가금 = quantity × 현재가
- 실현손익 = 누적 SELL notional - 그에 대응하는 BUY notional (이동평균 기준)
- 미실현손익 = 평가금 - (quantity × averageCost)

DB 저장 X — 매번 trade 에서 derived (성능 이슈 시 캐시).

## 4. 거래 규칙 (조작 방지 + 현실감)

### 4.1 매수
1. 클라이언트가 "매수 요청" 보냄 (ticker, quantity, market)
2. 백엔드:
   - 시세 fetch (KR: Naver, US: Yahoo) — 실시간
   - 거래 시각·시세를 lock
   - 검증:
     - 시장 거래 가능 시간? (MARKET_HOURS_ONLY 면 닫혔으면 거부)
     - 현금 충분? (notional + fee ≤ cashBalance)
     - 한 종목 비중 제한? (매수 후 평가금 / 총자산 ≤ maxPositionPct)
     - 시세 유효? (null/0 거부)
   - 통과 시 trade INSERT + participant.cashBalance 차감
3. 클라이언트는 결과 받음 (체결가, 수수료, 새 현금)

### 4.2 매도
- 보유 ≥ 매도 수량 검증
- 시세 lock 으로 매도가 결정
- KR 만 매도세 (0.23%) 적용
- 현금 += (notional - fee - tax)

### 4.3 시세 캐시 정책
- 라이브 시세는 1~2초 캐시 (모든 사용자 동시 거래 시 같은 시세 보장)
- 시세 stale 5분 이상이면 거부 (휴장 등)

### 4.4 거래 시간
- **MARKET_HOURS_ONLY**: KR 09:00~15:30 KST, US 22:30~05:00 KST (DST 자동)
- **ALWAYS**: 24시간 (마지막 가용 시세 사용 — 휴장 시 마감가 그대로)

추천: **default MARKET_HOURS_ONLY**. ALWAYS 는 옵션.

## 5. 정산 (FINISHED 전환 시점)

`endsAt` 도달 시 cron:
1. 각 참가자별 보유 포지션 전부 강제 청산 (가상 SELL — 시세는 endsAt 직전 시세)
2. 최종 cashBalance 산출
3. `finalReturnRate = (cashBalance - startingCapital) / startingCapital`
4. 내림차순 정렬 → `finalRank` 부여
5. `league.status = FINISHED`
6. 푸시 알림: "🏆 [친구 4명 단타] 종료 — 1등 닉네임 +12.3%"

## 6. 리더보드 UI

### 6.1 진행 중 (RUNNING)
- 실시간 순위 (5초 폴링)
- 각 참가자: 이모지·닉네임·총자산·수익률·1일 변화·보유 종목 수
- 본인 행 강조

### 6.2 종료 (FINISHED)
- 최종 순위 + 트로피 🥇🥈🥉
- 각 참가자 통계:
  - 총 거래 횟수
  - 최고 수익 종목
  - 최대 손실 종목
  - 평균 보유 기간
  - 가장 큰 단일 거래
- 베스트 트레이드 / 워스트 트레이드 (전체 참가자 중)

### 6.3 트로피 / 배지
- 🥇 우승
- 💎 다이아손 (보유 평균 ≥ 5일)
- ⚡ 단타왕 (보유 평균 ≤ 4시간)
- 🎯 정확도왕 (승률 ≥ 70%, 거래 ≥ 5회)
- 🦅 매의 눈 (가장 큰 단일 수익)
- 💀 큰 손실 (가장 큰 단일 손실 — 친구 놀림용)

## 7. 사회적 요소

### 7.1 거래 공개 정책 (League 별 옵션)
- **OPEN** (default): 다른 참가자의 거래 실시간 공개 (피드)
- **CLOSED**: 거래 비공개, 종료 시에만 공개

**OPEN 의 매력**: 친구가 NVDA 잡으면 알림 — 따라갈지 말지 본인 결정. 게임 재미↑.

### 7.2 거래 피드
- 새 매수/매도 발생 시 카드 누적 (스크롤)
- "🦊 노을: NVDA 매수 30주 @ $145.20"
- 본인 거래도 피드에 보임 (다른 사람 시점에선 본인 거래 보임)

### 7.3 멘션 / 반응
- V1: 거래 카드에 이모지 반응 (👍 / 🔥 / 😱 / 🤔) — 가볍게
- V2 추후: 댓글 / 채팅

## 8. 데이터 모델 (Flyway)

```sql
-- V19__mock_league.sql
create table signal_desk_mock_league (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  host_user_id    uuid not null references signal_desk_users(id),
  join_code       text not null unique,
  market_scope    text not null check (market_scope in ('KR','US','BOTH')),
  starting_capital bigint not null,
  started_at      timestamptz not null,
  ends_at         timestamptz not null,
  status          text not null default 'DRAFT' check (status in ('DRAFT','OPEN','RUNNING','FINISHED')),
  trading_hours   text not null default 'MARKET_HOURS_ONLY' check (trading_hours in ('MARKET_HOURS_ONLY','ALWAYS')),
  fee             numeric(6,5) not null default 0.003,
  tax             numeric(6,5) not null default 0.0023,
  max_position_pct numeric(4,3) not null default 0.30,
  visibility      text not null default 'OPEN' check (visibility in ('OPEN','CLOSED')),
  created_at      timestamptz not null default now()
);
create index idx_mock_league_host on signal_desk_mock_league(host_user_id);
create index idx_mock_league_status on signal_desk_mock_league(status);
create index idx_mock_league_ends_at on signal_desk_mock_league(ends_at) where status = 'RUNNING';

create table signal_desk_mock_participant (
  league_id       uuid not null references signal_desk_mock_league(id) on delete cascade,
  user_id         uuid not null references signal_desk_users(id),
  joined_at       timestamptz not null default now(),
  nickname        text not null,
  avatar_emoji    text not null default '🐱',
  cash_balance    bigint not null,
  final_return_rate numeric(8,5),
  final_rank      int,
  primary key (league_id, user_id)
);

create table signal_desk_mock_trade (
  id              uuid primary key default gen_random_uuid(),
  league_id       uuid not null references signal_desk_mock_league(id) on delete cascade,
  user_id         uuid not null references signal_desk_users(id),
  market          text not null check (market in ('KR','US')),
  ticker          text not null,
  name            text not null,
  side            text not null check (side in ('BUY','SELL')),
  quantity        int not null check (quantity > 0),
  price           bigint not null check (price > 0),
  price_locked_at timestamptz not null,
  fee_amount      bigint not null default 0,
  tax_amount      bigint not null default 0,
  notional_amount bigint not null,
  executed_at     timestamptz not null default now()
);
create index idx_mock_trade_league_exec on signal_desk_mock_trade(league_id, executed_at desc);
create index idx_mock_trade_user_league on signal_desk_mock_trade(user_id, league_id);

create table signal_desk_mock_reaction (
  trade_id        uuid not null references signal_desk_mock_trade(id) on delete cascade,
  user_id         uuid not null references signal_desk_users(id),
  emoji           text not null check (emoji in ('👍','🔥','😱','🤔')),
  created_at      timestamptz not null default now(),
  primary key (trade_id, user_id, emoji)
);
```

**trade 는 immutable** — 백엔드 코드에 UPDATE/DELETE 없음. 정정은 새 trade.

## 9. 백엔드 API

### League CRUD
- `POST /api/v1/mock/leagues` — 생성 (DRAFT)
- `GET /api/v1/mock/leagues/my` — 내 참여 leagues 목록
- `GET /api/v1/mock/leagues/{id}` — 상세 (참가자/리더보드 포함)
- `POST /api/v1/mock/leagues/{id}/open` — DRAFT → OPEN
- `POST /api/v1/mock/leagues/join` body `{ joinCode }` — 코드로 참가
- `POST /api/v1/mock/leagues/{id}/leave` — 참가 취소 (DRAFT/OPEN 만, RUNNING 후 X)

### Trade
- `POST /api/v1/mock/leagues/{id}/trades` body `{ market, ticker, side, quantity }`
  - 백엔드가 시세 fetch + lock + 검증 + INSERT
  - 반환: 체결 trade + 새 cashBalance + 새 position
- `GET /api/v1/mock/leagues/{id}/trades` — 거래 피드 (visibility=OPEN 일 때 전체, CLOSED 면 본인 것만)
- `GET /api/v1/mock/leagues/{id}/positions/me` — 내 보유 (derived)
- `GET /api/v1/mock/leagues/{id}/leaderboard` — 실시간 순위

### Reaction (V1 후 단계)
- `POST /api/v1/mock/trades/{id}/react` body `{ emoji }`
- `DELETE /api/v1/mock/trades/{id}/react/{emoji}`

### Scheduler
- `MockLeagueAutoStartScheduler` — 매 분 startedAt 도달한 OPEN → RUNNING
- `MockLeagueAutoFinishScheduler` — 매 분 endsAt 도달한 RUNNING → 정산 → FINISHED

## 10. 앱 UI

### 10.1 진입점
- 새 탭 X (현재 3탭 유지 — TabKey 변경 비용 큼)
- 대신 **AI 탭 또는 종목 탭** 안에 "리그" 섹션 카드
- 또는 헤더에 트로피 🏆 아이콘 — 한 탭으로 모달
- 추천: **헤더 아이콘** (시장 칩 옆)

### 10.2 화면 구조
```
[리그 홈]
  - 진행중인 내 리그 카드 (최대 3개)
  - "리그 만들기" 버튼
  - "코드로 참가" 입력

[리그 상세]
  - 헤더: 리그 이름 + 남은 시간 카운트다운 + 상태 배지
  - 리더보드 (실시간 순위, 5초 폴링)
  - 거래 피드 (탭 — 전체 / 내거래)
  - 보유 포지션 (탭 — 내 포지션 강조)
  - 액션 버튼: "거래하기"

[거래 모달]
  - 기존 종목 검색 재활용 (KR + US)
  - 종목 선택 → 매수/매도 / 수량 입력
  - 예상 체결가 (현재가 + 0.3% fee 미리보기)
  - 보유 현금 / 종목 비중 표시
  - "체결" 버튼 → 백엔드 호출

[종료 화면]
  - 우승자 트로피 애니메이션
  - 최종 순위 + 각자 통계
  - 베스트 트레이드 / 워스트 트레이드 강조
  - "공유" 버튼 (스크린샷 + 결과 카드)
```

### 10.3 푸시 알림
- 리그 시작 1시간 전 (참가 안 한 사람 친구로 권유)
- 종료 1시간 전 ("마지막 거래 기회")
- 종료 직후 ("🏆 우승자 ㅇㅇㅇ, 너는 N등")
- 친구가 큰 거래 (≥ 자본금 20%) 했을 때 (선택)

## 11. 결제 / 한계

V1:
- 무료, 제한 없음
- 자본금 max 100억 정도 (UI 표시 한계)
- 동시 진행 리그 최대 5개 (DB 부하)
- 참가자 max 10명 (UI 가독성)

V2 (추후):
- 시즌 시드머니 차등 — VIP 가입자 더 큰 자본금?
- 트로피 NFT? (과한 듯)
- 리그 결과 SNS 공유 (스크린샷 자동)

## 12. 부정 행위 / 어뷰징 방지

- ✅ **시세 백엔드 lock** — 클라이언트가 가격 못 바꿈
- ✅ **거래 시각 백엔드 timestamp** — 클라이언트 시각 안 받음
- ✅ **trade immutable** — UPDATE/DELETE 금지
- ✅ **현금 / 보유 검증** — 백엔드 일관성 체크
- ✅ **한 사용자 한 리그 한 번 참가** — (leagueId, userId) PK
- ✅ **시세 stale 거부** — 5분 이상 오래된 시세면 거래 reject
- ⚠️ **여러 계정으로 같은 리그 참가** — 일단 막지 않음 (친구끼리 게임이라 자정 효과)
- ⚠️ **시세 캐시 race condition** — 1~2초 동안 같은 가격 보장 (모든 사용자 공평)

## 13. MVP 범위 (V1)

V1 에 들어가는 것:
- League 생성/참가/시작/종료
- BUY/SELL (KR + US, 시장 시간만)
- 실시간 리더보드 (폴링)
- 정산 + 최종 순위
- 거래 피드 (OPEN visibility)
- 푸시 (시작/종료)

V1 에 X:
- 채팅 / 댓글
- 리액션 이모지
- 공매도 / 신용
- 결제 / 시즌 패스
- 친구 시스템 (지금은 joinCode 만)

## 14. 작업 단계 추정

| Phase | 내용 | 분량 |
|---|---|---|
| A | DB 스키마 (V19) + 도메인 모델 + JDBC 리포지토리 | 1d |
| B | League CRUD API + 인증 가드 | 1d |
| C | Trade API + 시세 lock 흐름 + 검증 | 2d |
| D | 리더보드 + 포지션 derived 로직 | 1d |
| E | Scheduler (auto-start / auto-finish 정산) | 1d |
| F | App — 리그 홈 + 상세 + 거래 모달 | 2d |
| G | App — 종료 화면 + 트로피 + 통계 | 1d |
| H | 푸시 알림 (시작/종료) | 0.5d |
| I | 베타 검증 + 버그 fix | 1~2d |

**전체 약 10~12일** (1 person fulltime 기준).

## 15. 단계별 출시 전략

### 15.1 v2 와 별도 트랙
- v2.0.0 출시 (현재 진행 중) 완료 후 시작 권장
- 또는 v2 안에 작은 MVP 만 (League 생성/참가/거래/순위만, scheduler/푸시는 follow-up)

### 15.2 베타 가족·친구 그룹
- 본인 + 친구 2~3명으로 첫 리그 (1주일)
- 데이터 정합성 / 시세 lock / 정산 검증
- 발견 이슈 fix 후 일반 노출

### 15.3 v2.x 또는 v3.0 으로 release
- 작은 기능이면 v2.1.0
- 새 탭/큰 변화면 v3.0

## 16. 미결 결정 (구현 들어가기 전 합의 필요)

- [ ] **리그 진입점**: 헤더 트로피 아이콘 vs AI 탭 안 섹션 vs 신규 4번째 탭
- [ ] **거래 공개 default**: OPEN (피드 공개) vs CLOSED (종료 시만)
- [ ] **거래 시간**: MARKET_HOURS_ONLY default 유지 OK?
- [ ] **자본금 단위**: KR 원 단위만? USD 별도? (BOTH 리그에서 환율 처리)
- [ ] **참가 max**: 10명 vs 더 큰 그룹 허용?
- [ ] **시즌 길이 권장**: 1주일 / 1달 / 사용자 자유?
- [ ] **수수료/세금**: 현실적 (KR 0.23% 매도세 + 0.015% 거래세) vs 단순화 (0 또는 일괄 0.3%)
- [ ] **공매도/신용**: V1 X 동의?
- [ ] **시작 시점 자유** vs **매주 월요일 09:00 같은 고정 시즌**

## 17. BOTH 시장 + 환율 이슈

KR + US 모두 거래 허용 시 자본금 단위 충돌:
- 옵션 A: 자본금 KRW 단위, US 매수 시 환율 자동 변환 (백엔드 USD/KRW fetch)
- 옵션 B: 자본금 USD 단위, KR 매수 시 변환
- 옵션 C: KRW 따로 / USD 따로 2개 지갑 (사용자 분배)

추천: **옵션 A** — KRW 통합. US 매수 시 환율 자동, 시세 lock 시 환율도 lock. 종료 시 환율도 같이 lock.

## 18. 다음 액션

1. **사용자 미결 결정 (§16) 합의** — 9개 항목 가이드 받기
2. **MVP 범위 합의** — V1 어디까지?
3. **v2 와 어떻게 묶을지** — v2.1 vs v3.0
4. 합의 후 Phase A (DB 스키마) 부터 코딩
