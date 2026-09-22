import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { ChevronDown, ChevronUp, Moon, Sunrise } from 'lucide-react-native'
import { useTheme } from '../../theme'
import type { DailyBriefing, MediaSummaryItem } from '../../types'
import { briefPresentation, selectLatestBrief } from '../../utils/briefPresentation'
import { BriefingDetails } from './BriefingDetails'

type Props = {
  items: MediaSummaryItem[]
  briefing?: DailyBriefing | null
  marketPreference?: 'KR' | 'US' | 'BOTH'
  onTickerPress?: (ticker: string) => void
}

/** 결론과 읽는 방법을 먼저, 지표/상세 근거는 사용자가 펼쳤을 때만 표시한다. */
export function BriefHero({ items, briefing, marketPreference = 'BOTH', onTickerPress }: Props) {
  const { palette } = useTheme()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const item = selectLatestBrief(items, marketPreference)
  if (!item && !briefing) return null
  const content = item ? briefPresentation(item) : null
  const expanded = !!item && expandedId === item.id
  const evening = item?.source === 'CLOSE_BRIEF' || item?.source === 'EVENING_BRIEF'
  const Icon = evening ? Moon : Sunrise
  const label = item?.source === 'EVENING_BRIEF' ? '미국장 마감 브리프'
    : item?.source === 'CLOSE_BRIEF' ? '한국장 마감 브리프'
    : item?.source === 'MIDDAY_BRIEF' ? '한국장 장중 브리프' : '모닝 브리프'
  const accent = content?.stale ? palette.inkMuted : palette.brandAccent
  const timestamp = item && Number.isFinite(Date.parse(item.publishedAt))
    ? new Date(item.publishedAt).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Seoul' }) + ' KST'
    : '발행 시각 확인 중'

  return (
    <View style={{ backgroundColor: palette.surface, borderRadius: 20, borderWidth: 1, borderColor: palette.border, padding: 20, gap: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <Icon size={17} color={accent} strokeWidth={2.2} />
        <Text style={{ color: palette.ink, fontSize: 14, fontWeight: '800', flex: 1 }}>{item ? label : '나의 확인 사항'}</Text>
        {content ? <Text style={{ color: accent, fontSize: 12, fontWeight: '700' }}>{content.label}</Text> : null}
      </View>
      {item && content ? <>
        <View style={{ gap: 8 }}>
          <Text style={{ color: palette.inkMuted, fontSize: 12 }}>{timestamp} 기준</Text>
          <Text accessibilityRole="header" style={{ color: palette.ink, fontSize: 21, fontWeight: '800', lineHeight: 30, letterSpacing: -0.5 }}>{content.headline}</Text>
        </View>
        <View style={{ backgroundColor: palette.surfaceAlt, borderRadius: 14, padding: 15, gap: 7 }}>
          <Text style={{ color: palette.brandAccent, fontSize: 12, fontWeight: '800' }}>이렇게 살펴보세요</Text>
          <Text style={{ color: palette.inkSub, fontSize: 15, lineHeight: 24 }}>{content.guide}</Text>
        </View>
        <View style={{ borderTopWidth: 1, borderTopColor: palette.borderLight }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={expanded ? '시장 흐름 닫기' : '시장 흐름 열기'}
            accessibilityState={{ expanded }}
            aria-expanded={expanded}
            onPress={() => setExpandedId(expanded ? null : item.id)}
            style={({ pressed }) => ({ minHeight: 52, paddingTop: 10, flexDirection: 'row', alignItems: 'center', gap: 8, opacity: pressed ? 0.65 : 1 })}
          >
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ color: palette.ink, fontSize: 14, fontWeight: '700' }}>시장 흐름 · 판단 근거</Text>
              <Text style={{ color: palette.inkMuted, fontSize: 12 }}>{expanded ? '확인한 내용을 접을 수 있습니다' : '지표와 세부 내용이 궁금할 때 열어보세요'}</Text>
            </View>
            <Text style={{ color: palette.brandAccent, fontSize: 12, fontWeight: '700' }}>{expanded ? '닫기' : '열기'}</Text>
            {expanded ? <ChevronUp size={17} color={palette.inkMuted} /> : <ChevronDown size={17} color={palette.inkMuted} />}
          </Pressable>
          {expanded ? <View style={{ gap: 16, paddingTop: 18 }}>
            {content.narrative ? <Text style={{ color: palette.inkSub, fontSize: 14, lineHeight: 23 }}>{content.narrative}</Text> : null}
            {content.points.length ? <View style={{ gap: 0 }}>
              {content.points.map((point, index) => <View key={index} style={{ paddingVertical: 12, borderTopWidth: 1, borderTopColor: palette.borderLight }}>
                <Text selectable style={{ color: palette.inkMuted, fontSize: 13, lineHeight: 21 }}>{point}</Text>
              </View>)}
            </View> : <Text style={{ color: palette.inkMuted, fontSize: 13 }}>추가로 확인된 상세 근거가 없습니다.</Text>}
            {item.keyTickers.length && onTickerPress ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {item.keyTickers.map((ticker) => <Pressable key={ticker} accessibilityRole="button" accessibilityLabel={ticker + ' 종목 보기'} onPress={() => onTickerPress(ticker)}
                style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 10, backgroundColor: palette.surfaceAlt }}>
                <Text style={{ color: palette.ink, fontSize: 13, fontWeight: '700' }}>{ticker}</Text>
              </Pressable>)}
            </View> : null}
          </View> : null}
        </View>
      </> : <Text style={{ color: palette.inkMuted, fontSize: 14, lineHeight: 22 }}>새 브리프가 아직 도착하지 않았습니다. 내 종목과 예정된 일정을 먼저 확인해 주세요.</Text>}
      {briefing ? <BriefingDetails briefing={briefing} /> : null}
    </View>
  )
}
