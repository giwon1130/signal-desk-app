/**
 * 리딩 둘러보기 — 승인된 리더 목록(적중률·구독자 순)에서 코드 없이 바로 구독.
 * 신규 사용자가 친구 코드 없이도 리더를 발견해 구독할 수 있는 진입점.
 */
import { useEffect, useState } from 'react'
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Megaphone } from 'lucide-react-native'
import { ModalHeader } from '../ModalHeader'
import { useTheme, type Palette } from '../../theme'
import { fetchDiscoverLeaders, subscribeByLeaderId, type LeaderCard } from '../../api/reading'
import { fmtPct } from './readingShared'
import { apiErrorMessage } from '../../utils/apiError'

type SortKey = 'hit' | 'followers' | 'calls'

type Props = {
  visible: boolean
  onClose: () => void
  onOpenLeader?: (leaderUserId: string) => void
  onSubscribed?: () => void
  toast?: { show: (msg: string, type?: 'success' | 'error' | 'info') => void }
}

export function DiscoverLeadersModal({ visible, onClose, onOpenLeader, onSubscribed, toast }: Props) {
  const { palette } = useTheme()
  const insets = useSafeAreaInsets()
  const [leaders, setLeaders] = useState<LeaderCard[]>([])
  const [loading, setLoading] = useState(false)
  const [busyId, setBusyId] = useState('')
  const [sort, setSort] = useState<SortKey>('hit')

  const load = async () => {
    setLoading(true)
    setLeaders(await fetchDiscoverLeaders())
    setLoading(false)
  }
  useEffect(() => { if (visible) void load() }, [visible])

  // 정렬 — 적중률(검증)/구독자(인기)/콜 많은 순. 콜 0건은 항상 뒤로(통계 의미 없음).
  const sortedLeaders = [...leaders].sort((a, b) => {
    if (sort === 'hit') {
      if ((a.totalCalls === 0) !== (b.totalCalls === 0)) return a.totalCalls === 0 ? 1 : -1
      return b.hitRate - a.hitRate || b.followerCount - a.followerCount
    }
    if (sort === 'followers') return b.followerCount - a.followerCount
    return b.totalCalls - a.totalCalls // 'calls'
  })

  const handleSubscribe = async (l: LeaderCard) => {
    if (busyId) return
    setBusyId(l.userId)
    try {
      await subscribeByLeaderId(l.userId)
      setLeaders((list) => list.map((x) => (x.userId === l.userId ? { ...x, following: true, followerCount: x.followerCount + 1 } : x)))
      toast?.show(`${l.displayName}님 구독 완료`, 'success')
      onSubscribed?.()
    } catch (e) {
      // 서버 메시지(예: "AI 리더 구독은 PRO 전용...") 그대로 노출.
      toast?.show(apiErrorMessage(e, '구독에 실패했어요. 잠시 후 다시 시도해 주세요'), 'error')
    } finally {
      setBusyId('')
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: palette.bg, paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <ModalHeader icon={Megaphone} title="리더 둘러보기" onClose={onClose} />
        <ScrollView contentContainerStyle={{ padding: 14, gap: 10 }}>
          <Text style={{ color: palette.inkMuted, fontSize: 12, lineHeight: 18 }}>
            적중률이 검증된 리더를 구독하면 그분의 종목 콜이 내 피드에 올라와요.
          </Text>
          {/* 정렬 탭 — 적중률(검증)/구독자(인기)/콜 많은 순 */}
          {leaders.length > 1 ? (
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {([['hit', '적중률순'], ['followers', '인기순'], ['calls', '콜 많은 순']] as const).map(([k, label]) => {
                const active = sort === k
                return (
                  <Pressable
                    key={k}
                    onPress={() => setSort(k)}
                    style={{
                      paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999,
                      backgroundColor: active ? palette.brandAccent + '22' : 'transparent',
                      borderWidth: 1, borderColor: active ? palette.brandAccent : palette.border,
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '800', color: active ? palette.brandAccent : palette.inkMuted }}>{label}</Text>
                  </Pressable>
                )
              })}
            </View>
          ) : null}
          {loading ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}><ActivityIndicator color={palette.brandAccent} /></View>
          ) : leaders.length === 0 ? (
            <View style={{ paddingVertical: 40, alignItems: 'center', gap: 6 }}>
              <Megaphone size={26} color={palette.inkFaint} strokeWidth={1.8} />
              <Text style={{ color: palette.inkMuted, fontSize: 13, fontWeight: '700' }}>아직 공개된 리더가 없어요</Text>
              <Text style={{ color: palette.inkFaint, fontSize: 11, textAlign: 'center' }}>친구의 구독 코드가 있으면 코드로 구독할 수 있어요</Text>
            </View>
          ) : (
            sortedLeaders.map((l) => (
              <View key={l.userId} style={{ backgroundColor: palette.surface, borderRadius: 12, borderWidth: 1, borderColor: palette.border, padding: 14, gap: 8 }}>
                <Pressable onPress={() => onOpenLeader?.(l.userId)} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, gap: 3 })}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ color: palette.ink, fontSize: 15, fontWeight: '800', flexShrink: 1 }} numberOfLines={1}>{l.displayName}</Text>
                    {l.isAi ? (
                      <View style={{ backgroundColor: (palette.purple ?? '#7c3aed') + '22', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1, flexShrink: 0 }}>
                        <Text style={{ color: palette.purple ?? '#7c3aed', fontSize: 9.5, fontWeight: '900' }}>AI · 💎 PRO</Text>
                      </View>
                    ) : null}
                  </View>
                  {l.bio ? <Text style={{ color: palette.inkMuted, fontSize: 12, lineHeight: 17 }} numberOfLines={2}>{l.bio}</Text> : null}
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 2 }}>
                    <Stat label="적중률" value={l.totalCalls > 0 ? `${Math.round(l.hitRate * 100)}%` : '—'} accent={palette.up} palette={palette} />
                    <Stat label="평균" value={l.avgReturnPct == null ? '—' : fmtPct(l.avgReturnPct)} accent={l.avgReturnPct != null && l.avgReturnPct < 0 ? palette.down : palette.up} palette={palette} />
                    <Stat label="콜" value={`${l.totalCalls}`} palette={palette} />
                    <Stat label="구독자" value={`${l.followerCount}`} palette={palette} />
                  </View>
                </Pressable>
                <Pressable
                  onPress={() => void handleSubscribe(l)}
                  disabled={l.following || busyId === l.userId}
                  style={({ pressed }) => ({
                    backgroundColor: l.following ? palette.surfaceAlt : (pressed ? palette.brandAccent + 'cc' : palette.brandAccent),
                    borderRadius: 10, paddingVertical: 10, alignItems: 'center',
                    borderWidth: l.following ? 1 : 0, borderColor: palette.border,
                    opacity: busyId === l.userId ? 0.6 : 1,
                  })}
                >
                  <Text style={{ color: l.following ? palette.inkSub : palette.bg, fontSize: 13, fontWeight: '800' }}>
                    {busyId === l.userId ? '구독 중…' : l.following ? '구독 중 ✓' : '구독하기'}
                  </Text>
                </Pressable>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </Modal>
  )
}

function Stat({ label, value, palette, accent }: { label: string; value: string; palette: Palette; accent?: string }) {
  return (
    <View style={{ gap: 1 }}>
      <Text style={{ color: accent ?? palette.ink, fontSize: 13, fontWeight: '900', fontVariant: ['tabular-nums'] }}>{value}</Text>
      <Text style={{ color: palette.inkFaint, fontSize: 9, fontWeight: '700' }}>{label}</Text>
    </View>
  )
}
