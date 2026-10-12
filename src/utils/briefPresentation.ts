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
  return '이 요약만으로 시장 방향을 단정하지 마세요. 주요 지수의 실제 등락과 기준 시각, 관심종목의 공시·일정을 함께 확인해 주세요.'
}

export function briefPresentation(item: MediaSummaryItem, now = Date.now()) {
  const paragraphs = item.summary.trim().split(/\n\s*\n/).filter(Boolean)
  const hasHeadline = paragraphs.length > 1 && paragraphs[0].length <= 120
  const published = Date.parse(item.publishedAt)
  const invalidTime = !Number.isFinite(published) || published > now + 300_000
  const stale = invalidTime || now - published > 24 * 60 * 60 * 1000
  const headline = hasHeadline ? paragraphs[0] : item.summary
  const insufficient = !item.summary.trim() || /(?:자료|근거|데이터).{0,20}(?:부족|충분하지)|판단.{0,8}보류/.test(headline)
  const pendingClose = /종가 확인 중|최종 종가는 아직 확인/.test(item.summary)
  const preopen = item.source === 'MORNING_BRIEF'
  return {
    headline: hasHeadline ? paragraphs[0] : item.videoTitle,
    narrative: hasHeadline ? paragraphs.slice(1).join('\n\n') : item.summary,
    stale,
    label: invalidTime ? '시각 확인 필요' : stale ? '이전 자료' : insufficient ? '판단 보류' : pendingClose ? '종가 확인 중' : preopen ? '개장 전 참고' : item.sentiment === 'BULLISH' ? '상승 흐름' : item.sentiment === 'BEARISH' ? '하락 흐름' : '시장 요약',
    guide: invalidTime ? '브리프의 발행 시각을 확인하기 어렵습니다. 현재 판단에 사용하기 전 최신 시세와 뉴스를 확인해 주세요.'
      : stale ? '이전에 발행된 브리프입니다. 당시 시장을 복기하는 데 참고하시고, 현재 판단에는 최신 시세와 뉴스를 함께 확인해 주세요.'
        : pendingClose ? '마감 전 시세가 포함되어 있습니다. 최종 종가가 확인되기 전에는 마감 결과로 해석하지 마세요.'
          : preopen && !insufficient ? '이전 거래일 결과와 해외 참고 여건을 정리했습니다. 오늘 국내장 방향이나 매수·매도 신호를 뜻하지 않습니다.'
            : marketReadingGuide(item.sentiment, insufficient),
    points: item.flowAnalysis.split(/\n+/).map((line) => line.replace(/^[•·\-*]\s*/, '').trim()).filter(Boolean),
  }
}
