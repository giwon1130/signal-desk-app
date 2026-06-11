/**
 * 시데 AI 플로팅 버튼 — 어느 탭에서든 챗봇처럼 바로 연다.
 * 네이티브: 하단 지수 펄스 위 우측 / 웹: 우하단 고정 (인터콤 스타일).
 */
import { useEffect, useRef } from 'react'
import { Animated, Easing, Platform, Pressable } from 'react-native'
import { Sparkles } from 'lucide-react-native'
import { useTheme } from '../theme'
import { hapticLight } from '../utils/haptics'

export function AssistantFab({ onPress }: { onPress: () => void }) {
  const { palette } = useTheme()
  const pulse = useRef(new Animated.Value(0)).current

  // 은은한 호흡 — 존재감은 주되 산만하지 않게.
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [pulse])

  return (
    <Pressable
      onPress={() => { void hapticLight(); onPress() }}
      accessibilityRole="button"
      accessibilityLabel="시데 AI에게 물어보기"
      style={{
        position: 'absolute',
        right: 16,
        // 네이티브는 하단 지수 펄스(≈36px)를 피해서, 웹은 여백만.
        bottom: Platform.OS === 'web' ? 24 : 52,
        zIndex: 50,
      }}
    >
      {({ pressed }) => (
        <Animated.View
          style={{
            width: 52, height: 52, borderRadius: 26,
            backgroundColor: palette.blue,
            alignItems: 'center', justifyContent: 'center',
            shadowColor: palette.blue, shadowOpacity: 0.45, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
            elevation: 6,
            transform: [
              { scale: pressed ? 0.92 : 1 },
              { translateY: pulse.interpolate({ inputRange: [0, 1], outputRange: [0, -2] }) },
            ],
          }}
        >
          <Sparkles size={23} color="#fff" strokeWidth={2.3} />
        </Animated.View>
      )}
    </Pressable>
  )
}
