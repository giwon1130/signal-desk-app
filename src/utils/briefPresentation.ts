import type { MediaSummaryItem } from '../types'

const BRIEF_SOURCES = new Set(['MORNING_BRIEF', 'MIDDAY_BRIEF', 'CLOSE_BRIEF', 'EVENING_BRIEF'])

export function selectLatestBrief(items: MediaSummaryItem[], market: 'KR' | 'US' | 'BOTH' = 'BOTH') {
  return items.filter((item) => BRIEF_SOURCES.has(item.source)
    && (market === 'BOTH' || (market === 'US' ? item.source === 'EVENING_BRIEF' : item.source !== 'EVENING_BRIEF')))
    .sort((a, b) => (Date.parse(b.publishedAt) || 0) - (Date.parse(a.publishedAt) || 0))[0] ?? null
}

export function marketReadingGuide(sentiment: MediaSummaryItem['sentiment'], insufficient = false) {
  if (insufficient) return '지금은 시장 방향을 판단할 자료가 충분하지 않습니다. 새로운 자료가 나올 때까지 개별 종목의 가격과 공시를 먼저 확인해 주세요.'
  if (sentiment === 'BULLISH') return '우호적인 분위기라도 모든 종목이 함께 오르지는 않습니다. 관심종목의 가격과 거래량이 함께 움직이는지 확인해 주세요.'
  if (sentiment === 'BEARISH') return '보유종목의 변동 폭과 미리 정한 대응 기준부터 점검해 주세요. 새로 진입할 때는 가격이 안정되는지 함께 살펴보시면 좋습니다.'
  return '시장 신호가 엇갈릴 때는 서두르지 않아도 괜찮습니다. 관심종목의 가격 변화와 예정된 공시·일정을 차례로 확인해 주세요.'
}

export function briefPresentation(item: MediaSummaryItem, now = Date.now()) {
  const paragraphs = item.summary.trim().split(/\n\s*\n/).filter(Boolean)
  const hasHeadline = paragraphs.length > 1 && paragraphs[0].length <= 120
  const published = Date.parse(item.publishedAt)
  const invalidTime = !Number.isFinite(published) || published > now + 300_000
  const stale = invalidTime || now - published > 24 * 60 * 60 * 1000
  const insufficient = !item.summary.trim() || /(?:자료|근거|데이터).{0,20}(?:부족|충분하지)|판단.{0,8}보류/.test(item.summary)
  return {
    headline: hasHeadline ? paragraphs[0] : item.videoTitle,
    narrative: hasHeadline ? paragraphs.slice(1).join('\n\n') : item.summary,
    stale,
    label: invalidTime ? '시각 확인 필요' : stale ? '이전 자료' : insufficient ? '판단 보류' : item.sentiment === 'BULLISH' ? '우호적인 흐름' : item.sentiment === 'BEARISH' ? '주의할 흐름' : '엇갈린 흐름',
    guide: invalidTime ? '브리프의 발행 시각을 확인하기 어렵습니다. 현재 판단에 사용하기 전 최신 시세와 뉴스를 확인해 주세요.'
      : stale ? '이전에 발행된 브리프입니다. 당시 시장을 복기하는 데 참고하시고, 현재 판단에는 최신 시세와 뉴스를 함께 확인해 주세요.' : marketReadingGuide(item.sentiment, insufficient),
    points: item.flowAnalysis.split(/\n+/).map((line) => line.replace(/^[•·\-*]\s*/, '').trim()).filter(Boolean),
  }
}
