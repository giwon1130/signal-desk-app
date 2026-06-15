/**
 * 🤖 AI 시황 흐름 리딩 카드 — 섹터·수급·순환매 흐름을 AI가 읽은 내러티브.
 * 서버 /reading/ai-flow 의 AiFlowReading 한 건을 렌더.
 */
import { Linking, Pressable, Text, View } from 'react-native'
import { ExternalLink, Sparkles, Tv } from 'lucide-react-native'
import { useTheme } from '../../theme'
import type { AiFlowReading } from '../../types'

function sentimentStyle(s: AiFlowReading['sentiment'], palette: any) {
  if (s === 'BULLISH') return { bg: palette.upSoft ?? palette.greenSoft, fg: palette.up ?? palette.green, label: '🟢 상승 우호' }
  if (s === 'BEARISH') return { bg: palette.downSoft ?? palette.redSoft, fg: palette.down ?? palette.red, label: '🔴 하락 우위' }
  return { bg: palette.surfaceAlt, fg: palette.inkMuted, label: '🟡 중립' }
}

export function AiFlowCard({ card }: { card: AiFlowReading }) {
  const { palette } = useTheme()
  const purple = palette.purple ?? '#7c3aed'
  const sent = sentimentStyle(card.sentiment, palette)
  const isYoutube = !!card.sourceUrl

  return (
    <View style={{
      backgroundColor: palette.surface, borderRadius: 14, borderWidth: 1, borderColor: palette.border,
      padding: 15, gap: 10,
    }}>
      {/* 헤더 — 데이터 기반은 시데 AI, 유튜브 출처면 채널명 + 빨강 아이콘 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
        <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: (isYoutube ? '#ff0000' : purple) + '1f', alignItems: 'center', justifyContent: 'center' }}>
          {isYoutube ? <Tv size={14} color="#ff0000" strokeWidth={2.4} /> : <Sparkles size={14} color={purple} strokeWidth={2.5} />}
        </View>
        <Text style={{ color: palette.ink, fontSize: 13, fontWeight: '900', flex: 1 }} numberOfLines={1}>
          {card.sourceLabel || '시데 AI 시황'}{isYoutube ? ' 요약' : ''}
        </Text>
        <View style={{ backgroundColor: sent.bg, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 }}>
          <Text style={{ color: sent.fg, fontSize: 10, fontWeight: '800' }}>{sent.label}</Text>
        </View>
      </View>

      <Text style={{ color: palette.inkFaint, fontSize: 10.5, fontWeight: '700' }} numberOfLines={1}>{card.title}</Text>

      {/* 헤드라인 */}
      <Text style={{ color: palette.ink, fontSize: 16, fontWeight: '900', lineHeight: 22 }}>{card.headline}</Text>

      {/* 본문 */}
      {card.narrative ? (
        <Text style={{ color: palette.inkSub, fontSize: 13.5, lineHeight: 21 }}>{card.narrative}</Text>
      ) : null}

      {/* 흐름 포인트 */}
      {card.flowPoints.length > 0 ? (
        <View style={{ gap: 6, marginTop: 2 }}>
          {card.flowPoints.map((p, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
              <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: purple, marginTop: 7 }} />
              <Text style={{ color: palette.inkSub, fontSize: 12.5, lineHeight: 18, flex: 1 }}>{p}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* 핵심 종목 칩 */}
      {card.keyTickers.length > 0 ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
          {card.keyTickers.map((t) => (
            <View key={t} style={{ backgroundColor: palette.surfaceAlt, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
              <Text style={{ color: palette.inkSub, fontSize: 11, fontWeight: '700' }}>{t}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* 유튜브 출처면 원문 링크 */}
      {isYoutube ? (
        <Pressable
          onPress={() => void Linking.openURL(card.sourceUrl).catch(() => {})}
          style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', marginTop: 2, opacity: pressed ? 0.6 : 1 })}
        >
          <ExternalLink size={12} color={palette.blue} strokeWidth={2.4} />
          <Text style={{ color: palette.blue, fontSize: 11.5, fontWeight: '800' }}>원문 영상 보기</Text>
        </Pressable>
      ) : null}

      <Text style={{ color: palette.inkFaint, fontSize: 9.5, lineHeight: 14, marginTop: 2 }}>
        {isYoutube
          ? 'AI가 공개 방송을 요약한 참고용 내용입니다(원문 확인 권장). 투자자문이 아니며 판단·책임은 본인에게 있어요.'
          : 'AI가 시장 데이터(섹터·수급·지수·뉴스)로 만든 참고용 시황입니다. 투자자문이 아니며 판단·책임은 본인에게 있어요.'}
      </Text>
    </View>
  )
}
