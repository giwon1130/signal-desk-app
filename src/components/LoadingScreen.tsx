import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Animated, Text, View } from 'react-native'
import { Quote, TrendingUp } from 'lucide-react-native'
import { useTheme } from '../theme'
import { INVESTING_QUOTES } from '../utils/investingQuotes'

// 명언 교체 주기. fade out(280) + fade in(380) 을 포함한 한 사이클.
const ROTATE_MS = 3200

/**
 * 앱 첫 시작 — 초기 데이터를 불러오는 동안 보여주는 로딩 화면.
 * 단순 스피너 대신 투자 명언을 일정 주기로 페이드 전환해 대기 시간을 덜 지루하게.
 */
export function LoadingScreen() {
  const { palette } = useTheme()
  // 매번 같은 명언으로 시작하지 않도록 시작 인덱스를 랜덤하게.
  const [index, setIndex] = useState(() => Math.floor(Math.random() * INVESTING_QUOTES.length))
  const fade = useRef(new Animated.Value(1)).current

  useEffect(() => {
    const timer = setInterval(() => {
      Animated.timing(fade, { toValue: 0, duration: 280, useNativeDriver: true }).start(() => {
        setIndex((prev) => (prev + 1) % INVESTING_QUOTES.length)
        Animated.timing(fade, { toValue: 1, duration: 380, useNativeDriver: true }).start()
      })
    }, ROTATE_MS)
    return () => clearInterval(timer)
  }, [fade])

  const quote = INVESTING_QUOTES[index]

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: palette.bg,
        paddingHorizontal: 32,
        gap: 28,
      }}
    >
      {/* ── 브랜드 ── */}
      <View style={{ alignItems: 'center', gap: 10 }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            backgroundColor: palette.blueSoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <TrendingUp size={28} color={palette.blue} strokeWidth={2.6} />
        </View>
        <Text style={{ color: palette.ink, fontSize: 18, fontWeight: '900', letterSpacing: -0.3 }}>
          Signal Desk
        </Text>
      </View>

      {/* ── 스피너 ── */}
      <View style={{ alignItems: 'center', gap: 8 }}>
        <ActivityIndicator size="small" color={palette.blue} />
        <Text style={{ color: palette.inkMuted, fontSize: 13, fontWeight: '600' }}>
          데이터 불러오는 중...
        </Text>
      </View>

      {/* ── 로테이션 투자 명언 ── */}
      <Animated.View
        style={{
          opacity: fade,
          width: '100%',
          maxWidth: 420,
          backgroundColor: palette.surface,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: palette.border,
          padding: 18,
          gap: 8,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Quote size={13} color={palette.blue} strokeWidth={2.5} />
          <Text style={{ color: palette.inkMuted, fontSize: 10, fontWeight: '800', letterSpacing: 0.8 }}>
            오늘의 투자 명언
          </Text>
        </View>
        <Text style={{ color: palette.ink, fontSize: 14, fontWeight: '600', lineHeight: 21 }}>
          "{quote.text}"
        </Text>
        <Text style={{ color: palette.inkMuted, fontSize: 12, fontWeight: '700', textAlign: 'right' }}>
          — {quote.author}
        </Text>
      </Animated.View>
    </View>
  )
}
