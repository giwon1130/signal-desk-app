/**
 * 최근 받은 알림 모달 — 헤더 종 아이콘으로 진입.
 * 급등락 푸시 회고: 종목·등락률·시각 + '왜 움직였나' 사유.
 * 안 읽음 표시(점)는 열람 시점 스냅샷(unreadIds) 기준 — 열면 서버에서 읽음 처리되지만
 * 이번 세션엔 어떤 게 새로 왔는지 보이게 유지. 항목별 X 삭제 + 전체 삭제 지원.
 */
import { Alert, Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Bell, Trash2, X } from 'lucide-react-native'
import { useTheme, type Palette } from '../theme'
import type { AlertHistoryItem } from '../types'
import { formatSignedRate } from '../utils'

type Props = {
  visible: boolean
  alerts: AlertHistoryItem[]
  /** 열람 시점에 안 읽음이던 알림 id 집합 — 점 표시용 */
  unreadIds: Set<string>
  onClose: () => void
  onOpenDetail: (market: string, ticker: string, name?: string) => void
  onDelete: (id: string) => void
  onClearAll: () => void
}

function dirMeta(direction: AlertHistoryItem['direction'], palette: Palette): { sym: string; color: string; tag: string | null } {
  const map: Record<AlertHistoryItem['direction'], { sym: string; color: string; tag: string | null }> = {
    UP: { sym: '▲', color: palette.up, tag: null },
    DOWN: { sym: '▼', color: palette.down, tag: null },
    PRICE_ABOVE: { sym: '🎯', color: palette.up, tag: '목표가' },
    PRICE_BELOW: { sym: '📉', color: palette.down, tag: '손절가' },
    VOLUME_SPIKE: { sym: '🔥', color: palette.orange ?? '#ea580c', tag: '거래량' },
  }
  return map[direction] ?? map.DOWN
}

export function RecentAlertsModal({ visible, alerts, unreadIds, onClose, onOpenDetail, onDelete, onClearAll }: Props) {
  const { palette } = useTheme()
  const insets = useSafeAreaInsets()

  const confirmClearAll = () => {
    if (alerts.length === 0) return
    // RN-Web 의 Alert.alert 는 UI 를 안 띄우므로 웹은 window.confirm 으로 분기.
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('받은 알림을 모두 삭제할까요?')) onClearAll()
      return
    }
    Alert.alert('전체 삭제', '받은 알림을 모두 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: onClearAll },
    ])
  }

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
            {alerts.length > 0 ? (
              <Pressable
                onPress={confirmClearAll}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="전체 삭제"
                style={({ pressed }) => ({
                  flexDirection: 'row', alignItems: 'center', gap: 4,
                  paddingHorizontal: 8, paddingVertical: 4, borderRadius: 7,
                  backgroundColor: palette.surfaceAlt ?? palette.surface, opacity: pressed ? 0.6 : 1,
                })}
              >
                <Trash2 size={12} color={palette.inkMuted} strokeWidth={2.4} />
                <Text style={{ color: palette.inkMuted, fontSize: 11, fontWeight: '800' }}>전체 삭제</Text>
              </Pressable>
            ) : null}
            <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="닫기" style={{ marginLeft: 2 }}>
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
                const meta = dirMeta(a.direction, palette)
                const unread = unreadIds.has(a.id)
                return (
                  <View
                    key={a.id}
                    style={{
                      borderBottomWidth: i === alerts.length - 1 ? 0 : 1, borderBottomColor: palette.border,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                      <Pressable
                        onPress={() => { onClose(); onOpenDetail(a.market, a.ticker, a.name) }}
                        style={({ pressed }) => ({ flex: 1, paddingVertical: 11, paddingHorizontal: 8, opacity: pressed ? 0.6 : 1 })}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                          {/* 안 읽음 점 */}
                          {unread ? (
                            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: meta.color }} />
                          ) : null}
                          <Text
                            style={{
                              flex: 1, color: unread ? palette.ink : palette.inkMuted,
                              fontSize: 14, fontWeight: unread ? '800' : '700',
                            }}
                            numberOfLines={1}
                          >
                            {a.name}
                          </Text>
                          {meta.tag ? (
                            <Text style={{ color: meta.color, fontSize: 12, fontWeight: '800' }}>{meta.sym} {meta.tag}</Text>
                          ) : (
                            <Text style={{ color: meta.color, fontSize: 14, fontWeight: '900', fontVariant: ['tabular-nums'] }}>
                              {meta.sym} {formatSignedRate(a.changeRate)}
                            </Text>
                          )}
                        </View>
                        <Text style={{ color: palette.inkFaint, fontSize: 11, marginTop: 2, marginLeft: unread ? 14 : 0 }}>
                          {a.market} · {a.ticker} · {a.alertDate}
                        </Text>
                        {a.reason ? (
                          <View style={{
                            marginTop: 6, marginLeft: unread ? 14 : 0,
                            backgroundColor: palette.surfaceAlt ?? palette.surface,
                            borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7,
                            borderLeftWidth: 3, borderLeftColor: meta.color,
                          }}>
                            <Text style={{ color: palette.inkMuted, fontSize: 12, lineHeight: 17 }}>{a.reason}</Text>
                          </View>
                        ) : null}
                      </Pressable>
                      {/* 개별 삭제 */}
                      <Pressable
                        onPress={() => onDelete(a.id)}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel="알림 삭제"
                        style={({ pressed }) => ({ padding: 10, opacity: pressed ? 0.4 : 0.7 })}
                      >
                        <X size={16} color={palette.inkFaint} strokeWidth={2.4} />
                      </Pressable>
                    </View>
                  </View>
                )
              })}
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  )
}
