import { Text, View } from 'react-native'
import { Sparkles } from 'lucide-react-native'
import { CollapsibleCard } from '../../components/CollapsibleCard'
import { useStyles } from '../../styles'
import { useTheme } from '../../theme'
import type { DailyBriefing } from '../../types'
import { slotLabel } from './helpers'
import { BriefingDetails } from './BriefingDetails'

export function BriefingCard({ briefing }: { briefing: DailyBriefing }) {
  const styles = useStyles()
  const { palette } = useTheme()

  return (
    <CollapsibleCard
      title={
        <View style={styles.cardTitleRow}>
          <Sparkles size={14} color={palette.blue} strokeWidth={2.5} />
          <Text style={styles.cardTitle}>오늘의 브리핑</Text>
        </View>
      }
      preview={
        <View style={styles.briefingSlotBadge}>
          <Text style={styles.briefingSlotBadgeText}>{slotLabel(briefing.slot)}</Text>
        </View>
      }
    >
      <Text style={styles.briefingNarrative}>{briefing.narrative || briefing.headline}</Text>
      <BriefingDetails briefing={briefing} />
    </CollapsibleCard>
  )
}
