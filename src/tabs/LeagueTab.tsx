/**
 * Trading League — 친구 모의투자 탭 홈.
 * v2.1 신규. 진입 시 내 참여 리그 목록 + '만들기'/'코드로 참가' 버튼.
 * 상세 화면 (리더보드 + 거래) 은 LeagueDetailModal.
 */
import { useCallback, useEffect, useState } from 'react'
import { Pressable, RefreshControl, ScrollView, Share, Text, TextInput, View } from 'react-native'
import { Plus, Share2, Trophy } from 'lucide-react-native'
import { useStyles } from '../styles'
import { useTheme } from '../theme'
import type { League } from '../types'
import { fetchMyLeagues, joinLeague } from '../api/league'
import {
  LEAGUE_AVATARS, fmtMoney, joinErrorMessage, leagueStatusColor, leagueStatusLabel,
} from '../components/league_parts/leagueShared'

type Props = {
  authToken: string | null
  refreshing?: boolean
  onOpenLeague: (leagueId: string) => void
  onCreateLeague: () => void
  onJoinedLeague: (leagueId: string) => void
  toast?: { show: (msg: string, type?: 'success' | 'error' | 'info') => void }
}

export function LeagueTab({ authToken, refreshing, onOpenLeague, onCreateLeague, onJoinedLeague, toast }: Props) {
  const styles = useStyles()
  const { palette } = useTheme()
  const [leagues, setLeagues] = useState<League[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [nickname, setNickname] = useState('')
  const [avatar, setAvatar] = useState(LEAGUE_AVATARS[0])
  const [joining, setJoining] = useState(false)

  const load = useCallback(async () => {
    if (!authToken) return
    setLoading(true)
    setLoadError(false)
    try {
      const list = await fetchMyLeagues()
      setLeagues(list)
    } catch {
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [authToken])

  useEffect(() => { void load() }, [load])

  const canJoin = joinCode.trim().length >= 4 && nickname.trim().length > 0 && !joining

  const handleJoin = async () => {
    if (!canJoin) return
    setJoining(true)
    try {
      const detail = await joinLeague(joinCode.trim().toUpperCase(), nickname.trim(), avatar)
      toast?.show('리그 참가 완료', 'success')
      setJoinCode('')
      onJoinedLeague(detail.league.id)
      await load()
    } catch (e: any) {
      toast?.show(joinErrorMessage(e?.message || ''), 'error')
    } finally {
      setJoining(false)
    }
  }

  return (
    <ScrollView
      style={styles.scroll}
      refreshControl={<RefreshControl refreshing={!!refreshing || loading} onRefresh={load} />}
      contentContainerStyle={styles.content}
    >
      {/* 헤더 */}
      <View style={{ paddingHorizontal: 4, paddingVertical: 4, gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Trophy size={18} color={palette.brandAccent} strokeWidth={2.5} />
          <Text style={{ color: palette.ink, fontSize: 18, fontWeight: '900' }}>친구 모의투자</Text>
        </View>
        <Text style={{ color: palette.inkMuted, fontSize: 12, lineHeight: 17 }}>
          자본금·기간 정해놓고 친구들과 수익률 1등 가리기. 매수가는 실시간 시세로 잠겨요.
        </Text>
      </View>

      {/* 액션 */}
      <View style={[styles.card, { gap: 12 }]}>
        <Pressable
          onPress={onCreateLeague}
          accessibilityRole="button"
          accessibilityLabel="새 리그 만들기"
          style={({ pressed }) => ({
            backgroundColor: pressed ? palette.brandAccent + 'cc' : palette.brandAccent,
            borderRadius: 10, paddingVertical: 12,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
          })}
        >
          <Plus size={14} color={palette.bg} strokeWidth={3} />
          <Text style={{ color: palette.bg, fontSize: 14, fontWeight: '800' }}>새 리그 만들기</Text>
        </Pressable>

        {/* 코드로 참가 — 닉네임 + 아바타 + 코드 */}
        <View style={{ gap: 8 }}>
          <Text style={{ color: palette.inkMuted, fontSize: 11, fontWeight: '800', letterSpacing: 1 }}>
            코드로 참가
          </Text>
          {/* 아바타 선택 */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {LEAGUE_AVATARS.slice(0, 8).map((emo) => (
              <Pressable
                key={emo}
                onPress={() => setAvatar(emo)}
                accessibilityRole="button"
                accessibilityLabel={`아바타 ${emo}`}
                style={{
                  width: 34, height: 34, borderRadius: 8,
                  alignItems: 'center', justifyContent: 'center',
                  backgroundColor: avatar === emo ? palette.brandAccent + '22' : palette.surfaceAlt,
                  borderWidth: 1, borderColor: avatar === emo ? palette.brandAccent : palette.border,
                }}
              >
                <Text style={{ fontSize: 18 }}>{emo}</Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            value={nickname}
            onChangeText={setNickname}
            placeholder="게임에 표시될 내 닉네임"
            placeholderTextColor={palette.inkFaint}
            maxLength={20}
            style={{
              backgroundColor: palette.surfaceAlt, color: palette.ink,
              borderWidth: 1, borderColor: palette.border, borderRadius: 8,
              paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, fontWeight: '700',
            }}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <TextInput
                value={joinCode}
                onChangeText={(v) => setJoinCode(v.toUpperCase())}
                placeholder="참가 코드 (예: X7K2M)"
                placeholderTextColor={palette.inkFaint}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={5}
                style={{
                  backgroundColor: palette.surfaceAlt, color: palette.ink,
                  borderWidth: 1, borderColor: palette.border, borderRadius: 8,
                  paddingHorizontal: 12, paddingVertical: 10,
                  fontSize: 14, fontWeight: '700', letterSpacing: 2,
                }}
              />
            </View>
            <Pressable
              onPress={() => void handleJoin()}
              disabled={!canJoin}
              accessibilityRole="button"
              accessibilityLabel="리그 참가"
              style={({ pressed }) => ({
                backgroundColor: pressed ? palette.blue + 'cc' : palette.blue,
                borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10,
                opacity: canJoin ? 1 : 0.5,
              })}
            >
              <Text style={{ color: palette.bg, fontSize: 13, fontWeight: '800' }}>
                {joining ? '참가 중…' : '참가'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* 내 리그 목록 */}
      <View style={styles.card}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.cardTitle}>내 리그</Text>
          <Text style={styles.metaText}>{leagues.length}개</Text>
        </View>
        {loadError ? (
          <View style={{ paddingVertical: 24, alignItems: 'center', gap: 8 }}>
            <Text style={{ color: palette.inkMuted, fontSize: 12, fontWeight: '700' }}>불러오기 실패</Text>
            <Pressable
              onPress={() => void load()}
              accessibilityRole="button"
              style={({ pressed }) => ({
                backgroundColor: pressed ? palette.surfaceAlt : palette.surface,
                borderWidth: 1, borderColor: palette.border, borderRadius: 8,
                paddingHorizontal: 16, paddingVertical: 8,
              })}
            >
              <Text style={{ color: palette.ink, fontSize: 12, fontWeight: '800' }}>다시 시도</Text>
            </Pressable>
          </View>
        ) : leagues.length === 0 ? (
          <View style={{ paddingVertical: 26, alignItems: 'center', gap: 6 }}>
            <Trophy size={28} color={palette.inkFaint} strokeWidth={1.8} />
            <Text style={{ color: palette.inkMuted, fontSize: 12, fontWeight: '700' }}>
              참여 중인 리그가 없어요
            </Text>
            <Text style={{ color: palette.inkFaint, fontSize: 11, textAlign: 'center', lineHeight: 16 }}>
              새 리그를 만들거나, 친구가 준 코드로 참가해보세요.
            </Text>
          </View>
        ) : (
          leagues.map((l) => <LeagueRow key={l.id} league={l} onPress={() => onOpenLeague(l.id)} />)
        )}
      </View>
    </ScrollView>
  )
}

function LeagueRow({ league, onPress }: { league: League; onPress: () => void }) {
  const { palette } = useTheme()
  const statusColor = leagueStatusColor(league.status, palette)

  // 남은 시간 (RUNNING) or 시작까지 (OPEN)
  const targetMs = new Date(league.status === 'OPEN' ? league.startedAt : league.endsAt).getTime()
  const diff = targetMs - Date.now()
  const remainText = formatDuration(diff)
  const remainLabel = league.status === 'OPEN' ? '시작까지' : league.status === 'RUNNING' ? '남은 시간' : ''

  const shareCode = async () => {
    try {
      await Share.share({
        message: `Signal Desk 리그 "${league.name}" 참가 코드: ${league.joinCode}`,
      })
    } catch { /* 취소 */ }
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${league.name} 리그 열기`}
      style={({ pressed }) => ({
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingVertical: 10, paddingHorizontal: 4,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <View style={{ flex: 1, gap: 3 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ color: palette.ink, fontSize: 14, fontWeight: '800' }}>{league.name}</Text>
          <View style={{ backgroundColor: statusColor + '22', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
            <Text style={{ color: statusColor, fontSize: 9, fontWeight: '800' }}>{leagueStatusLabel(league.status)}</Text>
          </View>
        </View>
        <Text style={{ color: palette.inkMuted, fontSize: 11 }}>
          {league.currency} · {league.marketScope} · 자본금 {fmtMoney(league.startingCapital, league.currency)} · 코드 {league.joinCode}
        </Text>
        {remainLabel && diff > 0 ? (
          <Text style={{ color: palette.inkFaint, fontSize: 10 }}>{remainLabel} {remainText}</Text>
        ) : null}
      </View>
      <Pressable
        onPress={() => void shareCode()}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="참가 코드 공유"
        style={{ padding: 6 }}
      >
        <Share2 size={15} color={palette.inkSub} strokeWidth={2.5} />
      </Pressable>
    </Pressable>
  )
}

function formatDuration(ms: number): string {
  if (ms <= 0) return '곧'
  const sec = Math.floor(ms / 1000)
  const day = Math.floor(sec / 86400)
  const hr = Math.floor((sec % 86400) / 3600)
  if (day > 0) return `${day}일 ${hr}시간`
  const min = Math.floor((sec % 3600) / 60)
  if (hr > 0) return `${hr}시간 ${min}분`
  return `${min}분`
}
