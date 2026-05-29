/**
 * 리딩(Leading Call) 탭 홈 — 구독 리더들의 시황/콜 피드.
 * spec: docs/leading-call-spec.md
 *
 * 구성:
 *  - 리더 상태 카드: 미신청 → '리더 되기', PENDING → 승인 대기, APPROVED → 글쓰기 + 내 코드
 *  - 코드로 리더 구독
 *  - 피드: 구독 리더 + 본인 글 (콜 현재 수익률 색상 표시)
 */
import { useCallback, useEffect, useState } from 'react'
import { Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native'
import { Megaphone, PenLine, Plus, TrendingUp } from 'lucide-react-native'
import { useStyles } from '../styles'
import { useTheme } from '../theme'
import type { Leader, ReadingCall, ReadingPost } from '../types'
import { applyForLeader, fetchFeed, fetchMyLeader, subscribe } from '../api/reading'

type Props = {
  authToken: string | null
  refreshing?: boolean
  refreshTick?: number
  onCompose: () => void
  onOpenLeader?: (leaderUserId: string) => void
  toast?: { show: (msg: string, type?: 'success' | 'error' | 'info') => void }
}

export function ReadingTab({ authToken, refreshing, refreshTick, onCompose, onOpenLeader, toast }: Props) {
  const styles = useStyles()
  const { palette } = useTheme()
  const [feed, setFeed] = useState<ReadingPost[]>([])
  const [leader, setLeader] = useState<Leader | null>(null)
  const [loading, setLoading] = useState(false)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    if (!authToken) return
    setLoading(true)
    try {
      const [f, me] = await Promise.all([fetchFeed(), fetchMyLeader()])
      setFeed(f)
      setLeader(me)
    } finally {
      setLoading(false)
    }
  }, [authToken])

  useEffect(() => { void load() }, [load, refreshTick])

  const handleBecomeLeader = async () => {
    if (busy) return
    setBusy(true)
    try {
      const me = await applyForLeader('나의 리딩', '')
      setLeader(me)
      toast?.show(
        me.status === 'APPROVED' ? '리더 등록 완료!' : '리더 신청 완료 — 승인 대기',
        me.status === 'APPROVED' ? 'success' : 'info',
      )
    } catch {
      toast?.show('리더 신청 실패', 'error')
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
    } catch {
      toast?.show('구독 실패 — 코드 확인', 'error')
    } finally {
      setBusy(false)
    }
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
          종목·시황을 정리해 공유하면, 글 속 종목이 그 시점 가격으로 박제돼요. 오르면 "거봐 내가 말했지?" 알림이 갑니다.
        </Text>
      </View>

      {/* 리더 상태 카드 */}
      <View style={[styles.card, { gap: 10 }]}>
        {!leader ? (
          <>
            <Text style={{ color: palette.inkMuted, fontSize: 12, lineHeight: 17 }}>
              직접 콜을 쓰고 싶다면 리더가 되어보세요. 친구는 내 코드로 구독합니다.
            </Text>
            <Pressable
              onPress={() => void handleBecomeLeader()}
              disabled={busy}
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
          </>
        ) : leader.status === 'PENDING' ? (
          <Text style={{ color: palette.orange, fontSize: 13, fontWeight: '700' }}>
            ⏳ 리더 승인 대기 중이에요.
          </Text>
        ) : (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: palette.ink, fontSize: 14, fontWeight: '800' }}>{leader.displayName}</Text>
              <Text style={{ color: palette.inkMuted, fontSize: 11 }}>구독자 {leader.followerCount}명</Text>
            </View>
            {leader.inviteCode ? (
              <Text style={{ color: palette.inkMuted, fontSize: 12 }}>
                내 구독 코드 <Text style={{ color: palette.brandAccent, fontWeight: '900', letterSpacing: 2 }}>{leader.inviteCode}</Text>
              </Text>
            ) : null}
            <Pressable
              onPress={onCompose}
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

        {/* 코드로 구독 */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <TextInput
              value={code}
              onChangeText={(v) => setCode(v.toUpperCase())}
              placeholder="리더 구독 코드 (예: X7K2M)"
              placeholderTextColor={palette.inkFaint}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={8}
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
            style={({ pressed }) => ({
              backgroundColor: pressed ? palette.blue + 'cc' : palette.blue,
              borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10,
              opacity: !code.trim() || busy ? 0.5 : 1,
            })}
          >
            <Text style={{ color: palette.bg, fontSize: 13, fontWeight: '800' }}>구독</Text>
          </Pressable>
        </View>
      </View>

      {/* 피드 */}
      <View style={styles.card}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.cardTitle}>피드</Text>
          <Text style={styles.metaText}>{feed.length}개</Text>
        </View>
        {feed.length === 0 ? (
          <View style={{ paddingVertical: 26, alignItems: 'center', gap: 6 }}>
            <Megaphone size={28} color={palette.inkFaint} strokeWidth={1.8} />
            <Text style={{ color: palette.inkMuted, fontSize: 12, fontWeight: '700' }}>아직 리딩이 없어요</Text>
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

function PostCard({ post, onPressLeader }: { post: ReadingPost; onPressLeader: () => void }) {
  const { palette } = useTheme()
  const when = formatWhen(post.createdAt)
  return (
    <View style={{ paddingVertical: 12, borderTopWidth: 1, borderTopColor: palette.border, gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable onPress={onPressLeader} hitSlop={6}>
          <Text style={{ color: palette.brandAccent, fontSize: 12, fontWeight: '800' }}>{post.leaderName}</Text>
        </Pressable>
        <Text style={{ color: palette.inkFaint, fontSize: 10 }}>{when}</Text>
      </View>
      <Text style={{ color: palette.ink, fontSize: 15, fontWeight: '800' }}>{post.title}</Text>
      {post.body ? (
        <Text style={{ color: palette.inkMuted, fontSize: 13, lineHeight: 19 }}>{post.body}</Text>
      ) : null}
      {post.calls.length > 0 ? (
        <View style={{ gap: 6, marginTop: 2 }}>
          {post.calls.map((c) => <CallRow key={c.id} call={c} palette={palette} />)}
        </View>
      ) : null}
    </View>
  )
}

function CallRow({ call, palette }: { call: ReadingCall; palette: ReturnType<typeof useTheme>['palette'] }) {
  const ret = call.returnPct
  const up = (ret ?? 0) >= 0
  const retColor = ret == null ? palette.inkFaint : up ? palette.brandAccent : palette.red ?? '#ef4444'
  const flag = call.market === 'KR' ? '🇰🇷' : '🇺🇸'
  const cur = call.entryCurrency === 'KRW' ? '₩' : '$'
  const hit = call.status === 'HIT'
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: palette.surfaceAlt, borderRadius: 8,
      paddingHorizontal: 10, paddingVertical: 8,
    }}>
      <Text style={{ fontSize: 12 }}>{flag}</Text>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ color: palette.ink, fontSize: 13, fontWeight: '800' }}>{call.name}</Text>
          {hit ? (
            <View style={{ backgroundColor: palette.brandAccent + '22', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 }}>
              <Text style={{ color: palette.brandAccent, fontSize: 9, fontWeight: '900' }}>적중</Text>
            </View>
          ) : null}
        </View>
        <Text style={{ color: palette.inkFaint, fontSize: 10 }}>
          진입 {cur}{formatPrice(call.entryPrice)}
          {call.targetReturnPct != null ? ` · 목표 ${call.targetReturnPct > 0 ? '+' : ''}${call.targetReturnPct}%` : ''}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
        {ret != null ? <TrendingUp size={12} color={retColor} strokeWidth={2.5} /> : null}
        <Text style={{ color: retColor, fontSize: 13, fontWeight: '900' }}>
          {ret == null ? '—' : `${up ? '+' : ''}${ret.toFixed(1)}%`}
        </Text>
      </View>
    </View>
  )
}

function formatPrice(n: number): string {
  return n >= 1000 ? Math.round(n).toLocaleString('ko-KR') : n.toFixed(2)
}

function formatWhen(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return '방금'
  if (min < 60) return `${min}분 전`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}시간 전`
  return `${Math.floor(hr / 24)}일 전`
}
