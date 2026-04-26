import { Text, View } from 'react-native'
import { Cpu } from 'lucide-react-native'
import { useStyles } from '../../styles'
import type { RecommendationExecutionLog } from '../../types'

type Props = {
  latestAiLog?: RecommendationExecutionLog
}

export function AiContextRow({ latestAiLog }: Props) {
  const styles = useStyles()
  if (!latestAiLog) return null
  return (
    <View style={styles.cardSection}>
      <View style={styles.cardTitleRow}>
        <Cpu size={13} color="#7c3aed" strokeWidth={2.5} />
        <Text style={styles.cardTitle}>최근 AI 로그</Text>
      </View>
      <Text style={styles.logMeta}>
        {latestAiLog.date} · {latestAiLog.stage} · {latestAiLog.status}
      </Text>
      <Text style={styles.cardNote}>{latestAiLog.rationale}</Text>
    </View>
  )
}
