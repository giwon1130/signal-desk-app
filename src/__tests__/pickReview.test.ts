import { canReviewPick, isPickSnapshotStale } from '../utils/pickReview'
import type { AiPick } from '../types/ai'

const createdAt = '2026-09-08T01:00:00Z'
const now = Date.parse(createdAt)
const pick: AiPick = {
  market: 'KR', ticker: '005930', name: '삼성전자', reason: '근거', confidence: 99, expectedReturnRate: null, riskNote: '',
  assessment: { decision: 'REVIEW', reasons: [], blockers: [], rulesVersion: 'review-v1' },
}

it('생성 30분 이후와 잘못된 시각은 재검증을 요구한다', () => {
  expect(isPickSnapshotStale(createdAt, now + 1_799_999)).toBe(false)
  expect(isPickSnapshotStale(createdAt, now + 1_800_000)).toBe(true)
  expect(isPickSnapshotStale('invalid', now)).toBe(true)
  expect(isPickSnapshotStale(undefined, now)).toBe(true)
  expect(isPickSnapshotStale(createdAt, now - 60_001)).toBe(true)
})

it('모델 확신도만으로 검토 가능을 표시하지 않는다', () => {
  expect(canReviewPick(pick, createdAt, now)).toBe(true)
  expect(canReviewPick({ ...pick, assessment: null }, createdAt, now)).toBe(false)
  for (const decision of ['WATCH', 'AVOID', 'INSUFFICIENT_DATA'] as const) {
    expect(canReviewPick({ ...pick, assessment: { ...pick.assessment!, decision } }, createdAt, now)).toBe(false)
  }
  expect(canReviewPick(pick, createdAt, now + 1_800_000)).toBe(false)
})
