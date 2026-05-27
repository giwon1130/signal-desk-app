import { Pressable, Text, View } from 'react-native'
import { useTheme } from '../theme'
import type { MarketPreference } from '../api/alertPreferences'

type Props = {
  value: MarketPreference
  disabled?: boolean
  onChange: (m: MarketPreference) => void
}

/**
 * 헤더용 compact 시장 선호 토글 — KR/BOTH/US 3-state segmented.
 *
 * v2 핵심 가치 (프로필별 화면) 의 진입점. 자주 쓰는 설정이라 헤더에 항상 노출.
 * 알림 설정(푸시) 과는 다른 축 — UI 노출 범위.
 *
 * 사용자가 변경하면 즉시 카드 필터링 반영.
 */
export function MarketProfileChip({ value, disabled, onChange }: Props) {
  const { palette } = useTheme()
  const options: Array<{ key: MarketPreference; label: string }> = [
    { key: 'KR',   label: '🇰🇷' },
    { key: 'BOTH', label: '🌍' },
    { key: 'US',   label: '🇺🇸' },
  ]
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: palette.surfaceAlt,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: palette.border,
        padding: 2,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {options.map((o) => {
        const active = value === o.key
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            disabled={disabled}
            hitSlop={6}
            style={{
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 6,
              backgroundColor: active ? palette.brandAccent : 'transparent',
            }}
          >
            <Text style={{ fontSize: 13, color: active ? palette.bg : palette.ink }}>
              {o.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}
