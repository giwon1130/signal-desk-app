import { useEffect, useState } from 'react'
import { Dimensions, Modal, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
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
import { DEFAULT_ALERT_PREFERENCES, getAlertPreferences, updateAlertPreferences, type AlertPreferences } from '../api/alertPreferences'
import { AlertToggleRow } from './reminder_parts/AlertToggleRow'
import { AlertGroup } from './reminder_parts/AlertGroup'
import { MinutesBeforePicker } from './reminder_parts/MinutesBeforePicker'

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
  const [prefs, setPrefs] = useState<AlertPreferences>(DEFAULT_ALERT_PREFERENCES)

  // 모달 열릴 때마다 현재 저장값 hydrate
  useEffect(() => {
    if (!visible) return
    void (async () => {
      const [p, a, b, c, sp] = await Promise.all([
        getPushAlertsEnabled(),
        getKrOpenEnabled(),
        getUsOpenEnabled(),
        getMinutesBefore(),
        authToken ? getAlertPreferences(authToken) : Promise.resolve(prefs),
      ])
      setPushOn(p)
      setKrOn(a)
      setUsOn(b)
      setMinutes(c)
      setPrefs(sp)
      setHydrated(true)
    })()
  }, [visible])

  const updatePref = async (patch: Partial<AlertPreferences>) => {
    const next = { ...prefs, ...patch }
    setPrefs(next)
    if (authToken) await updateAlertPreferences(authToken, next)
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
        <View style={styles.signalModalCard}>
          {/* 헤더는 ScrollView 밖 고정 — 콘텐츠가 길어 스크롤해도 닫기 버튼이 항상 보이게 */}
          <View style={styles.signalModalHeader}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Bell size={18} color={palette.blue} strokeWidth={2.5} />
              <Text style={styles.signalModalTitle}>알림 설정</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={20} accessibilityLabel="닫기">
              <X size={20} color={palette.inkMuted} strokeWidth={2.5} />
            </Pressable>
          </View>
          {/* 카드가 content-sized 라 ScrollView 에 flex:1 을 주면 0 으로 붕괴(헤더만 보임).
              CompositeRiskCard 와 동일하게 maxHeight 로 캡 + 스크롤. */}
          <ScrollView style={{ maxHeight: Dimensions.get('window').height * 0.7 }} showsVerticalScrollIndicator={false}>
            <Text style={[styles.signalModalSubtitle, { marginBottom: 12 }]}>
              장 시작은 로컬 알림, 급등락은 서버 푸시로 보내준다.
            </Text>

            {/* v2: 시장 선호는 헤더 MarketProfileChip 으로 이동. 알림 모달은 알림 전용. */}

            {/* 종목 급등락 (서버 푸시) — 단독 */}
            <View style={{ borderTopWidth: 1, borderTopColor: palette.border }}>
              <AlertToggleRow
                title="📈 관심종목 급등락 알림"
                hint="±5% 감지 시 푸시 (서버 발송)"
                value={pushOn}
                disabled={togglesDisabled}
                onValueChange={(v) => void handlePush(v)}
              />
            </View>

            {/* 거래량 급증 알림 — 전역 토글 (종목별 설정과 별개) */}
            <View style={{ borderTopWidth: 1, borderTopColor: palette.border }}>
              <AlertToggleRow
                title="🔥 거래량 급증 알림"
                hint="평소 대비 2배 이상 · 보유/관심 전 종목 적용"
                value={prefs.volumeAlertEnabled}
                disabled={togglesDisabled}
                onValueChange={(v) => void updatePref({ volumeAlertEnabled: v })}
              />
            </View>

            {/* 브리프 그룹 */}
            <AlertGroup
              title="📰 브리프 알림"
              subtitle="모닝 · 마감 · 미국 마감"
              master={prefs.premarketEnabled || prefs.closeBriefEnabled || prefs.eveningBriefEnabled}
              disabled={togglesDisabled}
              onToggleAll={(v) => void updatePref({ premarketEnabled: v, closeBriefEnabled: v, eveningBriefEnabled: v })}
            >
              <AlertToggleRow compact title="🌅 모닝 브리프" hint="08:30 KST · 야간 미국장 + 보유 공시" value={prefs.premarketEnabled} disabled={togglesDisabled} onValueChange={(v) => void updatePref({ premarketEnabled: v })} />
              <AlertToggleRow compact title="🔔 마감 브리프" hint="15:40 KST · 마감 정리 + 내일 관전" value={prefs.closeBriefEnabled} disabled={togglesDisabled} onValueChange={(v) => void updatePref({ closeBriefEnabled: v })} />
              <AlertToggleRow compact title="🌆 미국장 마감 브리프 (새벽)" hint="06:30 KST · NY 마감 직후 주도주·실적" value={prefs.eveningBriefEnabled} disabled={togglesDisabled} onValueChange={(v) => void updatePref({ eveningBriefEnabled: v })} />
            </AlertGroup>

            {/* 관심종목 watch 그룹 */}
            <AlertGroup
              title="👀 관심종목 watch 알림"
              subtitle="장중 가격 감시 알림"
              master={prefs.krEnabled || prefs.usEnabled}
              disabled={togglesDisabled}
              onToggleAll={(v) => void updatePref({ krEnabled: v, usEnabled: v })}
            >
              <AlertToggleRow compact title="🇰🇷 한국장" hint="09:00~15:30 KST, 거래일에만" value={prefs.krEnabled} disabled={togglesDisabled} onValueChange={(v) => void updatePref({ krEnabled: v })} />
              <AlertToggleRow compact title="🇺🇸 미국장" hint="22:30~05:00 KST, 거래일에만" value={prefs.usEnabled} disabled={togglesDisabled} onValueChange={(v) => void updatePref({ usEnabled: v })} />
            </AlertGroup>

            {/* 장 시작 그룹 (로컬 알림) */}
            <AlertGroup
              title="⏰ 장 시작 알림"
              subtitle="장 열리기 전 디바이스 알림"
              master={krOn || usOn}
              disabled={!hydrated}
              onToggleAll={(v) => { void handleKr(v); void handleUs(v) }}
            >
              <AlertToggleRow compact title="🇰🇷 한국장 시작" hint="매일 09:00 KST" value={krOn} disabled={!hydrated} onValueChange={(v) => void handleKr(v)} />
              <AlertToggleRow compact title="🇺🇸 미국장 시작" hint="평일 22:30/23:30 KST (서머타임 자동)" value={usOn} disabled={!hydrated} onValueChange={(v) => void handleUs(v)} />
              <MinutesBeforePicker value={minutes} options={MINUTES_OPTIONS} onChange={(m) => void handleMinutes(m)} />
            </AlertGroup>

            {/* 시장 위험도 — 단독 */}
            <View style={{ borderTopWidth: 1, borderTopColor: palette.border }}>
              <AlertToggleRow
                title="⚠️ 시장 위험도 알림"
                hint="합성 위험도 8/10 이상 · 08:32 KST"
                value={prefs.compositeRiskEnabled}
                disabled={togglesDisabled}
                onValueChange={(v) => void updatePref({ compositeRiskEnabled: v })}
              />
            </View>

            {/* 방해금지 — 야간 푸시 보류 */}
            <View style={{ borderTopWidth: 1, borderTopColor: palette.border }}>
              <AlertToggleRow
                title="🌙 방해금지 시간"
                hint={
                  prefs.quietHoursEnabled
                    ? `${String(prefs.quietStartHour).padStart(2, '0')}:00 ~ ${String(prefs.quietEndHour).padStart(2, '0')}:00 푸시 보류`
                    : '야간 시간대 푸시 보류'
                }
                value={prefs.quietHoursEnabled}
                disabled={togglesDisabled}
                onValueChange={(v) => void updatePref({ quietHoursEnabled: v })}
              />
              {prefs.quietHoursEnabled ? (
                <View style={{ paddingHorizontal: 4, paddingBottom: 10, gap: 8 }}>
                  <HourStepper
                    label="시작"
                    hour={prefs.quietStartHour}
                    disabled={togglesDisabled}
                    onChange={(h) => void updatePref({ quietStartHour: h })}
                  />
                  <HourStepper
                    label="종료"
                    hour={prefs.quietEndHour}
                    disabled={togglesDisabled}
                    onChange={(h) => void updatePref({ quietEndHour: h })}
                  />
                  <Text style={{ color: palette.inkFaint, fontSize: 10 }}>
                    KST 기준 · 자정을 넘겨도 됨(예: 22시~7시). 이 시간대엔 알림이 오지 않아요.
                  </Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.signalModalDisclaimer}>
              장 시작 알림은 디바이스 로컬 예약, 급등락 알림은 서버에서 Expo 푸시로 발송한다.
              알림을 끄면 서버에서 이 기기 토큰을 제거해서 더 이상 푸시가 안 온다.
            </Text>
          </ScrollView>
        </View>
      </Pressable>
      </SafeAreaView>
    </Modal>
  )
}

/** 0~23시 순환 스테퍼. */
function HourStepper({
  label, hour, disabled, onChange,
}: { label: string; hour: number; disabled?: boolean; onChange: (h: number) => void }) {
  const { palette } = useTheme()
  const step = (delta: number) => onChange((hour + delta + 24) % 24)
  const btn = (text: string, delta: number) => (
    <Pressable
      onPress={() => !disabled && step(delta)}
      hitSlop={8}
      style={({ pressed }) => ({
        width: 34, height: 34, borderRadius: 8,
        borderWidth: 1, borderColor: palette.border,
        backgroundColor: pressed ? palette.surfaceAlt : palette.surface,
        alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.4 : 1,
      })}
    >
      <Text style={{ color: palette.ink, fontSize: 18, fontWeight: '800' }}>{text}</Text>
    </Pressable>
  )
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Text style={{ color: palette.inkMuted, fontSize: 12, fontWeight: '800', width: 36 }}>{label}</Text>
      {btn('−', -1)}
      <Text style={{ color: palette.ink, fontSize: 15, fontWeight: '900', width: 56, textAlign: 'center', fontVariant: ['tabular-nums'] }}>
        {String(hour).padStart(2, '0')}:00
      </Text>
      {btn('+', +1)}
    </View>
  )
}
