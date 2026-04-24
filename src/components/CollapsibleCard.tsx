import { useState, type ReactNode } from 'react'
import { Pressable, Text, View } from 'react-native'
import { ChevronDown, ChevronRight } from 'lucide-react-native'
import { useStyles } from '../styles'
import { useTheme } from '../theme'
import { hapticLight } from '../utils/haptics'

/**
 * 탭해서 펼치는 카드.
 *
 * - 기본 접힘 상태이고, 헤더(title + preview)는 항상 보인다.
 * - 접힌 상태에서는 body 는 렌더링하지 않음 (성능상 cheap).
 * - 제어용 prop 이 필요하면 `collapsed` + `onToggle` 로 전환.
 */
export function CollapsibleCard({
  title,
  preview,
  defaultCollapsed = true,
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
        {preview ? <View style={styles.collapsibleHeaderPreview}>{preview}</View> : null}
        <Chevron size={16} color={palette.inkMuted} strokeWidth={2.5} />
      </Pressable>
      {!isCollapsed ? <View style={styles.collapsibleBody}>{children}</View> : null}
    </View>
  )
}
