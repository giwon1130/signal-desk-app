import { findMoverReason, moveContextLabel, safeEvidenceUrl } from '../utils/moverContext'
import type { MoverReason } from '../types'

const now = Date.parse('2026-10-06T02:00:00Z')
const sample: MoverReason = { market: 'KR', ticker: 'ABC', name: '샘플', direction: 'UP', changeRate: 5, reason: '관련 소식',
  context: { asOf: new Date(now).toISOString(), status: 'EVIDENCE_FOUND', summary: '새 공시가 있습니다.', evidence: [], sourceChecks: [], notes: [], rulesVersion: 'test' } }

test('same ticker in another market and opposite moves never share context', () => {
  expect(findMoverReason([sample], 'US', 'ABC', 5, now)).toBeUndefined()
  expect(findMoverReason([sample], 'KR', 'ABC', -5, now)).toBeUndefined()
  expect(findMoverReason([sample], 'KR', 'ABC', 5, now)).toBe(sample)
})
test('expired future and invalid contexts are hidden', () => {
  expect(findMoverReason([sample], 'KR', 'ABC', 5, now + 601000)).toBeUndefined()
  expect(findMoverReason([sample], 'KR', 'ABC', 5, now - 10000)).toBeUndefined()
  expect(findMoverReason([{ ...sample, context: { ...sample.context!, asOf: 'invalid' } }], 'KR', 'ABC', 5, now)).toBeUndefined()
})
test('old API contract remains readable and statuses are plain Korean', () => {
  expect(findMoverReason([{ ...sample, context: null }], 'KR', 'ABC', 5, now)?.reason).toBe('관련 소식')
  expect(moveContextLabel('UNAVAILABLE')).toBe('자료 조회 지연')
  expect(moveContextLabel('NO_RECENT_CATALYST')).not.toBe(moveContextLabel('UNAVAILABLE'))
})
test('only credential-free web source links are enabled', () => {
  expect(safeEvidenceUrl('https://dart.fss.or.kr/test')).toBe(true)
  for (const url of ['javascript:alert(1)', 'file:///tmp/test', 'https://key:secret@example.com', 'not a url']) expect(safeEvidenceUrl(url)).toBe(false)
})
