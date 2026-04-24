import { useRef, useState } from 'react'
import { GestureResponderEvent, Pressable, ScrollView, Text, View } from 'react-native'
import Svg, { G, Line, Path, Rect, Text as SvgText } from 'react-native-svg'
import type { ChartPoint } from '../types'
import { buildLinePath, buildMovingAverage, formatCompactNumber } from '../utils'
import { useStyles } from '../styles'
import { useTheme } from '../theme'

/**
 * 지수 캔들 + 거래량 차트.
 *
 * 레이아웃:
 *   ┌──────────┬────────────────────────────────────────┐
 *   │  Y축     │   가로 스크롤 영역 (캔들 + X축 날짜)    │
 *   │  가격    │                                        │
 *   │  라벨    │                                        │
 *   │ (고정)   │                                        │
 *   └──────────┴────────────────────────────────────────┘
 *
 * - 캔들당 22px 고정 → 데이터 많으면 가로 스크롤로 과거 탐색
 * - Y축 가격 라벨 5개 (paddedLow ~ paddedHigh 균등 분할)
 * - X축 날짜는 과밀 방지 위해 최소 48px 간격으로 표시
 */
export function CandleVolumeChart({ points, width }: { points: ChartPoint[]; width: number }) {
  const styles = useStyles()
  const { palette } = useTheme()
  const [selected, setSelected] = useState<number | null>(null)
  const scrollRef = useRef<ScrollView>(null)

  if (!points.length) {
    return (
      <View style={styles.emptyChart}>
        <Text style={styles.metaText}>차트 데이터 없음</Text>
      </View>
    )
  }

  // ── 치수 ────────────────────────────────────────────────────────────────
  const yAxisWidth = 48           // Y축 가격 라벨 고정 영역
  const outerPadding = 8          // 스크롤 영역 내부 좌우 여백
  const topPadding = 8
  const priceHeight = 180
  const volumeHeight = 70
  const xAxisHeight = 20
  const totalHeight = priceHeight + volumeHeight + 14 + xAxisHeight

  const perCandle = 22            // 캔들당 가로 폭 (고정)
  const candleWidth = 10
  const scrollInnerWidth = points.length * perCandle + outerPadding * 2
  // 화면 폭이 전체 컨텐츠보다 크면 전체를 화면에 딱 맞춰서 여백 없이 표시.
  const viewportWidth = Math.max(120, width - yAxisWidth)
  const chartInnerWidth = Math.max(scrollInnerWidth, viewportWidth)

  const low = Math.min(...points.map((item) => item.low))
  const high = Math.max(...points.map((item) => item.high))
  const spread = Math.max(1, high - low)
  const paddedLow = low - spread * 0.05
  const paddedHigh = high + spread * 0.05

  const maxVolume = Math.max(...points.map((item) => item.volume), 1)
  const volumeTop = topPadding + priceHeight + 14
  const xAt = (index: number) => outerPadding + perCandle * index + perCandle * 0.5
  const yAt = (value: number) => topPadding + ((paddedHigh - value) / (paddedHigh - paddedLow)) * priceHeight

  const ma5 = buildMovingAverage(points, 5)
  const ma20 = buildMovingAverage(points, 20)
  const ma60 = buildMovingAverage(points, 60)
  const ma5Path = buildLinePath(ma5, xAt, yAt)
  const ma20Path = buildLinePath(ma20, xAt, yAt)
  const ma60Path = buildLinePath(ma60, xAt, yAt)

  // ── Y축 가격 라벨 (5개 눈금) ────────────────────────────────────────────
  const yTickCount = 5
  const yTicks = Array.from({ length: yTickCount }, (_, i) => {
    const ratio = i / (yTickCount - 1)
    // 위에서 아래로 배열 (ratio 0 → paddedHigh, ratio 1 → paddedLow)
    const value = paddedHigh - (paddedHigh - paddedLow) * ratio
    return { value, y: topPadding + priceHeight * ratio }
  })
  const formatPrice = (v: number) => {
    if (v >= 1000) return v.toFixed(0)
    if (v >= 100) return v.toFixed(1)
    return v.toFixed(2)
  }

  // ── X축 날짜 라벨: 화면 과밀 방지 ─────────────────────────────────────
  // 캔들당 22px 이므로 최소 ~48px 간격 → 3개 캔들마다 라벨 1개 정도 수준.
  const xLabelStep = Math.max(1, Math.ceil(48 / perCandle))
  const xLabelIndices = points
    .map((_, idx) => idx)
    .filter((idx) => idx % xLabelStep === 0 || idx === points.length - 1)

  // ── 탭 → 캔들 선택 ─────────────────────────────────────────────────────
  const handlePress = (event: GestureResponderEvent) => {
    const x = event.nativeEvent.locationX - outerPadding
    if (x < 0 || x > points.length * perCandle) {
      setSelected(null)
      return
    }
    const idx = Math.max(0, Math.min(points.length - 1, Math.floor(x / perCandle)))
    setSelected((prev) => (prev === idx ? null : idx))
  }

  const sel = selected !== null ? points[selected] : null
  const selX = selected !== null ? xAt(selected) : 0
  const isUp = sel ? sel.close >= sel.open : false
  const upColor = '#dc2626'
  const downColor = '#2563eb'

  return (
    <View style={styles.chartWrap}>
      <View style={{ flexDirection: 'row' }}>
        {/* ── 고정 Y축 가격 라벨 ───────────────────────────────────── */}
        <Svg width={yAxisWidth} height={totalHeight}>
          {yTicks.map((tick, i) => (
            <SvgText
              key={`y-${i}`}
              x={yAxisWidth - 4}
              y={tick.y + 3}
              fill={palette.inkMuted}
              fontSize={10}
              fontWeight="600"
              textAnchor="end"
            >
              {formatPrice(tick.value)}
            </SvgText>
          ))}
          {/* 거래량 영역 라벨 */}
          <SvgText x={yAxisWidth - 4} y={volumeTop + 10} fill={palette.inkFaint} fontSize={9} fontWeight="700" textAnchor="end">
            거래량
          </SvgText>
        </Svg>

        {/* ── 스크롤 영역: 캔들 + 가이드선 + X축 ────────────────────── */}
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          onContentSizeChange={(w) => {
            // 가장 최근 캔들이 보이도록 우측 끝으로 스크롤 (초기 진입 시).
            if (w > viewportWidth) {
              scrollRef.current?.scrollToEnd({ animated: false })
            }
          }}
        >
          <Pressable onPress={handlePress}>
            <Svg width={chartInnerWidth} height={totalHeight}>
              <Rect x={outerPadding} y={topPadding} width={chartInnerWidth - outerPadding * 2} height={priceHeight} fill={palette.surfaceAlt} rx={8} />
              <Rect x={outerPadding} y={volumeTop} width={chartInnerWidth - outerPadding * 2} height={volumeHeight} fill={palette.surfaceAlt} rx={8} />

              {/* Y축 가이드선 (Y축 라벨과 같은 높이에 수평선) */}
              {yTicks.map((tick, i) => (
                <Line
                  key={`y-guide-${i}`}
                  x1={outerPadding}
                  x2={chartInnerWidth - outerPadding}
                  y1={tick.y}
                  y2={tick.y}
                  stroke={palette.border}
                  strokeWidth={0.5}
                  opacity={i === 0 || i === yTicks.length - 1 ? 0 : 0.6}
                />
              ))}

              {points.map((item, index) => {
                const x = xAt(index)
                const openY = yAt(item.open)
                const closeY = yAt(item.close)
                const highY = yAt(item.high)
                const lowY = yAt(item.low)
                const up = item.close >= item.open
                const bodyTop = Math.min(openY, closeY)
                const bodyHeight = Math.max(1.5, Math.abs(closeY - openY))
                const volumeBarHeight = (item.volume / maxVolume) * (volumeHeight - 8)
                return (
                  <G key={`${item.label}-${index}`}>
                    <Line x1={x} x2={x} y1={highY} y2={lowY} stroke={up ? upColor : downColor} strokeWidth={1.2} />
                    <Rect
                      x={x - candleWidth * 0.5}
                      y={bodyTop}
                      width={candleWidth}
                      height={bodyHeight}
                      fill={up ? upColor : downColor}
                      rx={1}
                    />
                    <Rect
                      x={x - candleWidth * 0.5}
                      y={volumeTop + volumeHeight - volumeBarHeight}
                      width={candleWidth}
                      height={volumeBarHeight}
                      fill={up ? 'rgba(220,38,38,0.55)' : 'rgba(37,99,235,0.55)'}
                      rx={1}
                    />
                  </G>
                )
              })}

              {ma5Path ? <Path d={ma5Path} stroke="#f59e0b" fill="none" strokeWidth={1.8} /> : null}
              {ma20Path ? <Path d={ma20Path} stroke="#6366f1" fill="none" strokeWidth={1.8} /> : null}
              {ma60Path ? <Path d={ma60Path} stroke="#10b981" fill="none" strokeWidth={1.8} /> : null}

              {/* 선택된 캔들 크로스헤어 */}
              {sel ? (
                <Line
                  x1={selX}
                  x2={selX}
                  y1={topPadding}
                  y2={volumeTop + volumeHeight}
                  stroke={palette.ink}
                  strokeWidth={1}
                  strokeDasharray="3,3"
                  opacity={0.45}
                />
              ) : null}

              {/* X축 날짜 라벨 (스크롤 영역 하단에 붙여서 캔들과 함께 스크롤) */}
              {xLabelIndices.map((idx) => (
                <SvgText
                  key={`x-${idx}`}
                  x={xAt(idx)}
                  y={totalHeight - 6}
                  fill={palette.inkMuted}
                  fontSize={10}
                  fontWeight="600"
                  textAnchor="middle"
                >
                  {points[idx]?.label ?? ''}
                </SvgText>
              ))}
            </Svg>
          </Pressable>
        </ScrollView>
      </View>

      {/* 선택된 캔들 OHLC 패널 */}
      {sel ? (
        <View style={styles.candleTip}>
          <View style={styles.candleTipHeader}>
            <Text style={styles.candleTipLabel}>{sel.label}</Text>
            <Text style={[styles.candleTipChange, { color: isUp ? upColor : downColor }]}>
              {isUp ? '▲' : '▼'} {(((sel.close - sel.open) / sel.open) * 100).toFixed(2)}%
            </Text>
          </View>
          <View style={styles.candleTipRow}>
            <View style={styles.candleTipCell}>
              <Text style={styles.candleTipKey}>시가</Text>
              <Text style={styles.candleTipVal}>{sel.open.toFixed(2)}</Text>
            </View>
            <View style={styles.candleTipCell}>
              <Text style={styles.candleTipKey}>고가</Text>
              <Text style={[styles.candleTipVal, { color: upColor }]}>{sel.high.toFixed(2)}</Text>
            </View>
            <View style={styles.candleTipCell}>
              <Text style={styles.candleTipKey}>저가</Text>
              <Text style={[styles.candleTipVal, { color: downColor }]}>{sel.low.toFixed(2)}</Text>
            </View>
            <View style={styles.candleTipCell}>
              <Text style={styles.candleTipKey}>종가</Text>
              <Text style={styles.candleTipVal}>{sel.close.toFixed(2)}</Text>
            </View>
            <View style={styles.candleTipCell}>
              <Text style={styles.candleTipKey}>거래량</Text>
              <Text style={styles.candleTipVal}>{formatCompactNumber(sel.volume)}</Text>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  )
}
