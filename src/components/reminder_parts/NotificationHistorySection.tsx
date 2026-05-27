import { Pressable, Text, View } from 'react-native'
import { History, Trash2 } from 'lucide-react-native'
import { useStyles } from '../../styles'
import { useTheme } from '../../theme'
import type { NotificationRecord } from '../../hooks/useMarketReminder'
import { formatRelativeOrShortTime } from '../../utils'

type Props = {
  history: NotificationRecord[]
  onClear: () => void
}

/**
 * 최근 도착한 알림 히스토리 — 앱 켜진 동안 잡힌 것만. 사용자가 비울 수 있음.
 */
export function NotificationHistorySection({ history, onClear }: Props) {
  const styles = useStyles()
  const { palette } = useTheme()
  return (
    <View style={[styles.signalModalSection, { marginTop: 16 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <History size={14} color={palette.inkSub} strokeWidth={2.5} />
        <Text style={[styles.signalModalSectionTitle, { flex: 1, marginBottom: 0 }]}>
          최근 알림
        </Text>
        {history.length > 0 ? (
          <Pressable
            onPress={onClear}
            hitSlop={8}
            style={({ pressed }) => ({
              flexDirection: 'row', alignItems: 'center', gap: 4,
              paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
              opacity: pressed ? 0.6 : 1,
            })}
            accessibilityLabel="히스토리 지우기"
          >
            <Trash2 size={11} color={palette.inkMuted} strokeWidth={2.5} />
            <Text style={{ color: palette.inkMuted, fontSize: 10, fontWeight: '700' }}>지우기</Text>
          </Pressable>
        ) : null}
      </View>
      {history.length === 0 ? (
        <View style={{ paddingVertical: 14, alignItems: 'center' }}>
          <Text style={{ color: palette.inkMuted, fontSize: 11 }}>
            아직 기록된 알림 없음
          </Text>
          <Text style={{ color: palette.inkFaint, fontSize: 10, marginTop: 2 }}>
            앱 켜진 동안 도착한 알림만 기록돼
          </Text>
        </View>
      ) : (
        <View style={{ gap: 6 }}>
          {history.map((h) => (
            <View
              key={`${h.id}-${h.firedAt}`}
              style={{
                backgroundColor: palette.surfaceAlt,
                borderRadius: 8, padding: 10, gap: 2,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ flex: 1, color: palette.ink, fontSize: 12, fontWeight: '700' }} numberOfLines={1}>
                  {h.title || '알림'}
                </Text>
                <Text style={{ color: palette.inkFaint, fontSize: 10, fontVariant: ['tabular-nums'] }}>
                  {formatRelativeOrShortTime(new Date(h.firedAt).toISOString())}
                </Text>
              </View>
              {h.body ? (
                <Text style={{ color: palette.inkMuted, fontSize: 11, lineHeight: 15 }} numberOfLines={3}>
                  {h.body}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      )}
    </View>
  )
}
