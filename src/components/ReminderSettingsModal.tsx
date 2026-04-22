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

type Props = {
  visible: boolean
  onClose: () => void
}

const MINUTES_OPTIONS = [5, 10, 15, 30, 60]

export function ReminderSettingsModal({ visible, onClose }: Props) {
  const styles = useStyles()
  const { palette } = useTheme()

  const [krOn, setKrOn] = useState(true)
  const [usOn, setUsOn] = useState(true)
  const [minutes, setMinutes] = useState(10)
  const [hydrated, setHydrated] = useState(false)

  // 모달 열릴 때마다 현재 저장값 hydrate
  useEffect(() => {
    if (!visible) return
    void (async () => {
      const [a, b, c] = await Promise.all([
        getKrOpenEnabled(),
        getUsOpenEnabled(),
        getMinutesBefore(),
      ])
      setKrOn(a)
      setUsOn(b)
      setMinutes(c)
      setHydrated(true)
    })()
  }, [visible])

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
              디바이스에 직접 예약되는 로컬 알림이라 서버 푸시 없이도 동작해.
            </Text>

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
              로컬 알림은 앱이 닫혀 있어도 OS가 띄워줘. 시그널 발생 같은 이벤트 기반 알림은
              아직 지원하지 않아 (서버 푸시 인프라가 필요해).
            </Text>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  )
}
