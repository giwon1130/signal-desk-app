import { Platform, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native'
import {
  Activity,
  Bell,
  Clock,
  Newspaper,
} from 'lucide-react-native'
import { CollapsibleCard } from '../components/CollapsibleCard'
import { useStyles } from '../styles'
import { useTheme } from '../theme'
import type {
  AiRecommendationData,
  AlertHistoryItem,
  DailyFortune,
  DisclosureItem,
  HoldingPosition,
  MarketEvent,
  MarketSummaryData,
  MediaSummaryItem,
} from '../types'
import {
  formatSignedRate,
  getMarketStatusTone,
  formatMarketStatus,
  getSessionPalette,
} from '../utils'
import { BriefingCard } from './today_parts/BriefingCard'
import { DisclosureCard } from './today_parts/DisclosureCard'
import { EventsCard } from './today_parts/EventsCard'
import { FortuneCard } from './today_parts/FortuneCard'
import { HoldingMonitor } from './today_parts/HoldingMonitor'
import { MediaSummaryCard } from './today_parts/MediaSummaryCard'
import { PicksCard } from './today_parts/PicksCard'
import { SentimentCard } from './today_parts/SentimentCard'
import { toneColor } from './today_parts/helpers'

type Props = {
  summary: MarketSummaryData | null
  aiRecommendation: AiRecommendationData | null
  positions: HoldingPosition[]
  alertHistory: AlertHistoryItem[]
  fortune: DailyFortune | null
  mediaSummary: MediaSummaryItem | null
  upcomingEvents: MarketEvent[]
  disclosures: DisclosureItem[]
  onOpenDetail: (market: string, ticker: string, name?: string) => void
  refreshing: boolean
  onRefresh: () => Promise<void>
}

export function TodayTab({
  summary,
  aiRecommendation,
  positions,
  alertHistory,
  fortune,
  mediaSummary,
  upcomingEvents,
  disclosures,
  onOpenDetail,
  refreshing,
  onRefresh,
}: Props) {
  const styles = useStyles()
  const { palette } = useTheme()

  const isWeb = Platform.OS === 'web'
  // 웹(데스크톱)에선 정보 밀도 ↑ — 더 많은 후보/모니터/알림 노출
  const listLimit = isWeb ? 12 : 5

  const krSentiment = summary?.newsSentiments?.find((s) => s.market === 'KR')
  const usSentiment = summary?.newsSentiments?.find((s) => s.market === 'US')

  const picks = aiRecommendation?.executionLogs
    ?.filter((log) => log.stage === 'RECOMMEND')
    ?.slice(0, listLimit) ?? []

  // 단타 후보: 보유 종목 중 손익 ±3% 이내 (액션 가능 구간)
  const monitorTargets = positions
    .filter((p) => Math.abs(p.profitRate) <= 8)
    .slice(0, listLimit)

  const tradingDay = summary?.tradingDayStatus
  const marketClosedToday = !!tradingDay && !tradingDay.krOpen && !tradingDay.usOpen

  return (
    <ScrollView
      style={styles.scroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={[styles.content, isWeb && styles.contentWeb]}
    >
      {/* ── 거래일 상태 배너 (휴장 시 강조) ── */}
      {tradingDay ? (
        <View style={[
          styles.tradingDayBanner,
          isWeb && styles.cardFull,
          marketClosedToday && {
            backgroundColor: tradingDay.isWeekend ? '#fef3c7' : '#fee2e2',
            borderColor: tradingDay.isWeekend ? '#fcd34d' : '#fecaca',
          },
        ]}>
          <Text style={styles.tradingDayBannerHeadline}>{tradingDay.headline}</Text>
          <Text style={styles.tradingDayBannerAdvice}>{tradingDay.advice}</Text>
          {marketClosedToday ? (
            <Text style={styles.tradingDayBannerNext}>다음 거래일: {tradingDay.nextTradingDay}</Text>
          ) : null}
        </View>
      ) : null}

      {/* ── 모닝 브리프 / 시장 종합 (Hero) ── */}
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

      {/* ── 마켓 상태 (한 줄 요약) ── */}
      <View style={styles.todayHeroCard}>
        <View style={styles.cardTitleRow}>
          <Activity size={13} color={palette.blue} strokeWidth={2.5} />
          <Text style={styles.cardEyebrow}>지금 시장</Text>
        </View>
        <Text style={[styles.todayHeroValue, { color: getMarketStatusTone(summary?.marketStatus) }]}>
          {formatMarketStatus(summary?.marketStatus)}
        </Text>
        <Text style={styles.cardNote}>{summary?.summary ?? '-'}</Text>
      </View>

      {/* ── 장 세션 컴팩트 ── */}
      {summary?.marketSessions?.length ? (
        <View style={[styles.todaySessionRow, isWeb && styles.cardFull]}>
          {summary.marketSessions.map((session) => {
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

      {/* ── 보유 종목 모니터 (보유 있는 사용자 최우선) ── */}
      {positions.length > 0 ? (
        <HoldingMonitor monitorTargets={monitorTargets} marketClosedToday={marketClosedToday} />
      ) : null}

      {/* ── 보유 종목 공시 (DART) ── */}
      <DisclosureCard disclosures={disclosures} onOpenDetail={onOpenDetail} />

      {/* ── 오늘의 단타 픽 ── */}
      <PicksCard picks={picks} marketClosedToday={marketClosedToday} />

      {/* ── 다가오는 이벤트 (FOMC/실적/휴장) ── */}
      <EventsCard events={upcomingEvents} />

      {/* ── 개인화 브리핑 ── */}
      {summary?.briefing ? <BriefingCard briefing={summary.briefing} /> : null}

      {/* ── 뉴스 sentiment ── */}
      {(krSentiment || usSentiment) ? (
        <CollapsibleCard
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
