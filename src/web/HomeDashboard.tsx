import { useMemo } from 'react'
import { Linking, Pressable, ScrollView, Text, View } from 'react-native'
import {
  Activity,
  AlertTriangle,
  Brain,
  ExternalLink,
  Newspaper,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react-native'
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
import { marketColor, useTheme, type Palette } from '../theme'
import { formatCompactNumber, formatSignedRate } from '../utils'

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

      <PicksRow
        aiRecommendation={props.aiRecommendation}
        palette={palette}
        onOpenDetail={props.onOpenDetail}
      />

      <View style={[{ gap: 14 }, webGrid('minmax(0, 2fr) minmax(0, 1fr)')]}>
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

/* ── 공통 유틸 ─────────────────────────────────────────── */

// RN-Web 에서 CSS Grid 를 쓰기 위한 스타일 헬퍼. RN StyleSheet 타입엔 없어서 캐스팅.
function webGrid(columns: string): object {
  return {
    display: 'grid',
    gridTemplateColumns: columns,
    // 좁아지면 1열로 접힘 (RN-web 의 display:grid 는 media query 없이 되는 auto-fit 은 별도)
  } as unknown as object
}

function Widget({
  palette, children, title, icon, meta,
}: {
  palette: Palette
  children: React.ReactNode
  title: string
  icon?: React.ReactNode
  meta?: React.ReactNode
}) {
  return (
    <View
      style={{
        backgroundColor: palette.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: palette.border,
        padding: 14,
        gap: 10,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
        {icon}
        <Text style={{ color: palette.ink, fontSize: 13, fontWeight: '800' }}>{title}</Text>
        <View style={{ flex: 1 }} />
        {meta}
      </View>
      {children}
    </View>
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

/* ── PortfolioWidget ──────────────────────────────────── */

function PortfolioWidget({
  portfolio, onOpenDetail, palette,
}: {
  portfolio: PortfolioSummary | null
  onOpenDetail: (m: string, t: string, n?: string) => void
  palette: Palette
}) {
  if (!portfolio || portfolio.positions.length === 0) {
    return (
      <Widget
        palette={palette}
        title="내 포트폴리오"
        icon={<Activity size={13} color={palette.blue} strokeWidth={2.5} />}
      >
        <View style={{ paddingVertical: 18, alignItems: 'center', gap: 4 }}>
          <Text style={{ color: palette.inkMuted, fontSize: 12 }}>보유 종목이 없어</Text>
          <Text style={{ color: palette.inkFaint, fontSize: 11 }}>종목 탭에서 담아봐</Text>
        </View>
      </Widget>
    )
  }
  const top3 = [...portfolio.positions].sort((a, b) => b.evaluationAmount - a.evaluationAmount).slice(0, 3)
  const totalValue = portfolio.totalValue || 1 // 0 divide 가드
  const rate = portfolio.totalProfitRate
  const rateColor = rate >= 0 ? palette.up : palette.down

  return (
    <Widget
      palette={palette}
      title="내 포트폴리오"
      icon={<Activity size={13} color={palette.blue} strokeWidth={2.5} />}
      meta={
        <Text style={{ color: palette.inkFaint, fontSize: 11, fontWeight: '700' }}>
          {portfolio.positions.length}종목
        </Text>
      }
    >
      <View style={{ gap: 4 }}>
        <Text style={{ color: palette.inkMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>
          평가금액
        </Text>
        <Text style={{ color: palette.ink, fontSize: 24, fontWeight: '900', fontVariant: ['tabular-nums'] }}>
          {formatCompactNumber(portfolio.totalValue)}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {rate >= 0 ? (
            <TrendingUp size={12} color={rateColor} strokeWidth={2.5} />
          ) : (
            <TrendingDown size={12} color={rateColor} strokeWidth={2.5} />
          )}
          <Text style={{ color: rateColor, fontSize: 13, fontWeight: '800', fontVariant: ['tabular-nums'] }}>
            {formatSignedRate(rate)}
          </Text>
          <Text style={{ color: rateColor, fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] }}>
            ({formatCompactNumber(portfolio.totalProfit)})
          </Text>
        </View>
      </View>

      <View style={{ gap: 6, marginTop: 4 }}>
        {top3.map((p) => {
          const weight = (p.evaluationAmount / totalValue) * 100
          const pColor = marketColor(palette, p.market, p.profitRate)
          return (
            <Pressable
              key={p.id}
              onPress={() => onOpenDetail(p.market, p.ticker, p.name)}
              style={(state) => {
                const hovered = (state as { hovered?: boolean }).hovered
                return [{
                  paddingHorizontal: 8, paddingVertical: 7, borderRadius: 7,
                  backgroundColor: hovered ? palette.surfaceAlt : 'transparent',
                  gap: 4,
                }]
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text
                  numberOfLines={1}
                  style={{ color: palette.ink, fontSize: 12, fontWeight: '700', flex: 1 }}
                >
                  {p.name}
                </Text>
                <Text style={{ color: palette.inkMuted, fontSize: 10, fontWeight: '700' }}>
                  {weight.toFixed(0)}%
                </Text>
                <Text
                  style={{ color: pColor, fontSize: 12, fontWeight: '800', fontVariant: ['tabular-nums'], minWidth: 58, textAlign: 'right' }}
                >
                  {formatSignedRate(p.profitRate)}
                </Text>
              </View>
              <View style={{ height: 3, borderRadius: 2, backgroundColor: palette.border, overflow: 'hidden' }}>
                <View
                  style={{
                    width: `${Math.max(2, Math.min(100, weight))}%`,
                    height: 3,
                    backgroundColor: palette.blue,
                  }}
                />
              </View>
            </Pressable>
          )
        })}
      </View>
    </Widget>
  )
}

/* ── NewsWidget ───────────────────────────────────────── */

function NewsWidget({ summary, palette }: { summary: MarketSummaryData | null; palette: Palette }) {
  // KR + US 뉴스 하이라이트를 섞어서 한 줄로. 각 마켓 앞에서부터 번갈아가며.
  const items = useMemo(() => {
    if (!summary?.newsSentiments) return []
    const kr = summary.newsSentiments.find((s) => s.market === 'KR')?.highlights ?? []
    const us = summary.newsSentiments.find((s) => s.market === 'US')?.highlights ?? []
    const merged: Array<{ market: 'KR' | 'US'; h: typeof kr[number] }> = []
    const max = Math.max(kr.length, us.length)
    for (let i = 0; i < max; i++) {
      if (kr[i]) merged.push({ market: 'KR', h: kr[i] })
      if (us[i]) merged.push({ market: 'US', h: us[i] })
    }
    return merged.slice(0, 10)
  }, [summary])

  return (
    <Widget
      palette={palette}
      title="시장 뉴스"
      icon={<Newspaper size={13} color={palette.blue} strokeWidth={2.5} />}
      meta={
        <Text style={{ color: palette.inkFaint, fontSize: 11, fontWeight: '700' }}>
          {items.length}건
        </Text>
      }
    >
      {items.length === 0 ? (
        <View style={{ paddingVertical: 18, alignItems: 'center' }}>
          <Text style={{ color: palette.inkMuted, fontSize: 12 }}>뉴스 수집 중…</Text>
        </View>
      ) : (
        items.map((it, i) => (
          <Pressable
            key={`${it.market}-${i}`}
            onPress={() => void Linking.openURL(it.h.url).catch(() => { /* noop */ })}
            style={(state) => {
              const hovered = (state as { hovered?: boolean }).hovered
              return [{
                flexDirection: 'row',
                gap: 8,
                paddingHorizontal: 6, paddingVertical: 7,
                borderRadius: 6,
                backgroundColor: hovered ? palette.surfaceAlt : 'transparent',
              }]
            }}
          >
            <View
              style={{
                width: 6, height: 6, borderRadius: 3, marginTop: 6,
                backgroundColor: toneDotColor(it.h.tone, palette),
              }}
            />
            <View style={{ flex: 1, gap: 2 }}>
              <Text
                numberOfLines={2}
                style={{ color: palette.ink, fontSize: 12, fontWeight: '700', lineHeight: 16 }}
              >
                {it.h.title}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ color: palette.inkFaint, fontSize: 10, fontWeight: '800' }}>
                  {it.market}
                </Text>
                <Text style={{ color: palette.inkMuted, fontSize: 10 }}>{it.h.source}</Text>
              </View>
            </View>
            <ExternalLink size={11} color={palette.inkFaint} />
          </Pressable>
        ))
      )}
    </Widget>
  )
}

function toneDotColor(tone: string, palette: Palette): string {
  if (tone === '긍정') return palette.up
  if (tone === '부정') return palette.down
  return palette.inkMuted
}

/* ── WatchAlertsWidget ────────────────────────────────── */

function WatchAlertsWidget({
  summary, palette, onOpenDetail,
}: {
  summary: MarketSummaryData | null
  palette: Palette
  onOpenDetail: (m: string, t: string, n?: string) => void
}) {
  const alerts = summary?.watchAlerts?.slice(0, 8) ?? []
  return (
    <Widget
      palette={palette}
      title="경보"
      icon={<AlertTriangle size={13} color={palette.orange} strokeWidth={2.5} />}
      meta={
        <Text style={{ color: palette.inkFaint, fontSize: 11, fontWeight: '700' }}>
          {alerts.length}건
        </Text>
      }
    >
      {alerts.length === 0 ? (
        <View style={{ paddingVertical: 18, alignItems: 'center' }}>
          <Text style={{ color: palette.inkMuted, fontSize: 12 }}>주의 신호 없음</Text>
        </View>
      ) : (
        alerts.map((a) => (
          <Pressable
            key={`${a.market}-${a.ticker}-${a.category}-${a.title}`}
            onPress={() => onOpenDetail(a.market, a.ticker, a.name)}
            style={(state) => {
              const hovered = (state as { hovered?: boolean }).hovered
              return [{
                paddingHorizontal: 8, paddingVertical: 7, borderRadius: 7,
                backgroundColor: hovered ? palette.surfaceAlt : 'transparent',
                gap: 2,
              }]
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View
                style={{
                  paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4,
                  backgroundColor:
                    a.severity === 'high' ? palette.redSoft
                    : a.severity === 'medium' ? palette.orangeSoft
                    : palette.surfaceAlt,
                }}
              >
                <Text
                  style={{
                    color:
                      a.severity === 'high' ? palette.red
                      : a.severity === 'medium' ? palette.orange
                      : palette.inkMuted,
                    fontSize: 9,
                    fontWeight: '800',
                    letterSpacing: 0.5,
                  }}
                >
                  {a.severity.toUpperCase()}
                </Text>
              </View>
              <Text
                numberOfLines={1}
                style={{ color: palette.ink, fontSize: 12, fontWeight: '700', flex: 1 }}
              >
                {a.name}
              </Text>
              <Text style={{ color: palette.inkFaint, fontSize: 10, fontWeight: '700' }}>
                {a.category}
              </Text>
            </View>
            <Text
              numberOfLines={1}
              style={{ color: palette.inkMuted, fontSize: 11, fontWeight: '600' }}
            >
              {a.title}
            </Text>
          </Pressable>
        ))
      )}
    </Widget>
  )
}

/* ── PicksRow (AI 추천 + 단타) ─────────────────────────── */

function PicksRow({
  aiRecommendation, palette, onOpenDetail,
}: {
  aiRecommendation: AiRecommendationData | null
  palette: Palette
  onOpenDetail: (m: string, t: string, n?: string) => void
}) {
  const logs = aiRecommendation?.executionLogs?.filter((l) => l.stage?.toUpperCase().includes('RECOMMEND')).slice(0, 10) ?? []

  return (
    <Widget
      palette={palette}
      title="오늘의 AI 추천"
      icon={<Brain size={13} color={palette.purple} strokeWidth={2.5} />}
      meta={
        aiRecommendation?.summary ? (
          <Text
            numberOfLines={1}
            style={{ color: palette.inkMuted, fontSize: 11, fontWeight: '600', maxWidth: 400 }}
          >
            {aiRecommendation.summary}
          </Text>
        ) : null
      }
    >
      {logs.length === 0 ? (
        <View style={{ paddingVertical: 18, alignItems: 'center', gap: 4 }}>
          <Sparkles size={18} color={palette.inkFaint} />
          <Text style={{ color: palette.inkMuted, fontSize: 12 }}>오늘 AI 추천이 아직 없어</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, paddingVertical: 2 }}
        >
          {logs.map((log) => {
            const exp = log.expectedReturnRate
            return (
              <Pressable
                key={`${log.date}-${log.market}-${log.ticker}`}
                onPress={() => onOpenDetail(log.market, log.ticker, log.name)}
                style={(state) => {
                  const hovered = (state as { hovered?: boolean }).hovered
                  return [{
                    width: 220,
                    paddingHorizontal: 12,
                    paddingVertical: 11,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: hovered ? palette.blue : palette.border,
                    backgroundColor: hovered ? palette.blueSoft : palette.bg,
                    gap: 4,
                  }]
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Text style={{ color: palette.inkFaint, fontSize: 9, fontWeight: '800', letterSpacing: 1 }}>
                    {log.market}
                  </Text>
                  <Text style={{ color: palette.inkMuted, fontSize: 10, fontWeight: '700' }}>
                    {log.ticker}
                  </Text>
                  <View style={{ flex: 1 }} />
                  {log.userStatus ? (
                    <Text style={{ color: palette.blue, fontSize: 9, fontWeight: '800' }}>
                      {log.userStatus}
                    </Text>
                  ) : null}
                </View>
                <Text
                  numberOfLines={1}
                  style={{ color: palette.ink, fontSize: 14, fontWeight: '800' }}
                >
                  {log.name}
                </Text>
                <Text
                  numberOfLines={2}
                  style={{ color: palette.inkMuted, fontSize: 11, lineHeight: 15, minHeight: 30 }}
                >
                  {log.rationale || '—'}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
                  {log.confidence != null ? (
                    <Text style={{ color: palette.purple, fontSize: 10, fontWeight: '800' }}>
                      확신 {Math.round(log.confidence * 100)}%
                    </Text>
                  ) : null}
                  {exp != null ? (
                    <Text
                      style={{
                        color: exp >= 0 ? palette.up : palette.down,
                        fontSize: 10,
                        fontWeight: '800',
                      }}
                    >
                      기대 {formatSignedRate(exp)}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            )
          })}
        </ScrollView>
      )}
    </Widget>
  )
}

/* ── TopMoversWidget ──────────────────────────────────── */

function TopMoversWidget({
  topMovers, palette, onOpenDetail,
}: {
  topMovers: TopMoversResponse | null
  palette: Palette
  onOpenDetail: (m: string, t: string, n?: string) => void
}) {
  const sections = [
    { label: 'KOSPI 상승', rows: topMovers?.kospi.gainers?.slice(0, 5) ?? [],  up: true  },
    { label: 'KOSPI 하락', rows: topMovers?.kospi.losers?.slice(0, 5)  ?? [],  up: false },
    { label: 'KOSDAQ 상승', rows: topMovers?.kosdaq.gainers?.slice(0, 5) ?? [], up: true  },
    { label: 'KOSDAQ 하락', rows: topMovers?.kosdaq.losers?.slice(0, 5)  ?? [], up: false },
  ]
  return (
    <Widget
      palette={palette}
      title="오늘의 급등락"
      icon={<TrendingUp size={13} color={palette.teal} strokeWidth={2.5} />}
    >
      <View style={[{ gap: 10 }, webGrid('minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)')]}>
        {sections.map((s) => (
          <View key={s.label} style={{ gap: 3 }}>
            <Text style={{
              color: s.up ? palette.up : palette.down,
              fontSize: 10,
              fontWeight: '800',
              letterSpacing: 0.5,
              paddingBottom: 3,
              borderBottomWidth: 1,
              borderBottomColor: palette.border,
            }}>
              {s.label}
            </Text>
            {s.rows.length === 0 ? (
              <Text style={{ color: palette.inkFaint, fontSize: 10, paddingVertical: 8 }}>—</Text>
            ) : (
              s.rows.map((r) => (
                <Pressable
                  key={`${s.label}-${r.ticker}`}
                  onPress={() => onOpenDetail(r.market, r.ticker, r.name)}
                  style={(state) => {
                    const hovered = (state as { hovered?: boolean }).hovered
                    return [{
                      paddingHorizontal: 4, paddingVertical: 4, borderRadius: 5,
                      backgroundColor: hovered ? palette.surfaceAlt : 'transparent',
                      flexDirection: 'row', alignItems: 'center', gap: 6,
                    }]
                  }}
                >
                  <Text
                    numberOfLines={1}
                    style={{ color: palette.ink, fontSize: 11, fontWeight: '700', flex: 1 }}
                  >
                    {r.name}
                  </Text>
                  <Text style={{
                    color: marketColor(palette, r.market, r.changeRate),
                    fontSize: 11,
                    fontWeight: '800',
                    fontVariant: ['tabular-nums'],
                  }}>
                    {formatSignedRate(r.changeRate)}
                  </Text>
                </Pressable>
              ))
            )}
          </View>
        ))}
      </View>
    </Widget>
  )
}

/* ── AlertTimelineWidget ──────────────────────────────── */

function AlertTimelineWidget({
  history, palette, onOpenDetail,
}: {
  history: AlertHistoryItem[]
  palette: Palette
  onOpenDetail: (m: string, t: string, n?: string) => void
}) {
  const items = history.slice(0, 10)
  return (
    <Widget
      palette={palette}
      title="최근 알림"
      icon={<Target size={13} color={palette.red} strokeWidth={2.5} />}
      meta={
        <Text style={{ color: palette.inkFaint, fontSize: 11, fontWeight: '700' }}>
          {items.length}건
        </Text>
      }
    >
      {items.length === 0 ? (
        <View style={{ paddingVertical: 18, alignItems: 'center' }}>
          <Text style={{ color: palette.inkMuted, fontSize: 12 }}>알림 내역 없음</Text>
        </View>
      ) : (
        items.map((a, i) => {
          const color = a.direction === 'UP' ? palette.up : palette.down
          return (
            <Pressable
              key={`${a.market}-${a.ticker}-${a.sentAt}-${i}`}
              onPress={() => onOpenDetail(a.market, a.ticker, a.name)}
              style={(state) => {
                const hovered = (state as { hovered?: boolean }).hovered
                return [{
                  paddingHorizontal: 6, paddingVertical: 6,
                  borderRadius: 6,
                  backgroundColor: hovered ? palette.surfaceAlt : 'transparent',
                  flexDirection: 'row', alignItems: 'center', gap: 8,
                }]
              }}
            >
              {a.direction === 'UP'
                ? <TrendingUp size={11} color={color} strokeWidth={2.5} />
                : <TrendingDown size={11} color={color} strokeWidth={2.5} />}
              <Text
                numberOfLines={1}
                style={{ color: palette.ink, fontSize: 12, fontWeight: '700', flex: 1 }}
              >
                {a.name}
              </Text>
              <Text style={{ color, fontSize: 11, fontWeight: '800', fontVariant: ['tabular-nums'] }}>
                {formatSignedRate(a.changeRate)}
              </Text>
              <Text style={{ color: palette.inkFaint, fontSize: 10, fontWeight: '600' }}>
                {a.alertDate}
              </Text>
            </Pressable>
          )
        })
      )}
    </Widget>
  )
}
