import { memo } from 'react'
import { ScrollView, Text, View } from 'react-native'
import type {
  AlertHistoryItem,
  HoldingPosition,
  MarketEvent,
  MarketSummaryData,
  MediaSummaryItem,
  MoverReason,
  NewsSentiment,
  PortfolioSummary,
  TopMoversResponse,
  WatchItem,
} from '../types'
import type { MarketPreference } from '../api/alertPreferences'
import { Sparkles } from 'lucide-react-native'
import { useTheme, type Palette } from '../theme'
import { TabIntro } from '../components/guide/TabIntro'
import { webGrid } from './shared'
import { GradientCard, Entrance, withAlpha } from './web_effects'
import { SectorPerformanceWidget } from './widgets/SectorPerformanceWidget'
import { CompositeRiskWidget } from './widgets/CompositeRiskWidget'
import { TopMoversWidget } from './widgets/TopMoversWidget'
import { AlertTimelineWidget } from './widgets/AlertTimelineWidget'
import { WatchAlertsWidget } from './widgets/WatchAlertsWidget'
import { PortfolioWidget } from './widgets/PortfolioWidget'
import { NewsWidget } from './widgets/NewsWidget'
import { BriefHero } from '../tabs/today_parts/BriefHero'
import { SeasonRulesCard } from '../tabs/today_parts/SeasonRulesCard'
import { EventsCard } from '../tabs/today_parts/EventsCard'

/**
 * 웹 전용 홈 대시보드 — 데스크톱 그리드 + 네이티브 v2 카드 재사용.
 *
 * 네이티브 '오늘' 탭 개편(브리프 히어로·시즌 규칙·공시·이벤트)과 동일 콘텐츠를
 * 데스크톱 밀도로 배치. AI 픽은 AI 탭으로 분리(네이티브 #6 원칙과 동일).
 *
 * 레이아웃 (CSS Grid):
 *   row1 full:        MoodHero (헤드라인 + 센티먼트 게이지 — 선호 시장만)
 *   row2 2fr/1fr:     BriefHero(모닝/장중/마감 브리프) / 시즌·이벤트 열
 *   row3 2fr/2fr/1.2fr: Portfolio / News / WatchAlerts
 *   row4 1.6fr/1fr:   SectorPerformance / CompositeRisk
 *   row5 1.6fr/1fr:   TopMovers(사유·선호 반영) / AlertTimeline + 공시
 */

type Props = {
  summary: MarketSummaryData | null
  positions: HoldingPosition[]
  watchlist: WatchItem[]
  alertHistory: AlertHistoryItem[]
  topMovers: TopMoversResponse | null
  portfolio: PortfolioSummary | null
  mediaSummaries: MediaSummaryItem[]
  moverReasons: MoverReason[]
  upcomingEvents: MarketEvent[]
  marketPreference: MarketPreference
  onOpenDetail: (market: string, ticker: string, name?: string) => void
}

// memo: AppShell 재렌더(검색 키스트로크 등)에 끌려 다시 그리지 않도록.
export const HomeDashboard = memo(function HomeDashboard(props: Props) {
  const { palette } = useTheme()
  const showBrief = props.mediaSummaries.length > 0 || !!props.summary?.briefing
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 14, paddingBottom: 20 }}>
      {/* 탭 인트로 — 컴팩트 타이틀, 처음 몇 번만 펼친 설명 (네이티브 탭과 동일) */}
      <TabIntro
        tabKey="web-today"
        icon={Sparkles}
        title="오늘"
        tagline="내 종목·시장을 하루 한눈에"
        description="장 상태, 모닝/장중/마감 브리프, 보유·관심 종목, 시장 지수와 핵심 시그널을 데스크톱 밀도로 모아 보여줘요."
        accent={palette.brandAccent}
      />
      <Entrance delay={0}>
        <MoodHero summary={props.summary} marketPreference={props.marketPreference} palette={palette} />
      </Entrance>

      {/* 브리프 + 시즌/이벤트 열 */}
      <Entrance delay={60}>
        <View style={[{ gap: 14 }, webGrid('minmax(0, 2fr) minmax(0, 1fr)')]}>
          <View style={{ gap: 14 }}>
            {showBrief ? (
              <BriefHero
                items={props.mediaSummaries}
                briefing={props.summary?.briefing ?? null}
                onTickerPress={(t) => {
                  const isKr = /^\d{6}$/.test(t)
                  props.onOpenDetail(isKr ? 'KR' : 'US', t)
                }}
              />
            ) : null}
          </View>
          <View style={{ gap: 14 }}>
            <SeasonRulesCard onOpenDetail={props.onOpenDetail} />
            <EventsCard events={props.upcomingEvents} />
          </View>
        </View>
      </Entrance>

      {/* 3-열 위젯 스트립 */}
      <Entrance delay={120}>
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
      <Entrance delay={180}>
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

      {/* AI 픽은 AI 탭으로 분리 — 홈은 시장/보유 상태에 집중 (네이티브 #6 원칙) */}

      <Entrance delay={240}>
        <View style={[{ gap: 14 }, webGrid('minmax(0, 1.6fr) minmax(0, 1fr)')]}>
          <TopMoversWidget
            topMovers={props.topMovers}
            moverReasons={props.moverReasons}
            marketPreference={props.marketPreference}
            palette={palette}
            onOpenDetail={props.onOpenDetail}
          />
          <View style={{ gap: 14 }}>
            <AlertTimelineWidget
              history={props.alertHistory}
              palette={palette}
              onOpenDetail={props.onOpenDetail}
            />
          </View>
        </View>
      </Entrance>
    </ScrollView>
  )
})

/* ── MoodHero (센티먼트 + 마켓 상태) ───────────────────── */

function MoodHero({ summary, marketPreference, palette }: { summary: MarketSummaryData | null; marketPreference: MarketPreference; palette: Palette }) {
  const showKr = marketPreference !== 'US'
  const showUs = marketPreference !== 'KR'
  const kr = showKr ? summary?.newsSentiments?.find((s) => s.market === 'KR') : undefined
  const us = showUs ? summary?.newsSentiments?.find((s) => s.market === 'US') : undefined
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
        {showKr ? <SentimentGauge label="KR" data={kr ?? null} palette={palette} /> : null}
        {showUs ? <SentimentGauge label="US" data={us ?? null} palette={palette} /> : null}
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
