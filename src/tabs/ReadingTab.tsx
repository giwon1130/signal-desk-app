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
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Pressable, RefreshControl, ScrollView, Share, Text, TextInput, View } from 'react-native'
import { Compass, Megaphone, PenLine, Plus, Share2, X } from 'lucide-react-native'
import { useStyles } from '../styles'
import { useTheme } from '../theme'
import type { Leader, ReadingPost } from '../types'
import { applyForLeader, fetchFeed, fetchFollowing, fetchLeaderEligibility, fetchMyLeader, subscribe, unsubscribe } from '../api/reading'
import { PostCard } from '../components/reading_parts/PostCard'
import { Entrance } from '../components/effects'
import { TabIntro } from '../components/guide/TabIntro'
import { EmptyGuide } from '../components/guide/EmptyGuide'
import { ReadingEventModal } from '../components/reading_parts/ReadingEventModal'
import { DiscoverLeadersModal } from '../components/reading_parts/DiscoverLeadersModal'
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
  /** PRO 여부 — AI 리더 구독 게이트(둘러보기) */
  isPro?: boolean
}

type FeedFilter = 'all' | 'human' | 'ai' | 'active'

const feedFilters: { key: FeedFilter; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'human', label: '사람 리더' },
  { key: 'ai', label: 'AI 리딩' },
  { key: 'active', label: '진행 중 콜' },
]

// memo: AppShell 재렌더(다른 탭 상태 변화 등)에 끌려 다시 그리지 않도록.
export const ReadingTab = memo(function ReadingTab({ authToken, refreshing, refreshTick, subscribeCode, onCompose, onOpenLeader, toast, isPro = false }: Props) {
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
  const [showEvent, setShowEvent] = useState(false)
  const [showDiscover, setShowDiscover] = useState(false)
  const [feedFilter, setFeedFilter] = useState<FeedFilter>('all')

  // 리딩 첫 진입 시 오픈 이벤트(무료) 안내 모달 — 1회만 (AsyncStorage 플래그).
  useEffect(() => {
    let alive = true
    AsyncStorage.getItem('signal:reading:eventSeen')
      .then((v) => { if (alive && v !== 'true') setShowEvent(true) })
      .catch(() => {})
    return () => { alive = false }
  }, [])
  const closeEvent = () => {
    setShowEvent(false)
    void AsyncStorage.setItem('signal:reading:eventSeen', 'true').catch(() => {})
  }

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
  // 피드는 구독 리더와 내 글로 구성된다. 구독 목록의 AI 여부로 AI 리딩을 구분한다.
  const aiLeaderIds = useMemo(
    () => new Set(following.filter((item) => item.isAi).map((item) => item.userId)),
    [following],
  )
  const filteredFeed = useMemo(() => feed.filter((post) => {
    if (feedFilter === 'human') return !aiLeaderIds.has(post.leaderUserId)
    if (feedFilter === 'ai') return aiLeaderIds.has(post.leaderUserId)
    if (feedFilter === 'active') return post.calls.some((call) => call.status === 'ACTIVE')
    return true
  }), [aiLeaderIds, feed, feedFilter])

  return (
    <>
    <ScrollView
      style={styles.scroll}
      refreshControl={<RefreshControl refreshing={!!refreshing || loading} onRefresh={load} />}
      contentContainerStyle={styles.content}
    >
      {/* 탭 인트로 — 컴팩트 타이틀, 처음 몇 번만 펼친 설명 (큰 히어로 대신) */}
      <TabIntro
        tabKey="reading"
        icon={Megaphone}
        title="리딩"
        tagline="검증된 콜 구독 · 사람 무료, AI는 PRO"
        description="리더가 종목을 콜하면 진입가가 자동 박제되고 이후 수익률이 그대로 추적돼요. 확정된 콜 성과를 보고 리더를 구독하면 그분의 콜이 내 피드에 올라옵니다. 🤖 AI 리더는 PRO 전용이에요."
        accent={palette.brandAccent}
      />

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
                <Plus size={14} color="#07150f" strokeWidth={3} />
                <Text style={{ color: '#07150f', fontSize: 14, fontWeight: '900' }}>새 리딩 쓰기</Text>
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
            <PenLine size={14} color="#07150f" strokeWidth={3} />
            <Text style={{ color: '#07150f', fontSize: 14, fontWeight: '900' }}>리더 되기</Text>
          </Pressable>
        </View>
      ) : null}

      {/* 리더 구독 — 누구나 */}
      <View style={[styles.card, { gap: 10 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ color: palette.inkMuted, fontSize: 11, fontWeight: '800', letterSpacing: 1 }}>리더 구독</Text>
          <View style={{ backgroundColor: palette.brandAccent + '22', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1 }}>
            <Text style={{ color: palette.brandAccent, fontSize: 9, fontWeight: '900' }}>사람 무료</Text>
          </View>
        </View>

        {/* 둘러보기 — 코드 없는 신규 사용자가 리더를 발견하는 주 진입점 */}
        <Pressable
          onPress={() => setShowDiscover(true)}
          accessibilityRole="button"
          style={({ pressed }) => ({
            flexDirection: 'row', alignItems: 'center', gap: 8,
            backgroundColor: pressed ? palette.surfaceAlt : palette.brandAccent + '14',
            borderWidth: 1, borderColor: palette.brandAccent + '55',
            borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11,
          })}
        >
          <Compass size={16} color={palette.brandAccent} strokeWidth={2.4} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: palette.ink, fontSize: 13, fontWeight: '800' }}>리더 둘러보기</Text>
            <Text style={{ color: palette.inkMuted, fontSize: 11 }}>공개 리딩과 확정된 콜 성과를 비교해 구독</Text>
          </View>
          <Text style={{ color: palette.inkFaint, fontSize: 14 }}>›</Text>
        </Pressable>

        <Text style={{ color: palette.inkFaint, fontSize: 11, textAlign: 'center' }}>또는 친구의 코드로 직접 구독</Text>
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
            <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '900' }}>구독</Text>
          </Pressable>
        </View>
        <Text style={{ color: palette.inkFaint, fontSize: 11, lineHeight: 16 }}>
          리더 구독은 정식 오픈 시 유료로 전환될 예정이에요. 지금은 오픈 이벤트 기간이라 무료로 구독할 수 있습니다. 친구가 보낸 링크를 누르면 코드가 자동으로 채워집니다.
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
          <Text style={styles.metaText}>{feedFilter === 'all' ? `${feed.length}개` : `${filteredFeed.length}/${feed.length}개`}</Text>
        </View>
        {feed.length > 0 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12, marginBottom: 4 }}>
            {feedFilters.map((filter) => {
              const selected = feedFilter === filter.key
              return (
                <Pressable
                  key={filter.key}
                  onPress={() => setFeedFilter(filter.key)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${filter.label} 피드 보기`}
                  style={({ pressed }) => ({
                    backgroundColor: selected ? palette.brandAccent + '20' : pressed ? palette.surface : palette.surfaceAlt,
                    borderWidth: 1, borderColor: selected ? palette.brandAccent + '88' : palette.border,
                    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7,
                  })}
                >
                  <Text style={{ color: selected ? palette.brandAccent : palette.inkMuted, fontSize: 11, fontWeight: '800' }}>{filter.label}</Text>
                </Pressable>
              )
            })}
          </View>
        ) : null}
        {loadError ? (
          <View style={{ paddingVertical: 24, alignItems: 'center', gap: 8 }}>
            <Text style={{ color: palette.inkMuted, fontSize: 12, fontWeight: '700' }}>불러오기 실패</Text>
            <Pressable onPress={() => void load()} accessibilityRole="button"
              style={({ pressed }) => ({ backgroundColor: pressed ? palette.surfaceAlt : palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 })}>
              <Text style={{ color: palette.ink, fontSize: 12, fontWeight: '800' }}>다시 시도</Text>
            </Pressable>
          </View>
        ) : feed.length === 0 ? (
          <EmptyGuide
            icon={Megaphone}
            accent={palette.brandAccent}
            title="아직 리딩이 없어요"
            description="검증된 리더가 종목을 콜하면 그 분의 매매 아이디어가 여기 실시간으로 올라옵니다."
            steps={[
              { n: 1, text: '리더 둘러보기에서 적중률·구독자 수를 비교해 마음에 드는 리더를 찾으세요.' },
              { n: 2, text: '구독하면 그 리더의 콜이 이 피드에 쌓입니다.' },
              ...(isApproved ? [{ n: 3, text: '리더로 승인되셨네요 — 직접 첫 리딩을 써보세요.' }] : []),
            ]}
            actions={[
              { label: '리더 둘러보기', onPress: () => setShowDiscover(true), primary: true },
              ...(isApproved ? [{ label: '리딩 쓰기', onPress: onCompose }] : []),
            ]}
          />
        ) : filteredFeed.length === 0 ? (
          <View style={{ paddingVertical: 28, alignItems: 'center', gap: 10 }}>
            <Text style={{ color: palette.inkMuted, fontSize: 13, fontWeight: '700' }}>선택한 조건의 리딩이 없어요</Text>
            <Pressable
              onPress={() => setFeedFilter('all')}
              accessibilityRole="button"
              style={({ pressed }) => ({
                backgroundColor: pressed ? palette.surfaceAlt : palette.surface,
                borderWidth: 1, borderColor: palette.border, borderRadius: 8,
                paddingHorizontal: 14, paddingVertical: 8,
              })}
            >
              <Text style={{ color: palette.ink, fontSize: 12, fontWeight: '800' }}>전체 보기</Text>
            </Pressable>
          </View>
        ) : (
          filteredFeed.map((p, i) => (
            <Entrance key={p.id} index={i}>
              <PostCard post={p} onPressLeader={onOpenLeader} />
            </Entrance>
          ))
        )}
      </View>
    </ScrollView>
    <ReadingEventModal visible={showEvent} monthlyPriceWon={9900} onClose={closeEvent} />
    <DiscoverLeadersModal
      visible={showDiscover}
      onClose={() => setShowDiscover(false)}
      onOpenLeader={onOpenLeader}
      onSubscribed={() => void load()}
      toast={toast}
      isPro={isPro}
    />
    </>
  )
})
