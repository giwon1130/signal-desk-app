import type { ComponentType, ReactNode } from 'react'
import { Pressable, Text, View } from 'react-native'
import { X } from 'lucide-react-native'
import { useTheme } from '../theme'

type IconType = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>

type Props = {
  icon: IconType
  title: string
  onClose: () => void
  /** 닫기 버튼 왼쪽에 들어가는 추가 액션(예: 공유 버튼). */
  right?: ReactNode
  titleNumberOfLines?: number
}

/**
 * 풀스크린 모달 공통 헤더 — 아이콘 + 제목 + (우측 액션) + 닫기(X).
 * 지수/설정/리그/리딩 모달이 공유. 아이콘 크기·a11y 등 기존 불일치를 통일.
 */
export function ModalHeader({ icon: Icon, title, onClose, right, titleNumberOfLines }: Props) {
  const { palette } = useTheme()
  return (
    <View
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingHorizontal: 16, paddingVertical: 11,
        borderBottomWidth: 1, borderBottomColor: palette.borderLight,
      }}
    >
      <View style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: palette.greenSoft, alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={17} color={palette.brandAccent} strokeWidth={2.5} />
      </View>
      <Text
        style={{ flex: 1, color: palette.ink, fontSize: 18, fontWeight: '900', letterSpacing: -0.35 }}
        numberOfLines={titleNumberOfLines}
      >
        {title}
      </Text>
      {right}
      <Pressable
        onPress={onClose}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="닫기"
        style={({ pressed }) => ({ width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? palette.surfaceAlt : 'transparent' })}
      >
        <X size={19} color={palette.inkMuted} strokeWidth={2.4} />
      </Pressable>
    </View>
  )
}
