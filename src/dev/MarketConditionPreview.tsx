import { useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import type { MarketCondition, PreMarketDirection } from '../types/market'
import { MarketMoodCard } from '../tabs/market_parts/MarketMoodCard'
import { PreMarketDirectionCard } from '../tabs/today_parts/PreMarketDirectionCard'
import { useTheme } from '../theme'

const base: MarketCondition = {
  market: 'KR', asOf: '2026-10-06T05:00:00Z', rulesVersion: 'PREVIEW_ONLY',
  horizon: 'CURRENT_SESSION', direction: 'MIXED', directionLabel: '흐름 엇갈림',
  riskLevel: 'UNKNOWN', riskLabel: '판단 보류', dataStatus: 'PARTIAL',
  headline: '한국 증시는 주요 지수의 흐름이 엇갈리고 있습니다.',
  summary: '코스피 -1.20% · 코스닥 +2.49%입니다. 지수 등락만으로 개별 종목의 흐름을 단정할 수 없습니다.',
  watchPoints: ['위험을 판단할 최신 자료가 부족합니다. 위험이 낮다는 의미는 아닙니다.', '시장 전체를 한 방향으로 해석하기보다 보유 종목과 업종별 흐름을 확인해 주세요.'],
  evidence: [
    { id: 'sample1', label: '코스피', status: 'OBSERVED', detail: '코스피(화면 점검용) -1.20%', source: 'PREVIEW', observedAt: '2026-10-06T05:00:00Z' },
    { id: 'sample2', label: 'VIX', status: 'MISSING', detail: 'VIX: 자료 미확보 — 위험 판단을 보류했습니다.' },
  ],
}
const premarket: PreMarketDirection = {
  locked: false, status: 'CONFLICTING', rulesVersion: 'PREVIEW_ONLY',
  asOf: '2026-10-05T23:30:00Z', biasLabel: '해외 참고지표가 엇갈리고 있습니다',
  summary: '밤사이 확인된 시장 여건입니다. 오늘 시초가나 장중 상승·하락을 확정하는 전망이 아닙니다.',
  overseas: [{ label: '한국 관련 ETF(샘플)', value: 100, changeRate: .7, observedAt: '2026-10-05T20:00:00Z', source: 'PREVIEW', isProxy: true }],
  coverage: 70, warnings: ['한국 야간선물 실측은 확인되지 않아 제외했습니다.', '실제 투자 판단에 사용하지 않는 화면 점검용 샘플입니다.'],
}

export function MarketConditionPreview() {
  const { palette, toggle } = useTheme()
  const [missing, setMissing] = useState(false)
  const [wide, setWide] = useState(false)
  const condition: MarketCondition = missing ? { ...base, direction: 'UNKNOWN', directionLabel: '판단 보류', dataStatus: 'INSUFFICIENT',
    headline: '한국 시장 흐름을 판단할 최신 자료가 부족합니다.', summary: '자료가 다시 확인되면 안내합니다. 자료 부족은 보합이나 안정 상태를 뜻하지 않습니다.' } : base
  return <ScrollView style={{ flex: 1, backgroundColor: palette.bg }} contentContainerStyle={{ padding: 20, alignItems: 'center' }}>
    <View style={{ width: '100%', maxWidth: wide ? 960 : 420, gap: 16 }}>
      <Text style={{ color: palette.orange, fontSize: 12 }}>개발 전용 샘플 · 실제 시황·계정·주문과 무관합니다</Text>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {[['자료 상태 전환', () => setMissing((v) => !v)], ['화면 폭 전환', () => setWide((v) => !v)], ['테마 전환', toggle]].map(([label, action]) =>
          <Pressable key={String(label)} onPress={action as () => void} style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, backgroundColor: palette.surface, borderRadius: 10 }}>
            <Text style={{ color: palette.ink }}>{String(label)}</Text>
          </Pressable>)}
      </View>
      <MarketMoodCard conditions={[condition, { ...condition, market: 'US', horizon: 'LATEST_OBSERVATION', headline: '미국 시장 자료를 확인하고 있습니다.' }]} marketPreference="BOTH" />
      <PreMarketDirectionCard data={premarket} stats={{ evaluatedCount: 5, correctCount: 5, accuracyPct: null, status: 'INSUFFICIENT_HISTORY', windowSize: 60 }} />
    </View>
  </ScrollView>
}
