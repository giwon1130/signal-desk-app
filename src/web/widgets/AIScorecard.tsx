/**
 * AI 워크스페이스 — 성적표 (Scorecard 서브탭).
 * 섹션별 하위 컴포넌트로 분리됨 — aiscorecard_parts/* 참조.
 */
import { useMemo } from 'react'
import { Text, View } from 'react-native'
import { AlertCircle, Check } from 'lucide-react-native'
import type { AiRecommendationData } from '../../types'
import { type Palette } from '../../theme'
import { Widget, webGrid } from '../shared'
import { MetricCards } from './aiscorecard_parts/MetricCards'
import { RecentResultsTable } from './aiscorecard_parts/RecentResultsTable'
import { ResultRow } from './aiscorecard_parts/ResultRow'

export function Scorecard({
  aiRecommendation, palette, onOpenDetail,
}: {
  aiRecommendation: AiRecommendationData | null
  palette: Palette
  onOpenDetail: (m: string, t: string, n?: string) => void
}) {
  const metrics = aiRecommendation?.metrics ?? null
  const logs = aiRecommendation?.executionLogs ?? []

  // 결과 로그 (RESULT 스테이지 + realizedReturnRate 있는 것)
  const results = useMemo(
    () => logs.filter((l) => l.realizedReturnRate != null),
    [logs],
  )
  // 사용자 참여율
  const participation = useMemo(() => {
    const recs = logs.filter((l) => l.stage?.toUpperCase().includes('RECOMMEND'))
    const engaged = recs.filter((l) => l.userStatus === 'HELD' || l.userStatus === 'WATCHED')
    const rate = recs.length === 0 ? 0 : engaged.length / recs.length
    return { total: recs.length, engaged: engaged.length, rate }
  }, [logs])

  // "놓친 픽" — userStatus 없거나 NEW 인데 실현수익 양수
  const missed = useMemo(
    () => results
      .filter((l) => (!l.userStatus || l.userStatus === 'NEW') && (l.realizedReturnRate ?? 0) > 0)
      .sort((a, b) => (b.realizedReturnRate ?? 0) - (a.realizedReturnRate ?? 0))
      .slice(0, 5),
    [results],
  )
  // "따라간 픽" — HELD/WATCHED
  const followed = useMemo(
    () => results
      .filter((l) => l.userStatus === 'HELD' || l.userStatus === 'WATCHED')
      .sort((a, b) => (b.realizedReturnRate ?? 0) - (a.realizedReturnRate ?? 0))
      .slice(0, 5),
    [results],
  )

  // 수익률 트렌드 (최신→과거 순 → 역순으로 스파크라인)
  const trendPoints = useMemo(() => {
    const pts = [...results]
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
      .map((l) => (l.realizedReturnRate ?? 0) * 100)
    return pts
  }, [results])

  return (
    <View style={{ gap: 14 }}>
      <MetricCards metrics={metrics} participation={participation} trendPoints={trendPoints} palette={palette} />

      <View style={[{ gap: 14 }, webGrid('minmax(0, 1fr) minmax(0, 1fr)')]}>
        <Widget
          palette={palette}
          title="놓친 픽"
          icon={<AlertCircle size={13} color={palette.orange} strokeWidth={2.5} />}
          meta={`${missed.length}건 · 관심 안 넣었지만 올랐음`}
        >
          {missed.length === 0 ? (
            <View style={{ paddingVertical: 18, alignItems: 'center' }}>
              <Text style={{ color: palette.inkMuted, fontSize: 12 }}>놓친 픽 없음 — 잘 따라가고 있습니다</Text>
            </View>
          ) : (
            <View style={{ gap: 4 }}>
              {missed.map((l) => <ResultRow key={`${l.date}-${l.ticker}`} log={l} palette={palette} onOpenDetail={onOpenDetail} />)}
            </View>
          )}
        </Widget>

        <Widget
          palette={palette}
          title="따라간 픽"
          icon={<Check size={13} color={palette.up} strokeWidth={2.5} />}
          meta={`${followed.length}건`}
        >
          {followed.length === 0 ? (
            <View style={{ paddingVertical: 18, alignItems: 'center' }}>
              <Text style={{ color: palette.inkMuted, fontSize: 12 }}>AI 픽을 관심/보유로 추가하면 여기 실적이 쌓여</Text>
            </View>
          ) : (
            <View style={{ gap: 4 }}>
              {followed.map((l) => <ResultRow key={`${l.date}-${l.ticker}`} log={l} palette={palette} onOpenDetail={onOpenDetail} />)}
            </View>
          )}
        </Widget>
      </View>

      <RecentResultsTable results={results.slice(0, 20)} palette={palette} onOpenDetail={onOpenDetail} />
    </View>
  )
}
