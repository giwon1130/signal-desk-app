/**
 * v2.1 통합 설정 모달 — 헤더 톱니 → 진입.
 *
 * 모음:
 *  - 시장 선호 (KR/BOTH/US)
 *  - 테마 (light/dark/system)
 *  - 알림 설정 진입 (별도 ReminderSettingsModal)
 *  - 계정 정보 / 로그아웃
 */
import { useEffect, useState } from 'react'
import { Modal, Pressable, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Bell, LogOut, Settings as SettingsIcon, Trash2 } from 'lucide-react-native'
import { useStyles } from '../styles'
import { useTheme } from '../theme'
import type { MarketPreference } from '../api/alertPreferences'
import { ModalHeader } from './ModalHeader'
import { MarketPreferencePicker } from './reminder_parts/MarketPreferencePicker'
import { fetchMyPlanRequest, requestPro, type PlanRequestStatus } from '../api/plan'
import { PRO_BENEFITS } from '../lib/entitlements'

type ThemeMode = 'system' | 'light' | 'dark'

type Props = {
  visible: boolean
  user: { nickname?: string | null; email?: string | null; plan?: string } | null
  marketPreference: MarketPreference
  themeMode: ThemeMode
  authToken: string | null
  onClose: () => void
  onMarketPreferenceChange: (p: MarketPreference) => void
  onThemeChange: (m: ThemeMode) => void
  onOpenReminder: () => void
  onLogout: () => void
  onDeleteAccount: () => void
}

export function SettingsModal({
  visible, user, marketPreference, themeMode, authToken,
  onClose, onMarketPreferenceChange, onThemeChange, onOpenReminder, onLogout, onDeleteAccount,
}: Props) {
  const styles = useStyles()
  const { palette } = useTheme()
  const insets = useSafeAreaInsets()

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: palette.bg, paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <ModalHeader icon={SettingsIcon} title="설정" onClose={onClose} />

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 14, gap: 18 }}>
          {/* 계정 정보 카드 */}
          {user ? (
            <View style={{
              backgroundColor: palette.surface, borderRadius: 12,
              borderWidth: 1, borderColor: palette.border, padding: 14, gap: 4,
            }}>
              <Text style={{ color: palette.inkMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1 }}>
                계정
              </Text>
              <Text style={{ color: palette.ink, fontSize: 15, fontWeight: '800' }}>
                {user.nickname || '익명'}
              </Text>
              {user.email ? (
                <Text style={{ color: palette.inkMuted, fontSize: 12 }}>{user.email}</Text>
              ) : null}
            </View>
          ) : null}

          {/* 플랜 — PRO 신청 (결제 전 수동 승인 퍼널) */}
          {user && authToken ? <PlanSection plan={user.plan ?? 'FREE'} palette={palette} /> : null}

          {/* 시장 선호 — 헤더 칩과 동기 (둘 다에서 변경 가능) */}
          <Section title="시장 선호" palette={palette}>
            <MarketPreferencePicker
              value={marketPreference}
              disabled={!authToken}
              onChange={onMarketPreferenceChange}
            />
            <Text style={{ color: palette.inkFaint, fontSize: 11, marginTop: 4 }}>
              헤더 칩과 같이 동작 — 어디서 바꿔도 즉시 반영
            </Text>
          </Section>

          {/* 테마 */}
          <Section title="테마" palette={palette}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {(['system', 'light', 'dark'] as ThemeMode[]).map((m) => {
                const active = themeMode === m
                const label = m === 'system' ? '시스템' : m === 'light' ? '라이트' : '다크'
                return (
                  <Pressable
                    key={m}
                    onPress={() => onThemeChange(m)}
                    style={[styles.filterChip, active && styles.filterChipActive, { flex: 1 }]}
                  >
                    <Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text>
                  </Pressable>
                )
              })}
            </View>
            <Text style={{ color: palette.inkFaint, fontSize: 11, marginTop: 4 }}>
              v2 는 다크 기본 — '대시보드 프로' 톤
            </Text>
          </Section>

          {/* 알림 진입 */}
          <Pressable
            onPress={() => {
              // iOS 는 닫히는 모달 위에 다른 모달을 즉시 띄우면 무시되는 경우가 있음 → 닫힘 애니메이션 후 열기.
              onClose()
              setTimeout(onOpenReminder, 350)
            }}
            style={({ pressed }) => ({
              backgroundColor: pressed ? palette.surfaceAlt : palette.surface,
              borderRadius: 12, borderWidth: 1, borderColor: palette.border,
              padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12,
            })}
          >
            <View style={{
              width: 36, height: 36, borderRadius: 10,
              backgroundColor: palette.blueSoft,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Bell size={18} color={palette.blue} strokeWidth={2.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: palette.ink, fontSize: 14, fontWeight: '800' }}>알림 설정</Text>
              <Text style={{ color: palette.inkMuted, fontSize: 11 }}>
                급등락·거래량·브리프·위험도·장 시작·방해금지
              </Text>
            </View>
            <Text style={{ color: palette.inkFaint, fontSize: 14 }}>›</Text>
          </Pressable>

          {/* 로그아웃 */}
          <Pressable
            onPress={onLogout}
            style={({ pressed }) => ({
              backgroundColor: pressed ? palette.redSoft : 'transparent',
              borderRadius: 12, borderWidth: 1, borderColor: palette.red,
              padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
              marginTop: 8,
            })}
          >
            <LogOut size={15} color={palette.red} strokeWidth={2.5} />
            <Text style={{ color: palette.red, fontSize: 14, fontWeight: '800' }}>로그아웃</Text>
          </Pressable>

          {/* 회원 탈퇴 */}
          {user ? (
            <Pressable
              onPress={onDeleteAccount}
              style={({ pressed }) => ({
                opacity: pressed ? 0.6 : 1,
                paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
              })}
            >
              <Trash2 size={13} color={palette.inkFaint} strokeWidth={2.5} />
              <Text style={{ color: palette.inkFaint, fontSize: 12, fontWeight: '700' }}>회원 탈퇴</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  )
}

/** 플랜 카드 — 현재 플랜 + PRO 혜택 + 신청 버튼(신청됨이면 접수 상태 표시). */
function PlanSection({ plan, palette }: { plan: string; palette: any }) {
  const [status, setStatus] = useState<PlanRequestStatus>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const pro = plan === 'PRO'

  useEffect(() => {
    if (pro) return
    let alive = true
    void fetchMyPlanRequest().then((s) => { if (alive) setStatus(s) })
    return () => { alive = false }
  }, [pro])

  const handleRequest = async () => {
    if (busy) return
    setBusy(true)
    const { ok, message: msg } = await requestPro()
    if (ok) setStatus('PENDING')
    setMessage(msg)
    setBusy(false)
  }

  return (
    <View style={{
      backgroundColor: pro ? (palette.purpleSoft ?? palette.surface) : palette.surface,
      borderRadius: 12, borderWidth: 1,
      borderColor: pro ? (palette.purple ?? '#7c3aed') : palette.border,
      padding: 14, gap: 6,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text style={{ color: palette.inkMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1 }}>플랜</Text>
        <View style={{ backgroundColor: pro ? (palette.purple ?? '#7c3aed') : palette.surfaceAlt, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 }}>
          <Text style={{ color: pro ? '#fff' : palette.inkSub, fontSize: 10.5, fontWeight: '900' }}>{pro ? '💎 PRO' : 'FREE'}</Text>
        </View>
      </View>
      {pro ? (
        <Text style={{ color: palette.inkSub, fontSize: 12 }}>시데 AI 하루 100회 등 PRO 혜택 이용 중이에요.</Text>
      ) : (
        <>
          <Text style={{ color: palette.inkSub, fontSize: 12, lineHeight: 17 }}>
            PRO 가 되면 아래가 한 번에 열려요.
          </Text>
          <View style={{ gap: 4, marginTop: 2 }}>
            <View style={{ flexDirection: 'row' }}>
              <Text style={{ flex: 1 }} />
              <Text style={{ width: 64, textAlign: 'center', color: palette.inkFaint, fontSize: 9.5, fontWeight: '800' }}>FREE</Text>
              <Text style={{ width: 84, textAlign: 'center', color: palette.purple ?? '#7c3aed', fontSize: 9.5, fontWeight: '900' }}>PRO</Text>
            </View>
            {PRO_BENEFITS.map((b) => (
              <View key={b.title} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ flex: 1, color: palette.inkSub, fontSize: 11 }} numberOfLines={1}>{b.icon} {b.title}</Text>
                <Text style={{ width: 64, textAlign: 'center', color: palette.inkFaint, fontSize: 10 }}>{b.free}</Text>
                <Text style={{ width: 84, textAlign: 'center', color: palette.ink, fontSize: 10, fontWeight: '800' }}>{b.pro}</Text>
              </View>
            ))}
          </View>
          <Text style={{ color: palette.inkMuted, fontSize: 11, lineHeight: 16, marginTop: 4 }}>
            🚧 PRO는 아직 베타 준비 중이에요. 지금 신청해두면 정식 오픈 때 순차적으로 안내드릴게요. (현재는 바로 승인되지 않아요)
          </Text>
          {status === 'PENDING' ? (
            <Text style={{ color: palette.purple ?? '#7c3aed', fontSize: 12, fontWeight: '800' }}>
              ⏳ 신청 접수됨 — 정식 오픈 때 순차적으로 안내드려요
            </Text>
          ) : status === 'DISMISSED' ? (
            <>
              <Text style={{ color: palette.inkMuted, fontSize: 11.5 }}>
                이전 신청이 보류됐어요. 다시 신청할 수 있어요.
              </Text>
              <Pressable
                onPress={() => void handleRequest()}
                disabled={busy}
                style={{
                  backgroundColor: palette.purple ?? '#7c3aed', borderRadius: 9,
                  paddingVertical: 9, alignItems: 'center', opacity: busy ? 0.6 : 1, marginTop: 2,
                }}
              >
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>{busy ? '신청 중...' : '다시 신청하기'}</Text>
              </Pressable>
            </>
          ) : (
            <Pressable
              onPress={() => void handleRequest()}
              disabled={busy}
              style={{
                backgroundColor: palette.purple ?? '#7c3aed', borderRadius: 9,
                paddingVertical: 9, alignItems: 'center', opacity: busy ? 0.6 : 1, marginTop: 2,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>{busy ? '신청 중...' : 'PRO 신청하기'}</Text>
            </Pressable>
          )}
          {message ? <Text style={{ color: palette.inkMuted, fontSize: 11 }}>{message}</Text> : null}
        </>
      )}
    </View>
  )
}

function Section({ title, palette, children }: { title: string; palette: any; children: React.ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: palette.inkMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1 }}>
        {title.toUpperCase()}
      </Text>
      {children}
    </View>
  )
}
