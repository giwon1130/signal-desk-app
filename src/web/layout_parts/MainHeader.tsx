/**
 * 데스크톱 메인 컬럼 상단 헤더 — 활성 탭 라벨 + 설명 + 시장 칩 + 마지막 동기화.
 */
import { Text, View } from 'react-native'
import { useTheme } from '../../theme'
import type { TabKey } from '../../types'
import type { MarketPreference } from '../../api/alertPreferences'
import { MarketProfileChip } from '../../components/MarketProfileChip'
import { ADMIN_TAB, TABS } from './tabs-config'

type Props = {
  activeTab: TabKey
  lastSyncedAt: string
  marketPreference: MarketPreference
  onMarketPreferenceChange: (p: MarketPreference) => void
}

export function MainHeader({ activeTab, lastSyncedAt, marketPreference, onMarketPreferenceChange }: Props) {
  const { palette } = useTheme()
  const tabMeta = TABS.find((t) => t.key === activeTab) ?? (activeTab === 'admin' ? ADMIN_TAB : undefined)
  const tabLabel = tabMeta?.label ?? ''
  const descriptionMap: Record<TabKey, string> = {
    today:  '오늘의 시장 흐름과 내 종목을 확인합니다.',
    stocks: '종목 탐색 · 관심 · 보유',
    ai:     '분석 근거를 살펴보고 관심종목을 검토합니다.',
    league: '가상 자금으로 투자하고 결과를 비교합니다.',
    reading: '투자 아이디어와 매매 기록을 나눕니다.',
    admin:  '사용자 · 플랜 · 사용량 운영',
  }
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: palette.border }}>
      <View style={{ gap: 3 }}>
        <Text accessibilityRole="header" style={{ color: palette.ink, fontSize: 25, fontWeight: '700', letterSpacing: -0.5 }}>{tabLabel}</Text>
        <Text style={{ color: palette.inkMuted, fontSize: 12.5 }}>{descriptionMap[activeTab]}</Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 6 }}>
        <MarketProfileChip value={marketPreference} onChange={onMarketPreferenceChange} textLabels />
        {lastSyncedAt ? (
          <Text style={{ color: palette.inkFaint, fontSize: 11, fontWeight: '600' }}>
            마지막 동기화 {lastSyncedAt}
          </Text>
        ) : null}
      </View>
    </View>
  )
}
