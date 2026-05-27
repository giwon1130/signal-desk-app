import { Text, View } from 'react-native'
import { AlertTriangle, Sparkles, TrendingDown, TrendingUp } from 'lucide-react-native'
import type { MarketInsightData } from '../../../types'
import type { Palette } from '../../../theme'

type Props = {
  insight: MarketInsightData
  palette: Palette
}

/**
 * Gemini 마켓 종합 인사이트 카드 — headline + summary + keyPoints 불릿 + sentiment 배지.
 */
export function InsightCard({ insight, palette }: Props) {
  const sentimentColor =
    insight.sentiment === 'BULLISH' ? palette.up :
    insight.sentiment === 'BEARISH' ? palette.down : palette.inkSub
  const SentimentIcon =
    insight.sentiment === 'BULLISH' ? TrendingUp :
    insight.sentiment === 'BEARISH' ? TrendingDown : AlertTriangle

  return (
    <View style={{
      backgroundColor: palette.surface,
      borderRadius: 14, borderWidth: 1, borderColor: palette.border,
      padding: 16, gap: 10,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Sparkles size={13} color={palette.purple} strokeWidth={2.5} />
        <Text style={{ color: palette.inkFaint, fontSize: 9, fontWeight: '800', letterSpacing: 1.5, flex: 1 }}>
          GEMINI · 오늘의 마켓 종합 인사이트
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <SentimentIcon size={11} color={sentimentColor} strokeWidth={2.5} />
          <Text style={{ color: sentimentColor, fontSize: 10, fontWeight: '800' }}>
            {insight.sentiment === 'BULLISH' ? '강세' : insight.sentiment === 'BEARISH' ? '약세' : '중립'}
          </Text>
        </View>
      </View>
      <Text style={{ color: palette.ink, fontSize: 16, fontWeight: '900', lineHeight: 22 }}>
        {insight.headline}
      </Text>
      <Text style={{ color: palette.inkSub, fontSize: 12, lineHeight: 18 }}>
        {insight.summary}
      </Text>
      {insight.keyPoints.length > 0 ? (
        <View style={{ gap: 4 }}>
          {insight.keyPoints.map((pt, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
              <Text style={{ color: palette.purple, fontSize: 11, fontWeight: '800', marginTop: 1 }}>·</Text>
              <Text style={{ color: palette.inkMuted, fontSize: 11, lineHeight: 16, flex: 1 }}>{pt}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  )
}

/** 데이터 로드 전 placeholder — Gemini 호출 시간 동안 노출. */
export function InsightCardSkeleton({ palette }: { palette: Palette }) {
  return (
    <View style={{
      backgroundColor: palette.surface,
      borderRadius: 14, borderWidth: 1, borderColor: palette.border,
      padding: 16, gap: 10,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Sparkles size={13} color={palette.inkFaint} strokeWidth={2.5} />
        <Text style={{ color: palette.inkFaint, fontSize: 9, fontWeight: '800', letterSpacing: 1.5 }}>
          GEMINI · 오늘의 마켓 종합 인사이트
        </Text>
      </View>
      <Text style={{ color: palette.inkMuted, fontSize: 13, lineHeight: 19 }}>
        AI 인사이트 불러오는 중…
      </Text>
      <Text style={{ color: palette.inkFaint, fontSize: 11, lineHeight: 16 }}>
        VIX·지수·뉴스 종합 분석에 잠시 시간이 걸려.
      </Text>
    </View>
  )
}
