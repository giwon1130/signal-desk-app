import { Pressable, Text, View } from 'react-native'
import { Bell } from 'lucide-react-native'
import type { AiRecommendationData } from '../../types'
import type { Palette } from '../../theme'
import { EmptyRow, Section } from './Section'

export const RECENT_AI_CAP = 5

type Props = {
  aiRecommendation: AiRecommendationData | null
  onOpenDetail: (market: string, ticker: string, name?: string) => void
  onGotoAi: () => void
  palette: Palette
}

export function RecentAiSection({ aiRecommendation, onOpenDetail, onGotoAi, palette }: Props) {
  const topAi = aiRecommendation?.executionLogs?.slice(0, RECENT_AI_CAP) ?? []
  return (
    <Section
      icon={<Bell size={13} color={palette.purple} strokeWidth={2.5} />}
      title="최근 AI 추천"
      meta={topAi.length ? `${topAi.length}건` : '—'}
      onMoreLabel="전체 로그"
      onMore={onGotoAi}
      palette={palette}
    >
      {topAi.length === 0 ? (
        <EmptyRow text="최근 AI 추천이 없어" hint="AI 탭에서 오늘의 플레이북 확인" palette={palette} />
      ) : (
        topAi.map((log) => (
          <Pressable
            key={`${log.date}-${log.market}-${log.ticker}-${log.stage}`}
            onPress={() => onOpenDetail(log.market, log.ticker, log.name)}
            style={(state) => {
              const hovered = (state as { hovered?: boolean }).hovered
              return [{
                paddingHorizontal: 8,
                paddingVertical: 7,
                borderRadius: 7,
                gap: 2,
                backgroundColor: hovered ? palette.surfaceAlt : 'transparent',
              }]
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text
                numberOfLines={1}
                style={{ color: palette.ink, fontSize: 12, fontWeight: '800', flex: 1 }}
              >
                {log.name}
              </Text>
              <Text
                style={{
                  color: palette.purple,
                  fontSize: 9,
                  fontWeight: '800',
                  letterSpacing: 0.5,
                }}
              >
                {log.stage}
              </Text>
            </View>
            <Text
              numberOfLines={1}
              style={{ color: palette.inkMuted, fontSize: 11, fontWeight: '600' }}
            >
              {log.market} · {log.ticker} · {log.status}
            </Text>
          </Pressable>
        ))
      )}
    </Section>
  )
}
