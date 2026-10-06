/** Development fixture only: never uses accounts, live market data or order endpoints. */
import { useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { useTheme } from '../theme'
import { ChartSection } from '../tabs/market_parts/ChartSection'
import { PickCard } from '../tabs/aitab_widgets/playbook_parts/PickCard'
import { EventsCard } from '../tabs/today_parts/EventsCard'
import type { ChartPeriodSnapshot, PeriodKey } from '../types'

const period: ChartPeriodSnapshot = {
  key: 'D', label: '일봉', source: '화면 점검용 샘플 · 실측 아님', asOf: '20261005', priceBasis: 'PREVIEW',
  note: '미 동부 거래일 기준 표시 예시입니다. 미확정 봉은 최종 종가가 아닙니다.',
  points: [
    { label: '10/01', date: '20261001', open: 100, high: 104, low: 99, close: 102, volume: 10000 },
    { label: '10/02', date: '20261002', open: 102, high: 104, low: 100, close: 101, volume: 12000 },
    { label: '10/05', date: '20261005', open: 101, high: 106, low: 100, close: 105, volume: 15000, provisional: true },
  ],
  stats: { latest: 105, high: 106, low: 99, changeRate: 3.96, range: 7, averageVolume: 12333 },
}

export function UsMarketPreview() {
  const { palette } = useTheme()
  const [compact, setCompact] = useState(false)
  const [available, setAvailable] = useState(false)
  const [selected, setSelected] = useState<PeriodKey>('D')
  const width = compact ? 390 : 1060
  const index = { label: '미국 지수 (샘플)', value: 105, changeRate: 3.96, periods: [period] }
  return <ScrollView style={{ backgroundColor: palette.bg }} contentContainerStyle={{ padding: 16, alignItems: 'center' }}>
    <View style={{ width, maxWidth: '100%', gap: 16 }}>
      <Text style={{ color: palette.orange, fontSize: 14 }}>개발 전용 샘플 · 실제 시황·계정·주문과 무관합니다</Text>
      <View style={{ flexDirection: 'row', gap: 16 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="화면 폭 전환" onPress={() => setCompact(!compact)}><Text style={{ color: palette.teal }}>화면 폭 전환</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="실적 자료 상태 전환" onPress={() => setAvailable(!available)}><Text style={{ color: palette.teal }}>실적 자료 상태 전환</Text></Pressable>
      </View>
      <ChartSection activeSection={{ market: 'US', title: '미국 시장 샘플', indices: [index] }}
        activeIndex={index} activePeriod={period} chartMarket="US" chartPeriod={selected} selectedIndexLabel={index.label}
        chartWidth={width - 48} onChartMarketChange={() => {}} onChartPeriodChange={setSelected} onSelectedIndexLabelChange={() => {}} />
      <PickCard palette={palette} generatedAt={new Date().toISOString()} inWatch={false} onOpenDetail={() => {}} onQuickAdd={async () => {}}
        pick={{ market: 'US', ticker: 'SAMPLE', name: '화면 점검용 후보', reason: '최근 종가는 20일 평균 가격 위에 있습니다.', expectedReturnRate: null, confidence: 0,
          riskNote: '샘플 자료입니다. 실제 투자 판단에 사용하지 마세요.', tradePlan: null,
          assessment: { decision: 'WATCH', reasons: ['최근 종가는 20일 평균 가격 위에 있습니다.', '거래량이 이전 20일 평균보다 적어 관찰합니다.'], blockers: ['샘플'], rulesVersion: 'preview', analysisDate: '2026-10-05',
            metrics: { movingAverage20: 100, momentum20Percent: 4, dailyVolatilityPercent: 2, averageTurnover20: 10000000, completedVolumeRatio: .8 } } }} />
      <EventsCard events={[]} earningsStatus={available ? 'AVAILABLE' : 'UNAVAILABLE'} />
    </View>
  </ScrollView>
}
