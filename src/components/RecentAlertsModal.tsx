/**
 * 최근 받은 알림 모달 — 헤더 종 아이콘으로 진입.
 * 급등락 푸시 회고: 종목·등락률·시각, 사유(있으면)까지 한 화면에.
 */
import { Modal, Pressable, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Bell, X } from 'lucide-react-native'
import { useTheme } from '../theme'
import type { AlertHistoryItem } from '../types'
import { formatSignedRate } from '../utils'

type Props = {
  visible: boolean
  alerts: AlertHistoryItem[]
  onClose: () => void
  onOpenDetail: (market: string, ticker: string, name?: string) => void
}

export function RecentAlertsModal({ visible, alerts, onClose, onOpenDetail }: Props) {
  const { palette } = useTheme()
  const insets = useSafeAreaInsets()

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }} onPress={onClose}>
        <View style={{ flex: 1 }} />
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: palette.bg,
            borderTopLeftRadius: 20, borderTopRightRadius: 20,
            paddingBottom: insets.bottom + 8, maxHeight: '78%',
          }}
        >
          {/* 헤더 */}
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 8,
            paddingHorizontal: 18, paddingTop: 16, paddingBottom: 12,
            borderBottomWidth: 1, borderBottomColor: palette.border,
          }}>
            <Bell size={17} color={palette.orange ?? '#ea580c'} strokeWidth={2.6} />
            <Text style={{ flex: 1, color: palette.ink, fontSize: 16, fontWeight: '900' }}>최근 받은 알림</Text>
            <Text style={{ color: palette.inkFaint, fontSize: 12, fontWeight: '700' }}>{alerts.length}건</Text>
            <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="닫기" style={{ marginLeft: 4 }}>
              <X size={20} color={palette.inkMuted} strokeWidth={2.5} />
            </Pressable>
          </View>

          {alerts.length === 0 ? (
            <View style={{ paddingVertical: 48, alignItems: 'center', gap: 6 }}>
              <Bell size={28} color={palette.inkFaint} strokeWidth={1.8} />
              <Text style={{ color: palette.inkMuted, fontSize: 13, fontWeight: '700' }}>아직 받은 알림이 없습니다</Text>
              <Text style={{ color: palette.inkFaint, fontSize: 11 }}>급등·급락 알림을 켜두면 여기에 모입니다</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ paddingHorizontal: 14, paddingVertical: 8 }}>
              {alerts.map((a, i) => {
                const isUp = a.direction === 'UP'
                const color = isUp ? palette.up : palette.down
                return (
                  <Pressable
                    key={`${a.ticker}-${a.sentAt}-${i}`}
                    onPress={() => { onClose(); onOpenDetail(a.market, a.ticker, a.name) }}
                    style={({ pressed }) => ({
                      paddingVertical: 11, paddingHorizontal: 8,
                      borderBottomWidth: i === alerts.length - 1 ? 0 : 1, borderBottomColor: palette.border,
                      opacity: pressed ? 0.6 : 1,
                    })}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={{ flex: 1, color: palette.ink, fontSize: 14, fontWeight: '800' }} numberOfLines={1}>{a.name}</Text>
                      <Text style={{ color, fontSize: 14, fontWeight: '900', fontVariant: ['tabular-nums'] }}>
                        {isUp ? '▲' : '▼'} {formatSignedRate(a.changeRate)}
                      </Text>
                    </View>
                    <Text style={{ color: palette.inkFaint, fontSize: 11, marginTop: 2 }}>
                      {a.market} · {a.ticker} · {a.alertDate}
                    </Text>
                    {(a as AlertHistoryItem & { reason?: string }).reason ? (
                      <View style={{
                        marginTop: 6, backgroundColor: palette.surfaceAlt ?? palette.surface,
                        borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7,
                        borderLeftWidth: 3, borderLeftColor: color,
                      }}>
                        <Text style={{ color: palette.inkMuted, fontSize: 12, lineHeight: 17 }}>
                          {(a as AlertHistoryItem & { reason?: string }).reason}
                        </Text>
                      </View>
                    ) : null}
                  </Pressable>
                )
              })}
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  )
}
