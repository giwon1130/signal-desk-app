import { useEffect, useRef } from 'react'
import { Animated, ViewStyle } from 'react-native'
import { useTheme } from '../theme'

type Props = {
  width?: number | string
  height?: number
  borderRadius?: number
  style?: ViewStyle
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 8, style }: Props) {
  const { palette } = useTheme()
  const opacity = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.75, duration: 750, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3,  duration: 750, useNativeDriver: true }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [])

  return (
    <Animated.View
      style={[
        { width: width as any, height, borderRadius, backgroundColor: palette.skeleton, opacity },
        style,
      ]}
    />
  )
}

/** 카드 스타일 스켈레톤 (홈/시장 탭에서 자주 씀) */
export function SkeletonCard({ height = 80 }: { height?: number }) {
  const { palette } = useTheme()
  return (
    <Animated.View style={{
      borderRadius: 14, borderWidth: 1, borderColor: palette.border,
      backgroundColor: palette.surfaceAlt, padding: 14, gap: 8,
    }}>
      <Skeleton width="60%" height={14} />
      <Skeleton width="40%" height={20} />
      <Skeleton width="80%" height={12} />
    </Animated.View>
  )
}
