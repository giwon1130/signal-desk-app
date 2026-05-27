/**
 * 미디어 요약 타입 — 모닝/이브닝 브리프, 뉴스 종합, 유튜브 자막 요약(legacy).
 */

export type MediaSummaryItem = {
  id: string
  channelTitle: string
  videoTitle: string
  videoUrl: string
  publishedAt: string
  summary: string
  flowAnalysis: string
  keyTickers: string[]
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL'
  hasTranscript: boolean
  source: 'YOUTUBE' | 'NEWS_DIGEST' | 'MORNING_BRIEF' | 'EVENING_BRIEF'
}
