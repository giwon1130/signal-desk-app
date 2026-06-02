/**
 * 리딩(Leading Call) 탭 홈 — 구독 리더들의 시황/콜 피드.
 *
 * 구성:
 *  - 리더 섹션: 권한(canLead) 있는 계정에만 노출. 미신청 → 이름+'리더 되기',
 *    PENDING → 승인 대기, SUSPENDED → 정지, APPROVED → 글쓰기 + 내 코드(공유).
 *    이미 리더면 권한과 무관하게 상태 카드 표시.
 *  - 리더 구독 섹션(누구나): 코드 입력 + 구독 중인 리더 목록(취소)
 *  - 피드: 구독 리더 + 본인 글 (PostCard 공용)
 */
import { useCallback, useEffect, useState } from 'react'
import { Pressable, RefreshControl, ScrollView, Share, Text, TextInput, View } from 'react-native'
import { Megaphone, PenLine, Plus, Share2, X } from 'lucide-react-native'
import { useStyles } from '../styles'
import { useTheme } from '../theme'
import type { Leader, ReadingPost } from '../types'
import { applyForLeader, fetchFeed, fetchFollowing, fetchLeaderEligibility, fetchMyLeader, subscribe, unsubscribe } from '../api/reading'
import { PostCard } from '../components/reading_parts/PostCard'
import { readingShareMessage, subscribeErrorMessage } from '../components/reading_parts/readingShared'
import { apiErrorMessage } from '../utils/apiError'

type Props = {
  authToken: string | null
  refreshing?: boolean
  refreshTick?: number
  subscribeCode?: string | null        // 딥링크(?leader=)로 들어온 구독 코드
  onCompose: () => void
  onOpenLeader?: (leaderUserId: string) => void
  toast?: { show: (msg: string, type?: 'success' | 'error' | 'info') => void }
}

export function ReadingTab({ authToken, refreshing, refreshTick, subscribeCode, onCompose, onOpenLeader, toast }: Props) {
  const styles = useStyles()
  const { palette } = useTheme()
  const [feed, setFeed] = useState<ReadingPost[]>([])
  const [leader, setLeader] = useState<Leader | null>(null)
  const [canLead, setCanLead] = useState(false)
  const [following, setFollowing] = useState<Leader[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [code, setCode] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    if (!authToken) return
    setLoading(true)
    setLoadError(false)
    try {
      const [f, me, fol, elig] = await Promise.all([fetchFeed(), fetchMyLeader(), fetchFollowing(), fetchLeaderEligibility()])
      setFeed(f); setLeader(me); setFollowing(fol); setCanLead(elig)
    } catch {
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [authToken])

  useEffect(() => { void load() }, [load, refreshTick])

  // 딥링크로 들어온 코드 prefill.
  useEffect(() => { if (subscribeCode) setCode(subscribeCode) }, [subscribeCode])

  const handleBecomeLeader = async () => {
    if (busy) return
    setBusy(true)
    try {
      const me = await applyForLeader(displayName.trim() || '나의 리딩', '')
      setLeader(me)
      toast?.show(
        me.status === 'APPROVED' ? '리더 등록 완료!' : '리더 신청 완료 — 승인 대기',
        me.status === 'APPROVED' ? 'success' : 'info',
      )
    } catch (e) {
      toast?.show(apiErrorMessage(e, '리더 신청 실패'), 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleSubscribe = async () => {
    if (!code.trim() || busy) return
    setBusy(true)
    try {
      const l = await subscribe(code.trim().toUpperCase())
      toast?.show(`${l.displayName}님 구독 완료`, 'success')
      setCode('')
      await load()
    } catch (e: any) {
      toast?.show(subscribeErrorMessage(e?.message || ''), 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleUnsubscribe = async (l: Leader) => {
    try {
      await unsubscribe(l.userId)
      toast?.show(`${l.displayName} 구독 취소`, 'info')
      await load()
    } catch (e) {
      toast?.show(apiErrorMessage(e, '구독 취소 실패'), 'error')
    }
  }

  const handleShareCode = async () => {
    if (!leader?.inviteCode) return
    try { await Share.share({ message: readingShareMessage(leader.displayName, leader.inviteCode) }) } catch { /* 취소 */ }
  }

  const isApproved = leader?.status === 'APPROVED'

  return (
    <ScrollView
      style={styles.scroll}
      refreshControl={<RefreshControl refreshing={!!refreshing || loading} onRefresh={load} />}
      contentContainerStyle={styles.content}
    >
      {/* 헤더 */}
      <View style={{ paddingHorizontal: 4, paddingVertical: 4, gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Megaphone size={18} color={palette.brandAccent} strokeWidth={2.5} />
          <Text style={{ color: palette.ink, fontSize: 18, fontWeight: '900' }}>리딩</Text>
        </View>
        <Text style={{ color: palette.inkMuted, fontSize: 12, lineHeight: 17 }}>
          종목·시황을 정리해 공유하면, 글 속 종목이 그 시점 가격으로 박제됩니다. 오르면 "거봐 내가 말했지?" 알림이 갑니다.
        </Text>
      </View>

      {/* 리더 섹션 — 이미 리더이거나 권한 있는 계정에만 */}
      {leader ? (
        <View style={[styles.card, { gap: 10 }]}>
          {leader.status === 'PENDING' ? (
            <Text style={{ color: palette.orange, fontSize: 13, fontWeight: '700' }}>⏳ 리더 승인 대기 중입니다.</Text>
          ) : leader.status === 'SUSPENDED' ? (
            <View style={{ gap: 4 }}>
              <Text style={{ color: palette.down, fontSize: 13, fontWeight: '800' }}>🚫 리더 권한이 정지되었습니다.</Text>
              <Text style={{ color: palette.inkMuted, fontSize: 12 }}>새 글 작성이 제한됩니다. 문의가 필요하면 운영자에게 연락해주세요.</Text>
            </View>
          ) : (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ color: palette.ink, fontSize: 14, fontWeight: '800' }}>{leader.displayName}</Text>
                <Text style={{ color: palette.inkMuted, fontSize: 11 }}>구독자 {leader.followerCount}명</Text>
              </View>
              {leader.inviteCode ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ color: palette.inkMuted, fontSize: 12, flex: 1 }}>
                    내 구독 코드 <Text style={{ color: palette.brandAccent, fontWeight: '900', letterSpacing: 2 }}>{leader.inviteCode}</Text>
                  </Text>
                  <Pressable
                    onPress={() => void handleShareCode()}
                    accessibilityRole="button"
                    accessibilityLabel="구독 코드 공유"
                    style={({ pressed }) => ({
                      flexDirection: 'row', alignItems: 'center', gap: 4,
                      backgroundColor: pressed ? palette.surface : palette.surfaceAlt,
                      borderWidth: 1, borderColor: palette.border, borderRadius: 8,
                      paddingHorizontal: 10, paddingVertical: 6,
                    })}
                  >
                    <Share2 size={12} color={palette.inkSub} strokeWidth={2.5} />
                    <Text style={{ color: palette.inkSub, fontSize: 11, fontWeight: '800' }}>공유</Text>
                  </Pressable>
                </View>
              ) : null}
              <Pressable
                onPress={onCompose}
                accessibilityRole="button"
                accessibilityLabel="새 리딩 쓰기"
                style={({ pressed }) => ({
                  backgroundColor: pressed ? palette.brandAccent + 'cc' : palette.brandAccent,
                  borderRadius: 10, paddingVertical: 12,
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                })}
              >
                <Plus size={14} color={palette.bg} strokeWidth={3} />
                <Text style={{ color: palette.bg, fontSize: 14, fontWeight: '800' }}>새 리딩 쓰기</Text>
              </Pressable>
            </>
          )}
        </View>
      ) : canLead ? (
        <View style={[styles.card, { gap: 10 }]}>
          <Text style={{ color: palette.inkMuted, fontSize: 12, lineHeight: 17 }}>
            직접 콜을 쓰고 싶다면 리더가 되어보세요. 친구는 내 코드로 구독합니다.
          </Text>
          <TextInput
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="리더 이름 (구독자에게 보일 이름)"
            placeholderTextColor={palette.inkFaint}
            maxLength={20}
            style={{
              backgroundColor: palette.surfaceAlt, color: palette.ink,
              borderWidth: 1, borderColor: palette.border, borderRadius: 8,
              paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, fontWeight: '700',
            }}
          />
          <Pressable
            onPress={() => void handleBecomeLeader()}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel="리더 되기"
            style={({ pressed }) => ({
              backgroundColor: pressed ? palette.brandAccent + 'cc' : palette.brandAccent,
              borderRadius: 10, paddingVertical: 12,
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
              opacity: busy ? 0.6 : 1,
            })}
          >
            <PenLine size={14} color={palette.bg} strokeWidth={3} />
            <Text style={{ color: palette.bg, fontSize: 14, fontWeight: '800' }}>리더 되기</Text>
          </Pressable>
        </View>
      ) : null}

      {/* 리더 구독 — 누구나 */}
      <View style={[styles.card, { gap: 10 }]}>
        <Text style={{ color: palette.inkMuted, fontSize: 11, fontWeight: '800', letterSpacing: 1 }}>리더 구독</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <TextInput
              value={code}
              onChangeText={(v) => setCode(v.toUpperCase())}
              placeholder="리더 구독 코드 (예: X7K2M)"
              placeholderTextColor={palette.inkFaint}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={5}
              onSubmitEditing={() => void handleSubscribe()}
              style={{
                backgroundColor: palette.surfaceAlt, color: palette.ink,
                borderWidth: 1, borderColor: palette.border, borderRadius: 8,
                paddingHorizontal: 12, paddingVertical: 10,
                fontSize: 14, fontWeight: '700', letterSpacing: 2,
              }}
            />
          </View>
          <Pressable
            onPress={() => void handleSubscribe()}
            disabled={!code.trim() || busy}
            accessibilityRole="button"
            accessibilityLabel="리더 구독"
            style={({ pressed }) => ({
              backgroundColor: pressed ? palette.blue + 'cc' : palette.blue,
              borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10,
              opacity: !code.trim() || busy ? 0.5 : 1,
            })}
          >
            <Text style={{ color: palette.bg, fontSize: 13, fontWeight: '800' }}>구독</Text>
          </Pressable>
        </View>
        <Text style={{ color: palette.inkFaint, fontSize: 11 }}>
          친구가 보낸 링크를 누르면 코드가 자동으로 채워집니다.
        </Text>

        {/* 구독 중인 리더 */}
        {following.length > 0 ? (
          <View style={{ gap: 2, marginTop: 2 }}>
            {following.map((l) => (
              <View key={l.userId} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderTopWidth: 1, borderTopColor: palette.border }}>
                <Pressable onPress={() => onOpenLeader?.(l.userId)} accessibilityRole="button" style={{ flex: 1 }}>
                  <Text style={{ color: palette.ink, fontSize: 13, fontWeight: '800' }}>{l.displayName}</Text>
                  <Text style={{ color: palette.inkMuted, fontSize: 10 }}>구독자 {l.followerCount}명</Text>
                </Pressable>
                <Pressable
                  onPress={() => void handleUnsubscribe(l)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={`${l.displayName} 구독 취소`}
                  style={({ pressed }) => ({
                    flexDirection: 'row', alignItems: 'center', gap: 3,
                    borderWidth: 1, borderColor: palette.border, borderRadius: 8,
                    paddingHorizontal: 10, paddingVertical: 6, opacity: pressed ? 0.6 : 1,
                  })}
                >
                  <X size={11} color={palette.inkMuted} strokeWidth={2.5} />
                  <Text style={{ color: palette.inkMuted, fontSize: 11, fontWeight: '800' }}>구독 취소</Text>
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      {/* 피드 */}
      <View style={styles.card}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.cardTitle}>피드</Text>
          <Text style={styles.metaText}>{feed.length}개</Text>
        </View>
        {loadError ? (
          <View style={{ paddingVertical: 24, alignItems: 'center', gap: 8 }}>
            <Text style={{ color: palette.inkMuted, fontSize: 12, fontWeight: '700' }}>불러오기 실패</Text>
            <Pressable onPress={() => void load()} accessibilityRole="button"
              style={({ pressed }) => ({ backgroundColor: pressed ? palette.surfaceAlt : palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 })}>
              <Text style={{ color: palette.ink, fontSize: 12, fontWeight: '800' }}>다시 시도</Text>
            </Pressable>
          </View>
        ) : feed.length === 0 ? (
          <View style={{ paddingVertical: 26, alignItems: 'center', gap: 6 }}>
            <Megaphone size={28} color={palette.inkFaint} strokeWidth={1.8} />
            <Text style={{ color: palette.inkMuted, fontSize: 12, fontWeight: '700' }}>아직 리딩이 없습니다</Text>
            <Text style={{ color: palette.inkFaint, fontSize: 11, textAlign: 'center', lineHeight: 16 }}>
              {isApproved ? '첫 리딩을 써보거나, ' : ''}친구 리더의 코드로 구독해보세요.
            </Text>
          </View>
        ) : (
          feed.map((p) => (
            <PostCard key={p.id} post={p} onPressLeader={() => onOpenLeader?.(p.leaderUserId)} />
          ))
        )}
      </View>
    </ScrollView>
  )
}
