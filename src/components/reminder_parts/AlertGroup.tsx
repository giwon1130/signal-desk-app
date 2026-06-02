import { useState } from 'react'
import { Pressable, Switch, Text, View } from 'react-native'
import { ChevronDown, ChevronRight } from 'lucide-react-native'
import { useTheme } from '../../theme'

type Props = {
  title: string
  subtitle?: string
  /** 그룹 마스터 — 하위 중 하나라도 켜져 있으면 ON. 토글하면 하위 전체 on/off. */
  master: boolean
  disabled?: boolean
  onToggleAll: (v: boolean) => void
  children: React.ReactNode
  defaultExpanded?: boolean
}

/**
 * 알림 그룹 — 헤더(마스터 토글 + 펼치기) + 펼치면 세부 토글들.
 * "전체 온오프" 느낌 + 펼쳐서 세부 조정.
 */
export function AlertGroup({ title, subtitle, master, disabled, onToggleAll, children, defaultExpanded }: Props) {
  const { palette } = useTheme()
  const [open, setOpen] = useState(!!defaultExpanded)
  return (
    <View style={{ borderTopWidth: 1, borderTopColor: palette.border }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 }}>
        <Pressable
          onPress={() => setOpen((o) => !o)}
          accessibilityRole="button"
          accessibilityLabel={`${title} 세부 ${open ? '접기' : '펼치기'}`}
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}
        >
          {open
            ? <ChevronDown size={16} color={palette.inkMuted} strokeWidth={2.5} />
            : <ChevronRight size={16} color={palette.inkMuted} strokeWidth={2.5} />}
          <View style={{ flex: 1 }}>
            <Text style={{ color: palette.ink, fontSize: 14, fontWeight: '800' }}>{title}</Text>
            {subtitle ? (
              <Text style={{ color: palette.inkFaint, fontSize: 11, marginTop: 1 }}>{subtitle}</Text>
            ) : null}
          </View>
        </Pressable>
        <Switch value={master} onValueChange={onToggleAll} disabled={disabled} />
      </View>
      {open ? (
        <View style={{ paddingLeft: 24, paddingBottom: 6, borderTopWidth: 1, borderTopColor: palette.border + '88' }}>
          {children}
        </View>
      ) : null}
    </View>
  )
}
