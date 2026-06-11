/**
 * 웹 전용 비주얼 이펙트 — 모바일 effects.tsx 의 "화려한 느낌"(그라데이션 히어로·코너 글로우·
 * 진입 애니메이션)을 RN-Web 환경에 맞춰 재현.
 *
 * 모바일은 react-native-svg(LinearGradient)·expo-haptics 를 쓰지만, 웹 코드는 그 의존을
 * 피하고(번들·web 호환) 순수 DOM(div + CSS linear/radial-gradient) + RN Animated 로만 구현.
 * 색은 전부 palette 토큰 기반 → 라이트/다크 두 테마에 자동 적응.
 */
import React, { useEffect, useRef } from 'react'
import { Animated, Easing, Platform, View, type ViewStyle } from 'react-native'

/** #rrggbb → rgba(). 잘못된 입력이면 원본 그대로. */
export function withAlpha(hex: string, alpha: number): string {
  const m = (hex || '').replace('#', '')
  if (m.length !== 6) return hex
  const r = parseInt(m.slice(0, 2), 16)
  const g = parseInt(m.slice(2, 4), 16)
  const b = parseInt(m.slice(4, 6), 16)
  if ([r, g, b].some(Number.isNaN)) return hex
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/** 색 글로우 — RN shadow props(웹에선 RN-Web 이 box-shadow 로 변환). overflow:hidden 에도 안 잘림. */
export function glow(color: string, opacity = 0.4, radius = 18): ViewStyle {
  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation: 8,
  }
}

/** 절대 배치 그라데이션/글로우 레이어(웹 전용 raw div). 부모는 relative+overflow:hidden 가정. */
export function GradientLayer({ image, opacity = 1 }: { image: string; opacity?: number }) {
  if (Platform.OS !== 'web') return null
  return React.createElement('div', {
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundImage: image,
      opacity,
      pointerEvents: 'none',
      zIndex: 0,
    },
  })
}

type GradientCardProps = {
  /** CSS gradient 문자열 배열 — 뒤로 갈수록 위에 레이어드(예: 베이스 linear + 코너 radial 글로우). */
  images: string[]
  /** 카드 외곽 글로우 색(옵션). */
  glowColor?: string
  glowOpacity?: number
  radius?: number
  style?: ViewStyle
  children: React.ReactNode
}

/**
 * 그라데이션 배경 + (옵션)코너 글로우 + 외곽 글로우를 가진 카드 셸.
 * 콘텐츠를 zIndex:1 래퍼로 감싸 그라데이션 레이어 위로 올린다(스태킹 보정).
 */
export function GradientCard({ images, glowColor, glowOpacity, radius = 14, style, children }: GradientCardProps) {
  return (
    <View
      style={[
        { position: 'relative', overflow: 'hidden', borderRadius: radius },
        glowColor ? glow(glowColor, glowOpacity) : null,
        style,
      ]}
    >
      {Platform.OS === 'web'
        ? images.map((img, i) => <GradientLayer key={i} image={img} />)
        : null}
      <View style={{ position: 'relative', zIndex: 1 }}>{children}</View>
    </View>
  )
}

/** 진입 시 fade + 살짝 떠오름. delay 로 스태거(위젯 순차 등장). */
export function Entrance({
  children,
  delay = 0,
  distance = 10,
  duration = 420,
  style,
}: {
  children: React.ReactNode
  delay?: number
  distance?: number
  duration?: number
  style?: ViewStyle
}) {
  const v = useRef(new Animated.Value(0)).current
  useEffect(() => {
    const anim = Animated.timing(v, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    })
    anim.start()
    return () => anim.stop()
  }, [v, delay, duration])
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: v,
          transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  )
}
