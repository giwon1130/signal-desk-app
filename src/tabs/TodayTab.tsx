import { memo, useMemo } from 'react'
import { Platform, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native'
import { useLivePrices } from '../hooks/useLivePrices'
import {
  Bell,
  Clock,
  Sparkles,
} from 'lucide-react-native'
import { CollapsibleCard } from '../components/CollapsibleCard'
import { TabIntro } from '../components/guide/TabIntro'
import { useStyles } from '../styles'
import { useTheme } from '../theme'
import type {
  AlertHistoryItem,
  HoldingPosition,
  MarketEvent,
  MarketSummaryData,
  MediaSummaryItem,
  NewsSentiment,
} from '../types'
import type { MarketPreference } from '../api/alertPreferences'
import {
  formatSignedRate,
  getSessionPalette,
} from '../utils'
import { BriefHero } from './today_parts/BriefHero'
import { PreMarketDirectionCard } from './today_parts/PreMarketDirectionCard'
import { NewsHero } from './today_parts/NewsHero'
import { EventsCard } from './today_parts/EventsCard'
import { HoldingMonitor } from './today_parts/HoldingMonitor'
import { SeasonRulesCard } from './today_parts/SeasonRulesCard'
import { Entrance } from '../components/effects'
import { MarketMoodCard } from './market_parts/MarketMoodCard'
import { WatchAlertList } from './market_parts/WatchAlertList'

type Props = {
  summary: MarketSummaryData | null
  positions: HoldingPosition[]
  alertHistory: AlertHistoryItem[]
  mediaSummaries: MediaSummaryItem[]
  upcomingEvents: MarketEvent[]
  // v2: Market 탭 흡수 — 합성위험도/시장 무드 지표/watch alerts. (급등락은 지수 상세 모달로 이동)
  marketPreference: MarketPreference
  onOpenDetail: (market: string, ticker: string, name?: string) => void
  refreshing: boolean
  onRefresh: () => Promise<void>
  onUpgrade?: () => void   // 야간 방향성 PRO 잠금 카드 → PRO 업그레이드 시트
}

// memo: AppShell 재렌더(검색 키스트로크 등)에 끌려 다시 그리지 않도록.
export const TodayTab = memo(function TodayTab({
  summary,
  positions,
  alertHistory,
  mediaSummaries,
  upcomingEvents,
  marketPreference,
  onOpenDetail,
  refreshing,
  onRefresh,
  onUpgrade,
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

  // 보유 종목 모니터 — KR 실시간 시세로 손익 재계산(종목 탭과 % 일치). 손익 절대값 큰 순.
  const liveTickers = useMemo(() => positions.filter((p) => p.market === 'KR').map((p) => p.ticker), [positions])
  const livePrices = useLivePrices(liveTickers)
  const monitorTargets = useMemo(() => positions.map((p) => {
    const lp = p.market === 'KR' ? livePrices[p.ticker] : undefined
    if (!lp || p.buyPrice <= 0) return p
    return { ...p, currentPrice: lp.price, profitRate: ((lp.price - p.buyPrice) / p.buyPrice) * 100 }
  }).sort((a, b) => Math.abs(b.profitRate) - Math.abs(a.profitRate)).slice(0, listLimit),
  [positions, livePrices, listLimit])

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
      {/* 탭 인트로 — 컴팩트 타이틀, 처음 몇 번만 펼친 설명 */}
      <TabIntro
        tabKey="today"
        icon={Sparkles}
        title="오늘"
        tagline="내 종목·시장을 하루 한눈에"
        description="장 세션 상태, 보유·관심 종목 모니터, 시장 지수와 핵심 시그널을 모아 보여줘요. 위에서부터 내 종목 → 시장 순으로 중요한 것부터 정렬돼 있습니다."
        accent={palette.brandAccent}
      />

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

      {/* 정보 우선순위: 내 종목(보유·관심) → 시장 맥락(무드·뉴스) → 읽을거리(브리프) → 시즌·이벤트.
          아침에 "내 종목 어떻게 됐지"가 1순위라 개인·액션 카드를 맨 위로. 무보유/무신호 카드는
          자동으로 미렌더되어 신규 사용자에겐 자연히 브리프가 상단에 온다. */}

      {/* ── 보유 종목 모니터 (내 종목 최우선) ── */}
      {positions.length > 0 ? (
        <Entrance index={0}>
          <HoldingMonitor monitorTargets={monitorTargets} marketClosedToday={marketClosedToday} />
        </Entrance>
      ) : null}

      {/* ── 관심종목 시그널 — 보유 모니터와 묶어 '내 종목' 블록으로 ── */}
      <Entrance index={1}>
        <WatchAlertList alerts={summary?.watchAlerts ?? []} />
      </Entrance>

      {/* ── 오늘 시장 분위기 — 위험도 + 요약 지표 통합, 쉬운 용어 ── */}
      <Entrance index={2}>
        <MarketMoodCard
          krRisk={summary?.compositeRiskKr ?? summary?.compositeRisk ?? null}
          usRisk={summary?.compositeRiskUs ?? summary?.compositeRisk ?? null}
          metrics={filteredMetrics}
          marketPreference={marketPreference}
        />
      </Entrance>

      {/* ── 오늘의 뉴스 — 헤드라인 회전(KR/US 번갈아), 시장 분위기 카드와 한 블록 ── */}
      {(krSentiment || usSentiment) ? (
        <Entrance index={3}>
          <NewsHero sentiments={[krSentiment, usSentiment].filter((s): s is NewsSentiment => !!s)} />
        </Entrance>
      ) : null}

      {/* ── 🌙 야간 방향성 (PRO) — 장 시작 전 한국장 출발 방향 미리보기 ── */}
      {summary?.preMarketDirection ? (
        <Entrance index={3}>
          <PreMarketDirectionCard data={summary.preMarketDirection} onUpgrade={onUpgrade} />
        </Entrance>
      ) : null}

      {/* ── 브리프 Hero — 최신 브리프 1건 + 개인화(브리핑) 통합 ── */}
      {(mediaSummaries.length > 0 || summary?.briefing) ? (
        <Entrance index={4}>
          <BriefHero
            items={mediaSummaries}
            briefing={summary?.briefing ?? null}
            onTickerPress={(t) => {
              const isKr = /^\d{6}$/.test(t)
              onOpenDetail(isKr ? 'KR' : 'US', t)
            }}
          />
        </Entrance>
      ) : null}

      {/* ── 이번 달 시즌 (저장한 시즌 규칙 중 진행 중인 것 — 없으면 미렌더) ── */}
      <SeasonRulesCard onOpenDetail={onOpenDetail} />

      {/* 보유 종목 공시(DART)는 '내 종목 소식'이라 종목 탭으로 이동.
          급등락은 하단 지수 펄스 → 지수 상세 모달로 이동. (오늘 탭은 시장 현황 중심) */}

      {/* ── 다가오는 이벤트 (FOMC/실적/휴장) — 선호 시장만, GLOBAL 은 항상 ── */}
      <EventsCard events={upcomingEvents.filter((e) =>
        e.market === 'GLOBAL' || (e.market === 'KR' ? showKr : showUs),
      )} />

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
