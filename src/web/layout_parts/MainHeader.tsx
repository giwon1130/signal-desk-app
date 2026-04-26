/**
 * 데스크톱 메인 컬럼 상단 헤더 — 활성 탭 라벨 + 설명 + 마지막 동기화.
 */
import { Text, View } from 'react-native'
import { useTheme } from '../../theme'
import type { TabKey } from '../../types'
import { TABS } from './tabs-config'

export function MainHeader({ activeTab, lastSyncedAt }: { activeTab: TabKey; lastSyncedAt: string }) {
  const { palette } = useTheme()
  const tabMeta = TABS.find((t) => t.key === activeTab)
  const tabLabel = tabMeta?.label ?? ''
  const descriptionMap: Record<TabKey, string> = {
    today:  '오늘의 시장 상태와 단타 후보를 한눈에',
    home:   '관심종목과 보유 포트폴리오 요약',
    market: 'KR/US 지수·섹터·Top Movers',
    stocks: '종목 탐색과 관심종목 관리',
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
      {lastSyncedAt ? (
        <Text style={{ color: palette.inkFaint, fontSize: 11, fontWeight: '600' }}>
          마지막 동기화 {lastSyncedAt}
        </Text>
      ) : null}
    </View>
  )
}
