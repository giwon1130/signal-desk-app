import type { AiPick, PickDecision } from '../types/ai'

export const PICK_DECISION_LABELS: Record<PickDecision, string> = {
  REVIEW: '검토 가능', WATCH: '관찰', AVOID: '진입 회피', INSUFFICIENT_DATA: '데이터 부족',
}

export function isPickSnapshotStale(generatedAt: string | undefined, now = Date.now()): boolean {
  const generated = generatedAt ? Date.parse(generatedAt) : NaN
  return !Number.isFinite(generated) || !Number.isFinite(now) || generated > now + 60_000 || now - generated >= 30 * 60_000
}

export function canReviewPick(pick: AiPick, generatedAt: string | undefined, now = Date.now()): boolean {
  return pick.assessment?.decision === 'REVIEW' && !isPickSnapshotStale(generatedAt, now)
}
