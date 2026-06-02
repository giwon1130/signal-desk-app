/**
 * 리그 상세 화면 — 리더보드 + 거래 피드 + 내 포지션 + 거래 진입.
 * 진행 중(RUNNING/OPEN)엔 10초 폴링, 종료(FINISHED)엔 폴링 안 함.
 */
import { useCallback, useEffect, useState } from 'react'
import { Modal, Pressable, RefreshControl, ScrollView, Share, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Crown, LogOut, Share2, Trophy, X } from 'lucide-react-native'
import { useTheme } from '../../theme'
import {
  fetchLeaderboard, fetchLeagueDetail, fetchMyPositions, fetchTradeFeed, leaveLeague,
} from '../../api/league'
import type {
  LeaderboardEntry, LeagueDetail as LeagueDetailType, LeaguePosition, LeagueTrade, MarketSessionStatus,
} from '../../types'
import { PlaceTradeModal } from './PlaceTradeModal'
import { fmtMoney, fmtNum, leagueShareMessage, leagueStatusColor, leagueStatusLabel } from './leagueShared'
import { apiErrorMessage } from '../../utils/apiError'

type Props = {
  visible: boolean
  leagueId: string | null
  myUserId?: string
  marketSessions?: MarketSessionStatus[]
  onClose: () => void
  onLeft?: () => void
  toast?: { show: (msg: string, type?: 'success' | 'error' | 'info') => void }
}

export function LeagueDetailModal({ visible, leagueId, myUserId, marketSessions, onClose, onLeft, toast }: Props) {
  const { palette } = useTheme()
  const insets = useSafeAreaInsets()
  const [detail, setDetail] = useState<LeagueDetailType | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [feed, setFeed] = useState<LeagueTrade[]>([])
  const [positions, setPositions] = useState<LeaguePosition[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [tradeOpen, setTradeOpen] = useState(false)
  const [leaving, setLeaving] = useState(false)

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
      setLoadError(false)
    } catch {
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [leagueId])

  const status = detail?.league.status
  useEffect(() => {
    if (!visible || !leagueId) return
    void load()
    if (status === 'FINISHED') return // 종료된 리그는 변동 없음 — 폴링 안 함.
    const interval = setInterval(() => { void load() }, 10000)
    return () => clearInterval(interval)
  }, [visible, leagueId, load, status])

  const handleShare = async () => {
    if (!detail) return
    try {
      await Share.share({ message: leagueShareMessage(detail.league.name, detail.league.joinCode) })
    } catch { /* user 취소 */ }
  }

  const handleLeave = async () => {
    if (!leagueId || leaving) return
    setLeaving(true)
    try {
      await leaveLeague(leagueId)
      toast?.show('리그에서 나갔어요', 'info')
      onLeft?.()
      onClose()
    } catch (e) {
      toast?.show(apiErrorMessage(e, '나가기 실패'), 'error')
    } finally {
      setLeaving(false)
    }
  }

  const league = detail?.league
  const me = leaderboard.find((e) => e.userId === myUserId)
  const isHost = !!league && !!myUserId && league.hostUserId === myUserId
  const canTrade = league?.status === 'RUNNING' && !!myUserId && !!me
  // 나가기: 호스트 불가, RUNNING/FINISHED 불가 (DRAFT/OPEN 만).
  const canLeave = !!league && !isHost && (league.status === 'DRAFT' || league.status === 'OPEN')

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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ color: palette.ink, fontSize: 16, fontWeight: '900' }} numberOfLines={1}>
                {league?.name ?? '리그'}
              </Text>
              {isHost ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#fbbf2422', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 }}>
                  <Crown size={10} color="#fbbf24" strokeWidth={2.5} />
                  <Text style={{ color: '#fbbf24', fontSize: 9, fontWeight: '800' }}>호스트</Text>
                </View>
              ) : null}
            </View>
            {league ? (
              <Text style={{ color: leagueStatusColor(league.status, palette), fontSize: 11, fontWeight: '700' }}>
                {leagueStatusLabel(league.status)}
                <Text style={{ color: palette.inkMuted, fontWeight: '400' }}> · 코드 {league.joinCode} · {remainText(league.status, league.startedAt, league.endsAt)}</Text>
              </Text>
            ) : null}
          </View>
          <Pressable onPress={() => void handleShare()} hitSlop={8} accessibilityRole="button" accessibilityLabel="참가 코드 공유" style={{ padding: 4 }}>
            <Share2 size={16} color={palette.inkSub} strokeWidth={2.5} />
          </Pressable>
          <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="닫기">
            <X size={20} color={palette.inkMuted} strokeWidth={2.5} />
          </Pressable>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          contentContainerStyle={{ padding: 14, gap: 14 }}
        >
          {loadError && !league ? (
            <View style={{ paddingVertical: 30, alignItems: 'center', gap: 8 }}>
              <Text style={{ color: palette.inkMuted, fontSize: 13, fontWeight: '700' }}>불러오기 실패</Text>
              <Pressable
                onPress={() => void load()}
                accessibilityRole="button"
                style={({ pressed }) => ({
                  backgroundColor: pressed ? palette.surfaceAlt : palette.surface,
                  borderWidth: 1, borderColor: palette.border, borderRadius: 8,
                  paddingHorizontal: 18, paddingVertical: 9,
                })}
              >
                <Text style={{ color: palette.ink, fontSize: 13, fontWeight: '800' }}>다시 시도</Text>
              </Pressable>
            </View>
          ) : !league && !loadError ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <Text style={{ color: palette.inkFaint, fontSize: 12 }}>불러오는 중…</Text>
            </View>
          ) : null}

          {/* 리더보드 */}
          {league ? (
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
                      평가 {fmtMoney(e.totalAssets, league.currency)} · 보유 {e.positionCount}종목
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
                {loading ? '불러오는 중…' : '아직 참가자가 없어요'}
              </Text>
            ) : null}
          </View>
          ) : null}

          {/* 내 자산 — 현금 + 총자산 */}
          {league && me ? (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1, backgroundColor: palette.surface, borderRadius: 12, borderWidth: 1, borderColor: palette.border, padding: 12, gap: 3 }}>
                <Text style={{ color: palette.inkMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1 }}>내 현금</Text>
                <Text style={{ color: palette.ink, fontSize: 16, fontWeight: '900', fontVariant: ['tabular-nums'] }}>
                  {fmtMoney(me.cashBalance, league.currency)}
                </Text>
              </View>
              <View style={{ flex: 1, backgroundColor: palette.surface, borderRadius: 12, borderWidth: 1, borderColor: palette.border, padding: 12, gap: 3 }}>
                <Text style={{ color: palette.inkMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1 }}>총자산</Text>
                <Text style={{ color: palette.ink, fontSize: 16, fontWeight: '900', fontVariant: ['tabular-nums'] }}>
                  {fmtMoney(me.totalAssets, league.currency)}
                </Text>
              </View>
            </View>
          ) : null}

          {/* 거래 액션 */}
          {canTrade ? (
            <Pressable
              onPress={() => setTradeOpen(true)}
              accessibilityRole="button"
              style={({ pressed }) => ({
                backgroundColor: pressed ? palette.brandAccent + 'cc' : palette.brandAccent,
                borderRadius: 12, paddingVertical: 14, alignItems: 'center',
              })}
            >
              <Text style={{ color: palette.bg, fontSize: 15, fontWeight: '900' }}>거래하기</Text>
            </Pressable>
          ) : league?.status === 'RUNNING' && !me && myUserId ? (
            <Text style={{ color: palette.inkFaint, fontSize: 11, textAlign: 'center' }}>내 정보 불러오는 중…</Text>
          ) : null}

          {/* 내 포지션 */}
          {league && positions.length > 0 ? (
            <View style={{ backgroundColor: palette.surface, borderRadius: 12, borderWidth: 1, borderColor: palette.border, padding: 12, gap: 6 }}>
              <Text style={{ color: palette.inkMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1 }}>
                내 보유 ({positions.length}종목)
              </Text>
              {positions.map((p) => {
                const up = (p.returnPct ?? 0) >= 0
                const retColor = p.returnPct == null ? palette.inkFaint : up ? palette.up : palette.down
                return (
                  <View key={`${p.market}:${p.ticker}`} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: 8 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: palette.ink, fontSize: 13, fontWeight: '800' }}>{p.name}</Text>
                      <Text style={{ color: palette.inkMuted, fontSize: 10 }}>{p.market} · {p.ticker} · {p.quantity}주</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ color: retColor, fontSize: 13, fontWeight: '900' }}>
                        {p.returnPct == null ? '—' : `${up ? '+' : ''}${p.returnPct.toFixed(2)}%`}
                      </Text>
                      <Text style={{ color: palette.inkMuted, fontSize: 10 }}>
                        평단 {fmtNum(p.averageCost)}{p.currentPrice != null ? ` → ${fmtNum(p.currentPrice)}` : ''}
                      </Text>
                    </View>
                  </View>
                )
              })}
            </View>
          ) : null}

          {/* 거래 피드 */}
          {league ? (
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
                        {t.quantity}주 @ {fmtNum(t.originalPrice)} {t.originalCurrency} · {timeAgo(t.executedAt)}
                      </Text>
                    </View>
                    <Text style={{ color, fontSize: 11, fontWeight: '800' }}>
                      {t.side === 'BUY' ? '매수' : '매도'} {fmtMoney(t.notionalAmount, league.currency)}
                    </Text>
                  </View>
                )
              })
            )}
          </View>
          ) : null}

          {/* 나가기 (비호스트 · DRAFT/OPEN) */}
          {canLeave ? (
            <Pressable
              onPress={() => void handleLeave()}
              disabled={leaving}
              accessibilityRole="button"
              style={({ pressed }) => ({
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                paddingVertical: 12, borderRadius: 10,
                borderWidth: 1, borderColor: palette.border,
                opacity: pressed || leaving ? 0.6 : 1,
              })}
            >
              <LogOut size={14} color={palette.down} strokeWidth={2.5} />
              <Text style={{ color: palette.down, fontSize: 13, fontWeight: '800' }}>
                {leaving ? '나가는 중…' : '리그 나가기'}
              </Text>
            </Pressable>
          ) : null}
        </ScrollView>

        {/* 거래 모달 */}
        {leagueId && league ? (
          <PlaceTradeModal
            visible={tradeOpen}
            leagueId={leagueId}
            positions={positions}
            cashBalance={me?.cashBalance ?? 0}
            currency={league.currency}
            marketScope={league.marketScope}
            totalAssets={me?.totalAssets ?? 0}
            tradingHours={league.tradingHours}
            marketSessions={marketSessions ?? []}
            onClose={() => setTradeOpen(false)}
            onTraded={() => { void load() }}
            toast={toast}
          />
        ) : null}
      </View>
    </Modal>
  )
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
