/**
 * 좁은 뷰포트용 상단 탭 바 — 사이드바를 숨기고 5개 탭을 row 로 노출.
 */
import { Pressable, Text, View } from 'react-native'
import { useTheme } from '../../theme'
import { hapticLight } from '../../utils/haptics'
import type { TabKey } from '../../types'
import { TABS } from './tabs-config'

export function NarrowTabBar({ activeTab, onTabChange }: { activeTab: TabKey; onTabChange: (k: TabKey) => void }) {
  const { palette } = useTheme()
  return (
    <View style={{
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: palette.border,
      backgroundColor: palette.surface,
      paddingHorizontal: 4,
    }}>
      {TABS.map(({ key, label, Icon }) => {
        const active = activeTab === key
        return (
          <Pressable
            key={key}
            onPress={() => { if (!active) { void hapticLight(); onTabChange(key) } }}
            style={({ pressed }) => [
              {
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 8,
                gap: 2,
                opacity: pressed ? 0.6 : 1,
                borderBottomWidth: 2,
                borderBottomColor: active ? palette.blue : 'transparent',
              },
            ]}
          >
            <Icon size={16} color={active ? palette.blue : palette.inkFaint} strokeWidth={active ? 2.5 : 1.8} />
            <Text style={{
              color: active ? palette.blue : palette.inkFaint,
              fontSize: 10, fontWeight: active ? '800' : '600',
            }}>{label}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}
