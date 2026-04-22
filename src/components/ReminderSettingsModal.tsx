import { useEffect, useState } from 'react'
import { Modal, Pressable, ScrollView, Switch, Text, View } from 'react-native'
import { Bell, X } from 'lucide-react-native'
import { useStyles } from '../styles'
import { useTheme } from '../theme'
import {
  getKrOpenEnabled,
  getMinutesBefore,
  getUsOpenEnabled,
  setKrOpenEnabled,
  setMinutesBefore,
  setUsOpenEnabled,
} from '../hooks/useMarketReminder'
import { getPushAlertsEnabled, setPushAlertsEnabled } from '../api/pushDevice'

type Props = {
  visible: boolean
  authToken: string | null
  onClose: () => void
}

const MINUTES_OPTIONS = [5, 10, 15, 30, 60]

export function ReminderSettingsModal({ visible, authToken, onClose }: Props) {
  const styles = useStyles()
  const { palette } = useTheme()

  const [pushOn, setPushOn] = useState(true)
  const [krOn, setKrOn] = useState(true)
  const [usOn, setUsOn] = useState(true)
  const [minutes, setMinutes] = useState(10)
  const [hydrated, setHydrated] = useState(false)

  // 모달 열릴 때마다 현재 저장값 hydrate
  useEffect(() => {
    if (!visible) return
    void (async () => {
      const [p, a, b, c] = await Promise.all([
        getPushAlertsEnabled(),
        getKrOpenEnabled(),
        getUsOpenEnabled(),
        getMinutesBefore(),
      ])
      setPushOn(p)
      setKrOn(a)
      setUsOn(b)
      setMinutes(c)
      setHydrated(true)
    })()
  }, [visible])

  const handlePush = async (v: boolean) => {
    setPushOn(v)
    if (authToken) await setPushAlertsEnabled(authToken, v)
  }
  const handleKr = async (v: boolean) => { setKrOn(v); await setKrOpenEnabled(v) }
  const handleUs = async (v: boolean) => { setUsOn(v); await setUsOpenEnabled(v) }
  const handleMinutes = async (m: number) => { setMinutes(m); await setMinutesBefore(m) }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.signalModalBackdrop} onPress={onClose}>
        <Pressable style={styles.signalModalCard} onPress={() => {}}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.signalModalHeader}>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Bell size={18} color={palette.blue} strokeWidth={2.5} />
                <Text style={styles.signalModalTitle}>알림 설정</Text>
              </View>
              <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="닫기">
                <X size={20} color={palette.inkMuted} strokeWidth={2.5} />
              </Pressable>
            </View>

            <Text style={[styles.signalModalSubtitle, { marginBottom: 12 }]}>
              장 시작은 로컬 알림, 급등락은 서버 푸시로 보내준다.
            </Text>

            {/* ── 급등락 푸시 ── */}
            <View style={[styles.summaryRow, { paddingHorizontal: 0 }]}>
              <View style={styles.metricLeft}>
                <Text style={styles.metricName}>📈 관심종목 급등락 알림</Text>
                <Text style={styles.metricState}>±5% 감지 시 푸시 (서버 발송)</Text>
              </View>
              <Switch
                value={pushOn}
                onValueChange={(v) => void handlePush(v)}
                disabled={!hydrated || !authToken}
              />
            </View>

            {/* ── 한국장 ── */}
            <View style={[styles.summaryRow, { paddingHorizontal: 0 }]}>
              <View style={styles.metricLeft}>
                <Text style={styles.metricName}>🇰🇷 한국장 시작</Text>
                <Text style={styles.metricState}>매일 09:00 KST</Text>
              </View>
              <Switch value={krOn} onValueChange={(v) => void handleKr(v)} disabled={!hydrated} />
            </View>

            {/* ── 미국장 ── */}
            <View style={[styles.summaryRow, { paddingHorizontal: 0 }]}>
              <View style={styles.metricLeft}>
                <Text style={styles.metricName}>🇺🇸 미국장 시작</Text>
                <Text style={styles.metricState}>매일 23:30 KST (서머타임 평균)</Text>
              </View>
              <Switch value={usOn} onValueChange={(v) => void handleUs(v)} disabled={!hydrated} />
            </View>

            {/* ── 몇 분 전 ── */}
            <View style={styles.signalModalSection}>
              <Text style={styles.signalModalSectionTitle}>몇 분 전 알림</Text>
              <View style={styles.filterRow}>
                {MINUTES_OPTIONS.map((m) => (
                  <Pressable
                    key={m}
                    onPress={() => void handleMinutes(m)}
                    style={[styles.filterChip, minutes === m && styles.filterChipActive]}
                  >
                    <Text style={[styles.filterText, minutes === m && styles.filterTextActive]}>
                      {m}분 전
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <Text style={styles.signalModalDisclaimer}>
              장 시작 알림은 디바이스 로컬 예약, 급등락 알림은 서버에서 Expo 푸시로 발송한다.
              알림을 끄면 서버에서 이 기기 토큰을 제거해서 더 이상 푸시가 안 온다.
            </Text>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  )
}
