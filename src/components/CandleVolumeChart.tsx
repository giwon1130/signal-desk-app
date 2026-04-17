import { Text, View } from 'react-native'
import Svg, { Line, Path, Rect } from 'react-native-svg'
import type { ChartPoint } from '../types'
import { buildLinePath, buildMovingAverage } from '../utils'
import { styles } from '../styles'

export function CandleVolumeChart({ points, width }: { points: ChartPoint[]; width: number }) {
  if (!points.length) {
    return (
      <View style={styles.emptyChart}>
        <Text style={styles.metaText}>차트 데이터 없음</Text>
      </View>
    )
  }

  const outerPadding = 14
  const topPadding = 8
  const priceHeight = 180
  const volumeHeight = 70
  const totalHeight = priceHeight + volumeHeight + 28
  const chartWidth = Math.max(120, width - outerPadding * 2)
  const step = chartWidth / Math.max(1, points.length)
  const candleWidth = Math.max(4, Math.min(14, step * 0.56))

  const low = Math.min(...points.map((item) => item.low))
  const high = Math.max(...points.map((item) => item.high))
  const spread = Math.max(1, high - low)
  const paddedLow = low - spread * 0.05
  const paddedHigh = high + spread * 0.05

  const maxVolume = Math.max(...points.map((item) => item.volume), 1)
  const volumeTop = topPadding + priceHeight + 14
  const xAt = (index: number) => outerPadding + step * index + step * 0.5
  const yAt = (value: number) => topPadding + ((paddedHigh - value) / (paddedHigh - paddedLow)) * priceHeight

  const ma5 = buildMovingAverage(points, 5)
  const ma20 = buildMovingAverage(points, 20)
  const ma60 = buildMovingAverage(points, 60)
  const ma5Path = buildLinePath(ma5, xAt, yAt)
  const ma20Path = buildLinePath(ma20, xAt, yAt)
  const ma60Path = buildLinePath(ma60, xAt, yAt)
  const tickIndices = Array.from(
    new Set([0, Math.floor((points.length - 1) / 2), Math.max(points.length - 1, 0)]),
  )

  return (
    <View style={styles.chartWrap}>
      <Svg width={width} height={totalHeight}>
        <Rect x={outerPadding} y={topPadding} width={chartWidth} height={priceHeight} fill="#f8fafc" rx={8} />
        <Rect x={outerPadding} y={volumeTop} width={chartWidth} height={volumeHeight} fill="#f8fafc" rx={8} />

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
            <View key={`${item.label}-${index}`}>
              <Line
                x1={x}
                x2={x}
                y1={highY}
                y2={lowY}
                stroke={up ? '#dc2626' : '#2563eb'}
                strokeWidth={1.2}
              />
              <Rect
                x={x - candleWidth * 0.5}
                y={bodyTop}
                width={candleWidth}
                height={bodyHeight}
                fill={up ? '#dc2626' : '#2563eb'}
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
            </View>
          )
        })}

        {ma5Path ? <Path d={ma5Path} stroke="#f59e0b" fill="none" strokeWidth={1.8} /> : null}
        {ma20Path ? <Path d={ma20Path} stroke="#6366f1" fill="none" strokeWidth={1.8} /> : null}
        {ma60Path ? <Path d={ma60Path} stroke="#10b981" fill="none" strokeWidth={1.8} /> : null}
      </Svg>
      <View style={styles.chartAxisRow}>
        {tickIndices.map((index) => (
          <Text key={`${points[index]?.label ?? index}-${index}`} style={styles.chartAxisLabel}>
            {points[index]?.label ?? '-'}
          </Text>
        ))}
      </View>
    </View>
  )
}
