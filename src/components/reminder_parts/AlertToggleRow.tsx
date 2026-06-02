import { Switch, Text, View } from 'react-native'
import { useTheme } from '../../theme'

type Props = {
  title: string
  hint?: string
  value: boolean
  disabled?: boolean
  onValueChange: (v: boolean) => void
  compact?: boolean   // 그룹 내부 세부 토글용 (작게)
}

/**
 * 알림 토글 한 줄 — 제목/설명/스위치.
 * left 를 flex:1 로 두고 텍스트는 줄바꿈 → 긴 한글이 스위치를 화면 밖으로 밀지 않게.
 */
export function AlertToggleRow({ title, hint, value, disabled, onValueChange, compact }: Props) {
  const { palette } = useTheme()
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingVertical: compact ? 8 : 11,
    }}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: palette.ink, fontSize: compact ? 13 : 14, fontWeight: '700' }}>{title}</Text>
        {hint ? (
          <Text style={{ color: palette.inkMuted, fontSize: 11, lineHeight: 15, marginTop: 2 }}>{hint}</Text>
        ) : null}
      </View>
      <Switch value={value} onValueChange={onValueChange} disabled={disabled} />
    </View>
  )
}
