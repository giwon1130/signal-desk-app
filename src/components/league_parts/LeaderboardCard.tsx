/**
 * 리더보드 — 상위 3명 시상대(메달·금빛 글로우·그라데이션) + 4위↓ 순차 진입 행.
 * 행/시상대 탭 시 동료 포트폴리오 드릴다운 (공개 리그 또는 본인).
 */
import { ChevronRight, Crown } from 'lucide-react-native'
import { Text, View } from 'react-native'
import { useTheme } from '../../theme'
import type { LeaderboardEntry, League } from '../../types'
import { fmtMoney } from './leagueShared'
import { Entrance, GradientBackground, PressableScale, glow } from '../effects'

const MEDAL = ['🥇', '🥈', '🥉']
// 순위별 시상대 색 (그라데이션 stop + 글로우 + 높이)
const PODIUM = [
  { grad: [{ offset: '0', color: '#fde68a' }, { offset: '1', color: '#f59e0b' }], glowColor: '#f59e0b', height: 132 }, // 1위 금
  { grad: [{ offset: '0', color: '#f1f5f9' }, { offset: '1', color: '#94a3b8' }], glowColor: '#cbd5e1', height: 106 }, // 2위 은
  { grad: [{ offset: '0', color: '#eab589' }, { offset: '1', color: '#b45309' }], glowColor: '#d97706', height: 92 },  // 3위 동
]
const PODIUM_INK = '#1f2937'

export function LeaderboardCard({ leaderboard, league, myUserId, onSelectMember }: {
  leaderboard: LeaderboardEntry[]
  league: League
  myUserId?: string
  onSelectMember: (e: LeaderboardEntry) => void
}) {
  const { palette } = useTheme()
  const canDrill = (e: LeaderboardEntry) => league.visibility === 'OPEN' || e.userId === myUserId

  const top3 = leaderboard.slice(0, 3)
  const hasPodium = leaderboard.length >= 3
  const rest = hasPodium ? leaderboard.slice(3) : leaderboard
  // 시상대 시각 배치: [2위, 1위, 3위]
  const podiumOrder: Array<{ e: LeaderboardEntry; rank: number }> = hasPodium
    ? [{ e: top3[1], rank: 2 }, { e: top3[0], rank: 1 }, { e: top3[2], rank: 3 }]
    : []

  return (
    <View style={{ backgroundColor: palette.surface, borderRadius: 12, borderWidth: 1, borderColor: palette.border, padding: 12, gap: 8 }}>
      <Text style={{ color: palette.inkMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1 }}>
        리더보드 ({leaderboard.length}명)
      </Text>

      {leaderboard.length === 0 ? (
        <Text style={{ color: palette.inkFaint, fontSize: 11, textAlign: 'center', paddingVertical: 14 }}>
          아직 참가자가 없습니다
        </Text>
      ) : null}

      {/* 시상대 (상위 3) */}
      {hasPodium ? (
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingTop: 20, paddingBottom: 4 }}>
          {podiumOrder.map(({ e, rank }, i) => {
            const conf = PODIUM[rank - 1]
            const isMe = e.userId === myUserId
            const up = e.returnRate >= 0
            return (
              <Entrance key={e.userId} index={i} distance={22} style={{ flex: 1 }}>
                <PressableScale
                  onPress={canDrill(e) ? () => onSelectMember(e) : undefined}
                  accessibilityLabel={`${e.nickname} ${rank}위`}
                  style={{ alignItems: 'center', gap: 3 }}
                >
                  {rank === 1
                    ? <Crown size={20} color="#fbbf24" strokeWidth={2} fill="#fbbf24" />
                    : <View style={{ height: 20 }} />}
                  <View
                    style={[
                      {
                        width: '100%', height: conf.height, borderRadius: 14, overflow: 'hidden',
                        alignItems: 'center', justifyContent: 'center', gap: 3, paddingHorizontal: 4,
                        borderWidth: isMe ? 2 : 0, borderColor: palette.brandAccent,
                      },
                      glow(conf.glowColor, rank === 1 ? 16 : 9, rank === 1 ? 0.7 : 0.4),
                    ]}
                  >
                    <GradientBackground colors={conf.grad} radius={14} x1="0" y1="0" x2="0.5" y2="1" />
                    <Text style={{ fontSize: rank === 1 ? 30 : 24 }}>{e.avatarEmoji}</Text>
                    <Text style={{ fontSize: 17 }}>{MEDAL[rank - 1]}</Text>
                    <Text numberOfLines={1} style={{ color: PODIUM_INK, fontSize: 11, fontWeight: '900', maxWidth: '100%' }}>
                      {e.nickname}{isMe ? '(나)' : ''}
                    </Text>
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.55)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1 }}>
                      <Text style={{ color: up ? '#b91c1c' : '#1d4ed8', fontSize: 12, fontWeight: '900', fontVariant: ['tabular-nums'] }}>
                        {up ? '+' : ''}{(e.returnRate * 100).toFixed(1)}%
                      </Text>
                    </View>
                  </View>
                </PressableScale>
              </Entrance>
            )
          })}
        </View>
      ) : null}

      {/* 4위↓ (시상대 없으면 전체) */}
      {rest.map((e, i) => {
        const isMe = e.userId === myUserId
        const up = e.returnRate >= 0
        const retColor = up ? palette.up : palette.down
        return (
          <Entrance key={e.userId} index={i} distance={12}>
            <PressableScale
              onPress={canDrill(e) ? () => onSelectMember(e) : undefined}
              accessibilityLabel={`${e.nickname} ${e.rank}위 포트폴리오`}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 10,
                backgroundColor: isMe ? palette.brandAccent + '14' : palette.surfaceAlt,
                paddingHorizontal: 10, paddingVertical: 9, borderRadius: 10,
                borderWidth: isMe ? 1 : 0, borderColor: palette.brandAccent + '55',
              }}
            >
              <Text style={{ color: palette.inkMuted, fontSize: 13, fontWeight: '900', width: 22, textAlign: 'center' }}>{e.rank}</Text>
              <Text style={{ fontSize: 18 }}>{e.avatarEmoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: palette.ink, fontSize: 13, fontWeight: '800' }}>{e.nickname}{isMe ? ' (나)' : ''}</Text>
                <Text style={{ color: palette.inkMuted, fontSize: 10 }}>
                  평가 {fmtMoney(e.totalAssets, league.currency)} · 보유 {e.positionCount}종목
                </Text>
              </View>
              <Text style={{ color: retColor, fontSize: 14, fontWeight: '900', fontVariant: ['tabular-nums'] }}>
                {up ? '+' : ''}{(e.returnRate * 100).toFixed(2)}%
              </Text>
              {canDrill(e) && !isMe ? <ChevronRight size={15} color={palette.inkFaint} strokeWidth={2.5} /> : null}
            </PressableScale>
          </Entrance>
        )
      })}
    </View>
  )
}
