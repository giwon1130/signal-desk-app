import type { MediaSummaryItem } from '../types'
import { briefPresentation, marketReadingGuide, selectLatestBrief } from '../utils/briefPresentation'

const now = Date.parse('2026-09-22T07:00:00Z')
const brief: MediaSummaryItem = {
  id: 'close', source: 'CLOSE_BRIEF', channelTitle: 'Signal Desk', videoTitle: '마감 브리프', videoUrl: '',
  publishedAt: '2026-09-22T06:40:00Z', summary: '시장의 흐름이 엇갈립니다\n\n확인된 요인만 설명합니다.',
  flowAnalysis: '• 첫 번째 근거\n\n- 두 번째 근거', sentiment: 'NEUTRAL', keyTickers: [], hasTranscript: false,
}

it('뉴스 종합과 유튜브 요약을 브리프로 잘못 선택하지 않는다', () => {
  expect(selectLatestBrief([{ ...brief, source: 'NEWS_DIGEST' }, { ...brief, source: 'YOUTUBE' }])).toBeNull()
  expect(selectLatestBrief([])).toBeNull()
})

it('발행 시각 순으로 선택하고 원본 순서를 변경하지 않는다', () => {
  const earlier = { ...brief, id: 'morning', source: 'MORNING_BRIEF' as const, publishedAt: '2026-09-21T23:00:00Z' }
  const items = [earlier, brief]
  expect(selectLatestBrief(items)?.id).toBe('close')
  expect(items[0]).toBe(earlier)
})

it('선택한 시장의 브리프만 사용한다', () => {
  const us = { ...brief, id: 'us', source: 'EVENING_BRIEF' as const, publishedAt: '2026-09-22T08:00:00Z' }
  expect(selectLatestBrief([us, brief], 'KR')?.id).toBe('close')
  expect(selectLatestBrief([us, brief], 'US')?.id).toBe('us')
  expect(selectLatestBrief([brief], 'US')).toBeNull()
})

it('제목·본문·세부 근거를 분리하고 원문 의미를 보존한다', () => {
  const result = briefPresentation(brief, now)
  expect(result.headline).toBe('시장의 흐름이 엇갈립니다')
  expect(result.narrative).toBe('확인된 요인만 설명합니다.')
  expect(result.points).toEqual(['첫 번째 근거', '두 번째 근거'])
  expect(result.stale).toBe(false)
})

it('한 문단인 요약은 임의로 잘라 결론으로 만들지 않는다', () => {
  const result = briefPresentation({ ...brief, summary: '본문만 있는 요약입니다.' }, now)
  expect(result.headline).toBe(brief.videoTitle)
  expect(result.narrative).toBe('본문만 있는 요약입니다.')
})

it.each(['invalid', '2026-09-20T07:00:00Z', '2026-09-22T07:06:00Z'])('잘못됐거나 오래된 시각 %s에 현재 판단처럼 안내하지 않는다', (publishedAt) => {
  const result = briefPresentation({ ...brief, sentiment: 'BULLISH', publishedAt }, now)
  expect(result.stale).toBe(true)
  expect(result.label).toBe(publishedAt === '2026-09-20T07:00:00Z' ? '이전 자료' : '시각 확인 필요')
  expect(result.guide).toContain('최신 시세')
})

it('24시간까지는 발행 시각을 유지하되 이후에는 이전 자료로 표시한다', () => {
  const publishedAt = new Date(now - 24 * 3600000).toISOString()
  expect(briefPresentation({ ...brief, publishedAt }, now).stale).toBe(false)
  expect(briefPresentation({ ...brief, publishedAt }, now + 1).stale).toBe(true)
})

it.each(['', '검증된 자료가 충분하지 않습니다.', '오늘의 시장 판단을 보류합니다.'])('자료가 부족한 요약에는 방향성 안내를 만들지 않는다', (summary) => {
  const result = briefPresentation({ ...brief, sentiment: 'BULLISH', summary }, now)
  expect(result.label).toBe('판단 보류')
  expect(result.guide).toContain('자료가 충분하지 않습니다')
})

it('자료 부족은 상승·하락 분류보다 우선한다', () => {
  expect(marketReadingGuide('BEARISH', true)).toContain('자료가 충분하지 않습니다')
  expect(marketReadingGuide('BULLISH')).toContain('모든 종목이 함께 오르지는 않습니다')
  expect(marketReadingGuide('NEUTRAL')).toContain('서두르지 않아도')
})
