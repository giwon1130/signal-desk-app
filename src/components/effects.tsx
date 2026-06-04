/**
 * 공용 비주얼 이펙트 — 새 의존성 없이 (RN Animated + react-native-svg + expo-haptics).
 * 리그·리딩 화려 개선에 사용.
 */
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native'
import type { StyleProp, ViewStyle } from 'react-native'
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg'
import * as Haptics from 'expo-haptics'

/** 마운트 시 페이드 + 슬라이드업 + 살짝 스케일로 등장. index 로 순차(stagger) 지연. */
export function Entrance({
  index = 0,
  distance = 14,
  duration = 380,
  style,
  children,
}: {
  index?: number
  distance?: number
  duration?: number
  style?: StyleProp<ViewStyle>
  children: ReactNode
}) {
  const v = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.timing(v, {
      toValue: 1,
      duration,
      delay: Math.min(index, 12) * 65, // 너무 길어지지 않게 12개까지만 stagger
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start()
  }, [])
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: v,
          transform: [
            { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) },
            { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  )
}

/** 누르면 살짝 축소 + 햅틱. 터치 피드백용 Pressable 대체. */
export function PressableScale({
  onPress,
  disabled,
  haptic = true,
  scaleTo = 0.96,
  style,
  children,
  accessibilityLabel,
}: {
  onPress?: () => void
  disabled?: boolean
  haptic?: boolean
  scaleTo?: number
  style?: StyleProp<ViewStyle>
  children: ReactNode
  accessibilityLabel?: string
}) {
  const s = useRef(new Animated.Value(1)).current
  const animate = (to: number) =>
    Animated.spring(s, { toValue: to, useNativeDriver: true, speed: 40, bounciness: 0 }).start()
  return (
    <Pressable
      onPressIn={() => {
        animate(scaleTo)
        if (haptic) void Haptics.selectionAsync().catch(() => {})
      }}
      onPressOut={() => animate(1)}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel}
    >
      <Animated.View style={[style, { transform: [{ scale: s }] }]}>{children}</Animated.View>
    </Pressable>
  )
}

/** SVG 선형 그라데이션 배경 (absolute fill). 부모에 borderRadius + overflow:'hidden' 권장. */
export function GradientBackground({
  colors,
  x1 = '0',
  y1 = '0',
  x2 = '1',
  y2 = '1',
  radius = 0,
  style,
}: {
  colors: Array<{ offset: string; color: string; opacity?: number }>
  x1?: string
  y1?: string
  x2?: string
  y2?: string
  radius?: number
  style?: StyleProp<ViewStyle>
}) {
  const id = 'grad' + useId().replace(/:/g, '') // 인스턴스별 고유 id (SVG 충돌 방지)
  return (
    <View
      style={[StyleSheet.absoluteFill, { borderRadius: radius, overflow: 'hidden' }, style]}
      pointerEvents="none"
    >
      <Svg width="100%" height="100%">
        <Defs>
          <SvgLinearGradient id={id} x1={x1} y1={y1} x2={x2} y2={y2}>
            {colors.map((c, i) => (
              <Stop key={i} offset={c.offset} stopColor={c.color} stopOpacity={c.opacity ?? 1} />
            ))}
          </SvgLinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </View>
  )
}

/** 컬러 글로우 그림자 스타일 (iOS shadow + Android elevation). */
export function glow(color: string, radius = 12, opacity = 0.55): ViewStyle {
  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: radius,
    shadowOpacity: opacity,
    elevation: radius,
  }
}

/** 가벼운 햅틱 (탭 전환 등 즉시 피드백). */
export const tapHaptic = () =>
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
