/**
 * 데스크톱 메인 컬럼 상단 헤더 — 활성 탭 라벨 + 설명 + 시장 칩 + 마지막 동기화.
 */
import { Text, View } from 'react-native'
import { useTheme } from '../../theme'
import type { TabKey } from '../../types'
import type { MarketPreference } from '../../api/alertPreferences'
import { MarketProfileChip } from '../../components/MarketProfileChip'
import { TABS } from './tabs-config'

type Props = {
  activeTab: TabKey
  lastSyncedAt: string
  marketPreference: MarketPreference
  onMarketPreferenceChange: (p: MarketPreference) => void
}

export function MainHeader({ activeTab, lastSyncedAt, marketPreference, onMarketPreferenceChange }: Props) {
  const { palette } = useTheme()
  const tabMeta = TABS.find((t) => t.key === activeTab)
  const tabLabel = tabMeta?.label ?? ''
  const descriptionMap: Record<TabKey, string> = {
    today:  '시장 무드 · 모닝/이브닝 브리프 · 보유 모니터',
    stocks: '종목 탐색 · 관심 · 보유',
    ai:     '오늘의 플레이북 + 누적 성적표',
  }
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
      <View style={{ gap: 2 }}>
        <Text style={{ color: palette.inkFaint, fontSize: 10, fontWeight: '800', letterSpacing: 2 }}>
          SIGNAL DESK
        </Text>
        <Text style={{ color: palette.ink, fontSize: 22, fontWeight: '800' }}>{tabLabel}</Text>
        <Text style={{ color: palette.inkMuted, fontSize: 12 }}>{descriptionMap[activeTab]}</Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 6 }}>
        <MarketProfileChip value={marketPreference} onChange={onMarketPreferenceChange} />
        {lastSyncedAt ? (
          <Text style={{ color: palette.inkFaint, fontSize: 11, fontWeight: '600' }}>
            마지막 동기화 {lastSyncedAt}
          </Text>
        ) : null}
      </View>
    </View>
  )
}
