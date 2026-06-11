import { useEffect, useRef, useState } from 'react'
import { Animated, Easing, Text, View } from 'react-native'
import { Quote, TrendingUp } from 'lucide-react-native'
import { useTheme } from '../theme'
import { INVESTING_QUOTES } from '../utils/investingQuotes'
import { Entrance } from './effects'

// 명언 교체 주기. fade out(280) + fade in(380) 을 포함한 한 사이클.
const ROTATE_MS = 3200

// 로딩 단계 문구 — 고정 문구보다 "진행되고 있다"는 감각을 주게 회전.
const PHASES = ['시세 받아오는 중...', '브리핑 준비 중...', '거의 다 됐어요...']
const PHASE_MS = 1500

/**
 * 앱 첫 시작 — 초기 데이터를 불러오는 동안 보여주는 로딩 화면.
 * 로고 등장(스케일+페이드) + 아이콘 펄스 + 단계 문구 회전 + 투자 명언 페이드 로테이션.
 */
export function LoadingScreen() {
  const { palette } = useTheme()
  // 매번 같은 명언으로 시작하지 않도록 시작 인덱스를 랜덤하게.
  const [index, setIndex] = useState(() => Math.floor(Math.random() * INVESTING_QUOTES.length))
  const [phase, setPhase] = useState(0)
  const fade = useRef(new Animated.Value(1)).current
  const logoIn = useRef(new Animated.Value(0)).current
  const pulse = useRef(new Animated.Value(0)).current

  // 로고 등장 + 아이콘 무한 펄스
  useEffect(() => {
    Animated.timing(logoIn, { toValue: 1, duration: 520, easing: Easing.out(Easing.back(1.4)), useNativeDriver: true }).start()
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [logoIn, pulse])

  // 로딩 단계 문구 — 마지막 단계에서 멈춤 ("거의 다 됐어요"가 1단계로 되돌아가면 어색).
  useEffect(() => {
    const t = setInterval(() => setPhase((p) => Math.min(p + 1, PHASES.length - 1)), PHASE_MS)
    return () => clearInterval(t)
  }, [])

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
      {/* ── 브랜드 (등장 + 펄스) ── */}
      <Animated.View
        style={{
          alignItems: 'center',
          gap: 10,
          opacity: logoIn,
          transform: [{ scale: logoIn.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }],
        }}
      >
        <Animated.View
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            backgroundColor: palette.blueSoft,
            alignItems: 'center',
            justifyContent: 'center',
            transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] }) }],
          }}
        >
          <TrendingUp size={28} color={palette.blue} strokeWidth={2.6} />
        </Animated.View>
        <Text style={{ color: palette.ink, fontSize: 18, fontWeight: '900', letterSpacing: -0.3 }}>
          Signal Desk
        </Text>
      </Animated.View>

      {/* ── 진행 단계 ── */}
      <View style={{ alignItems: 'center', gap: 8 }}>
        <Dots color={palette.blue} />
        <Text style={{ color: palette.inkMuted, fontSize: 13, fontWeight: '600' }}>
          {PHASES[phase]}
        </Text>
      </View>

      {/* ── 로테이션 투자 명언 (슬라이드업 등장) ── */}
      <Entrance distance={18} duration={460} style={{ width: '100%', maxWidth: 420 }}>
        <Animated.View
          style={{
            opacity: fade,
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
      </Entrance>
    </View>
  )
}

/** 점 3개가 차례로 통통 튀는 인디케이터 — 기본 스피너보다 브랜드 톤에 맞게. */
function Dots({ color }: { color: string }) {
  const v1 = useRef(new Animated.Value(0)).current
  const v2 = useRef(new Animated.Value(0)).current
  const v3 = useRef(new Animated.Value(0)).current
  useEffect(() => {
    const loops = [v1, v2, v3].map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 160),
          Animated.timing(v, { toValue: 1, duration: 340, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(v, { toValue: 0, duration: 340, easing: Easing.in(Easing.quad), useNativeDriver: true }),
          Animated.delay((2 - i) * 160),
        ]),
      ),
    )
    loops.forEach((l) => l.start())
    return () => loops.forEach((l) => l.stop())
  }, [v1, v2, v3])
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {[v1, v2, v3].map((v, i) => (
        <Animated.View
          key={i}
          style={{
            width: 7, height: 7, borderRadius: 4, backgroundColor: color,
            opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
            transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }) }],
          }}
        />
      ))}
    </View>
  )
}
