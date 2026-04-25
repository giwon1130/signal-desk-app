/**
 * 웹 UI 공용 프리미티브 — HomeDashboard · StocksPage · ContextSidebar · TickerRibbon 이
 * 공통으로 쓰는 카드 셸/행/뱃지/스파크라인. 각 파일에 Pressable hover 스타일이 흩어져
 * 있던 걸 한 곳에 모아서 일관된 UX + 유지보수 쉽게.
 */
import React, { useMemo } from 'react'
import { Platform, Pressable, Text, View, type PressableStateCallbackType, type StyleProp, type ViewStyle } from 'react-native'
import type { Palette } from '../theme'
import type { ChartPoint } from '../types'
import { formatNumber } from '../utils'

export const CARD_RADIUS = 12
export const CARD_PADDING = 14

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

/** 0.0123 → +1.23% / -0.45% / 0.00% */
export function formatPct(rate: number | null | undefined, digits = 2) {
  if (rate == null || Number.isNaN(rate)) return '—'
  const v = rate * 100
  const sign = v > 0 ? '+' : ''
  return `${sign}${v.toFixed(digits)}%`
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
          padding: dense ? 12 : CARD_PADDING,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        {icon}
        <Text style={{ fontSize: 13, fontWeight: '700', color: palette.ink, flex: 1 }} numberOfLines={1}>
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

// ─────────────────────────── Hoverable Row ──────────────────────────

type HoverRowProps = {
  onPress?: () => void
  palette: Palette
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
  hoverStyle?: StyleProp<ViewStyle>
  padding?: number | { paddingVertical?: number; paddingHorizontal?: number }
  radius?: number
}

export function HoverRow({ onPress, palette, children, style, hoverStyle, padding, radius = 8 }: HoverRowProps) {
  const pad =
    typeof padding === 'number'
      ? { paddingVertical: padding, paddingHorizontal: padding }
      : { paddingVertical: 8, paddingHorizontal: 8, ...(padding ?? {}) }
  return (
    <Pressable
      onPress={onPress}
      style={(state: PressableStateCallbackType) => {
        const hovered = (state as { hovered?: boolean }).hovered
        return [
          {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            borderRadius: radius,
            ...pad,
            backgroundColor: hovered ? palette.surfaceAlt : 'transparent',
          },
          style,
          hovered ? hoverStyle : null,
        ]
      }}
    >
      {children}
    </Pressable>
  )
}

// ─────────────────────────── Empty State ────────────────────────────

export function EmptyState({ palette, message, hint }: { palette: Palette; message: string; hint?: string }) {
  return (
    <View style={{ paddingVertical: 22, alignItems: 'center', gap: 4 }}>
      <Text style={{ color: palette.inkMuted, fontSize: 12, fontWeight: '600' }}>{message}</Text>
      {hint ? <Text style={{ color: palette.inkFaint, fontSize: 11 }}>{hint}</Text> : null}
    </View>
  )
}

// ─────────────────────────── Delta Text ─────────────────────────────

export function Delta({ value, palette, digits = 2, style, showSign = true }: {
  value: number | null | undefined
  palette: Palette
  digits?: number
  style?: any
  showSign?: boolean
}) {
  const color = deltaColor(value, palette)
  const v = value == null || Number.isNaN(value) ? '—' : `${showSign && value > 0 ? '+' : ''}${(value * 100).toFixed(digits)}%`
  return <Text style={[{ color, fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] }, style]}>{v}</Text>
}

// ─────────────────────────── Stance Tag ─────────────────────────────

const STANCE_COLORS: Record<string, { bg: string; fg: string }> = {}
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

// ─────────────────────────── Session Badge ──────────────────────────

export function SessionBadge({ label, isOpen, palette }: { label: string; isOpen: boolean; palette: Palette }) {
  const bg = isOpen ? palette.upSoft : palette.surfaceAlt
  const fg = isOpen ? palette.up : palette.inkMuted
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: bg, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
      <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: fg }} />
      <Text style={{ color: fg, fontSize: 9, fontWeight: '800', letterSpacing: 0.4 }}>{label}</Text>
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
  const { path, areaPath, last, first, trend } = useMemo(() => {
    const values = (Array.isArray(points) ? points : []).map((p: any) =>
      typeof p === 'number' ? p : (p?.close as number)
    ).filter((v): v is number => typeof v === 'number' && !Number.isNaN(v))
    if (values.length < 2) return { path: '', areaPath: '', last: null, first: null, trend: 0 }
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
      first: values[0],
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
