import { Modal, Pressable, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Sparkles, Quote } from 'lucide-react-native'
import { useTheme } from '../theme'
import type { DailyFortune } from '../types'
import { fortuneToneColor } from '../tabs/today_parts/helpers'
import { getDailyQuote } from '../utils/investingQuotes'

type Props = {
  visible: boolean
  fortune: DailyFortune | null
  onClose: () => void
}

export function DailyGreetingModal({ visible, fortune, onClose }: Props) {
  const { palette } = useTheme()

  const quote = fortune ? getDailyQuote(fortune.date) : null
  const accent = fortune ? fortuneToneColor(fortune.overallTone) : palette.blue
  const toneSoft = fortune?.overallTone === 'good'
    ? palette.upSoft
    : fortune?.overallTone === 'bad'
    ? palette.downSoft
    : palette.orangeSoft

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
      <Pressable
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
        }}
        onPress={onClose}
      >
        <Pressable
          style={{
            backgroundColor: palette.surface,
            borderRadius: 20,
            padding: 24,
            width: '100%',
            maxWidth: 360,
            gap: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.18,
            shadowRadius: 20,
            elevation: 12,
          }}
          onPress={() => {}}
        >
          {/* ── 헤더 ── */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Sparkles size={18} color={accent} strokeWidth={2.5} />
            <Text style={{ color: palette.ink, fontSize: 15, fontWeight: '900', flex: 1 }}>오늘의 투자 운세</Text>
            <Text style={{ color: palette.inkMuted, fontSize: 11 }}>
              {fortune?.date ?? ''}
            </Text>
          </View>

          {/* ── 운세 카드 ── */}
          {fortune ? (
            <View style={{ backgroundColor: toneSoft, borderRadius: 14, padding: 16, gap: 10, borderWidth: 1, borderColor: palette.border }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{
                  width: 56, height: 56, borderRadius: 28,
                  borderWidth: 2.5, borderColor: accent,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ color: accent, fontSize: 20, fontWeight: '900', fontVariant: ['tabular-nums'] }}>
                    {fortune.overallScore}
                  </Text>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ color: accent, fontSize: 14, fontWeight: '900' }}>{fortune.overallLabel}</Text>
                  <Text style={{ color: palette.ink, fontSize: 13, fontWeight: '700', lineHeight: 18 }} numberOfLines={2}>
                    {fortune.headline}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 6 }}>
                {[
                  { label: '재물', score: fortune.wealthScore },
                  { label: '거래', score: fortune.tradeScore },
                  { label: '인내', score: fortune.patienceScore },
                ].map(({ label, score }) => (
                  <View key={label} style={{
                    flex: 1, backgroundColor: palette.surface, borderRadius: 8,
                    paddingVertical: 6, alignItems: 'center', gap: 2,
                    borderWidth: 1, borderColor: palette.border,
                  }}>
                    <Text style={{ color: palette.inkMuted, fontSize: 9, fontWeight: '700' }}>{label}</Text>
                    <Text style={{
                      fontSize: 16, fontWeight: '900', fontVariant: ['tabular-nums'],
                      color: score >= 70 ? palette.up : score <= 40 ? palette.down : palette.inkSub,
                    }}>{score}</Text>
                  </View>
                ))}
              </View>

              <Text style={{ color: palette.inkSub, fontSize: 11, fontStyle: 'italic', textAlign: 'center', lineHeight: 16 }}>
                "{fortune.mantra}"
              </Text>
            </View>
          ) : (
            <View style={{ backgroundColor: palette.surfaceAlt, borderRadius: 14, padding: 16, alignItems: 'center' }}>
              <Text style={{ color: palette.inkMuted, fontSize: 13 }}>운세 데이터를 불러오는 중이야.</Text>
            </View>
          )}

          {/* ── 오늘의 명언 ── */}
          {quote ? (
            <View style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Quote size={12} color={palette.blue} strokeWidth={2.5} />
                <Text style={{ color: palette.inkMuted, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 }}>
                  오늘의 투자 명언
                </Text>
              </View>
              <View style={{ backgroundColor: palette.surfaceAlt, borderRadius: 12, padding: 14, gap: 6, borderWidth: 1, borderColor: palette.border }}>
                <Text style={{ color: palette.ink, fontSize: 13, fontWeight: '600', lineHeight: 20 }}>
                  "{quote.text}"
                </Text>
                <Text style={{ color: palette.inkMuted, fontSize: 11, textAlign: 'right' }}>
                  — {quote.author}
                </Text>
              </View>
            </View>
          ) : null}

          {/* ── 닫기 버튼 ── */}
          <Pressable
            onPress={onClose}
            style={({ pressed }) => ({
              backgroundColor: palette.blue,
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: 'center',
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '900' }}>
              오늘도 좋은 투자 하자!
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
      </SafeAreaView>
    </Modal>
  )
}
