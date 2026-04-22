import { Linking, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native'
import {
  Activity,
  Brain,
  Clock,
  Newspaper,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react-native'
import { useStyles } from '../styles'
import { useTheme } from '../theme'
import type {
  AiRecommendationData,
  HoldingPosition,
  MarketSummaryData,
  NewsSentiment,
  UserPickStatus,
} from '../types'
import {
  formatCompactNumber,
  formatSignedRate,
  getMarketStatusTone,
  getSessionPalette,
} from '../utils'

type Props = {
  summary: MarketSummaryData | null
  aiRecommendation: AiRecommendationData | null
  positions: HoldingPosition[]
  refreshing: boolean
  onRefresh: () => Promise<void>
}

const toneColor = (tone: string) =>
  tone === '긍정' ? '#dc2626' : tone === '부정' ? '#2563eb' : '#94a3b8'

const slotLabel = (slot: string | undefined) => {
  switch (slot) {
    case 'PRE_MARKET': return '장 전'
    case 'INTRADAY':   return '장 중'
    case 'POST_MARKET': return '마감 후'
    case 'WEEKEND':    return '주말'
    case 'HOLIDAY':    return '휴장'
    default:           return '오늘'
  }
}

const userStatusLabel = (status: UserPickStatus | undefined) => {
  switch (status) {
    case 'HELD':    return '보유'
    case 'WATCHED': return '관심'
    default:        return '신규'
  }
}

const priorityColor = (priority: string) => {
  switch (priority) {
    case 'high':   return '#dc2626'
    case 'medium': return '#f59e0b'
    default:       return '#94a3b8'
  }
}

function SentimentCard({ sentiment }: { sentiment: NewsSentiment }) {
  const styles = useStyles()
  const { palette } = useTheme()
  const accent = sentiment.label === '긍정' ? '#dc2626' : sentiment.label === '부정' ? '#2563eb' : palette.inkMuted
  const bar = Math.max(2, Math.min(100, sentiment.score))

  return (
    <View style={styles.todaySentimentCard}>
      <View style={styles.todaySentimentHead}>
        <Text style={styles.todaySentimentMarket}>{sentiment.market === 'KR' ? '🇰🇷 한국' : '🇺🇸 미국'}</Text>
        <Text style={[styles.todaySentimentLabel, { color: accent }]}>{sentiment.label}</Text>
        <Text style={[styles.todaySentimentScore, { color: accent }]}>{sentiment.score}</Text>
      </View>
      <View style={styles.todaySentimentBarTrack}>
        <View style={[styles.todaySentimentBarFill, { width: `${bar}%`, backgroundColor: accent }]} />
      </View>
      <View style={styles.todaySentimentMetaRow}>
        <Text style={styles.todaySentimentMeta}>긍정 {sentiment.positiveCount}</Text>
        <Text style={styles.todaySentimentMeta}>중립 {sentiment.neutralCount}</Text>
        <Text style={styles.todaySentimentMeta}>부정 {sentiment.negativeCount}</Text>
      </View>
      <Text style={styles.todaySentimentRationale}>{sentiment.rationale}</Text>
      {sentiment.highlights.slice(0, 3).map((h, i) => (
        <Pressable
          key={`${sentiment.market}-${i}`}
          onPress={() => h.url && void Linking.openURL(h.url)}
          style={styles.todayHeadlineRow}
        >
          <View style={[styles.todayHeadlineDot, { backgroundColor: toneColor(h.tone) }]} />
          <Text style={styles.todayHeadlineText} numberOfLines={2}>{h.title}</Text>
          <Text style={styles.todayHeadlineSource}>{h.source}</Text>
        </Pressable>
      ))}
    </View>
  )
}

export function TodayTab({
  summary,
  aiRecommendation,
  positions,
  refreshing,
  onRefresh,
}: Props) {
  const styles = useStyles()
  const { palette } = useTheme()

  const krSentiment = summary?.newsSentiments?.find((s) => s.market === 'KR')
  const usSentiment = summary?.newsSentiments?.find((s) => s.market === 'US')

  const picks = aiRecommendation?.executionLogs
    ?.filter((log) => log.stage === 'RECOMMEND')
    ?.slice(0, 5) ?? []

  // 단타 후보: 보유 종목 중 손익 ±3% 이내 (액션 가능 구간)
  const monitorTargets = positions
    .filter((p) => Math.abs(p.profitRate) <= 8)
    .slice(0, 5)

  const tradingDay = summary?.tradingDayStatus
  const marketClosedToday = !!tradingDay && !tradingDay.krOpen && !tradingDay.usOpen

  return (
    <ScrollView
      style={styles.scroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={styles.content}
    >
      {/* ── 거래일 상태 배너 (휴장 시 강조) ── */}
      {tradingDay ? (
        <View style={[
          styles.tradingDayBanner,
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
          {summary?.marketStatus ?? '-'}
        </Text>
        <Text style={styles.cardNote}>{summary?.summary ?? '-'}</Text>
      </View>

      {/* ── 장 세션 컴팩트 ── */}
      {summary?.marketSessions?.length ? (
        <View style={styles.todaySessionRow}>
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
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.cardTitleRow}>
              <Newspaper size={14} color="#0d9488" strokeWidth={2.5} />
              <Text style={styles.cardTitle}>뉴스 sentiment</Text>
            </View>
            <Text style={styles.metaText}>오늘 헤드라인 기반</Text>
          </View>
          {krSentiment ? <SentimentCard sentiment={krSentiment} /> : null}
          {usSentiment ? <SentimentCard sentiment={usSentiment} /> : null}
        </View>
      ) : null}

      {/* ── 개인화 브리핑 ── */}
      {summary?.briefing ? (
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.cardTitleRow}>
              <Sparkles size={14} color={palette.blue} strokeWidth={2.5} />
              <Text style={styles.cardTitle}>오늘의 브리핑</Text>
            </View>
            <View style={styles.briefingSlotBadge}>
              <Text style={styles.briefingSlotBadgeText}>{slotLabel(summary.briefing.slot)}</Text>
            </View>
          </View>

          <Text style={styles.briefingNarrative}>{summary.briefing.narrative || summary.briefing.headline}</Text>

          {summary.briefing.context ? (
            <View style={styles.briefingContextRow}>
              {summary.briefing.context.holdingPnlLabel ? (
                <View style={styles.briefingContextChip}>
                  <Text style={styles.briefingContextChipLabel}>보유</Text>
                  <Text style={[
                    styles.briefingContextChipValue,
                    (summary.briefing.context.holdingPnlRate ?? 0) >= 0
                      ? { color: '#dc2626' }
                      : { color: '#2563eb' },
                  ]}>
                    {summary.briefing.context.holdingPnlLabel}
                  </Text>
                </View>
              ) : null}
              <View style={styles.briefingContextChip}>
                <Text style={styles.briefingContextChipLabel}>관심 신호</Text>
                <Text style={styles.briefingContextChipValue}>{summary.briefing.context.watchlistAlertCount}</Text>
              </View>
              <View style={styles.briefingContextChip}>
                <Text style={styles.briefingContextChipLabel}>분위기</Text>
                <Text style={styles.briefingContextChipValue}>{summary.briefing.context.marketMood}</Text>
              </View>
              {summary.briefing.context.keyEvent ? (
                <View style={styles.briefingContextChip}>
                  <Text style={styles.briefingContextChipLabel}>이벤트</Text>
                  <Text style={styles.briefingContextChipValue}>{summary.briefing.context.keyEvent}</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {summary.briefing.actionItems?.length ? (
            <View style={styles.briefingActionList}>
              {summary.briefing.actionItems.map((action, idx) => (
                <View key={`${action.ticker ?? 'noticker'}-${idx}`} style={styles.briefingActionRow}>
                  <View style={[styles.briefingActionBar, { backgroundColor: priorityColor(action.priority) }]} />
                  <View style={styles.briefingActionBody}>
                    <Text style={styles.briefingActionTitle}>{action.title}</Text>
                    <Text style={styles.briefingActionDetail} numberOfLines={2}>{action.detail}</Text>
                    {action.ticker ? (
                      <Text style={styles.briefingActionMeta}>
                        {action.market ?? ''}{action.market && action.ticker ? ' · ' : ''}{action.ticker}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          ) : null}
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
                <Text style={styles.todayMonitorPrice}>{formatCompactNumber(p.currentPrice)}</Text>
              </View>
            </View>
          )
        })}
      </View>
    </ScrollView>
  )
}
