import { Pressable, Text, View } from 'react-native'
import { useStyles } from '../../styles'

type Props = {
  value: 'KR' | 'US' | 'BOTH'
  disabled?: boolean
  onChange: (m: 'KR' | 'US' | 'BOTH') => void
}

/**
 * 투자 시장 선호 — KR-only / US-only / BOTH 칩 선택. UI 노출 범위(ambient 콘텐츠 필터) 결정.
 * 알림 토글과 별개 — 토글이 ON 이어도 marketPreference 에 따라 자동 차단되는 항목이 있음
 * (예: KR 만 선택 시 이브닝 브리프 자동 차단).
 */
export function MarketPreferencePicker({ value, disabled, onChange }: Props) {
  const styles = useStyles()
  return (
    <View style={[styles.signalModalSection, { marginTop: 0, marginBottom: 6 }]}>
      <Text style={styles.signalModalSectionTitle}>투자 시장</Text>
      <Text style={[styles.metricState, { marginTop: 2, marginBottom: 8 }]}>
        선택한 시장만 카드·종목·이벤트가 보입니다. 알림 토글과 별개.
      </Text>
      <View style={styles.filterRow}>
        {(['KR', 'BOTH', 'US'] as const).map((m) => {
          const active = value === m
          const label = m === 'KR' ? '🇰🇷 한국만' : m === 'US' ? '🇺🇸 미국만' : '🇰🇷🇺🇸 둘 다'
          return (
            <Pressable
              key={m}
              onPress={() => onChange(m)}
              style={[styles.filterChip, active && styles.filterChipActive]}
              disabled={disabled}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}
