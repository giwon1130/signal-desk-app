/**
 * Trading League — 친구 모의투자 탭 홈.
 * 내 참여 리그 목록 + '만들기' + 코드로 참가(닉네임은 참가 모달에서).
 */
import { memo, useCallback, useEffect, useState } from 'react'
import { Pressable, RefreshControl, ScrollView, Share, Text, TextInput, View } from 'react-native'
import { ChevronRight, Plus, Share2, Trophy } from 'lucide-react-native'
import { useStyles } from '../styles'
import { useTheme } from '../theme'
import type { League } from '../types'
import { fetchMyLeagues } from '../api/league'
import { Entrance, GradientBackground, PressableScale, glow } from '../components/effects'
import { TabIntro } from '../components/guide/TabIntro'
import { ProUpgradeSheet } from '../components/pro/ProUpgrade'
import { FREE_LIMITS } from '../lib/entitlements'
import {
  fmtMoney, leagueShareMessage, leagueStatusColor, leagueStatusLabel,
} from '../components/league_parts/leagueShared'

type Props = {
  authToken: string | null
  refreshing?: boolean
  onOpenLeague: (leagueId: string) => void
  onCreateLeague: () => void
  onRequestJoin: (code: string) => void
  /** PRO 여부 — FREE 는 진행 중 리그 1개 제한 */
  isPro?: boolean
}

// memo: AppShell 재렌더(다른 탭 상태 변화 등)에 끌려 다시 그리지 않도록.
export const LeagueTab = memo(function LeagueTab({ authToken, refreshing, onOpenLeague, onCreateLeague, onRequestJoin, isPro = false }: Props) {
  const styles = useStyles()
  const { palette } = useTheme()
  const [leagues, setLeagues] = useState<League[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [upgradeOpen, setUpgradeOpen] = useState(false)

  // FREE 는 진행 중(미종료) 리그 1개까지. 초과 시 만들기 대신 업그레이드 안내.
  const ongoingCount = leagues.filter((l) => l.status !== 'FINISHED').length
  const atLeagueLimit = !isPro && ongoingCount >= FREE_LIMITS.leagues
  const handleCreate = () => { if (atLeagueLimit) setUpgradeOpen(true); else onCreateLeague() }

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

  const codeValid = joinCode.trim().length >= 5

  const handleJoin = () => {
    if (!codeValid) return
    onRequestJoin(joinCode.trim().toUpperCase())
    setJoinCode('')
  }

  return (
    <>
    <ScrollView
      style={styles.scroll}
      refreshControl={<RefreshControl refreshing={!!refreshing || loading} onRefresh={load} />}
      contentContainerStyle={styles.content}
    >
      {/* 탭 인트로 — 컴팩트 타이틀, 처음 몇 번만 펼친 설명 */}
      <TabIntro
        tabKey="league"
        icon={Trophy}
        title="리그"
        tagline="친구와 모의투자 수익률 경쟁"
        description="자본금·기간을 정해 친구들과 가상으로 경쟁해요. 매수가는 실시간 시세로 잠기고, 마감 때 시상대에서 순위가 갈립니다. 리그를 만들거나 친구 코드로 참가하세요."
        accent="#f59e0b"
      />

      {/* 액션 */}
      <View style={[styles.card, { gap: 12 }]}>
        {atLeagueLimit ? (
          <Text style={{ color: palette.inkMuted, fontSize: 11, fontWeight: '600' }}>
            무료는 진행 중 리그 1개까지예요 · PRO는 무제한 💎
          </Text>
        ) : null}
        <PressableScale onPress={handleCreate} accessibilityLabel="새 리그 만들기" style={{ borderRadius: 12, overflow: 'hidden' }}>
          <View style={[
            { paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 12, overflow: 'hidden' },
            glow(palette.brandAccent, 12, 0.5),
          ]}>
            <GradientBackground colors={[{ offset: '0', color: palette.brandAccent }, { offset: '1', color: palette.blue }]} radius={12} x1="0" y1="0" x2="1" y2="0" />
            <Plus size={15} color="#ffffff" strokeWidth={3} />
            <Text style={{ color: '#ffffff', fontSize: 15, fontWeight: '900' }}>새 리그 만들기</Text>
          </View>
        </PressableScale>

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
              onSubmitEditing={handleJoin}
              style={{
                backgroundColor: palette.surfaceAlt, color: palette.ink,
                borderWidth: 1, borderColor: palette.border, borderRadius: 8,
                paddingHorizontal: 12, paddingVertical: 10,
                fontSize: 14, fontWeight: '700', letterSpacing: 2,
              }}
            />
          </View>
          <Pressable
            onPress={handleJoin}
            disabled={!codeValid}
            accessibilityRole="button"
            accessibilityLabel="리그 참가"
            style={({ pressed }) => ({
              backgroundColor: pressed ? palette.blue + 'cc' : palette.blue,
              borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10,
              opacity: codeValid ? 1 : 0.5,
            })}
          >
            <Text style={{ color: palette.bg, fontSize: 13, fontWeight: '800' }}>참가</Text>
          </Pressable>
        </View>
        <Text style={{ color: palette.inkFaint, fontSize: 11 }}>
          친구가 보낸 링크를 누르면 코드 없이 바로 참가할 수 있습니다.
        </Text>
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
              참여 중인 리그가 없습니다
            </Text>
            <Text style={{ color: palette.inkFaint, fontSize: 11, textAlign: 'center', lineHeight: 16 }}>
              새 리그를 만들거나, 친구가 준 코드로 참가해보세요.
            </Text>
          </View>
        ) : (
          leagues.map((l, i) => (
            <Entrance key={l.id} index={i}>
              <LeagueRow league={l} onPress={() => onOpenLeague(l.id)} />
            </Entrance>
          ))
        )}
      </View>
    </ScrollView>
    <ProUpgradeSheet visible={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </>
  )
})

function LeagueRow({ league, onPress }: { league: League; onPress: () => void }) {
  const { palette } = useTheme()
  const statusColor = leagueStatusColor(league.status, palette)

  const targetMs = new Date(league.status === 'OPEN' ? league.startedAt : league.endsAt).getTime()
  const diff = targetMs - Date.now()
  const remainText = formatDuration(diff)
  const remainLabel = league.status === 'OPEN' ? '시작까지' : league.status === 'RUNNING' ? '남은 시간' : ''

  const shareCode = async () => {
    try {
      await Share.share({ message: leagueShareMessage(league.name, league.joinCode) })
    } catch { /* 취소 */ }
  }

  const running = league.status === 'RUNNING'
  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel={`${league.name} 리그 열기`}
      style={[
        {
          flexDirection: 'row', alignItems: 'center', gap: 10,
          backgroundColor: palette.surfaceAlt, borderRadius: 12,
          borderLeftWidth: 3, borderLeftColor: statusColor,
          paddingVertical: 12, paddingHorizontal: 12, marginBottom: 8,
        },
        running ? glow(statusColor, 8, 0.32) : null,
      ]}
    >
      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: statusColor + '22', alignItems: 'center', justifyContent: 'center' }}>
        <Trophy size={16} color={statusColor} strokeWidth={2.5} />
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ color: palette.ink, fontSize: 14, fontWeight: '800', flexShrink: 1, minWidth: 0 }} numberOfLines={1}>{league.name}</Text>
          <View style={[
            { backgroundColor: statusColor + '22', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, flexShrink: 0 },
            running ? glow(statusColor, 6, 0.5) : null,
          ]}>
            <Text style={{ color: statusColor, fontSize: 9, fontWeight: '900' }}>{leagueStatusLabel(league.status)}</Text>
          </View>
        </View>
        <Text style={{ color: palette.inkMuted, fontSize: 11 }} numberOfLines={1}>
          {league.currency} · {league.marketScope} · 자본금 {fmtMoney(league.startingCapital, league.currency)}
        </Text>
        {remainLabel && diff > 0 ? (
          <Text style={{ color: palette.inkFaint, fontSize: 10 }}>{remainLabel} {remainText} · 코드 {league.joinCode}</Text>
        ) : (
          <Text style={{ color: palette.inkFaint, fontSize: 10 }}>코드 {league.joinCode}</Text>
        )}
      </View>
      <Pressable
        onPress={() => void shareCode()}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="참가 링크 공유"
        style={{ padding: 6 }}
      >
        <Share2 size={15} color={palette.inkSub} strokeWidth={2.5} />
      </Pressable>
      <ChevronRight size={16} color={palette.inkFaint} strokeWidth={2.5} />
    </PressableScale>
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
