/**
 * 웹 UI 공용 프리미티브 — HomeDashboard · StocksPage · ContextSidebar · TickerRibbon 이
 * 공통으로 쓰는 카드 셸/행/뱃지/스파크라인. 각 파일에 Pressable hover 스타일이 흩어져
 * 있던 걸 한 곳에 모아서 일관된 UX + 유지보수 쉽게.
 */
import React, { useMemo } from 'react'
import { Animated, Easing, Platform, Text, View, type StyleProp, type ViewStyle } from 'react-native'
import type { Palette } from '../theme'
import type { ChartPoint } from '../types'
import { formatNumber } from '../utils'

export const CARD_RADIUS = 14
export const CARD_PADDING = 15

/** 웹 카드 공통 소프트 섀도 — 평면적이던 카드에 은은한 깊이. 라이트/다크 공통(검정 알파). */
export const softShadow: ViewStyle = Platform.OS === 'web'
  ? { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 14, shadowOffset: { width: 0, height: 4 } }
  : {}

/** CSS Grid passthrough (RN-Web). */
export const webGrid = (columns: string, gap = 14): object =>
  Platform.OS === 'web'
    ? ({ display: 'grid', gridTemplateColumns: columns, gap } as unknown as object)
    : ({ flexDirection: 'row', gap } as object)

/** direction 에 따른 색. threshold 0 기준 기본, 필요시 custom. */
export function deltaColor(value: number | null | undefined, palette: Palette, neutralAt = 0) {
  if (value == null || Number.isNaN(value)) return palette.inkMuted
  if (value > neutralAt) return palette.up
  if (value < -neutralAt) return palette.down
  return palette.inkSub
}

// formatNumber 는 utils.ts 로 이전됨 (모바일·웹 공통). 기존 import 호환 위해 re-export.
export { formatNumber }

// ─────────────────────────── Widget Card ────────────────────────────

type WidgetProps = {
  title: string
  meta?: React.ReactNode
  icon?: React.ReactNode
  action?: React.ReactNode
  palette: Palette
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
  bodyStyle?: StyleProp<ViewStyle>
  dense?: boolean
}

export function Widget({ title, meta, icon, action, palette, children, style, bodyStyle, dense }: WidgetProps) {
  return (
    <View
      style={[
        {
          backgroundColor: palette.surface,
          borderRadius: CARD_RADIUS,
          borderWidth: 1,
          borderColor: palette.border,
          padding: dense ? 13 : CARD_PADDING,
          overflow: 'hidden',
        },
        softShadow,
        style,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 12 }}>
        {icon}
        <Text style={{ fontSize: 12, fontWeight: '800', color: palette.ink, flex: 1, letterSpacing: 0.2, textTransform: 'uppercase' }} numberOfLines={1}>
          {title}
        </Text>
        {meta ? (
          <Text style={{ fontSize: 11, color: palette.inkMuted, fontWeight: '600' }}>{meta}</Text>
        ) : null}
        {action}
      </View>
      <View style={bodyStyle}>{children}</View>
    </View>
  )
}

// ─────────────────────────── Skeleton ───────────────────────────────

/** 로딩 자리표시 — 은은한 펄스. 데이터 도착 전 레이아웃이 비지 않게. */
export function Skeleton({ width = '100%', height = 14, radius = 6, style }: { width?: number | string; height?: number; radius?: number; style?: StyleProp<ViewStyle> }) {
  const v = React.useRef(new Animated.Value(0.5)).current
  React.useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: 720, easing: Easing.inOut(Easing.ease), useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(v, { toValue: 0.5, duration: 720, easing: Easing.inOut(Easing.ease), useNativeDriver: Platform.OS !== 'web' }),
    ]))
    loop.start()
    return () => loop.stop()
  }, [v])
  return (
    <Animated.View style={[{ width: width as any, height, borderRadius: radius, backgroundColor: 'rgba(128,128,128,0.18)', opacity: v }, style]} />
  )
}

// ─────────────────────────── Stance Tag ─────────────────────────────

export function stanceTagStyle(stance: string, palette: Palette) {
  const s = (stance || '').toUpperCase()
  if (s.includes('BUY') || s.includes('매수')) return { bg: palette.upSoft, fg: palette.up, label: stance || 'BUY' }
  if (s.includes('SELL') || s.includes('매도')) return { bg: palette.downSoft, fg: palette.down, label: stance || 'SELL' }
  if (s.includes('HOLD') || s.includes('보유') || s.includes('관망')) return { bg: palette.orangeSoft, fg: palette.orange, label: stance || 'HOLD' }
  if (s.includes('WATCH') || s.includes('관심')) return { bg: palette.tealSoft, fg: palette.teal, label: stance || 'WATCH' }
  return { bg: palette.surfaceAlt, fg: palette.inkSub, label: stance }
}

export function StanceTag({ stance, palette, size = 'sm' }: { stance: string | undefined; palette: Palette; size?: 'sm' | 'xs' }) {
  if (!stance) return null
  const { bg, fg, label } = stanceTagStyle(stance, palette)
  const pad = size === 'xs' ? { paddingHorizontal: 5, paddingVertical: 1 } : { paddingHorizontal: 7, paddingVertical: 2 }
  const fs = size === 'xs' ? 9 : 10
  return (
    <View style={{ backgroundColor: bg, borderRadius: 4, ...pad, alignSelf: 'flex-start' }}>
      <Text style={{ color: fg, fontSize: fs, fontWeight: '800', letterSpacing: 0.3 }} numberOfLines={1}>
        {label}
      </Text>
    </View>
  )
}

// ─────────────────────────── Sparkline ──────────────────────────────

type SparkProps = {
  points: ChartPoint[] | number[]
  width?: number
  height?: number
  color?: string
  fillOpacity?: number
  palette: Palette
  showLast?: boolean
}

/**
 * SVG <path> 를 HTML 로 인라인. 웹 전용 — Platform.OS === 'web' 아닐 땐 null 반환.
 * RN-Web 이 View/Text 기반이라 네이티브 SVG 안 써도 되게 순수 DOM 으로 그림.
 */
export function Sparkline({ points, width = 80, height = 26, color, fillOpacity = 0.12, palette, showLast = false }: SparkProps) {
  const { path, areaPath, last, trend } = useMemo(() => {
    const values = (Array.isArray(points) ? points : []).map((p: any) =>
      typeof p === 'number' ? p : (p?.close as number)
    ).filter((v): v is number => typeof v === 'number' && !Number.isNaN(v))
    if (values.length < 2) return { path: '', areaPath: '', last: null, trend: 0 }
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min || 1
    const stepX = width / (values.length - 1)
    const y = (v: number) => height - ((v - min) / range) * height
    const coords = values.map((v, i) => `${(i * stepX).toFixed(1)},${y(v).toFixed(1)}`)
    const p = `M${coords.join(' L')}`
    const a = `${p} L${width.toFixed(1)},${height} L0,${height} Z`
    return {
      path: p,
      areaPath: a,
      last: values[values.length - 1],
      trend: values[values.length - 1] - values[0],
    }
  }, [points, width, height])

  if (!path) {
    return (
      <View style={{ width, height, justifyContent: 'center' }}>
        <Text style={{ fontSize: 9, color: palette.inkFaint }}>—</Text>
      </View>
    )
  }
  if (Platform.OS !== 'web') {
    return <View style={{ width, height }} />
  }
  const stroke = color ?? (trend >= 0 ? palette.up : palette.down)
  return (
    <View style={{ width, height, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      {React.createElement('svg' as any, {
        width,
        height,
        viewBox: `0 0 ${width} ${height}`,
        style: { display: 'block' },
      },
        React.createElement('path' as any, { d: areaPath, fill: stroke, fillOpacity, stroke: 'none' }),
        React.createElement('path' as any, { d: path, fill: 'none', stroke, strokeWidth: 1.4, strokeLinejoin: 'round', strokeLinecap: 'round' }),
      )}
      {showLast && last != null ? (
        <Text style={{ fontSize: 10, color: stroke, fontWeight: '700', fontVariant: ['tabular-nums'] }}>
          {formatNumber(last, last < 100 ? 2 : 0)}
        </Text>
      ) : null}
    </View>
  )
}
