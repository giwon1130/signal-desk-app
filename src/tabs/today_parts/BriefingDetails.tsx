import { Text, View } from 'react-native'
import { useStyles } from '../../styles'
import type { DailyBriefing } from '../../types'
import { priorityColor } from './helpers'

/**
 * 브리핑의 개인화 부분 — 컨텍스트 칩(보유/관심/분위기/이벤트) + 액션 아이템.
 * (내러티브는 브리프 본문과 겹쳐 제외. 브리프 카드 안에 통합해 노출.)
 */
export function BriefingDetails({ briefing }: { briefing: DailyBriefing }) {
  const styles = useStyles()
  const hasContext = !!briefing.context
  const hasActions = !!briefing.actionItems?.length
  if (!hasContext && !hasActions) return null

  return (
    <>
      {briefing.context ? (
        <View style={styles.briefingContextRow}>
          {briefing.context.holdingPnlLabel ? (
            <View style={styles.briefingContextChip}>
              <Text style={styles.briefingContextChipLabel}>보유</Text>
              <Text style={[
                styles.briefingContextChipValue,
                (briefing.context.holdingPnlRate ?? 0) >= 0 ? { color: '#dc2626' } : { color: '#2563eb' },
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
    </>
  )
}
