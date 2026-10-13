/** Development-only sample. No account, quote, or trading calls. */
import { ScrollView, Text, View } from 'react-native'
import { useTheme } from '../theme'
import { BriefHero } from '../tabs/today_parts/BriefHero'
import { InsightCard } from '../tabs/aitab_widgets/playbook_parts/InsightCard'
import type { MarketInsightData, MediaSummaryItem } from '../types'

const asOf = new Date().toISOString()
const headline = '코스피 3.80% 급락 · 코스닥 1.20% 하락 마감했습니다'
const summary = '국내 주요 지수가 하락했습니다. 당일 보도에서는 외국인 매도세가 증시 약세의 배경으로 부각됐습니다. 외국인 매도세가 이어지는지와 대형주의 낙폭을 함께 살펴볼 필요가 있습니다.'
const source = { source: '샘플 언론사', title: '외국인 매도에 코스피 하락 마감 (화면 점검용)', url: 'https://example.com/market-report', publishedAt: asOf }
const brief: MediaSummaryItem = {
  id: 'preview-market-drivers', source: 'CLOSE_BRIEF', channelTitle: '화면 점검용 샘플',
  videoTitle: '한국장 마감 브리프', videoUrl: '', publishedAt: asOf,
  summary: `${headline}\n\n${summary}`,
  flowAnalysis: `보도에서 짚은 배경 · 외국인 매도: ${source.source} · ${source.title} · ${asOf} — ${source.url}\n당일 기사 제목에 명시된 배경입니다. 주가 변동의 원인으로 확정하지 않습니다.`,
  keyTickers: [], sentiment: 'BEARISH', hasTranscript: false,
}
const insight: MarketInsightData = {
  headline, summary, sentiment: 'BEARISH', keyPoints: [],
  assessment: {
    rulesVersion: 'preview-market-evidence-v5', asOf,
    horizon: 'CURRENT_CONDITIONS_KR_WITH_GLOBAL_CONTEXT', regime: 'PRESSURED', riskLevel: 'ELEVATED',
    coveragePercent: 80, balanceScore: null, headline, conclusion: summary,
    factors: [], evidence: [], newsEvidence: [], warnings: ['실측이 아닌 화면 점검용 샘플입니다.'],
    drivers: [{ id: 'foreign_sell', label: '외국인 매도', summary: '당일 보도에서는 외국인 매도세가 증시 약세의 배경으로 부각됐습니다.',
      watchPoint: '외국인 매도세가 이어지는지 확인할 필요가 있습니다.', kind: 'REPORTED_CONTEXT', basis: 'HEADLINE', sources: [source] }],
  },
}

export function MarketDriversPreview() {
  const { palette } = useTheme()
  return <ScrollView style={{ flex: 1, backgroundColor: palette.bg }} contentContainerStyle={{ alignItems: 'center', padding: 20 }}>
    <View style={{ width: '100%', maxWidth: 720, gap: 24 }}>
      <Text style={{ color: palette.orange, fontSize: 13 }}>화면 점검용 샘플 · 실제 시세·기사·투자 판단이 아닙니다</Text>
      <BriefHero items={[brief]} />
      <InsightCard insight={insight} palette={palette} />
    </View>
  </ScrollView>
}
