import { Platform, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native'
import {
  Activity,
  Bell,
  Brain,
  Clock,
  Newspaper,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react-native'
import { CollapsibleCard } from '../components/CollapsibleCard'
import { useStyles } from '../styles'
import { useTheme } from '../theme'
import type {
  AiRecommendationData,
  AlertHistoryItem,
  DailyFortune,
  HoldingPosition,
  MarketSummaryData,
} from '../types'
import {
  formatPrice,
  formatSignedRate,
  getMarketStatusTone,
  formatMarketStatus,
  getSessionPalette,
} from '../utils'
import { BriefingCard } from './today_parts/BriefingCard'
import { FortuneCard } from './today_parts/FortuneCard'
import { SentimentCard } from './today_parts/SentimentCard'
import { toneColor, userStatusLabel } from './today_parts/helpers'

type Props = {
  summary: MarketSummaryData | null
  aiRecommendation: AiRecommendationData | null
  positions: HoldingPosition[]
  alertHistory: AlertHistoryItem[]
  fortune: DailyFortune | null
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

      {/* ── 개인화 브리핑 ── */}
      {summary?.briefing ? <BriefingCard briefing={summary.briefing} /> : null}

      {/* ── AI 최근 실적 (신뢰도) ── */}
      {aiRecommendation?.metrics ? (
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <TrendingUp size={13} color="#15803d" strokeWidth={2.5} />
            <Text style={styles.cardEyebrow}>AI 최근 {aiRecommendation.metrics.windowDays}일 실적</Text>
          </View>
          <View style={styles.metricsRow}>
            <View style={styles.metricsCell}>
              <Text style={styles.metricsLabel}>적중률</Text>
              <Text style={[styles.metricsValue, { color: aiRecommendation.metrics.hitRate >= 0.5 ? '#15803d' : '#b91c1c' }]}>
                {Math.round(aiRecommendation.metrics.hitRate * 100)}%
              </Text>
              <Text style={styles.metricsSub}>{aiRecommendation.metrics.successCount}/{aiRecommendation.metrics.totalCount}건</Text>
            </View>
            <View style={styles.metricsCell}>
              <Text style={styles.metricsLabel}>평균 수익률</Text>
              <Text style={[styles.metricsValue, { color: aiRecommendation.metrics.averageReturnRate >= 0 ? '#dc2626' : '#2563eb' }]}>
                {formatSignedRate(aiRecommendation.metrics.averageReturnRate)}
              </Text>
              <Text style={styles.metricsSub}>
                최고 {formatSignedRate(aiRecommendation.metrics.bestReturnRate)} · 최저 {formatSignedRate(aiRecommendation.metrics.worstReturnRate)}
              </Text>
            </View>
          </View>
        </View>
      ) : null}

      {/* ── 오늘의 단타 픽 ── */}
      <View style={styles.card}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.cardTitleRow}>
            <Target size={14} color="#dc2626" strokeWidth={2.5} />
            <Text style={styles.cardTitle}>오늘의 단타 픽</Text>
          </View>
          <Text style={styles.metaText}>{picks.length}개 후보</Text>
        </View>
        {marketClosedToday ? (
          <Text style={styles.metaText}>
            지금은 휴장이라 단타 진입은 의미 없어. 다음 거래일 후보 미리 봐두는 용도로만 활용해.
          </Text>
        ) : null}
        {picks.length === 0 ? (
          <Text style={styles.metaText}>오늘은 추천 후보가 없어. 무리해서 진입하지 말 것.</Text>
        ) : picks.map((p, i) => (
          <View key={`${p.ticker}-${i}`} style={styles.todayPickRow}>
            <View style={styles.todayPickTopLine}>
              <Text style={styles.todayPickName}>{p.name}</Text>
              <View style={styles.todayPickHeaderBadges}>
                <View style={[
                  styles.pickUserStatusBadge,
                  p.userStatus === 'HELD'    && styles.pickUserStatusBadgeHeld,
                  p.userStatus === 'WATCHED' && styles.pickUserStatusBadgeWatched,
                  (!p.userStatus || p.userStatus === 'NEW') && styles.pickUserStatusBadgeNew,
                ]}>
                  <Text style={[
                    styles.pickUserStatusBadgeText,
                    p.userStatus === 'HELD'    && styles.pickUserStatusBadgeTextHeld,
                    p.userStatus === 'WATCHED' && styles.pickUserStatusBadgeTextWatched,
                  ]}>
                    {userStatusLabel(p.userStatus)}
                  </Text>
                </View>
                <View style={styles.todayPickStanceBadge}>
                  <Text style={styles.todayPickStanceBadgeText}>{p.stage}</Text>
                </View>
              </View>
            </View>
            <Text style={styles.todayPickMeta}>{p.market} · {p.ticker}{p.confidence ? ` · 확신 ${p.confidence}%` : ''}</Text>
            <Text style={styles.todayPickRationale} numberOfLines={2}>{p.rationale}</Text>
            {p.expectedReturnRate != null ? (
              <Text style={[styles.todayPickReturn, { color: p.expectedReturnRate >= 0 ? '#dc2626' : '#2563eb' }]}>
                기대 수익률 {formatSignedRate(p.expectedReturnRate)}
              </Text>
            ) : null}
          </View>
        ))}
      </View>

      {/* ── 보유 종목 모니터 ── */}
      <View style={styles.card}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.cardTitleRow}>
            <Brain size={14} color="#7c3aed" strokeWidth={2.5} />
            <Text style={styles.cardTitle}>보유 종목 모니터</Text>
          </View>
          <Text style={styles.metaText}>액션 가능한 {monitorTargets.length}건</Text>
        </View>
        {monitorTargets.length === 0 ? (
          <Text style={styles.metaText}>지금 액션이 필요한 종목은 없어.</Text>
        ) : monitorTargets.map((p) => {
          const isProfit = p.profitRate >= 0
          const Icon = isProfit ? TrendingUp : TrendingDown
          const color = isProfit ? '#dc2626' : '#2563eb'
          // 휴리스틱 가이드: +3%↑ 익절 고려, -3%↓ 손절 고려
          // 휴장 중에는 어차피 체결 안 되니까 시나리오만 점검
          const advice = marketClosedToday
            ? (p.profitRate >= 3 ? '휴장 중 — 다음 개장 후 분할 매도 시나리오 점검'
              : p.profitRate <= -3 ? '휴장 중 — 다음 개장 후 손절 라인 재확인'
              : '휴장 중 — 별도 액션 없음')
            : (p.profitRate >= 3 ? '익절 구간 — 분할 매도 고려' :
               p.profitRate <= -3 ? '손절 구간 — 손절 라인 점검' :
               '관찰 구간 — 다음 시그널 기다리기')
          return (
            <View key={`${p.market}-${p.ticker}-${p.id || p.name}`} style={styles.todayMonitorRow}>
              <View style={styles.todayMonitorLeft}>
                <Text style={styles.todayMonitorName}>{p.name}</Text>
                <Text style={styles.todayMonitorMeta}>{p.market} · {p.ticker} · {p.quantity}주</Text>
                <Text style={styles.todayMonitorAdvice}>{advice}</Text>
              </View>
              <View style={styles.todayMonitorRight}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Icon size={13} color={color} strokeWidth={2.5} />
                  <Text style={[styles.todayMonitorRate, { color }]}>{formatSignedRate(p.profitRate)}</Text>
                </View>
                <Text style={styles.todayMonitorPrice}>{formatPrice(p.currentPrice, p.market)}</Text>
              </View>
            </View>
          )
        })}
      </View>

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
