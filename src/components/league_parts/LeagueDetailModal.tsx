/**
 * 리그 상세 화면 — 리더보드 + 거래 피드 + 내 포지션 + 거래 진입.
 * 실시간 폴링 10초.
 */
import { useCallback, useEffect, useState } from 'react'
import { Modal, Pressable, RefreshControl, ScrollView, Share, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Crown, Share2, Trophy, X } from 'lucide-react-native'
import { useTheme } from '../../theme'
import {
  fetchLeaderboard, fetchLeagueDetail, fetchMyPositions, fetchTradeFeed,
} from '../../api/league'
import type {
  LeaderboardEntry, LeagueDetail as LeagueDetailType, LeaguePosition, LeagueTrade,
} from '../../types'
import { PlaceTradeModal } from './PlaceTradeModal'

type Props = {
  visible: boolean
  leagueId: string | null
  myUserId?: string
  onClose: () => void
  toast?: { show: (msg: string, type?: 'success' | 'error' | 'info') => void }
}

export function LeagueDetailModal({ visible, leagueId, myUserId, onClose, toast }: Props) {
  const { palette } = useTheme()
  const insets = useSafeAreaInsets()
  const [detail, setDetail] = useState<LeagueDetailType | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [feed, setFeed] = useState<LeagueTrade[]>([])
  const [positions, setPositions] = useState<LeaguePosition[]>([])
  const [loading, setLoading] = useState(false)
  const [tradeOpen, setTradeOpen] = useState(false)

  const load = useCallback(async () => {
    if (!leagueId) return
    setLoading(true)
    try {
      const [d, lb, fd, pos] = await Promise.all([
        fetchLeagueDetail(leagueId),
        fetchLeaderboard(leagueId),
        fetchTradeFeed(leagueId, 50),
        fetchMyPositions(leagueId),
      ])
      setDetail(d); setLeaderboard(lb); setFeed(fd); setPositions(pos)
    } finally {
      setLoading(false)
    }
  }, [leagueId])

  useEffect(() => {
    if (!visible || !leagueId) return
    void load()
    // 10초 폴링.
    const interval = setInterval(() => { void load() }, 10000)
    return () => clearInterval(interval)
  }, [visible, leagueId, load])

  const handleShare = async () => {
    if (!detail) return
    try {
      await Share.share({
        message: `Signal Desk 리그 "${detail.league.name}" 참가 코드: ${detail.league.joinCode}`,
      })
    } catch { /* user 취소 */ }
  }

  const league = detail?.league
  const me = leaderboard.find((e) => e.userId === myUserId)
  const canTrade = league?.status === 'RUNNING' && !!myUserId

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: palette.bg, paddingTop: insets.top, paddingBottom: insets.bottom }}>
        {/* 헤더 */}
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          paddingHorizontal: 16, paddingVertical: 12,
          borderBottomWidth: 1, borderBottomColor: palette.border, gap: 10,
        }}>
          <Trophy size={18} color={palette.brandAccent} strokeWidth={2.5} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: palette.ink, fontSize: 16, fontWeight: '900' }} numberOfLines={1}>
              {league?.name ?? '리그'}
            </Text>
            {league ? (
              <Text style={{ color: palette.inkMuted, fontSize: 11 }}>
                {statusLabel(league.status)} · 코드 {league.joinCode} · {remainText(league.status, league.startedAt, league.endsAt)}
              </Text>
            ) : null}
          </View>
          <Pressable onPress={() => void handleShare()} hitSlop={8} style={{ padding: 4 }}>
            <Share2 size={16} color={palette.inkSub} strokeWidth={2.5} />
          </Pressable>
          <Pressable onPress={onClose} hitSlop={10}>
            <X size={20} color={palette.inkMuted} strokeWidth={2.5} />
          </Pressable>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          contentContainerStyle={{ padding: 14, gap: 14 }}
        >
          {/* 리더보드 */}
          <View style={{ backgroundColor: palette.surface, borderRadius: 12, borderWidth: 1, borderColor: palette.border, padding: 12, gap: 8 }}>
            <Text style={{ color: palette.inkMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1 }}>
              리더보드 ({leaderboard.length}명)
            </Text>
            {leaderboard.map((e) => {
              const isMe = e.userId === myUserId
              const retColor = e.returnRate >= 0 ? palette.up : palette.down
              return (
                <View
                  key={e.userId}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 10,
                    backgroundColor: isMe ? palette.brandAccent + '11' : 'transparent',
                    paddingHorizontal: 8, paddingVertical: 8, borderRadius: 8,
                  }}
                >
                  <View style={{ width: 28, alignItems: 'center' }}>
                    {e.rank === 1 ? <Crown size={16} color="#fbbf24" strokeWidth={2.5} /> :
                      <Text style={{ color: palette.inkMuted, fontSize: 13, fontWeight: '800' }}>{e.rank}</Text>}
                  </View>
                  <Text style={{ fontSize: 18 }}>{e.avatarEmoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: palette.ink, fontSize: 13, fontWeight: '800' }}>
                      {e.nickname}{isMe ? ' (나)' : ''}
                    </Text>
                    <Text style={{ color: palette.inkMuted, fontSize: 10 }}>
                      평가 {e.totalAssets.toLocaleString('ko-KR')} · 보유 {e.positionCount}종목
                    </Text>
                  </View>
                  <Text style={{ color: retColor, fontSize: 14, fontWeight: '900', fontVariant: ['tabular-nums'] }}>
                    {e.returnRate >= 0 ? '+' : ''}{(e.returnRate * 100).toFixed(2)}%
                  </Text>
                </View>
              )
            })}
            {leaderboard.length === 0 ? (
              <Text style={{ color: palette.inkFaint, fontSize: 11, textAlign: 'center', paddingVertical: 14 }}>
                불러오는 중…
              </Text>
            ) : null}
          </View>

          {/* 거래 액션 */}
          {canTrade ? (
            <Pressable
              onPress={() => setTradeOpen(true)}
              style={({ pressed }) => ({
                backgroundColor: pressed ? palette.brandAccent + 'cc' : palette.brandAccent,
                borderRadius: 12, paddingVertical: 14, alignItems: 'center',
              })}
            >
              <Text style={{ color: palette.bg, fontSize: 15, fontWeight: '900' }}>거래하기</Text>
            </Pressable>
          ) : null}

          {/* 내 포지션 */}
          {positions.length > 0 ? (
            <View style={{ backgroundColor: palette.surface, borderRadius: 12, borderWidth: 1, borderColor: palette.border, padding: 12, gap: 6 }}>
              <Text style={{ color: palette.inkMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1 }}>
                내 보유 ({positions.length}종목)
              </Text>
              {positions.map((p) => (
                <View key={`${p.market}:${p.ticker}`} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: palette.ink, fontSize: 13, fontWeight: '800' }}>{p.name}</Text>
                    <Text style={{ color: palette.inkMuted, fontSize: 10 }}>{p.market} · {p.ticker}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ color: palette.ink, fontSize: 12, fontWeight: '800' }}>{p.quantity}주</Text>
                    <Text style={{ color: palette.inkMuted, fontSize: 10 }}>평단 {p.averageCost.toFixed(2)}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          {/* 거래 피드 */}
          <View style={{ backgroundColor: palette.surface, borderRadius: 12, borderWidth: 1, borderColor: palette.border, padding: 12, gap: 6 }}>
            <Text style={{ color: palette.inkMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1 }}>
              거래 피드 ({feed.length}건)
            </Text>
            {feed.length === 0 ? (
              <Text style={{ color: palette.inkFaint, fontSize: 11, textAlign: 'center', paddingVertical: 14 }}>
                아직 거래 없음
              </Text>
            ) : (
              feed.map((t) => {
                const trader = detail?.participants.find((p) => p.userId === t.userId)
                const color = t.side === 'BUY' ? palette.up : palette.down
                return (
                  <View key={t.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 }}>
                    <Text style={{ fontSize: 14 }}>{trader?.avatarEmoji ?? '🐱'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: palette.ink, fontSize: 12, fontWeight: '700' }}>
                        {trader?.nickname ?? '?'} · {t.side === 'BUY' ? '매수' : '매도'} {t.name}
                      </Text>
                      <Text style={{ color: palette.inkMuted, fontSize: 10 }}>
                        {t.quantity}주 @ {t.originalPrice.toFixed(2)} {t.originalCurrency} · {timeAgo(t.executedAt)}
                      </Text>
                    </View>
                    <Text style={{ color, fontSize: 10, fontWeight: '800' }}>
                      {t.side === 'BUY' ? '+' : '-'}{t.notionalAmount.toLocaleString('ko-KR')}
                    </Text>
                  </View>
                )
              })
            )}
          </View>
        </ScrollView>

        {/* 거래 모달 */}
        {leagueId && league ? (
          <PlaceTradeModal
            visible={tradeOpen}
            leagueId={leagueId}
            positions={positions}
            cashBalance={me?.cashBalance ?? 0}
            currency={league.currency}
            onClose={() => setTradeOpen(false)}
            onTraded={() => { void load() }}
            toast={toast}
          />
        ) : null}
      </View>
    </Modal>
  )
}

function statusLabel(s: string): string {
  switch (s) {
    case 'DRAFT': return '준비 중'
    case 'OPEN': return '모집 중'
    case 'RUNNING': return '진행 중'
    case 'FINISHED': return '종료됨'
    default: return s
  }
}

function remainText(status: string, startedAt: string, endsAt: string): string {
  if (status === 'FINISHED') return '정산 완료'
  const target = new Date(status === 'OPEN' ? startedAt : endsAt).getTime()
  const diff = target - Date.now()
  if (diff <= 0) return '곧'
  const sec = Math.floor(diff / 1000)
  const day = Math.floor(sec / 86400)
  const hr = Math.floor((sec % 86400) / 3600)
  const prefix = status === 'OPEN' ? '시작' : '종료'
  if (day > 0) return `${prefix}까지 ${day}일 ${hr}시간`
  const min = Math.floor((sec % 3600) / 60)
  if (hr > 0) return `${prefix}까지 ${hr}시간 ${min}분`
  return `${prefix}까지 ${min}분`
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return `${sec}초 전`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}분 전`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}시간 전`
  return `${Math.floor(hr / 24)}일 전`
}
