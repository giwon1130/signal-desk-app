import { Switch, Text, View } from 'react-native'
import { useStyles } from '../../styles'

type Props = {
  title: string
  hint: string
  value: boolean
  disabled?: boolean
  onValueChange: (v: boolean) => void
}

/**
 * 알림 토글 한 줄 — 제목/설명/스위치. 모달 안 8종 알림이 모두 같은 패턴이라 추출.
 */
export function AlertToggleRow({ title, hint, value, disabled, onValueChange }: Props) {
  const styles = useStyles()
  return (
    <View style={[styles.summaryRow, { paddingHorizontal: 0 }]}>
      <View style={styles.metricLeft}>
        <Text style={styles.metricName}>{title}</Text>
        <Text style={styles.metricState}>{hint}</Text>
      </View>
      <Switch value={value} onValueChange={onValueChange} disabled={disabled} />
    </View>
  )
}
