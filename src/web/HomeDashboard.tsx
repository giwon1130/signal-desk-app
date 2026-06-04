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
import { Sparkles } from 'lucide-react-native'
import { useTheme, type Palette } from '../theme'
import { webGrid } from './shared'
import { GradientCard, Entrance, withAlpha } from './web_effects'
import { SectorPerformanceWidget } from './widgets/SectorPerformanceWidget'
import { CompositeRiskWidget } from './widgets/CompositeRiskWidget'
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
      <Entrance delay={0}>
        <MoodHero summary={props.summary} palette={palette} />
      </Entrance>

      {/* 3-열 위젯 스트립 */}
      <Entrance delay={70}>
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
      </Entrance>

      {/* Sector + 종합 위험도 행 */}
      <Entrance delay={140}>
        <View style={[{ gap: 14 }, webGrid('minmax(0, 1.6fr) minmax(0, 1fr)')]}>
          <SectorPerformanceWidget
            positions={props.positions}
            watchlist={props.watchlist}
            palette={palette}
            onOpenDetail={props.onOpenDetail}
          />
          <CompositeRiskWidget summary={props.summary} palette={palette} />
        </View>
      </Entrance>

      <Entrance delay={210}>
        <PicksRow
          aiRecommendation={props.aiRecommendation}
          palette={palette}
          onOpenDetail={props.onOpenDetail}
        />
      </Entrance>

      <Entrance delay={280}>
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
      </Entrance>
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
    <GradientCard
      radius={16}
      glowColor={palette.purple}
      glowOpacity={0.22}
      images={[
        `linear-gradient(135deg, ${palette.purpleSoft}, ${palette.surface} 62%)`,
        `radial-gradient(circle at 94% 4%, ${withAlpha(palette.purple, 0.20)}, transparent 52%)`,
      ]}
      style={{ borderWidth: 1, borderColor: palette.border, padding: 18 }}
    >
      <View style={[{ gap: 12 }, webGrid('minmax(0, 1fr) auto auto') as object]}>
        <View style={{ gap: 5 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Sparkles size={13} color={palette.purple} strokeWidth={2.5} />
            <Text style={{ color: palette.purple, fontSize: 10, fontWeight: '800', letterSpacing: 2 }}>
              TODAY · MARKET MOOD
            </Text>
          </View>
          <Text style={{ color: palette.ink, fontSize: 23, fontWeight: '900', lineHeight: 29 }}>
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
    </GradientCard>
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
        minWidth: 132,
        paddingHorizontal: 14,
        paddingVertical: 11,
        borderRadius: 12,
        backgroundColor: withAlpha(color, 0.1),
        borderWidth: 1,
        borderColor: withAlpha(color, 0.32),
        alignItems: 'center',
        gap: 2,
      }}
    >
      <Text style={{ color: palette.inkFaint, fontSize: 9, fontWeight: '800', letterSpacing: 1.5 }}>
        {label} SENTIMENT
      </Text>
      <Text style={{ color, fontSize: 30, fontWeight: '900', fontVariant: ['tabular-nums'], lineHeight: 34 }}>
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
