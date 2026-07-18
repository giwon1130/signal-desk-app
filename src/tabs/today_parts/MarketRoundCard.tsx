import { Linking, Pressable, Text, View } from 'react-native'
import { ExternalLink, ShieldAlert, Video } from 'lucide-react-native'
import type { MarketRound } from '../../types'
import { useTheme } from '../../theme'

type Props = { round: MarketRound }

/**
 * 공포를 키우는 상시 게시판 대신, 이벤트가 있을 때만 보이는 검수형 라운드.
 * 영상 전문을 복제하지 않고 공식 원문을 열며, "왜 지금 보나"를 반드시 함께 보여준다.
 */
export function MarketRoundCard({ round }: Props) {
  const { palette } = useTheme()
  const levelColor = round.riskLevel === 'HIGH' ? palette.red : round.riskLevel === 'CAUTION' ? palette.orange : palette.blue

  return (
    <View style={{ backgroundColor: palette.surface, borderWidth: 1, borderColor: levelColor + '88', borderRadius: 14, padding: 15, gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 9 }}>
        <View style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: levelColor + '18', alignItems: 'center', justifyContent: 'center' }}>
          <ShieldAlert size={16} color={levelColor} strokeWidth={2.4} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ color: levelColor, fontSize: 10, fontWeight: '900', letterSpacing: 0.7 }}>시장 라운드 · 검수된 원문</Text>
          <Text style={{ color: palette.ink, fontSize: 16, fontWeight: '900' }}>{round.title}</Text>
        </View>
      </View>

      <Text style={{ color: palette.inkSub, fontSize: 12.5, lineHeight: 19 }}>{round.summary}</Text>

      {round.checkpoints.length > 0 ? (
        <View style={{ backgroundColor: palette.surfaceAlt, borderRadius: 10, padding: 11, gap: 5 }}>
          <Text style={{ color: palette.inkMuted, fontSize: 10, fontWeight: '900', letterSpacing: 0.6 }}>지금 확인할 것</Text>
          {round.checkpoints.map((point) => (
            <Text key={point} style={{ color: palette.inkSub, fontSize: 11.5, lineHeight: 17 }}>• {point}</Text>
          ))}
        </View>
      ) : null}

      {round.contents.map((content) => (
        <Pressable
          key={content.id}
          onPress={() => { void Linking.openURL(content.url).catch(() => {}) }}
          accessibilityRole="link"
          accessibilityLabel={`${content.title} 원문 열기`}
          style={({ pressed }) => ({
            borderWidth: 1, borderColor: palette.border, backgroundColor: pressed ? palette.surfaceAlt : palette.surface,
            borderRadius: 10, padding: 11, gap: 5, opacity: pressed ? 0.82 : 1,
          })}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Video size={12} color={palette.brandAccent} strokeWidth={2.5} />
            <Text style={{ color: palette.brandAccent, fontSize: 10, fontWeight: '900', flex: 1 }}>
              {content.label}{content.official ? ' · 공식 원문' : ''}
            </Text>
            <ExternalLink size={12} color={palette.inkFaint} strokeWidth={2.4} />
          </View>
          <Text style={{ color: palette.ink, fontSize: 13, fontWeight: '800' }} numberOfLines={2}>{content.title}</Text>
          <Text style={{ color: palette.inkMuted, fontSize: 10.5 }} numberOfLines={1}>
            {[content.sourceName, content.expertName].filter(Boolean).join(' · ')}
          </Text>
          <Text style={{ color: palette.inkSub, fontSize: 11, lineHeight: 16 }} numberOfLines={2}>왜 지금: {content.whyRecommended}</Text>
        </Pressable>
      ))}

      <Text style={{ color: palette.inkFaint, fontSize: 10.5, lineHeight: 15 }}>
        이 라운드는 투자 지시가 아니라 확인할 정보와 관점을 모아둔 공간이에요.
      </Text>
    </View>
  )
}
