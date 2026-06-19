/**
 * 요금제(FREE/PRO) 엔타이틀먼트 — UI 선제 안내용. 최종 권위는 서버.
 * 백엔드 application.yml signal-desk.plan.free.* 기본값과 맞춰 둔다.
 */
export function isPro(plan?: string | null): boolean {
  return (plan ?? 'FREE').toUpperCase() === 'PRO'
}

/** FREE 자원 상한 (서버 기본값 미러). */
export const FREE_LIMITS = {
  watchlist: 10,
  holdings: 10,
  leaderSubscriptions: 1,
  leagues: 1,
} as const

/** PRO 자원 상한 (서버 기본값 미러) — 무제한이 아니라 남용 방지용 넉넉한 캡. */
export const PRO_LIMITS = {
  watchlist: 100,
  holdings: 50,
  leaderSubscriptions: 30,
  leagues: 5,
} as const

/** PRO 혜택 요약 — SettingsModal 비교 카드 등에서 사용. */
export const PRO_BENEFITS: { icon: string; title: string; free: string; pro: string }[] = [
  { icon: '💬', title: 'AI 비서 질문', free: '하루 5회', pro: '하루 100회 + 상위 모델' },
  { icon: '🧠', title: 'AI 종목 심층 리포트', free: '—', pro: '하루 5회' },
  { icon: '🎯', title: '목표가 알림 (상한·하한)', free: '—', pro: '제공' },
  { icon: '📰', title: '장중·미국장 마감 브리프', free: '—', pro: '제공' },
  { icon: '⭐', title: '관심 종목', free: `${FREE_LIMITS.watchlist}개`, pro: `${PRO_LIMITS.watchlist}개` },
  { icon: '💼', title: '보유 종목', free: `${FREE_LIMITS.holdings}개`, pro: `${PRO_LIMITS.holdings}개` },
  { icon: '📣', title: '리더 구독', free: `${FREE_LIMITS.leaderSubscriptions}명`, pro: `${PRO_LIMITS.leaderSubscriptions}명` },
  { icon: '🏆', title: '리그 생성', free: `${FREE_LIMITS.leagues}개`, pro: `${PRO_LIMITS.leagues}개` },
]
