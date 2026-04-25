import { Text, View } from 'react-native'
import { BarChart3 } from 'lucide-react-native'
import type { AlternativeSignal, MarketSummaryData } from '../../types'
import { type Palette } from '../../theme'
import { Widget } from '../shared'

/**
 * `alternativeSignals` — 비전통적 지표 (VIX, Fear&Greed, 달러지수 등).
 * 기존 summary 에 들어있던 필드를 그냥 꺼내 씀.
 */
export function AltSignalsWidget({ summary, palette }: { summary: MarketSummaryData | null; palette: Palette }) {
  const signals = summary?.alternativeSignals ?? []
  if (signals.length === 0) {
    return (
      <Widget palette={palette} title="대체 시그널" icon={<BarChart3 size={13} color={palette.orange} strokeWidth={2.5} />}>
        <View style={{ paddingVertical: 18, alignItems: 'center' }}>
          <Text style={{ color: palette.inkMuted, fontSize: 12 }}>대체 시그널 준비 중</Text>
        </View>
      </Widget>
    )
  }
  return (
    <Widget
      palette={palette}
      title="대체 시그널"
      icon={<BarChart3 size={13} color={palette.orange} strokeWidth={2.5} />}
      meta={`${signals.length}개`}
    >
      <View style={{ gap: 8 }}>
        {signals.slice(0, 5).map((s) => (
          <AltSignalRow key={s.label} signal={s} palette={palette} />
        ))}
      </View>
    </Widget>
  )
}

function AltSignalRow({ signal, palette }: { signal: AlternativeSignal; palette: Palette }) {
  const score = signal.score ?? 50
  const color = score >= 65 ? palette.up : score <= 35 ? palette.down : palette.inkSub
  return (
    <View style={{ gap: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text style={{ color: palette.ink, fontSize: 12, fontWeight: '700', flex: 1 }} numberOfLines={1}>
          {signal.label}
        </Text>
        <Text style={{ color, fontSize: 12, fontWeight: '800', fontVariant: ['tabular-nums'] }}>
          {score.toFixed(0)}
        </Text>
      </View>
      <View style={{ height: 4, backgroundColor: palette.surfaceAlt, borderRadius: 2, overflow: 'hidden' }}>
        <View style={{ width: `${Math.max(0, Math.min(100, score))}%`, height: '100%', backgroundColor: color }} />
      </View>
      {signal.state ? (
        <Text numberOfLines={1} style={{ color: palette.inkMuted, fontSize: 10 }}>
          {signal.state}{signal.highlights && signal.highlights.length > 0 ? ` · ${signal.highlights.slice(0, 2).join(', ')}` : ''}
        </Text>
      ) : null}
    </View>
  )
}
