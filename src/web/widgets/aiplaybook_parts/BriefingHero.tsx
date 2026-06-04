import { Text, View } from 'react-native'
import { Flame } from 'lucide-react-native'
import type { MarketSummaryData } from '../../../types'
import { type Palette } from '../../../theme'
import { GradientCard, withAlpha } from '../../web_effects'

type Props = {
  summary: MarketSummaryData | null
  palette: Palette
}

/**
 * Playbook 상단 hero — 시간대(slot) 레이블 + headline + narrative + 컨텍스트 pill 4종.
 */
export function BriefingHero({ summary, palette }: Props) {
  const briefing = summary?.briefing
  const slot = briefing?.slot
  const slotLabel =
    slot === 'PRE_MARKET' ? '장 시작 전' :
    slot === 'INTRADAY'   ? '장중' :
    slot === 'POST_MARKET'? '장 마감 후' :
    slot === 'WEEKEND'    ? '주말' :
    slot === 'HOLIDAY'    ? '휴장' : null
  const headline = briefing?.headline ?? summary?.summary ?? '오늘의 브리핑을 불러오는 중…'
  const narrative = briefing?.narrative ?? ''

  return (
    <GradientCard
      radius={16}
      glowColor={palette.orange}
      glowOpacity={0.2}
      images={[
        `linear-gradient(135deg, ${palette.orangeSoft}, ${palette.surface} 62%)`,
        `radial-gradient(circle at 95% 4%, ${withAlpha(palette.orange, 0.18)}, transparent 50%)`,
      ]}
      style={{ borderWidth: 1, borderColor: palette.border, padding: 18 }}
    >
      <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Flame size={14} color={palette.orange} strokeWidth={2.5} />
        <Text style={{ color: palette.inkFaint, fontSize: 10, fontWeight: '800', letterSpacing: 2 }}>
          TODAY · BRIEFING
        </Text>
        {slotLabel ? (
          <View style={{ backgroundColor: palette.blueSoft, borderRadius: 4, paddingHorizontal: 7, paddingVertical: 2 }}>
            <Text style={{ color: palette.blue, fontSize: 10, fontWeight: '800', letterSpacing: 0.3 }}>{slotLabel}</Text>
          </View>
        ) : null}
      </View>
      <Text style={{ color: palette.ink, fontSize: 20, fontWeight: '800', lineHeight: 26 }}>
        {headline}
      </Text>
      {narrative ? (
        <Text style={{ color: palette.inkSub, fontSize: 13, lineHeight: 19 }}>
          {narrative}
        </Text>
      ) : null}
      {briefing?.context ? (
        <View style={{ flexDirection: 'row', gap: 14, marginTop: 4, flexWrap: 'wrap' }}>
          {briefing.context.holdingPnlLabel ? (
            <ContextPill
              label="내 포지션"
              value={briefing.context.holdingPnlLabel}
              color={briefing.context.holdingPnlRate == null ? palette.inkSub : briefing.context.holdingPnlRate >= 0 ? palette.up : palette.down}
              palette={palette}
            />
          ) : null}
          {briefing.context.watchlistAlertCount > 0 ? (
            <ContextPill
              label="감시 알림"
              value={`${briefing.context.watchlistAlertCount}건`}
              color={palette.orange}
              palette={palette}
            />
          ) : null}
          {briefing.context.marketMood ? (
            <ContextPill
              label="시장 분위기"
              value={briefing.context.marketMood}
              color={palette.purple}
              palette={palette}
            />
          ) : null}
          {briefing.context.keyEvent ? (
            <ContextPill
              label="핵심 이벤트"
              value={briefing.context.keyEvent}
              color={palette.teal}
              palette={palette}
            />
          ) : null}
        </View>
      ) : null}
      </View>
    </GradientCard>
  )
}

function ContextPill({ label, value, color, palette }: { label: string; value: string; color: string; palette: Palette }) {
  return (
    <View style={{ flexDirection: 'column', gap: 2 }}>
      <Text style={{ color: palette.inkFaint, fontSize: 9, fontWeight: '800', letterSpacing: 0.8 }}>
        {label.toUpperCase()}
      </Text>
      <Text style={{ color, fontSize: 13, fontWeight: '800' }}>{value}</Text>
    </View>
  )
}
