import { Text, View } from 'react-native'
import { Sparkles } from 'lucide-react-native'
import { CollapsibleCard } from '../../components/CollapsibleCard'
import { useStyles } from '../../styles'
import { useTheme } from '../../theme'
import type { DailyBriefing } from '../../types'
import { priorityColor, slotLabel } from './helpers'

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

      {briefing.context ? (
        <View style={styles.briefingContextRow}>
          {briefing.context.holdingPnlLabel ? (
            <View style={styles.briefingContextChip}>
              <Text style={styles.briefingContextChipLabel}>보유</Text>
              <Text style={[
                styles.briefingContextChipValue,
                (briefing.context.holdingPnlRate ?? 0) >= 0
                  ? { color: '#dc2626' }
                  : { color: '#2563eb' },
              ]}>
                {briefing.context.holdingPnlLabel}
              </Text>
            </View>
          ) : null}
          <View style={styles.briefingContextChip}>
            <Text style={styles.briefingContextChipLabel}>관심 신호</Text>
            <Text style={styles.briefingContextChipValue}>{briefing.context.watchlistAlertCount}</Text>
          </View>
          <View style={styles.briefingContextChip}>
            <Text style={styles.briefingContextChipLabel}>분위기</Text>
            <Text style={styles.briefingContextChipValue}>{briefing.context.marketMood}</Text>
          </View>
          {briefing.context.keyEvent ? (
            <View style={styles.briefingContextChip}>
              <Text style={styles.briefingContextChipLabel}>이벤트</Text>
              <Text style={styles.briefingContextChipValue}>{briefing.context.keyEvent}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {briefing.actionItems?.length ? (
        <View style={styles.briefingActionList}>
          {briefing.actionItems.map((action, idx) => (
            <View key={`${action.ticker ?? 'noticker'}-${idx}`} style={styles.briefingActionRow}>
              <View style={[styles.briefingActionBar, { backgroundColor: priorityColor(action.priority) }]} />
              <View style={styles.briefingActionBody}>
                <Text style={styles.briefingActionTitle}>{action.title}</Text>
                <Text style={styles.briefingActionDetail} numberOfLines={2}>{action.detail}</Text>
                {action.ticker ? (
                  <Text style={styles.briefingActionMeta}>
                    {action.market ?? ''}{action.market && action.ticker ? ' · ' : ''}{action.ticker}
                  </Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </CollapsibleCard>
  )
}
