import { useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import type { MoverReason, TopMoversResponse } from '../types'
import { useTheme } from '../theme'
import { TopMoversMarketCard } from '../tabs/market_parts/TopMoversMarketCard'
import { TopMoversWidget } from '../web/widgets/TopMoversWidget'

export function MoverContextPreview() {
  const { palette, toggle } = useTheme()
  const [wide, setWide] = useState(false)
  const [failed, setFailed] = useState(false)
  const now = new Date().toISOString()
  const reason: MoverReason = {
    market: 'KR', ticker: '000000', name: '화면 점검용 종목', changeRate: 5.2, direction: 'UP', reason: '',
    context: { asOf: now, rulesVersion: 'PREVIEW_ONLY', status: failed ? 'UNAVAILABLE' : 'EVIDENCE_FOUND',
      summary: failed ? '관련 자료를 불러오지 못했습니다. 가격 변동부터 확인해 주세요.' : '판매·공급계약 관련 공시가 나왔습니다. 계약 규모와 기간을 확인해 주세요.',
      evidence: failed ? [] : [{ kind: 'DISCLOSURE', title: '[화면 점검용] 단일판매·공급계약 체결', source: '샘플 공시', url: 'https://example.com', publishedDate: '2026-10-06', timing: 'DATE_ONLY' },
        { kind: 'NEWS', title: '[화면 점검용] 회사, 인수 계약 보도 사실 아냐', source: '샘플 뉴스', url: 'https://example.com/news', publishedAt: now, timing: 'RELATED_PERIOD' }],
      sourceChecks: [{ source: '뉴스', status: failed ? 'UNAVAILABLE' : 'SUCCESS' }, { source: '공시', status: 'COLLECTED_ONLY' }],
      notes: ['화면 점검용 샘플입니다. 실제 종목이나 투자 판단과 무관합니다.', '관련 자료가 있다는 것만으로 주가 변동의 원인이 확정되지는 않습니다.'] },
  }
  const top: TopMoversResponse = { generatedAt: now, kospi: { gainers: [{ market: 'KR', ticker: '000000', name: reason.name, changeRate: 5.2, price: 10000 }], losers: [] }, kosdaq: { gainers: [], losers: [] } }
  return <ScrollView style={{ flex: 1, backgroundColor: palette.bg }} contentContainerStyle={{ padding: 20, alignItems: 'center' }}>
    <View style={{ width: '100%', maxWidth: wide ? 1080 : 420, gap: 16 }}>
      <Text style={{ color: palette.orange, fontSize: 12 }}>개발 전용 샘플 · 실제 종목·뉴스·계정과 무관합니다</Text>
      <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
        {[['모바일/웹', () => setWide(!wide)], ['조회 실패 전환', () => setFailed(!failed)], ['테마 전환', toggle]].map(([label, action]) =>
          <Pressable key={String(label)} onPress={action as () => void} style={{ padding: 10, minHeight: 44, backgroundColor: palette.surface, borderRadius: 8 }}><Text style={{ color: palette.ink }}>{String(label)}</Text></Pressable>)}
      </View>
      {wide ? <TopMoversWidget topMovers={top} moverReasons={[reason]} marketPreference="KR" palette={palette} onOpenDetail={() => {}} />
        : <TopMoversMarketCard topMovers={top} moverReasons={[reason]} market="KR" defaultCollapsed={false} onOpenDetail={() => {}} />}
    </View>
  </ScrollView>
}
