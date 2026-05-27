import { Pressable, Text, View } from 'react-native'
import { useStyles } from '../../styles'

type Props = {
  value: number
  options: number[]
  onChange: (m: number) => void
}

/**
 * 장 시작 N분 전 로컬 알림 — 칩 선택. 디바이스 로컬 예약 (서버 푸시 X).
 */
export function MinutesBeforePicker({ value, options, onChange }: Props) {
  const styles = useStyles()
  return (
    <View style={styles.signalModalSection}>
      <Text style={styles.signalModalSectionTitle}>몇 분 전 알림</Text>
      <View style={styles.filterRow}>
        {options.map((m) => (
          <Pressable
            key={m}
            onPress={() => onChange(m)}
            style={[styles.filterChip, value === m && styles.filterChipActive]}
          >
            <Text style={[styles.filterText, value === m && styles.filterTextActive]}>
              {m}분 전
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  )
}
