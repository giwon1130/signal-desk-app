import { useEffect, useState } from 'react'
import { Modal, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Bell, X } from 'lucide-react-native'
import { useStyles } from '../styles'
import { useTheme } from '../theme'
import {
  clearNotificationHistory,
  getKrOpenEnabled,
  getMinutesBefore,
  getNotificationHistory,
  getUsOpenEnabled,
  setKrOpenEnabled,
  setMinutesBefore,
  setUsOpenEnabled,
  type NotificationRecord,
} from '../hooks/useMarketReminder'
import { getPushAlertsEnabled, setPushAlertsEnabled } from '../api/pushDevice'
import { getAlertPreferences, updateAlertPreferences, type AlertPreferences } from '../api/alertPreferences'
import { AlertToggleRow } from './reminder_parts/AlertToggleRow'
import { MinutesBeforePicker } from './reminder_parts/MinutesBeforePicker'
import { NotificationHistorySection } from './reminder_parts/NotificationHistorySection'

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
  const [history, setHistory] = useState<NotificationRecord[]>([])
  const [prefs, setPrefs] = useState<AlertPreferences>({
    krEnabled: true, usEnabled: false, premarketEnabled: true, compositeRiskEnabled: true,
    marketPreference: 'BOTH', eveningBriefEnabled: false,
  })

  // 모달 열릴 때마다 현재 저장값 hydrate
  useEffect(() => {
    if (!visible) return
    void (async () => {
      const [p, a, b, c, h, sp] = await Promise.all([
        getPushAlertsEnabled(),
        getKrOpenEnabled(),
        getUsOpenEnabled(),
        getMinutesBefore(),
        getNotificationHistory(),
        authToken ? getAlertPreferences(authToken) : Promise.resolve(prefs),
      ])
      setPushOn(p)
      setKrOn(a)
      setUsOn(b)
      setMinutes(c)
      setHistory(h)
      setPrefs(sp)
      setHydrated(true)
    })()
  }, [visible])

  const updatePref = async (patch: Partial<AlertPreferences>) => {
    const next = { ...prefs, ...patch }
    setPrefs(next)
    if (authToken) await updateAlertPreferences(authToken, next)
  }

  const handleClearHistory = async () => {
    await clearNotificationHistory()
    setHistory([])
  }

  const handlePush = async (v: boolean) => {
    setPushOn(v)
    if (authToken) await setPushAlertsEnabled(authToken, v)
  }
  const handleKr = async (v: boolean) => { setKrOn(v); await setKrOpenEnabled(v) }
  const handleUs = async (v: boolean) => { setUsOn(v); await setUsOpenEnabled(v) }
  const handleMinutes = async (m: number) => { setMinutes(m); await setMinutesBefore(m) }

  const togglesDisabled = !hydrated || !authToken

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <Pressable style={styles.signalModalBackdrop} onPress={onClose}>
        {/* BUG fix(v2): card 를 Pressable 로 두면 자식 ScrollView 의 vertical swipe 가
            가로채여 위아래 스크롤이 안 됨. View 로 바꾸면 backdrop 의 hit test 에서
            card 영역은 backdrop 까지 propagate 안 돼서 outside click 닫기는 그대로 작동. */}
        <View style={[styles.signalModalCard, { maxHeight: '85%' }]}>
          {/* 헤더는 ScrollView 밖 고정 — 콘텐츠가 길어 스크롤해도 닫기 버튼이 항상 보이게 */}
          <View style={styles.signalModalHeader}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Bell size={18} color={palette.blue} strokeWidth={2.5} />
              <Text style={styles.signalModalTitle}>알림 설정</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="닫기">
              <X size={20} color={palette.inkMuted} strokeWidth={2.5} />
            </Pressable>
          </View>
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <Text style={[styles.signalModalSubtitle, { marginBottom: 12 }]}>
              장 시작은 로컬 알림, 급등락은 서버 푸시로 보내준다.
            </Text>

            {/* v2: 시장 선호는 헤더 MarketProfileChip 으로 이동. 알림 모달은 알림 전용. */}

            <AlertToggleRow
              title="📈 관심종목 급등락 알림"
              hint="±5% 감지 시 푸시 (서버 발송)"
              value={pushOn}
              disabled={togglesDisabled}
              onValueChange={(v) => void handlePush(v)}
            />
            <AlertToggleRow
              title="🇰🇷 한국장 watch 알림"
              hint="09:00~15:30 KST, 거래일에만"
              value={prefs.krEnabled}
              disabled={togglesDisabled}
              onValueChange={(v) => void updatePref({ krEnabled: v })}
            />
            <AlertToggleRow
              title="🇺🇸 미국장 watch 알림"
              hint="22:30~05:00 KST, 거래일에만 (디폴트 OFF)"
              value={prefs.usEnabled}
              disabled={togglesDisabled}
              onValueChange={(v) => void updatePref({ usEnabled: v })}
            />
            <AlertToggleRow
              title="🌅 모닝 브리프 알림"
              hint="08:30 KST · 야간 미국장 + 보유 종목 공시 통합"
              value={prefs.premarketEnabled}
              disabled={togglesDisabled}
              onValueChange={(v) => void updatePref({ premarketEnabled: v })}
            />
            <AlertToggleRow
              title="🌆 미장 이브닝 브리프"
              hint="06:30 KST · NY 마감 직후 NASDAQ/S&P · 주도주 · 실적"
              value={prefs.eveningBriefEnabled}
              disabled={togglesDisabled}
              onValueChange={(v) => void updatePref({ eveningBriefEnabled: v })}
            />
            <AlertToggleRow
              title="⚠️ 시장 위험도 알림"
              hint="합성 위험도 8/10 이상일 때 · 08:32 KST"
              value={prefs.compositeRiskEnabled}
              disabled={togglesDisabled}
              onValueChange={(v) => void updatePref({ compositeRiskEnabled: v })}
            />
            <AlertToggleRow
              title="🇰🇷 한국장 시작"
              hint="매일 09:00 KST"
              value={krOn}
              disabled={!hydrated}
              onValueChange={(v) => void handleKr(v)}
            />
            <AlertToggleRow
              title="🇺🇸 미국장 시작"
              hint="평일 22:30/23:30 KST (서머타임 자동)"
              value={usOn}
              disabled={!hydrated}
              onValueChange={(v) => void handleUs(v)}
            />

            <MinutesBeforePicker
              value={minutes}
              options={MINUTES_OPTIONS}
              onChange={(m) => void handleMinutes(m)}
            />

            <Text style={styles.signalModalDisclaimer}>
              장 시작 알림은 디바이스 로컬 예약, 급등락 알림은 서버에서 Expo 푸시로 발송한다.
              알림을 끄면 서버에서 이 기기 토큰을 제거해서 더 이상 푸시가 안 온다.
            </Text>

            <NotificationHistorySection
              history={history}
              onClear={() => void handleClearHistory()}
            />
          </ScrollView>
        </View>
      </Pressable>
      </SafeAreaView>
    </Modal>
  )
}
