import { Pressable, Text, View } from 'react-native'
import { Brain, Sparkles } from 'lucide-react-native'
import type { AiRecommendationData } from '../../types'
import type { Palette } from '../../theme'
import { formatSignedRate } from '../../utils'
import { Widget, webGrid } from '../shared'

export function PicksRow({
  aiRecommendation, palette, onOpenDetail,
}: {
  aiRecommendation: AiRecommendationData | null
  palette: Palette
  onOpenDetail: (m: string, t: string, n?: string) => void
}) {
  const logs = aiRecommendation?.executionLogs?.filter((l) => l.stage?.toUpperCase().includes('RECOMMEND')).slice(0, 12) ?? []
  const metrics = aiRecommendation?.metrics
  const winRate = metrics?.hitRate != null ? Math.round(metrics.hitRate * 100) : null

  return (
    <Widget
      palette={palette}
      title="오늘의 AI 추천"
      icon={<Brain size={13} color={palette.purple} strokeWidth={2.5} />}
      meta={
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, maxWidth: 520 }}>
          {winRate != null ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: palette.purpleSoft, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
              <Text style={{ color: palette.purple, fontSize: 10, fontWeight: '800', letterSpacing: 0.3 }}>
                승률 {winRate}%
              </Text>
            </View>
          ) : null}
          {metrics?.averageReturnRate != null ? (
            <Text style={{ color: metrics.averageReturnRate >= 0 ? palette.up : palette.down, fontSize: 10, fontWeight: '800' }}>
              평균 {formatSignedRate(metrics.averageReturnRate)}
            </Text>
          ) : null}
          {aiRecommendation?.summary ? (
            <Text numberOfLines={1} style={{ color: palette.inkMuted, fontSize: 11, fontWeight: '600', flexShrink: 1 }}>
              {aiRecommendation.summary}
            </Text>
          ) : null}
        </View>
      }
    >
      {logs.length === 0 ? (
        <View style={{ paddingVertical: 18, alignItems: 'center', gap: 4 }}>
          <Sparkles size={18} color={palette.inkFaint} />
          <Text style={{ color: palette.inkMuted, fontSize: 12 }}>오늘 AI 추천이 아직 없어</Text>
        </View>
      ) : (
        <View style={[{ gap: 10 }, webGrid('repeat(auto-fill, minmax(220px, 1fr))')]}>
          {logs.map((log) => {
            const exp = log.expectedReturnRate
            return (
              <Pressable
                key={`${log.date}-${log.market}-${log.ticker}`}
                onPress={() => onOpenDetail(log.market, log.ticker, log.name)}
                style={(state) => {
                  const hovered = (state as { hovered?: boolean }).hovered
                  return [{
                    paddingHorizontal: 12,
                    paddingVertical: 11,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: hovered ? palette.blue : palette.border,
                    backgroundColor: hovered ? palette.blueSoft : palette.bg,
                    gap: 4,
                  }]
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Text style={{ color: palette.inkFaint, fontSize: 9, fontWeight: '800', letterSpacing: 1 }}>
                    {log.market}
                  </Text>
                  <Text style={{ color: palette.inkMuted, fontSize: 10, fontWeight: '700' }}>
                    {log.ticker}
                  </Text>
                  <View style={{ flex: 1 }} />
                  {log.userStatus ? (
                    <Text style={{ color: palette.blue, fontSize: 9, fontWeight: '800' }}>
                      {log.userStatus}
                    </Text>
                  ) : null}
                </View>
                <Text
                  numberOfLines={1}
                  style={{ color: palette.ink, fontSize: 14, fontWeight: '800' }}
                >
                  {log.name}
                </Text>
                <Text
                  numberOfLines={2}
                  style={{ color: palette.inkMuted, fontSize: 11, lineHeight: 15, minHeight: 30 }}
                >
                  {log.rationale || '—'}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
                  {log.confidence != null ? (
                    <Text style={{ color: palette.purple, fontSize: 10, fontWeight: '800' }}>
                      확신 {Math.round(log.confidence * 100)}%
                    </Text>
                  ) : null}
                  {exp != null ? (
                    <Text
                      style={{
                        color: exp >= 0 ? palette.up : palette.down,
                        fontSize: 10,
                        fontWeight: '800',
                      }}
                    >
                      기대 {formatSignedRate(exp)}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            )
          })}
        </View>
      )}
    </Widget>
  )
}
