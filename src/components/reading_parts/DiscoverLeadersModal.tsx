/**
 * 리딩 둘러보기 — 승인된 리더의 누적 콜·확정 성과를 비교해 코드 없이 구독.
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
import { ProUpgradeSheet } from '../pro/ProUpgrade'

type SortKey = 'hit' | 'followers' | 'calls'

const MIN_COMPARABLE_CALLS = 3

type Props = {
  visible: boolean
  onClose: () => void
  onOpenLeader?: (leaderUserId: string) => void
  onSubscribed?: () => void
  toast?: { show: (msg: string, type?: 'success' | 'error' | 'info') => void }
  /** PRO 여부 — AI 리더 구독은 PRO 전용 */
  isPro?: boolean
}

export function DiscoverLeadersModal({ visible, onClose, onOpenLeader, onSubscribed, toast, isPro = false }: Props) {
  const { palette } = useTheme()
  const insets = useSafeAreaInsets()
  const [leaders, setLeaders] = useState<LeaderCard[]>([])
  const [loading, setLoading] = useState(false)
  const [busyId, setBusyId] = useState('')
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [sort, setSort] = useState<SortKey>('hit')

  const load = async () => {
    setLoading(true)
    setLeaders(await fetchDiscoverLeaders())
    setLoading(false)
  }
  useEffect(() => { if (visible) void load() }, [visible])

  // 성과 비교는 확정 콜이 어느 정도 쌓인 리더를 먼저 보여준다.
  // 표본이 1~2건인 높은 적중률이 상단을 독점하지 않게 한다.
  const sortedLeaders = [...leaders].sort((a, b) => {
    if (sort === 'hit') {
      const aComparable = a.resolvedCalls >= MIN_COMPARABLE_CALLS
      const bComparable = b.resolvedCalls >= MIN_COMPARABLE_CALLS
      if (aComparable !== bComparable) return aComparable ? -1 : 1
      return b.hitRate - a.hitRate || b.resolvedCalls - a.resolvedCalls || b.followerCount - a.followerCount
    }
    if (sort === 'followers') return b.followerCount - a.followerCount
    return b.totalCalls - a.totalCalls // 'calls'
  })

  const handleSubscribe = async (l: LeaderCard) => {
    if (busyId) return
    // AI 리더는 PRO 전용 — FREE면 구독 대신 업그레이드 시트로.
    if (l.isAi && !isPro) { setUpgradeOpen(true); return }
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
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 36 }}>
          <View style={{ backgroundColor: palette.surfaceAlt, borderRadius: 14, paddingHorizontal: 13, paddingVertical: 11 }}>
            <Text style={{ color: palette.inkMuted, fontSize: 12, lineHeight: 18 }}>
              확정된 종목 콜의 결과와 표본 수를 함께 비교해요. 적중률만 높고 표본이 적은 리더는 순위에서 뒤로 배치합니다.
            </Text>
          </View>
          {/* 정렬 탭 — 성과 검증/구독자/누적 콜 순 */}
          {leaders.length > 1 ? (
            <View style={{ flexDirection: 'row', gap: 4, backgroundColor: palette.surfaceAlt, borderRadius: 13, padding: 4 }}>
              {([['hit', '성과 확인순'], ['followers', '인기순'], ['calls', '콜 많은 순']] as const).map(([k, label]) => {
                const active = sort === k
                return (
                  <Pressable
                    key={k}
                    onPress={() => setSort(k)}
                    style={{
                      flex: 1, alignItems: 'center', paddingHorizontal: 7, paddingVertical: 8, borderRadius: 10,
                      backgroundColor: active ? palette.surface : 'transparent',
                      borderWidth: 1, borderColor: active ? palette.borderLight : 'transparent',
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: active ? '900' : '700', color: active ? palette.ink : palette.inkMuted }}>{label}</Text>
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
              <View key={l.userId} style={{ backgroundColor: palette.surface, borderRadius: 18, borderWidth: 1, borderColor: palette.borderLight, padding: 16, gap: 12 }}>
                <Pressable onPress={() => onOpenLeader?.(l.userId)} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, gap: 3 })}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ width: 38, height: 38, borderRadius: 13, backgroundColor: l.isAi ? palette.purpleSoft : palette.greenSoft, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: l.isAi ? palette.purple : palette.brandAccent, fontSize: 15, fontWeight: '900' }}>{l.displayName.slice(0, 1)}</Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                      <Text style={{ color: palette.ink, fontSize: 15, fontWeight: '900' }} numberOfLines={1}>{l.displayName}</Text>
                      <Text style={{ color: palette.inkFaint, fontSize: 10.5, fontWeight: '700' }}>구독자 {l.followerCount}명 · 누적 콜 {l.totalCalls}건</Text>
                    </View>
                    {l.isAi ? (
                      <View style={{ backgroundColor: palette.purpleSoft, borderRadius: 7, paddingHorizontal: 7, paddingVertical: 3 }}>
                        <Text style={{ color: palette.purple, fontSize: 9.5, fontWeight: '900' }}>AI · PRO</Text>
                      </View>
                    ) : null}
                  </View>
                  {l.bio ? <Text style={{ color: palette.inkMuted, fontSize: 12, lineHeight: 18, marginTop: 7 }} numberOfLines={2}>{l.bio}</Text> : null}
                  {l.isAi && l.totalCalls === 0 ? (
                    <View style={{ backgroundColor: palette.surfaceAlt, borderRadius: 12, padding: 12, gap: 2, marginTop: 7 }}>
                      <Text style={{ color: palette.purple, fontSize: 12, fontWeight: '900' }}>AI 시황 리딩</Text>
                      <Text style={{ color: palette.inkMuted, fontSize: 10.5, lineHeight: 15 }}>종목 콜 대신 장 흐름과 주요 재료를 정리해요.</Text>
                    </View>
                  ) : (
                    <PerformanceSummary leader={l} palette={palette} />
                  )}
                </Pressable>
                <Pressable
                  onPress={() => void handleSubscribe(l)}
                  disabled={l.following || busyId === l.userId}
                  style={({ pressed }) => ({
                    backgroundColor: l.following ? palette.surfaceAlt : (pressed ? palette.green : palette.brandAccent),
                    borderRadius: 12, paddingVertical: 11, alignItems: 'center',
                    borderWidth: 1, borderColor: l.following ? palette.borderLight : palette.brandAccent,
                    opacity: busyId === l.userId ? 0.6 : 1,
                  })}
                >
                  <Text style={{ color: l.following ? palette.inkSub : '#07150f', fontSize: 13, fontWeight: '900' }}>
                    {busyId === l.userId ? '구독 중…'
                      : l.following ? '구독 중 ✓'
                      : (l.isAi && !isPro) ? 'PRO로 구독'
                      : '구독하기'}
                  </Text>
                </Pressable>
              </View>
            ))
          )}
        </ScrollView>
      </View>
      <ProUpgradeSheet visible={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </Modal>
  )
}

function PerformanceSummary({ leader, palette }: { leader: LeaderCard; palette: Palette }) {
  const hasResolvedCalls = leader.resolvedCalls > 0
  const comparable = leader.resolvedCalls >= MIN_COMPARABLE_CALLS
  if (!hasResolvedCalls) {
    return (
      <View style={{ backgroundColor: palette.surfaceAlt, borderRadius: 12, padding: 12, gap: 2, marginTop: 7 }}>
        <Text style={{ color: palette.inkSub, fontSize: 12, fontWeight: '800' }}>성과 집계 준비 중</Text>
        <Text style={{ color: palette.inkMuted, fontSize: 10.5, lineHeight: 15 }}>확정된 콜이 쌓이면 목표 달성률과 평균 수익률을 확인할 수 있어요.</Text>
      </View>
    )
  }
  return (
    <View style={{ gap: 8, marginTop: 7 }}>
      <View style={{ flexDirection: 'row', gap: 1, backgroundColor: palette.borderLight, borderRadius: 12, overflow: 'hidden' }}>
        <View style={{ flex: 1, backgroundColor: palette.surfaceAlt, paddingHorizontal: 12, paddingVertical: 11, gap: 2 }}>
          <Text style={{ color: palette.inkMuted, fontSize: 9.5, fontWeight: '800' }}>목표 달성률 · 확정 {leader.resolvedCalls}건</Text>
          <Text style={{ color: palette.up, fontSize: 18, fontWeight: '900', fontVariant: ['tabular-nums'] }}>{Math.round(leader.hitRate * 100)}%</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: palette.surfaceAlt, paddingHorizontal: 12, paddingVertical: 11, gap: 2 }}>
          <Text style={{ color: palette.inkMuted, fontSize: 9.5, fontWeight: '800' }}>평균 수익률</Text>
          <Text style={{ color: leader.avgReturnPct != null && leader.avgReturnPct < 0 ? palette.down : palette.up, fontSize: 18, fontWeight: '900', fontVariant: ['tabular-nums'] }}>
            {leader.avgReturnPct == null ? '—' : fmtPct(leader.avgReturnPct)}
          </Text>
        </View>
      </View>
      <Text style={{ color: comparable ? palette.inkFaint : palette.orange, fontSize: 10.5, lineHeight: 15 }}>
        {comparable
          ? `확정된 콜 ${leader.resolvedCalls}건 기준 · 누적 콜 ${leader.totalCalls}건`
          : `표본 수집 중 · 확정 ${leader.resolvedCalls}건, 3건부터 성과 비교 순위에 반영`}
      </Text>
    </View>
  )
}
