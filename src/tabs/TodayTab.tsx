import { Linking, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native'
import {
  Activity,
  Brain,
  CheckCircle,
  Clock,
  Newspaper,
  Sunrise,
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

  return (
    <ScrollView
      style={styles.scroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={styles.content}
    >
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

      {/* ── 장전 브리핑 ── */}
      {summary?.briefing ? (
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.cardTitleRow}>
              <Sunrise size={14} color="#f59e0b" strokeWidth={2.5} />
              <Text style={styles.cardTitle}>장전 브리핑</Text>
            </View>
            <Text style={styles.metaText}>{summary.briefing.preMarket.length}개 포인트</Text>
          </View>
          <Text style={styles.cardNote}>{summary.briefing.headline}</Text>
          <View style={styles.briefingList}>
            {summary.briefing.preMarket.slice(0, 4).map((item) => (
              <View key={item} style={styles.briefingBulletRow}>
                <CheckCircle size={13} color="#0d9488" strokeWidth={2.5} style={{ marginTop: 3 }} />
                <Text style={styles.briefingItem}>{item}</Text>
              </View>
            ))}
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
        {picks.length === 0 ? (
          <Text style={styles.metaText}>오늘은 추천 후보가 없어. 무리해서 진입하지 말 것.</Text>
        ) : picks.map((p, i) => (
          <View key={`${p.ticker}-${i}`} style={styles.todayPickRow}>
            <View style={styles.todayPickTopLine}>
              <Text style={styles.todayPickName}>{p.name}</Text>
              <View style={styles.todayPickStanceBadge}>
                <Text style={styles.todayPickStanceBadgeText}>{p.stage}</Text>
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
          const advice =
            p.profitRate >= 3 ? '익절 구간 — 분할 매도 고려' :
            p.profitRate <= -3 ? '손절 구간 — 손절 라인 점검' :
            '관찰 구간 — 다음 시그널 기다리기'
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
