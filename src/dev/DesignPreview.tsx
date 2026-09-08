/** EXPO_PUBLIC_DESIGN_PREVIEW=1 개발 전용. 실제 계정·주문·시세 호출 없이 UI를 점검한다. */
import { useState } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { Sparkles, Sunrise, BarChart3 } from 'lucide-react-native'
import { ThemeProvider, useTheme } from '../theme'
import { NativeShellChrome } from '../components/NativeShellChrome'
import { TabIntro } from '../components/guide/TabIntro'
import { TodayFocusCard } from '../tabs/today_parts/TodayFocusCard'
import { HoldingMonitor } from '../tabs/today_parts/HoldingMonitor'
import { Playbook } from '../tabs/aitab_widgets/Playbook'
import { PortfolioSection } from '../tabs/stocks_parts/PortfolioSection'
import { LeagueTab } from '../tabs/LeagueTab'
import { ReadingTab } from '../tabs/ReadingTab'
import type { AiPick, HoldingPosition, MarketSessionStatus, TabKey } from '../types'

const generatedAt = new Date().toISOString()
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
    market: 'KR', ticker: '000000', name: '근거를 확인할 후보', reason: '순매수 수급과 완만한 가격 움직임을 함께 확인한 샘플이야. 실제 종목 추천은 아니야.', expectedReturnRate: null, confidence: 75,
    riskNote: '거래량과 변동성 이력이 없어 추가 확인이 필요해', changeRate: 2.4, flowTag: '외인 순매수',
    assessment: { decision: 'REVIEW', reasons: ['기준가와 당일 등락률을 확인했어'], blockers: [], rulesVersion: 'review-v1' },
    tradePlan: { proposalId: 'preview-only', side: 'BUY', orderType: 'LIMIT', currency: 'KRW', referencePrice: 100000, entryLimitPrice: 100000, stopLossPrice: 97500, takeProfitPrice: 105000, riskLevel: 'MEDIUM', maxPositionPercent: 5, expiresAt: new Date(Date.now() + 1800000).toISOString(), executable: false, guardrails: ['손절 2.5%·목표 5%의 예시 시나리오이며 예상 수익률이 아니야', '주문 직전 시세 신선도·장 시간·호가 단위를 다시 확인'] },
  },
  {
    market: 'US', ticker: 'WAIT', name: '가격 안정을 기다릴 후보', reason: '당일 가격이 크게 움직여 관찰 중인 샘플이야.', expectedReturnRate: null, confidence: 95,
    riskNote: '당일 6% 이상 상승해 추격 위험을 먼저 확인해야 해', changeRate: 8.1,
    assessment: { decision: 'WATCH', reasons: ['기준가와 당일 등락률을 확인했어'], blockers: ['추격 위험'], rulesVersion: 'review-v1' },
  },
]

function Preview() {
  const { palette, toggle } = useTheme()
  const [activeTab, setActiveTab] = useState<TabKey>('today')
  const [notice, setNotice] = useState('샘플 화면 · 계정 연결과 실제 주문 없음')
  const [watch, setWatch] = useState(false)
  const previewAction = () => setNotice('미리보기야 · 실제 데이터는 변경하지 않았어')
  const chrome = { isUp: true, lastSyncedAt: '10:20', marketPreference: 'BOTH' as const, unreadAlertCount: 2, activeTab, onOpenAlerts: previewAction, onOpenSettings: toggle, onTabChange: setActiveTab }
  return (
    <SafeAreaView style={{ flex: 1, width: '100%', maxWidth: 440, alignSelf: 'center', backgroundColor: palette.bg }}>
      <NativeShellChrome {...chrome} />
      <Text style={{ color: palette.orange, backgroundColor: palette.orangeSoft, fontSize: 11, padding: 8, textAlign: 'center' }}>{notice} · 설정 버튼: 테마 전환</Text>
      {activeTab === 'league' ? <LeagueTab authToken={null} onOpenLeague={previewAction} onCreateLeague={previewAction} onRequestJoin={previewAction} />
        : activeTab === 'reading' ? <ReadingTab authToken={null} onCompose={previewAction} /> : (
        <ScrollView key={activeTab} contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 60 }}>
          <TabIntro tabKey={'preview-' + activeTab} title={activeTab === 'today' ? '오늘' : activeTab === 'stocks' ? '내 종목' : 'AI 인사이트'} tagline={activeTab === 'ai' ? '추천보다 근거를 먼저, 판단은 차분하게' : '오늘의 흐름과 나의 기준을 한눈에'} description="실제 컴포넌트에 샘플 데이터를 넣은 개발 전용 화면이야." icon={activeTab === 'today' ? Sunrise : activeTab === 'stocks' ? BarChart3 : Sparkles} accent={palette.teal} autoExpandTimes={0} />
          {activeTab === 'today' ? <>
            <TodayFocusCard sessions={sessions} positionsCount={2} alertCount={3} isPremarketWindow={false} hasBrief onOpenSection={previewAction} />
            <HoldingMonitor monitorTargets={positions} sessions={sessions} onOpenDetail={previewAction} />
          </> : activeTab === 'stocks' ? (
            <PortfolioSection portfolio={{ totalCost: 0, totalValue: 0, totalProfit: 0, totalProfitRate: 0, positions }} liveOf={(_m, _t, price) => ({ price, changeRate: 0, live: false })} onImportPress={previewAction} onOpenDetail={previewAction} />
          ) : <Playbook aiPicks={{ generatedAt, summary: '시장 소음보다 확인된 근거에 집중해봐', picks }} summary={null} watchlist={watch ? [{ id: 'preview', market: 'KR', ticker: '000000', name: '샘플', price: 100000, changeRate: 2.4, sector: '', stance: 'WATCH', note: '', source: 'PREVIEW' }] : []} marketInsight={{ headline: '차분하게 기회를 살펴볼 시간', summary: '미리보기 데이터야. 투자 판단에 사용하지 마.', sentiment: 'NEUTRAL', keyPoints: ['장 상태 확인', '보유 종목 대응 기준 확인'] }} palette={palette} onOpenDetail={previewAction} onQuickAddWatch={async () => setWatch(true)} />}
        </ScrollView>
      )}
      <NativeShellChrome {...chrome} placement="navigation" />
    </SafeAreaView>
  )
}

export default function DesignPreview() {
  return <SafeAreaProvider style={{ backgroundColor: '#152b32' }}><ThemeProvider><Preview /></ThemeProvider></SafeAreaProvider>
}
