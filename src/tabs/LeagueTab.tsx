/**
 * Trading League — 친구 모의투자 탭 홈.
 * v2.1 신규. 진입 시 내 참여 리그 목록 + '만들기'/'코드로 참가' 버튼.
 * 상세 화면 (리더보드 + 거래) 은 LeagueDetailModal — 다음 phase.
 */
import { useCallback, useEffect, useState } from 'react'
import { Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native'
import { Plus, Trophy } from 'lucide-react-native'
import { useStyles } from '../styles'
import { useTheme } from '../theme'
import type { League } from '../types'
import { fetchMyLeagues, joinLeague } from '../api/league'

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
  const [joinCode, setJoinCode] = useState('')
  const [joining, setJoining] = useState(false)

  const load = useCallback(async () => {
    if (!authToken) return
    setLoading(true)
    try {
      const list = await fetchMyLeagues()
      setLeagues(list)
    } finally {
      setLoading(false)
    }
  }, [authToken])

  useEffect(() => { void load() }, [load])

  const handleJoin = async () => {
    if (!joinCode.trim() || joining) return
    setJoining(true)
    try {
      // 닉네임은 일단 '나' — Phase G 에서 사용자 입력 모달 추가 가능.
      const detail = await joinLeague(joinCode.trim().toUpperCase(), '나')
      toast?.show('리그 참가 완료', 'success')
      setJoinCode('')
      onJoinedLeague(detail.league.id)
      await load()
    } catch (e: any) {
      toast?.show('참가 실패 — 코드 확인', 'error')
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
      <View style={[styles.card, { gap: 10 }]}>
        <Pressable
          onPress={onCreateLeague}
          style={({ pressed }) => ({
            backgroundColor: pressed ? palette.brandAccent + 'cc' : palette.brandAccent,
            borderRadius: 10, paddingVertical: 12,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
          })}
        >
          <Plus size={14} color={palette.bg} strokeWidth={3} />
          <Text style={{ color: palette.bg, fontSize: 14, fontWeight: '800' }}>새 리그 만들기</Text>
        </Pressable>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <TextInput
              value={joinCode}
              onChangeText={(v) => setJoinCode(v.toUpperCase())}
              placeholder="참가 코드 (예: X7K2M)"
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
            onPress={() => void handleJoin()}
            disabled={!joinCode.trim() || joining}
            style={({ pressed }) => ({
              backgroundColor: pressed ? palette.blue + 'cc' : palette.blue,
              borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10,
              opacity: !joinCode.trim() || joining ? 0.5 : 1,
            })}
          >
            <Text style={{ color: palette.bg, fontSize: 13, fontWeight: '800' }}>
              {joining ? '참가 중…' : '참가'}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* 내 리그 목록 */}
      <View style={styles.card}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.cardTitle}>내 리그</Text>
          <Text style={styles.metaText}>{leagues.length}개</Text>
        </View>
        {leagues.length === 0 ? (
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
  const statusLabel =
    league.status === 'DRAFT' ? '준비 중' :
    league.status === 'OPEN' ? '모집 중' :
    league.status === 'RUNNING' ? '진행 중' : '종료됨'
  const statusColor =
    league.status === 'RUNNING' ? palette.brandAccent :
    league.status === 'OPEN' ? palette.blue :
    league.status === 'FINISHED' ? palette.inkMuted : palette.orange

  // 남은 시간 (RUNNING) or 시작까지 (OPEN)
  const targetMs = new Date(league.status === 'OPEN' ? league.startedAt : league.endsAt).getTime()
  const diff = targetMs - Date.now()
  const remainText = formatDuration(diff)
  const remainLabel = league.status === 'OPEN' ? '시작까지' : league.status === 'RUNNING' ? '남은 시간' : ''

  return (
    <Pressable
      onPress={onPress}
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
            <Text style={{ color: statusColor, fontSize: 9, fontWeight: '800' }}>{statusLabel}</Text>
          </View>
        </View>
        <Text style={{ color: palette.inkMuted, fontSize: 11 }}>
          {league.currency} · {league.marketScope} · 자본금 {formatNumber(league.startingCapital)} · 코드 {league.joinCode}
        </Text>
        {remainLabel && diff > 0 ? (
          <Text style={{ color: palette.inkFaint, fontSize: 10 }}>{remainLabel} {remainText}</Text>
        ) : null}
      </View>
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

function formatNumber(n: number): string {
  return n.toLocaleString('ko-KR')
}
