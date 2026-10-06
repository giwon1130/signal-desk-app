/** EXPO_PUBLIC_DESIGN_PREVIEW=1 개발 전용. 실제 계정·주문·시세 호출 없이 UI를 점검한다. */
import { useState } from 'react'
import { MarketConditionPreview } from './MarketConditionPreview'
import { MoverContextPreview } from './MoverContextPreview'
import { UsMarketPreview } from './UsMarketPreview'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { Sparkles, Sunrise, BarChart3 } from 'lucide-react-native'
import { ThemeProvider, useTheme } from '../theme'
import { NativeShellChrome } from '../components/NativeShellChrome'
import { TabIntro } from '../components/guide/TabIntro'
import { TodayFocusCard } from '../tabs/today_parts/TodayFocusCard'
import { HoldingMonitor } from '../tabs/today_parts/HoldingMonitor'
import { BriefHero } from '../tabs/today_parts/BriefHero'
import { WatchAlertList } from '../tabs/market_parts/WatchAlertList'
import { IndexPulse } from '../components/IndexPulse'
import { Playbook } from '../tabs/aitab_widgets/Playbook'
import { PortfolioSection } from '../tabs/stocks_parts/PortfolioSection'
import { LeagueTab } from '../tabs/LeagueTab'
import { ReadingTab } from '../tabs/ReadingTab'
import { WebLayout } from '../web/WebLayout'
import { HomeDashboard } from '../web/HomeDashboard'
import { StocksPage } from '../web/StocksPage'
import { AIWorkspace } from '../web/AIWorkspace'
import type { AiPick, HoldingPosition, MarketInsightData, MarketSessionStatus, MediaSummaryItem, TabKey } from '../types'

const generatedAt = new Date().toISOString()
const sampleBrief: MediaSummaryItem = {
  id: 'preview-brief', source: 'CLOSE_BRIEF', channelTitle: '화면 점검용 샘플',
  videoTitle: '한국장 마감 브리프', videoUrl: '', publishedAt: generatedAt,
  summary: '긍정 요인과 부담 요인이 엇갈리고 있습니다\n\n반도체 관련 흐름은 국내 시장에 힘을 보태고 있습니다. 반면 미국 금리 흐름은 주식시장에 부담이 될 수 있습니다. 방향이 뚜렷해질 때까지 장중 흐름을 함께 확인할 필요가 있습니다.',
  flowAnalysis: '반도체 관련 흐름: 우호적인 조건입니다. 화면 점검용 샘플이며 실측값이 아닙니다.\n미국 금리: 샘플 지표가 높아져 주식시장 부담 요인으로 표시했습니다.\n야간선물: 검증 가능한 최신 자료가 없어 이번 판단에서 제외했습니다.\n뉴스: 확인된 기사가 없다면 상승·하락 원인을 추정하지 않습니다.',
  keyTickers: [], sentiment: 'NEUTRAL', hasTranscript: false,
}
const marketInsight: MarketInsightData = {
  headline: '긍정 요인과 부담 요인이 엇갈리고 있습니다',
  summary: '반도체 관련 흐름은 국내 시장에 힘을 보태고 있습니다. 반면 미국 금리 흐름은 주식시장에 부담으로 작용하고 있습니다. 방향이 뚜렷해질 때까지 장중 흐름을 조금 더 확인할 필요가 있습니다.',
  sentiment: 'NEUTRAL',
  keyPoints: ['반도체 동행 지표: 우호적인 조건을 보여주고 있습니다. 샘플 반도체 ETF +1.50% · 실측 아님',
    '미 국채 10년물: 샘플 4.30%, 이전 관측 대비 +10.00bp · 일간 공표치(실시간 아님)',
    '한국 야간선물: 검증된 시세 피드가 연결되지 않아 방향 판단에서 제외했습니다.',
    '관측 시각이 없는 수급·월간 지표는 단기 판단에서 제외했습니다. 이 비중은 적중률을 의미하지 않습니다.'],
  assessment: {
    rulesVersion: 'preview-market-evidence-v1', asOf: generatedAt,
    horizon: 'CURRENT_CONDITIONS_KR_WITH_GLOBAL_CONTEXT', regime: 'MIXED', riskLevel: 'ELEVATED',
    coveragePercent: 75, balanceScore: null, headline: '긍정 요인과 부담 요인이 엇갈립니다', conclusion: '방향이 확인될 때까지 무리한 진입은 피하는 편이 좋습니다.',
    factors: [], evidence: [{ id: 'DGS10', label: '미 국채 10년물', source: 'FRED:DGS10', sourceUrl: 'https://fred.stlouisfed.org/series/DGS10',
      observedAt: null, observationDate: null, status: 'DELAYED', value: 4.3, change: 10, unit: 'BASIS_POINTS', detail: '실측 아닌 화면 점검용 샘플' }],
    warnings: ['화면 점검용 샘플이며 실제 투자 판단에 사용하면 안 됩니다.'], newsEvidence: [],
  },
}
const sessions: MarketSessionStatus[] = [
  { market: 'KR', label: '한국', phase: 'REGULAR', status: 'OPEN', isOpen: true, localTime: '10:20', note: '샘플' },
  { market: 'US', label: '미국', phase: 'CLOSED', status: 'CLOSED', isOpen: false, localTime: '21:20', note: '샘플' },
]
const positions: HoldingPosition[] = [
  { id: 'sample-1', market: 'KR', ticker: '005930', name: '샘플 한국 종목', buyPrice: 70000, currentPrice: 66500, quantity: 10, profitRate: -5, profitAmount: -35000, evaluationAmount: 665000, source: 'PREVIEW', targetPrice: 75000, stopLossPrice: 67000 },
  { id: 'sample-2', market: 'US', ticker: 'DEMO', name: '샘플 미국 종목', buyPrice: 120, currentPrice: 128, quantity: 5, profitRate: 6.67, profitAmount: 40, evaluationAmount: 640, source: 'PREVIEW', targetPrice: 128, stopLossPrice: 115 },
]
const picks: AiPick[] = [
  {
    market: 'KR', ticker: '000000', name: '근거를 확인할 후보', reason: '순매수 수급과 완만한 가격 움직임을 함께 확인한 샘플입니다. 실제 종목 추천이 아닙니다.', expectedReturnRate: null, confidence: 75,
    riskNote: '거래량과 변동성 이력이 없어 추가 확인이 필요합니다.', changeRate: 2.4, flowTag: '외인 순매수',
    assessment: { decision: 'REVIEW', reasons: ['기준가와 당일 등락률을 확인했습니다.'], blockers: [], rulesVersion: 'review-v1' },
    tradePlan: { proposalId: 'preview-only', side: 'BUY', orderType: 'LIMIT', currency: 'KRW', referencePrice: 100000, entryLimitPrice: 100000, stopLossPrice: 97500, takeProfitPrice: 105000, riskLevel: 'MEDIUM', maxPositionPercent: 5, expiresAt: new Date(Date.now() + 1800000).toISOString(), executable: false, guardrails: ['손절 2.5%·목표 5%의 예시 시나리오이며 예상 수익률이 아닙니다.', '주문 직전 시세 신선도·장 시간·호가 단위를 다시 확인해야 합니다.'] },
  },
  {
    market: 'US', ticker: 'WAIT', name: '가격 안정을 기다릴 후보', reason: '당일 가격이 크게 움직여 관찰 중인 샘플입니다.', expectedReturnRate: null, confidence: 95,
    riskNote: '당일 6% 이상 상승해 추격 위험을 먼저 확인해야 합니다.', changeRate: 8.1,
    assessment: { decision: 'WATCH', reasons: ['기준가와 당일 등락률을 확인했습니다.'], blockers: ['추격 위험'], rulesVersion: 'review-v1' },
  },
]

function Preview() {
  const { palette, toggle } = useTheme()
  const [activeTab, setActiveTab] = useState<TabKey>('today')
  const [notice, setNotice] = useState('샘플 화면 · 계정 연결과 실제 주문 없음')
  const [watch, setWatch] = useState(false)
  const [briefVariant, setBriefVariant] = useState<'normal' | 'stale' | 'missing'>('normal')
  const brief = briefVariant === 'stale' ? { ...sampleBrief, id: 'preview-stale', publishedAt: new Date(Date.now() - 48 * 3600000).toISOString() }
    : briefVariant === 'missing' ? { ...sampleBrief, id: 'preview-missing', sentiment: 'NEUTRAL' as const, summary: '시장 판단을 잠시 보류합니다\n\n검증된 자료가 충분하지 않습니다.', flowAnalysis: '' } : sampleBrief
  const previewAction = () => setNotice('미리보기입니다 · 실제 데이터는 변경하지 않았습니다')
  const chrome = { isUp: true, lastSyncedAt: '10:20', marketPreference: 'BOTH' as const, unreadAlertCount: 2, activeTab, onOpenAlerts: previewAction, onOpenSettings: toggle, onTabChange: setActiveTab }
  return (
    <SafeAreaView style={{ flex: 1, width: '100%', maxWidth: 440, alignSelf: 'center', backgroundColor: palette.bg }}>
      <NativeShellChrome {...chrome} />
      <Text style={{ color: palette.orange, backgroundColor: palette.orangeSoft, fontSize: 11, padding: 8, textAlign: 'center' }}>{notice} · 설정 버튼: 테마 전환</Text>
      {activeTab === 'league' ? <LeagueTab authToken={null} onOpenLeague={previewAction} onCreateLeague={previewAction} onRequestJoin={previewAction} />
        : activeTab === 'reading' ? <ReadingTab authToken={null} onCompose={previewAction} /> : (
        <ScrollView key={activeTab} contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 60 }}>
          <TabIntro tabKey={'preview-' + activeTab} title={activeTab === 'today' ? '오늘' : activeTab === 'stocks' ? '내 종목' : 'AI 분석'} tagline={activeTab === 'ai' ? '추천보다 근거를 먼저, 판단은 차분하게' : '오늘의 흐름과 나의 기준을 한눈에'} description="실제 컴포넌트에 샘플 데이터를 넣은 개발 전용 화면입니다." icon={activeTab === 'today' ? Sunrise : activeTab === 'stocks' ? BarChart3 : Sparkles} accent={palette.teal} autoExpandTimes={0} />
          {activeTab === 'today' ? <>
            <TodayFocusCard sessions={sessions} positionsCount={2} alertCount={0} isPremarketWindow={false} hasBrief onOpenSection={previewAction} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {(['normal', 'stale', 'missing'] as const).map((variant) => <Pressable key={variant} accessibilityRole="button" accessibilityState={{ selected: variant === briefVariant }} onPress={() => setBriefVariant(variant)} style={{ flex: 1, minHeight: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 10, backgroundColor: variant === briefVariant ? palette.greenSoft : palette.surface }}>
                <Text style={{ color: palette.ink, fontSize: 12 }}>{variant === 'normal' ? '일반 샘플' : variant === 'stale' ? '이전 자료' : '자료 부족'}</Text>
              </Pressable>)}
            </View>
            <BriefHero items={[brief]} />
            <HoldingMonitor monitorTargets={positions} sessions={sessions} onOpenDetail={previewAction} />
            <WatchAlertList alerts={[]} />
          </> : activeTab === 'stocks' ? (
            <PortfolioSection portfolio={{ totalCost: 0, totalValue: 0, totalProfit: 0, totalProfitRate: 0, positions }} liveOf={(_m, _t, price) => ({ price, changeRate: 0, live: false })} onImportPress={previewAction} onOpenDetail={previewAction} />
          ) : <Playbook aiPicks={{ generatedAt, summary: '화면 점검용 후보입니다. 실제 투자 판단에 사용하지 마세요.', picks }} summary={null} watchlist={watch ? [{ id: 'preview', market: 'KR', ticker: '000000', name: '샘플', price: 100000, changeRate: 2.4, sector: '', stance: 'WATCH', note: '', source: 'PREVIEW' }] : []} marketInsight={marketInsight} palette={palette} onOpenDetail={previewAction} onQuickAddWatch={async () => setWatch(true)} />}
        </ScrollView>
      )}
      <IndexPulse marketPreference="BOTH" onPress={previewAction} sections={{ generatedAt, koreaMarket: { market: 'KR', title: '한국 샘플', indices: [{ label: '코스피(샘플)', value: 2800, changeRate: 0.72, periods: [] }, { label: '코스닥(샘플)', value: 850, changeRate: -0.38, periods: [] }] }, usMarket: { market: 'US', title: '미국 샘플', indices: [{ label: '나스닥(샘플)', value: 19000, changeRate: 1.2, periods: [] }] } }} />
      <NativeShellChrome {...chrome} placement="navigation" />
    </SafeAreaView>
  )
}

function WebPreview() {
  const { palette } = useTheme()
  const [activeTab, setActiveTab] = useState<TabKey>('today')
  const [marketPreference, setMarketPreference] = useState<'KR' | 'US' | 'BOTH'>('BOTH')
  const [notice, setNotice] = useState('웹 화면 점검용 샘플 · 계정 연결과 실제 주문 없음')
  const previewAction = () => setNotice('미리보기입니다. 실제 계정이나 데이터는 변경하지 않았습니다.')
  // US 샘플만 전달해 국내 종목 실시간 시세 구독도 발생하지 않게 한다.
  const portfolio = { totalCost: 600, totalValue: 640, totalProfit: 40, totalProfitRate: 6.67, positions: positions.filter((p) => p.market === 'US') }
  return <WebLayout user={{ nickname: '화면 점검' }} activeTab={activeTab} isUp lastSyncedAt="샘플"
    onTabChange={setActiveTab} onLogout={previewAction} onOpenReminder={previewAction}
    onOpenSettings={() => setNotice('설정·개인 연동 진입 확인 · 샘플에서는 연결 키를 생성하지 않습니다.')}
    onOpenAlerts={() => setNotice('알림함 진입 확인 · 샘플 알림은 없습니다.')}
    onOpenIndex={(_market, label) => setNotice(`${label} 지수 상세 진입 확인`)}
    marketPreference={marketPreference} onMarketPreferenceChange={setMarketPreference}
    sections={{ generatedAt, koreaMarket: { market: 'KR', title: '한국 샘플', indices: [{ label: '코스피(샘플)', value: 2800, changeRate: 0.72, periods: [] }] }, usMarket: { market: 'US', title: '미국 샘플', indices: [{ label: '나스닥(샘플)', value: 19000, changeRate: 1.2, periods: [] }] } }}
    watchlist={[]} portfolio={portfolio} aiRecommendation={null} onOpenDetail={previewAction}>
    <Text style={{ color: palette.orange, backgroundColor: palette.orangeSoft, padding: 10, fontSize: 12 }}>{notice}</Text>
    {activeTab === 'today' ? <HomeDashboard summary={null} positions={positions} watchlist={[]} alertHistory={[]}
      topMovers={null} portfolio={portfolio} mediaSummaries={[sampleBrief]} moverReasons={[]} upcomingEvents={[]}
      marketPreference={marketPreference} onOpenDetail={previewAction} />
      : activeTab === 'stocks' ? <StocksPage watchlist={[]} portfolio={portfolio} stockSearch="" stockMarketFilter="ALL"
        stockResults={[]} stockSearchLoading={false} favoriteDeletingId="" bulkDeleting={false} disclosures={[]}
        onStockSearchChange={previewAction} onStockMarketFilterChange={previewAction} onOpenDetail={previewAction}
        onQuickAddWatch={async () => previewAction()} onDeleteFavorite={previewAction} onDeleteAllFavorites={previewAction} />
        : activeTab === 'ai' ? <AIWorkspace aiRecommendation={null} summary={null} watchlist={[]}
          aiPicks={{ generatedAt, summary: '화면 점검용 샘플입니다.', picks }} hiddenSignals={null} marketInsight={marketInsight}
          marketPreference={marketPreference} onOpenDetail={previewAction} onQuickAddWatch={async () => previewAction()} onOpenAssistant={previewAction} />
          : <Text style={{ color: palette.ink }}>이 탭은 이번 웹 레이아웃 점검 범위가 아닙니다.</Text>}
  </WebLayout>
}

export default function DesignPreview() {
  const usData = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('view') === 'us-data'
  const movers = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('view') === 'movers'
  const indicators = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('view') === 'indicators'
  const web = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('view') === 'web'
  return <SafeAreaProvider style={{ backgroundColor: '#152b32' }}><ThemeProvider>{usData ? <UsMarketPreview /> : movers ? <MoverContextPreview /> : indicators ? <MarketConditionPreview /> : web ? <WebPreview /> : <Preview />}</ThemeProvider></SafeAreaProvider>
}
