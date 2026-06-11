import { memo } from 'react'
import { Platform, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native'
import {
  Bell,
  Clock,
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
  MoverReason,
  NewsSentiment,
  TopMoversResponse,
} from '../types'
import type { MarketPreference } from '../api/alertPreferences'
import {
  formatSignedRate,
  getSessionPalette,
} from '../utils'
import { BriefHero } from './today_parts/BriefHero'
import { NewsHero } from './today_parts/NewsHero'
import { DisclosureCard } from './today_parts/DisclosureCard'
import { EventsCard } from './today_parts/EventsCard'
import { HoldingMonitor } from './today_parts/HoldingMonitor'
import { MarketMoodCard } from './market_parts/MarketMoodCard'
import { TopMoversMarketCard } from './market_parts/TopMoversMarketCard'
import { WatchAlertList } from './market_parts/WatchAlertList'

type Props = {
  summary: MarketSummaryData | null
  positions: HoldingPosition[]
  alertHistory: AlertHistoryItem[]
  fortune: DailyFortune | null
  mediaSummaries: MediaSummaryItem[]
  upcomingEvents: MarketEvent[]
  disclosures: DisclosureItem[]
  // v2: Market 탭 흡수 — 합성위험도/시장 무드 지표/top movers/watch alerts.
  topMovers: TopMoversResponse | null
  moverReasons: MoverReason[]
  marketPreference: MarketPreference
  onOpenDetail: (market: string, ticker: string, name?: string) => void
  refreshing: boolean
  onRefresh: () => Promise<void>
}

// memo: AppShell 재렌더(검색 키스트로크 등)에 끌려 다시 그리지 않도록.
export const TodayTab = memo(function TodayTab({
  summary,
  positions,
  alertHistory,
  fortune,
  mediaSummaries,
  upcomingEvents,
  disclosures,
  topMovers,
  moverReasons,
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

      {/* ── 브리프 Hero — 세션/거래일 상태 아래. 최신 브리프 1건 + 개인화(브리핑) 통합 ── */}
      {(mediaSummaries.length > 0 || summary?.briefing) ? (
        <BriefHero
          items={mediaSummaries}
          briefing={summary?.briefing ?? null}
          onTickerPress={(t) => {
            const isKr = /^\d{6}$/.test(t)
            onOpenDetail(isKr ? 'KR' : 'US', t)
          }}
        />
      ) : null}

      {/* ── 오늘의 뉴스 — 헤드라인 회전(KR/US 번갈아). 브리프 바로 아래로 상단 배치 ── */}
      {(krSentiment || usSentiment) ? (
        <NewsHero sentiments={[krSentiment, usSentiment].filter((s): s is NewsSentiment => !!s)} />
      ) : null}

      {/* ── 오늘 시장 분위기 — 위험도 + 요약 지표 통합, 쉬운 용어 ── */}
      <MarketMoodCard
        krRisk={summary?.compositeRiskKr ?? summary?.compositeRisk ?? null}
        usRisk={summary?.compositeRiskUs ?? summary?.compositeRisk ?? null}
        metrics={filteredMetrics}
        marketPreference={marketPreference}
      />

      {/* ── 보유 종목 모니터 (보유 있는 사용자 최우선) ── */}
      {positions.length > 0 ? (
        <HoldingMonitor monitorTargets={monitorTargets} marketClosedToday={marketClosedToday} />
      ) : null}

      {/* ── 보유 종목 공시 (DART) ── */}
      <DisclosureCard disclosures={disclosures} onOpenDetail={onOpenDetail} />

      {/* AI 추천(단타 픽)은 AI 탭으로 분리 (#6) — 오늘 탭은 오늘 시장/보유 상태만 */}

      {/* ── 시장 발견 (v2): 급등락 — 시장별 1카드(급등|급락 좌우), 프로필별 필터 ── */}
      {showKr && topMovers ? (
        <TopMoversMarketCard topMovers={topMovers} moverReasons={moverReasons} market="KR" onOpenDetail={onOpenDetail} />
      ) : null}
      {showUs && topMovers?.us ? (
        <TopMoversMarketCard topMovers={topMovers} moverReasons={moverReasons} market="US" onOpenDetail={onOpenDetail} />
      ) : null}

      {/* ── 관심종목 알림 (Market 탭에서 흡수) ── */}
      <WatchAlertList alerts={summary?.watchAlerts ?? []} />

      {/* ── 다가오는 이벤트 (FOMC/실적/휴장) ── */}
      <EventsCard events={upcomingEvents} />

      {/* 개인화 브리핑(보유/액션)은 브리프 카드에 통합 — 별도 카드 제거 */}
      {/* 뉴스 sentiment 는 상단 NewsHero(회전 헤드라인)로 이동 — 하단 카드 제거 */}

      {/* ── 최근 받은 알림 (회고) — 모바일은 헤더 종 아이콘으로 대체, 웹에서만 카드 노출 ── */}
      {isWeb && alertHistory.length > 0 ? (
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

      {/* 투자 운세는 탭에서 제외 — 설정/별도 진입 없이 노출 안 함 */}
    </ScrollView>
  )
})
