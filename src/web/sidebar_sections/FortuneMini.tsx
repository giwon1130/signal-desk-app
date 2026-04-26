import { Text, View } from 'react-native'
import { Sparkles } from 'lucide-react-native'
import type { DailyFortune } from '../../types'
import type { Palette } from '../../theme'

export function FortuneMini({ fortune, palette }: { fortune: DailyFortune; palette: Palette }) {
  const toneColor = fortune.overallTone === 'good' ? palette.up : fortune.overallTone === 'bad' ? palette.down : palette.orange
  const toneSoft = fortune.overallTone === 'good' ? palette.upSoft : fortune.overallTone === 'bad' ? palette.downSoft : palette.orangeSoft
  return (
    <View
      style={{
        backgroundColor: toneSoft,
        borderRadius: 10,
        padding: 12,
        gap: 6,
        borderWidth: 1,
        borderColor: palette.border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Sparkles size={13} color={toneColor} strokeWidth={2.5} />
        <Text style={{ color: palette.ink, fontSize: 12, fontWeight: '800', flex: 1 }}>오늘의 운</Text>
        <Text style={{ color: toneColor, fontSize: 11, fontWeight: '900', letterSpacing: 0.5 }}>
          {fortune.overallLabel} · {fortune.overallScore}
        </Text>
      </View>
      <Text style={{ color: palette.ink, fontSize: 12, fontWeight: '700', lineHeight: 16 }} numberOfLines={2}>
        {fortune.headline}
      </Text>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        <FortuneBadge label="재물" score={fortune.wealthScore} palette={palette} />
        <FortuneBadge label="거래" score={fortune.tradeScore} palette={palette} />
        <FortuneBadge label="인내" score={fortune.patienceScore} palette={palette} />
      </View>
    </View>
  )
}

function FortuneBadge({ label, score, palette }: { label: string; score: number; palette: Palette }) {
  const color = score >= 70 ? palette.up : score <= 40 ? palette.down : palette.inkSub
  return (
    <View style={{ flex: 1, backgroundColor: palette.surface, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 4, borderWidth: 1, borderColor: palette.border }}>
      <Text style={{ color: palette.inkMuted, fontSize: 9, fontWeight: '700' }}>{label}</Text>
      <Text style={{ color, fontSize: 13, fontWeight: '900', fontVariant: ['tabular-nums'] }}>{score}</Text>
    </View>
  )
}
