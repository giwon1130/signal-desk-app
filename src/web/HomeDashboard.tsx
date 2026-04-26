import { ScrollView, Text, View } from 'react-native'
import type {
  AiRecommendationData,
  AlertHistoryItem,
  HoldingPosition,
  MarketSummaryData,
  NewsSentiment,
  PortfolioSummary,
  TopMoversResponse,
  WatchItem,
} from '../types'
import { useTheme, type Palette } from '../theme'
import { webGrid } from './shared'
import { SectorPerformanceWidget } from './widgets/SectorPerformanceWidget'
import { AltSignalsWidget } from './widgets/AltSignalsWidget'
import { TopMoversWidget } from './widgets/TopMoversWidget'
import { AlertTimelineWidget } from './widgets/AlertTimelineWidget'
import { WatchAlertsWidget } from './widgets/WatchAlertsWidget'
import { PortfolioWidget } from './widgets/PortfolioWidget'
import { NewsWidget } from './widgets/NewsWidget'
import { PicksRow } from './widgets/PicksRow'

/**
 * 웹 전용 홈 대시보드 — Phase 2.
 *
 * Today 탭의 모바일 카드 스택 대신, 실제 데스크톱 주식 대시보드처럼
 * 한 화면에 여러 위젯이 동시에 보이는 구조.
 *
 * 레퍼런스: Yahoo Finance home, Toss증권 웹 홈, Investing.com dashboard.
 *
 * 레이아웃 (CSS Grid, 12-col 기준):
 *   row1 full:  MoodHero (센티먼트 게이지 KR+US + 마켓 상태)
 *   row2 2fr/2fr/1.2fr: Portfolio / News / WatchAlerts
 *   row3 full:  PicksRow (AI 추천 + 단타)
 *   row4 2fr/1fr: TopMovers / AlertTimeline
 *
 * 좁아지면 자동으로 컬럼이 접힘 (CSS grid auto-fit).
 */

type Props = {
  summary: MarketSummaryData | null
  aiRecommendation: AiRecommendationData | null
  positions: HoldingPosition[]
  watchlist: WatchItem[]
  alertHistory: AlertHistoryItem[]
  topMovers: TopMoversResponse | null
  portfolio: PortfolioSummary | null
  onOpenDetail: (market: string, ticker: string, name?: string) => void
}

export function HomeDashboard(props: Props) {
  const { palette } = useTheme()
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 14, paddingBottom: 20 }}>
      <MoodHero summary={props.summary} palette={palette} />

      {/* 3-열 위젯 스트립 */}
      <View
        style={[
          { gap: 14 },
          webGrid('minmax(0, 2fr) minmax(0, 2fr) minmax(0, 1.2fr)'),
        ]}
      >
        <PortfolioWidget
          portfolio={props.portfolio}
          onOpenDetail={props.onOpenDetail}
          palette={palette}
        />
        <NewsWidget summary={props.summary} palette={palette} />
        <WatchAlertsWidget summary={props.summary} palette={palette} onOpenDetail={props.onOpenDetail} />
      </View>

      {/* Sector + AltSignals 행 */}
      <View style={[{ gap: 14 }, webGrid('minmax(0, 1.6fr) minmax(0, 1fr)')]}>
        <SectorPerformanceWidget
          positions={props.positions}
          watchlist={props.watchlist}
          palette={palette}
          onOpenDetail={props.onOpenDetail}
        />
        <AltSignalsWidget summary={props.summary} palette={palette} />
      </View>

      <PicksRow
        aiRecommendation={props.aiRecommendation}
        palette={palette}
        onOpenDetail={props.onOpenDetail}
      />

      <View style={[{ gap: 14 }, webGrid('minmax(0, 1.6fr) minmax(0, 1fr)')]}>
        <TopMoversWidget
          topMovers={props.topMovers}
          palette={palette}
          onOpenDetail={props.onOpenDetail}
        />
        <AlertTimelineWidget
          history={props.alertHistory}
          palette={palette}
          onOpenDetail={props.onOpenDetail}
        />
      </View>
    </ScrollView>
  )
}

/* ── MoodHero (센티먼트 + 마켓 상태) ───────────────────── */

function MoodHero({ summary, palette }: { summary: MarketSummaryData | null; palette: Palette }) {
  const kr = summary?.newsSentiments?.find((s) => s.market === 'KR')
  const us = summary?.newsSentiments?.find((s) => s.market === 'US')
  const headline = summary?.summary ?? '오늘의 시장 데이터를 불러오는 중…'
  const status   = summary?.marketStatus ?? ''

  return (
    <View
      style={{
        backgroundColor: palette.surface,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: palette.border,
        padding: 18,
        gap: 12,
        ...(webGrid('minmax(0, 1fr) auto auto') as object),
      }}
    >
      <View style={{ gap: 4 }}>
        <Text style={{ color: palette.inkFaint, fontSize: 10, fontWeight: '800', letterSpacing: 2 }}>
          TODAY · MARKET MOOD
        </Text>
        <Text style={{ color: palette.ink, fontSize: 22, fontWeight: '800', lineHeight: 28 }}>
          {headline}
        </Text>
        {status ? (
          <Text style={{ color: palette.inkMuted, fontSize: 12, fontWeight: '600' }}>
            {status}
          </Text>
        ) : null}
      </View>
      <SentimentGauge label="KR" data={kr ?? null} palette={palette} />
      <SentimentGauge label="US" data={us ?? null} palette={palette} />
    </View>
  )
}

function SentimentGauge({ label, data, palette }: { label: string; data: NewsSentiment | null; palette: Palette }) {
  const score = data?.score ?? 50
  const tone = data?.label ?? '중립'
  // 긍정(>55) 상승색, 부정(<45) 하락색, 중립은 회색
  const color = score > 55 ? palette.up : score < 45 ? palette.down : palette.inkMuted
  return (
    <View
      style={{
        minWidth: 130,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: palette.surfaceAlt,
        borderWidth: 1,
        borderColor: palette.border,
        alignItems: 'center',
        gap: 2,
      }}
    >
      <Text style={{ color: palette.inkFaint, fontSize: 9, fontWeight: '800', letterSpacing: 1.5 }}>
        {label} SENTIMENT
      </Text>
      <Text style={{ color, fontSize: 28, fontWeight: '900', fontVariant: ['tabular-nums'] }}>
        {Math.round(score)}
      </Text>
      <Text style={{ color, fontSize: 11, fontWeight: '800' }}>{tone}</Text>
      {data ? (
        <Text style={{ color: palette.inkMuted, fontSize: 10, marginTop: 2 }}>
          긍 {data.positiveCount} · 중 {data.neutralCount} · 부 {data.negativeCount}
        </Text>
      ) : null}
    </View>
  )
}
