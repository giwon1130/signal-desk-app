/**
 * PRO 업그레이드 — 공용 컴포넌트.
 * - ProBadge: 작은 💎 PRO 배지
 * - ProLockRow: 잠긴 기능 줄(자물쇠 + 설명) — 탭하면 업그레이드 시트 열기
 * - ProUpgradeSheet: 혜택 비교 + 신청 버튼(기존 requestPro 재사용, 베타 무료 안내)
 */
import { useEffect, useState } from 'react'
import { Modal, Pressable, ScrollView, Text, View } from 'react-native'
import { Lock, X } from 'lucide-react-native'
import { useTheme } from '../../theme'
import { PRO_BENEFITS } from '../../lib/entitlements'
import { fetchMyPlanRequest, requestPro, type PlanRequestStatus } from '../../api/plan'

const PURPLE = '#7c3aed'

export function ProBadge() {
  const { palette } = useTheme()
  return (
    <View style={{ backgroundColor: (palette.purple ?? PURPLE), borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1 }}>
      <Text style={{ color: '#fff', fontSize: 9.5, fontWeight: '900' }}>💎 PRO</Text>
    </View>
  )
}

export function ProLockRow({ title, hint, onPress }: { title: string; hint?: string; onPress: () => void }) {
  const { palette } = useTheme()
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingVertical: 9, paddingHorizontal: 10, borderRadius: 10,
        backgroundColor: pressed ? palette.surfaceAlt : palette.surface,
        borderWidth: 1, borderColor: palette.border, opacity: pressed ? 0.85 : 1,
      })}
    >
      <Lock size={14} color={palette.inkMuted} strokeWidth={2.2} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ color: palette.inkSub, fontSize: 12.5, fontWeight: '700' }} numberOfLines={1}>{title}</Text>
        {hint ? <Text style={{ color: palette.inkFaint, fontSize: 10.5 }} numberOfLines={1}>{hint}</Text> : null}
      </View>
      <ProBadge />
    </Pressable>
  )
}

export function ProUpgradeSheet({
  visible,
  onClose,
  plan,
}: {
  visible: boolean
  onClose: () => void
  plan?: string | null
}) {
  const { palette } = useTheme()
  const purple = palette.purple ?? PURPLE
  const [status, setStatus] = useState<PlanRequestStatus>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!visible) return
    setMessage('')
    let alive = true
    void fetchMyPlanRequest().then((s) => { if (alive) setStatus(s) })
    return () => { alive = false }
  }, [visible])

  const handleRequest = async () => {
    if (busy) return
    setBusy(true)
    const { ok, message: msg } = await requestPro()
    if (ok) setStatus('PENDING')
    setMessage(msg)
    setBusy(false)
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' }}>
        <View style={{ backgroundColor: palette.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 18, paddingTop: 16, paddingBottom: 28, maxHeight: '88%' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Text style={{ color: palette.ink, fontSize: 18, fontWeight: '900', flex: 1 }}>💎 시데 PRO</Text>
            <Pressable onPress={onClose} hitSlop={8}><X size={20} color={palette.inkMuted} /></Pressable>
          </View>
          <Text style={{ color: palette.inkSub, fontSize: 12.5, lineHeight: 18, marginBottom: 12 }}>
            FREE 는 맛보기, PRO 는 진짜 트레이딩 도구. 아래 혜택이 한 번에 열려요.
          </Text>

          <ScrollView style={{ alignSelf: 'stretch' }} contentContainerStyle={{ gap: 6, paddingBottom: 4 }}>
            <View style={{ flexDirection: 'row', paddingHorizontal: 4, paddingBottom: 2 }}>
              <Text style={{ flex: 1 }} />
              <Text style={{ width: 70, textAlign: 'center', color: palette.inkFaint, fontSize: 10, fontWeight: '800' }}>FREE</Text>
              <Text style={{ width: 92, textAlign: 'center', color: purple, fontSize: 10, fontWeight: '900' }}>PRO</Text>
            </View>
            {PRO_BENEFITS.map((b) => (
              <View key={b.title} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: palette.surface, borderRadius: 10, borderWidth: 1, borderColor: palette.border, paddingVertical: 8, paddingHorizontal: 10 }}>
                <Text style={{ flex: 1, color: palette.inkSub, fontSize: 12, fontWeight: '700' }}>{b.icon} {b.title}</Text>
                <Text style={{ width: 70, textAlign: 'center', color: palette.inkFaint, fontSize: 11 }}>{b.free}</Text>
                <Text style={{ width: 92, textAlign: 'center', color: palette.ink, fontSize: 11, fontWeight: '800' }}>{b.pro}</Text>
              </View>
            ))}
          </ScrollView>

          <Text style={{ color: palette.inkMuted, fontSize: 11, lineHeight: 16, marginTop: 12 }}>
            🎉 베타 기간엔 결제 없이 무료로 승인해 드려요. 신청하면 검토 후 알림으로 알려드립니다.
          </Text>

          {status === 'PENDING' ? (
            <Text style={{ color: purple, fontSize: 13, fontWeight: '800', marginTop: 10, textAlign: 'center' }}>
              ⏳ 신청 검토 중 — 승인되면 알림으로 알려드려요
            </Text>
          ) : (
            <Pressable
              onPress={() => void handleRequest()}
              disabled={busy}
              style={({ pressed }) => ({
                marginTop: 12, backgroundColor: purple, borderRadius: 12, paddingVertical: 13,
                alignItems: 'center', opacity: pressed || busy ? 0.7 : 1,
              })}
            >
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>
                {busy ? '신청 중...' : (status === 'DISMISSED' ? '다시 신청하기' : 'PRO 신청하기')}
              </Text>
            </Pressable>
          )}
          {message ? <Text style={{ color: palette.inkMuted, fontSize: 11, marginTop: 6, textAlign: 'center' }}>{message}</Text> : null}
        </View>
      </View>
    </Modal>
  )
}
