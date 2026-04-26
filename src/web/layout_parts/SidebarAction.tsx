/**
 * 좌측 사이드바 하단에 들어가는 작은 액션 버튼 (알림/테마/로그아웃 등).
 */
import { Pressable, Text } from 'react-native'
import type { ReactNode } from 'react'
import { useTheme } from '../../theme'

export function SidebarAction({
  icon, label, onPress, danger,
}: { icon: ReactNode; label: string; onPress: () => void; danger?: boolean }) {
  const { palette } = useTheme()
  return (
    <Pressable
      onPress={onPress}
      style={(state) => {
        const { pressed } = state
        const hovered = (state as { hovered?: boolean }).hovered
        return [{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingHorizontal: 10,
          paddingVertical: 8,
          borderRadius: 8,
          backgroundColor: hovered ? (danger ? palette.redSoft : palette.surfaceAlt) : 'transparent',
          opacity: pressed ? 0.7 : 1,
        }]
      }}
    >
      {icon}
      <Text style={{
        color: danger ? palette.red : palette.inkSub,
        fontSize: 12,
        fontWeight: '700',
      }}>{label}</Text>
    </Pressable>
  )
}
