/**
 * 리더 프로필 모달 — 적중률/평균수익/총콜 통계 + 그 리더의 글 목록.
 * 피드에서 리더 이름을 누르면 열린다.
 */
import { useCallback, useEffect, useState } from 'react'
import { Modal, Pressable, RefreshControl, ScrollView, Share, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Megaphone, Share2 } from 'lucide-react-native'
import { ModalHeader } from '../ModalHeader'
import { useTheme } from '../../theme'
import { fetchLeaderProfile, subscribe } from '../../api/reading'
import type { LeaderProfile } from '../../types'
import { PostCard } from './PostCard'
import { fmtPct, readingShareMessage, subscribeErrorMessage } from './readingShared'

type Props = {
  visible: boolean
  leaderUserId: string | null
  myUserId?: string
  onClose: () => void
  onSubscribed?: () => void
  toast?: { show: (msg: string, type?: 'success' | 'error' | 'info') => void }
}

export function LeaderProfileModal({ visible, leaderUserId, myUserId, onClose, onSubscribed, toast }: Props) {
  const { palette } = useTheme()
  const insets = useSafeAreaInsets()
  const [profile, setProfile] = useState<LeaderProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [subscribing, setSubscribing] = useState(false)
  // 백엔드 프로필에 '내 구독 여부'가 없어 로컬로 추적 — 구독 성공 후 버튼을 '구독 중'으로 잠가
  // 중복 구독/더블탭을 차단. 모달을 새 리더로 다시 열면 리셋.
  const [subscribed, setSubscribed] = useState(false)

  const load = useCallback(async () => {
    if (!leaderUserId) return
    setLoading(true)
    try {
      const p = await fetchLeaderProfile(leaderUserId)
      setProfile(p)
      setLoadError(false)
    } catch {
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [leaderUserId])

  useEffect(() => {
    if (visible && leaderUserId) { setSubscribed(false); void load() }
  }, [visible, leaderUserId, load])

  const leader = profile?.leader
  const stats = profile?.stats
  const isSelf = !!leader && leader.userId === myUserId

  const handleSubscribe = async () => {
    if (!leader?.inviteCode || subscribing || subscribed) return
    setSubscribing(true)
    try {
      await subscribe(leader.inviteCode)
      setSubscribed(true)
      // 구독자 수도 즉시 +1 반영 (재조회 없이 화면 일관성)
      setProfile((prev) => prev ? { ...prev, leader: { ...prev.leader, followerCount: prev.leader.followerCount + 1 } } : prev)
      toast?.show(`${leader.displayName}님 구독 완료`, 'success')
      onSubscribed?.()
    } catch (e: any) {
      const msg = e?.message || ''
      // 이미 구독한 경우도 성공처럼 처리(중복은 에러가 아님)
      if (/already|conflict|exists|중복/i.test(msg)) {
        setSubscribed(true)
        toast?.show('이미 구독 중이에요', 'info')
      } else {
        toast?.show(subscribeErrorMessage(msg), 'error')
      }
    } finally {
      setSubscribing(false)
    }
  }

  const handleShare = async () => {
    if (!leader?.inviteCode) return
    try { await Share.share({ message: readingShareMessage(leader.displayName, leader.inviteCode) }) } catch { /* 취소 */ }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: palette.bg, paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <ModalHeader
          icon={Megaphone}
          title={leader?.displayName ?? '리더'}
          titleNumberOfLines={1}
          onClose={onClose}
          right={leader?.inviteCode ? (
            <Pressable onPress={() => void handleShare()} hitSlop={8} accessibilityRole="button" accessibilityLabel="구독 코드 공유" style={{ padding: 4 }}>
              <Share2 size={16} color={palette.inkSub} strokeWidth={2.5} />
            </Pressable>
          ) : undefined}
        />

        <ScrollView
          style={{ flex: 1 }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          contentContainerStyle={{ padding: 14, gap: 14 }}
        >
          {loadError && !profile ? (
            <View style={{ paddingVertical: 30, alignItems: 'center', gap: 8 }}>
              <Text style={{ color: palette.inkMuted, fontSize: 13, fontWeight: '700' }}>불러오기 실패</Text>
              <Pressable onPress={() => void load()} accessibilityRole="button"
                style={({ pressed }) => ({ backgroundColor: pressed ? palette.surfaceAlt : palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: 8, paddingHorizontal: 18, paddingVertical: 9 })}>
                <Text style={{ color: palette.ink, fontSize: 13, fontWeight: '800' }}>다시 시도</Text>
              </Pressable>
            </View>
          ) : !profile ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <Text style={{ color: palette.inkFaint, fontSize: 12 }}>불러오는 중…</Text>
            </View>
          ) : (
            <>
              {/* 소개 + 구독자 */}
              {leader ? (
                <View style={{ gap: 6 }}>
                  {leader.bio ? <Text style={{ color: palette.inkMuted, fontSize: 13, lineHeight: 19 }}>{leader.bio}</Text> : null}
                  <Text style={{ color: palette.inkFaint, fontSize: 11 }}>구독자 {leader.followerCount}명</Text>
                </View>
              ) : null}

              {/* 통계 */}
              {stats ? (
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Stat label="총 콜" value={`${stats.totalCalls}개`} palette={palette} />
                  <Stat label="적중" value={`${stats.hitCount}개`} palette={palette} />
                  <Stat
                    label="적중률"
                    value={stats.totalCalls > 0 ? `${Math.round(stats.hitRate * 100)}%` : '—'}
                    palette={palette}
                    accent={palette.up}
                  />
                  <Stat
                    label="평균 수익"
                    value={stats.avgReturnPct == null ? '—' : fmtPct(stats.avgReturnPct)}
                    palette={palette}
                    accent={stats.avgReturnPct != null && stats.avgReturnPct < 0 ? palette.down : palette.up}
                  />
                </View>
              ) : null}

              {/* 구독 버튼 (본인 아니고 코드 있을 때). 구독 완료면 비활성 '구독 중 ✓' */}
              {!isSelf && leader?.inviteCode ? (
                <Pressable
                  onPress={() => void handleSubscribe()}
                  disabled={subscribing || subscribed}
                  accessibilityRole="button"
                  style={({ pressed }) => ({
                    backgroundColor: subscribed ? palette.surfaceAlt : (pressed ? palette.brandAccent + 'cc' : palette.brandAccent),
                    borderRadius: 12, paddingVertical: 13, alignItems: 'center',
                    borderWidth: subscribed ? 1 : 0, borderColor: palette.border,
                    opacity: subscribing ? 0.6 : 1,
                  })}
                >
                  <Text style={{ color: subscribed ? palette.inkSub : palette.bg, fontSize: 14, fontWeight: '800' }}>
                    {subscribing ? '구독 중…' : subscribed ? '구독 중 ✓' : '구독하기'}
                  </Text>
                </Pressable>
              ) : null}

              {/* 글 목록 */}
              <View style={{ backgroundColor: palette.surface, borderRadius: 12, borderWidth: 1, borderColor: palette.border, paddingHorizontal: 12, paddingVertical: 4 }}>
                {profile.posts.length === 0 ? (
                  <Text style={{ color: palette.inkFaint, fontSize: 12, textAlign: 'center', paddingVertical: 20 }}>아직 글이 없습니다</Text>
                ) : (
                  profile.posts.map((p) => <PostCard key={p.id} post={p} showLeader={false} />)
                )}
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  )
}

function Stat({ label, value, palette, accent }: { label: string; value: string; palette: any; accent?: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: palette.surface, borderRadius: 10, borderWidth: 1, borderColor: palette.border, paddingVertical: 10, alignItems: 'center', gap: 2 }}>
      <Text style={{ color: accent ?? palette.ink, fontSize: 15, fontWeight: '900', fontVariant: ['tabular-nums'] }}>{value}</Text>
      <Text style={{ color: palette.inkMuted, fontSize: 9, fontWeight: '700' }}>{label}</Text>
    </View>
  )
}
