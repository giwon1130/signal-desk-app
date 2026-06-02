import { Platform, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native'
import {
  Bell,
  Clock,
  Newspaper,
} from 'lucide-react-native'
import { CollapsibleCard } from '../components/CollapsibleCard'
import { useStyles } from '../styles'
import { useTheme } from '../theme'
import type {
  AlertHistoryItem,
  DailyFortune,
  DisclosureItem,
  HoldingPosition,
  MarketEvent,
  MarketSummaryData,
  MediaSummaryItem,
  TopMoversResponse,
} from '../types'
import type { MarketPreference } from '../api/alertPreferences'
import {
  formatSignedRate,
  getSessionPalette,
} from '../utils'
import { BriefingCard } from './today_parts/BriefingCard'
import { DisclosureCard } from './today_parts/DisclosureCard'
import { EventsCard } from './today_parts/EventsCard'
import { FortuneCard } from './today_parts/FortuneCard'
import { HoldingMonitor } from './today_parts/HoldingMonitor'
import { MediaSummaryCard } from './today_parts/MediaSummaryCard'
import { SentimentCard } from './today_parts/SentimentCard'
import { toneColor } from './today_parts/helpers'
import { CompositeRiskCard } from './market_parts/CompositeRiskCard'
import { MarketSummaryMetrics } from './market_parts/MarketSummaryMetrics'
import { TopMoversSection } from './market_parts/TopMoversSection'
import { WatchAlertList } from './market_parts/WatchAlertList'

type Props = {
  summary: MarketSummaryData | null
  positions: HoldingPosition[]
  alertHistory: AlertHistoryItem[]
  fortune: DailyFortune | null
  mediaSummary: MediaSummaryItem | null
  upcomingEvents: MarketEvent[]
  disclosures: DisclosureItem[]
  // v2: Market 탭 흡수 — 합성위험도/시장 무드 지표/top movers/watch alerts.
  topMovers: TopMoversResponse | null
  marketPreference: MarketPreference
  onOpenDetail: (market: string, ticker: string, name?: string) => void
  refreshing: boolean
  onRefresh: () => Promise<void>
}

export function TodayTab({
  summary,
  positions,
  alertHistory,
  fortune,
  mediaSummary,
  upcomingEvents,
  disclosures,
  topMovers,
  marketPreference,
  onOpenDetail,
  refreshing,
  onRefresh,
}: Props) {
  const styles = useStyles()
  const { palette } = useTheme()

  const isWeb = Platform.OS === 'web'
  // 웹(데스크톱)에선 정보 밀도 ↑ — 더 많은 후보/모니터/알림 노출
  const listLimit = isWeb ? 12 : 5

  // 시장 선호 — 선택 시장의 정보만 노출 (#5).
  const showKr = marketPreference === 'KR' || marketPreference === 'BOTH'
  const showUs = marketPreference === 'US' || marketPreference === 'BOTH'

  const krSentiment = showKr ? summary?.newsSentiments?.find((s) => s.market === 'KR') : undefined
  const usSentiment = showUs ? summary?.newsSentiments?.find((s) => s.market === 'US') : undefined

  // 단타 후보: 보유 종목 중 손익 ±3% 이내 (액션 가능 구간)
  const monitorTargets = positions
    .filter((p) => Math.abs(p.profitRate) <= 8)
    .slice(0, listLimit)

  const tradingDay = summary?.tradingDayStatus
  const marketClosedToday = !!tradingDay && !tradingDay.krOpen && !tradingDay.usOpen

  // 요약 지표(Fear Meter 글로벌 / KR Heat·Flow Bias KR / US Heat US) 필터.
  const filteredMetrics = (summary?.marketSummary ?? []).filter((m) => {
    const label = m.label
    if (label === 'Fear Meter') return true
    if (label === 'KR Heat' || label === 'Flow Bias') return showKr
    if (label === 'US Heat') return showUs
    return true
  })

  return (
    <ScrollView
      style={styles.scroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={[styles.content, isWeb && styles.contentWeb]}
    >
      {/* ── 브리프 (Hero, 맨 위) — 모닝/장중/마감/이브닝 중 최신 자동 노출 ── */}
      {mediaSummary ? (
        <MediaSummaryCard
          item={mediaSummary}
          defaultCollapsed={false}
          onTickerPress={(t) => {
            const isKr = /^\d{6}$/.test(t)
            onOpenDetail(isKr ? 'KR' : 'US', t)
          }}
        />
      ) : null}

      {/* ── 장 세션 상태 — 선택 시장만 (#5) ── */}
      {summary?.marketSessions?.length ? (
        <View style={[styles.todaySessionRow, isWeb && styles.cardFull]}>
          {summary.marketSessions.filter((s) =>
            (s.market === 'KR' && showKr) || (s.market === 'US' && showUs) || (s.market !== 'KR' && s.market !== 'US'),
          ).map((session) => {
            const tone = getSessionPalette(session.isOpen)
            return (
              <View key={session.market} style={[styles.todaySessionPill, { backgroundColor: tone.backgroundColor }]}>
                <Clock size={11} color={tone.textColor} strokeWidth={2.5} />
                <Text style={[styles.todaySessionLabel, { color: tone.textColor }]}>{session.label}</Text>
                <Text style={[styles.todaySessionStatus, { color: tone.textColor }]}>{session.status}</Text>
              </View>
            )
          })}
        </View>
      ) : null}

      {/* ── 거래일 상태 배너 — 휴장/주말/마감일에만 노출 (장 열린 날은 정보가치 X) ── */}
      {tradingDay && marketClosedToday ? (
        <View style={[
          styles.tradingDayBanner,
          isWeb && styles.cardFull,
          {
            backgroundColor: tradingDay.isWeekend ? palette.orangeSoft : palette.redSoft,
            borderColor: tradingDay.isWeekend ? palette.orange : palette.red,
          },
        ]}>
          <Text style={styles.tradingDayBannerHeadline}>{tradingDay.headline}</Text>
          <Text style={styles.tradingDayBannerAdvice}>{tradingDay.advice}</Text>
          <Text style={styles.tradingDayBannerNext}>다음 거래일: {tradingDay.nextTradingDay}</Text>
        </View>
      ) : null}

      {/* ── 시장 무드 (v2): 합성 위험도 + 요약 지표 ── */}
      <CompositeRiskCard risk={summary?.compositeRisk ?? null} />
      {filteredMetrics.length > 0 ? <MarketSummaryMetrics metrics={filteredMetrics} /> : null}

      {/* ── 보유 종목 모니터 (보유 있는 사용자 최우선) ── */}
      {positions.length > 0 ? (
        <HoldingMonitor monitorTargets={monitorTargets} marketClosedToday={marketClosedToday} />
      ) : null}

      {/* ── 보유 종목 공시 (DART) ── */}
      <DisclosureCard disclosures={disclosures} onOpenDetail={onOpenDetail} />

      {/* AI 추천(단타 픽)은 AI 탭으로 분리 (#6) — 오늘 탭은 오늘 시장/보유 상태만 */}

      {/* ── 시장 발견 (v2): top movers — 프로필별 필터 ── */}
      {showKr && topMovers ? (
        <TopMoversSection topMovers={topMovers} kind="gainers" market="KR" onOpenDetail={onOpenDetail} />
      ) : null}
      {showKr && topMovers ? (
        <TopMoversSection topMovers={topMovers} kind="losers" market="KR" onOpenDetail={onOpenDetail} />
      ) : null}
      {showUs && topMovers?.us ? (
        <TopMoversSection topMovers={topMovers} kind="gainers" market="US" onOpenDetail={onOpenDetail} />
      ) : null}
      {showUs && topMovers?.us ? (
        <TopMoversSection topMovers={topMovers} kind="losers" market="US" onOpenDetail={onOpenDetail} />
      ) : null}

      {/* ── 관심종목 알림 (Market 탭에서 흡수) ── */}
      <WatchAlertList alerts={summary?.watchAlerts ?? []} />

      {/* ── 다가오는 이벤트 (FOMC/실적/휴장) ── */}
      <EventsCard events={upcomingEvents} />

      {/* ── 개인화 브리핑 ── */}
      {summary?.briefing ? <BriefingCard briefing={summary.briefing} /> : null}

      {/* ── 뉴스 sentiment ── */}
      {(krSentiment || usSentiment) ? (
        <CollapsibleCard
          defaultCollapsed
          title={
            <View style={styles.cardTitleRow}>
              <Newspaper size={14} color="#0d9488" strokeWidth={2.5} />
              <Text style={styles.cardTitle}>뉴스 sentiment</Text>
            </View>
          }
          preview={
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              {krSentiment ? (
                <Text style={[styles.todaySentimentLabel, { color: toneColor(krSentiment.label) }]}>
                  🇰🇷 {krSentiment.label} {krSentiment.score}
                </Text>
              ) : null}
              {usSentiment ? (
                <Text style={[styles.todaySentimentLabel, { color: toneColor(usSentiment.label) }]}>
                  🇺🇸 {usSentiment.label} {usSentiment.score}
                </Text>
              ) : null}
            </View>
          }
        >
          <Text style={styles.metaText}>오늘 헤드라인 기반</Text>
          {krSentiment ? <SentimentCard sentiment={krSentiment} /> : null}
          {usSentiment ? <SentimentCard sentiment={usSentiment} /> : null}
        </CollapsibleCard>
      ) : null}

      {/* ── 최근 받은 알림 (회고) ── */}
      {alertHistory.length > 0 ? (
        <CollapsibleCard
          defaultCollapsed
          title={
            <View style={styles.cardTitleRow}>
              <Bell size={14} color="#ea580c" strokeWidth={2.5} />
              <Text style={styles.cardTitle}>최근 받은 알림</Text>
            </View>
          }
          preview={<Text style={styles.metaText}>{alertHistory.length}건</Text>}
        >
          {alertHistory.slice(0, isWeb ? 15 : 5).map((a, i) => {
            const isUp = a.direction === 'UP'
            const color = isUp ? '#dc2626' : '#2563eb'
            return (
              <Pressable
                key={`${a.ticker}-${a.sentAt}-${i}`}
                onPress={() => onOpenDetail(a.market, a.ticker, a.name)}
                style={styles.todayMonitorRow}
              >
                <View style={styles.todayMonitorLeft}>
                  <Text style={styles.todayMonitorName}>{a.name}</Text>
                  <Text style={styles.todayMonitorMeta}>{a.market} · {a.ticker} · {a.alertDate}</Text>
                </View>
                <View style={styles.todayMonitorRight}>
                  <Text style={[styles.todayMonitorRate, { color }]}>
                    {isUp ? '↑' : '↓'} {formatSignedRate(a.changeRate)}
                  </Text>
                </View>
              </Pressable>
            )
          })}
        </CollapsibleCard>
      ) : null}

      {/* ── 오늘의 투자 운세 (재미용 — 맨 아래) ── */}
      {fortune ? <FortuneCard fortune={fortune} /> : null}
    </ScrollView>
  )
}
