import { useState, type ReactNode } from 'react'
import { Platform, Pressable, Text, View } from 'react-native'
import { ChevronDown, ChevronRight } from 'lucide-react-native'
import { useStyles } from '../styles'
import { useTheme } from '../theme'
import { hapticLight } from '../utils/haptics'

/**
 * 탭해서 펼치는 카드.
 *
 * - 모바일 기본: 접힘 상태. 헤더(title + preview)는 항상 보임.
 * - 웹(데스크톱) 기본: **펼침 상태**. 정보 밀도가 모바일보다 훨씬 높은 웹에서
 *   사용자가 매번 여러 카드를 눌러 펼치는 건 UX 낭비. 웹에선 항상 펼쳐서 보이게 함.
 * - 접힌 상태에서는 body 는 렌더링하지 않음 (성능상 cheap).
 * - 제어용 prop 이 필요하면 `collapsed` + `onToggle` 로 전환.
 */
export function CollapsibleCard({
  title,
  preview,
  // 웹에선 기본 펼침(false), 네이티브에선 기본 접힘(true)
  defaultCollapsed = Platform.OS !== 'web',
  collapsed: controlled,
  onToggle,
  cardStyle,
  headerStyle,
  children,
}: {
  title: ReactNode
  preview?: ReactNode
  defaultCollapsed?: boolean
  collapsed?: boolean
  onToggle?: (next: boolean) => void
  cardStyle?: object | object[]
  headerStyle?: object | object[]
  children: ReactNode
}) {
  const styles = useStyles()
  const { palette } = useTheme()
  const [internal, setInternal] = useState(defaultCollapsed)
  const isCollapsed = controlled ?? internal
  const isWeb = Platform.OS === 'web'

  const handlePress = () => {
    void hapticLight()
    const next = !isCollapsed
    if (controlled === undefined) setInternal(next)
    onToggle?.(next)
  }

  const Chevron = isCollapsed ? ChevronRight : ChevronDown

  return (
    <View style={[styles.card, cardStyle as any]}>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.collapsibleHeader,
          headerStyle as any,
          pressed && { opacity: 0.7 },
        ]}
        hitSlop={8}
      >
        <View style={styles.collapsibleHeaderMain}>{title}</View>
        {preview && !isWeb ? <View style={styles.collapsibleHeaderPreview}>{preview}</View> : null}
        {/* 웹에선 접을 일이 없으니 셰브론 숨김 (헤더를 눌러도 토글은 되지만 UI 는 깔끔하게) */}
        {!isWeb ? <Chevron size={16} color={palette.inkMuted} strokeWidth={2.5} /> : null}
      </Pressable>
      {!isCollapsed ? <View style={styles.collapsibleBody}>{children}</View> : null}
    </View>
  )
}
