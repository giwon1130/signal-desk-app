/**
 * 동료 포트폴리오 드릴다운 — 리더보드에서 참가자를 탭하면 그 사람의
 * 현금·주식평가·총자산·수익률 + 현재 보유 종목(종목별 현재가·수익률)을 보여준다.
 * 공개(OPEN) 리그에서만 타인 조회가 가능하며, 가시성은 백엔드가 강제한다.
 */
import { useEffect, useState } from 'react'
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from 'react-native'
import { X } from 'lucide-react-native'
import { useTheme } from '../../theme'
import { fetchMemberPositions } from '../../api/league'
import type { LeaderboardEntry, LeagueCurrency, LeaguePosition } from '../../types'
import { fmtMoney, fmtNum } from './leagueShared'

type Props = {
  visible: boolean
  leagueId: string | null
  member: LeaderboardEntry | null
  currency: LeagueCurrency
  onClose: () => void
}

export function MemberPortfolioModal({ visible, leagueId, member, currency, onClose }: Props) {
  const { palette } = useTheme()
  const [positions, setPositions] = useState<LeaguePosition[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!visible || !leagueId || !member) return
    let alive = true
    setLoading(true)
    setError(false)
    setPositions([])
    fetchMemberPositions(leagueId, member.userId)
      .then((p) => { if (alive) setPositions(p) })
      .catch(() => { if (alive) setError(true) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [visible, leagueId, member])

  const ret = member?.returnRate ?? 0
  const retColor = ret >= 0 ? palette.up : palette.down

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: '#0008', justifyContent: 'center', padding: 20 }}>
        {/* 카드 내부 탭은 닫히지 않게 (onPress no-op) */}
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: palette.bg, borderRadius: 16, borderWidth: 1, borderColor: palette.border,
            maxHeight: '82%', overflow: 'hidden',
          }}
        >
          {/* 헤더 — 아바타 · 닉네임 · 순위 · 수익률 */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, borderBottomWidth: 1, borderBottomColor: palette.border }}>
            <Text style={{ fontSize: 24 }}>{member?.avatarEmoji ?? '🐱'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: palette.ink, fontSize: 16, fontWeight: '900' }} numberOfLines={1}>{member?.nickname ?? ''}</Text>
              <Text style={{ color: palette.inkMuted, fontSize: 11, fontWeight: '700' }}>
                {member ? `${member.rank}위 · 보유 ${member.positionCount}종목` : ''}
              </Text>
            </View>
            <Text style={{ color: retColor, fontSize: 18, fontWeight: '900', fontVariant: ['tabular-nums'] }}>
              {ret >= 0 ? '+' : ''}{(ret * 100).toFixed(2)}%
            </Text>
            <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="닫기">
              <X size={20} color={palette.inkMuted} strokeWidth={2.5} />
            </Pressable>
          </View>

          {/* 자산 요약 — 현금 / 주식평가 / 총자산 */}
          {member ? (
            <View style={{ flexDirection: 'row', padding: 12, gap: 8 }}>
              <Stat label="현금" value={fmtMoney(member.cashBalance, currency)} palette={palette} />
              <Stat label="주식평가" value={fmtMoney(member.evaluatedAssets, currency)} palette={palette} />
              <Stat label="총자산" value={fmtMoney(member.totalAssets, currency)} palette={palette} />
            </View>
          ) : null}

          {/* 보유 종목 */}
          <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 18 }}>
            <Text style={{ color: palette.inkMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 2 }}>
              보유 종목 ({positions.length})
            </Text>
            {loading ? (
              <View style={{ paddingVertical: 24, alignItems: 'center' }}><ActivityIndicator color={palette.inkMuted} /></View>
            ) : error ? (
              <Text style={{ color: palette.inkFaint, fontSize: 12, textAlign: 'center', paddingVertical: 20 }}>불러오기 실패</Text>
            ) : positions.length === 0 ? (
              <Text style={{ color: palette.inkFaint, fontSize: 12, textAlign: 'center', paddingVertical: 20 }}>현재 보유 종목이 없습니다 (전액 현금)</Text>
            ) : positions.map((p) => {
              const up = (p.returnPct ?? 0) >= 0
              const c = p.returnPct == null ? palette.inkFaint : up ? palette.up : palette.down
              const gain = p.currentPrice != null ? (p.currentPrice - p.averageCost) * p.quantity : null
              return (
                <View key={`${p.market}:${p.ticker}`} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 8, borderTopWidth: 1, borderTopColor: palette.border }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: palette.ink, fontSize: 13, fontWeight: '800' }} numberOfLines={1}>{p.name}</Text>
                    <Text style={{ color: palette.inkMuted, fontSize: 10 }}>{p.market} · {p.ticker} · {p.quantity}주</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ color: c, fontSize: 13, fontWeight: '900' }}>
                      {p.returnPct == null ? '—' : `${up ? '+' : ''}${p.returnPct.toFixed(2)}%`}
                    </Text>
                    {gain != null ? (
                      <Text style={{ color: c, fontSize: 11, fontWeight: '700' }}>
                        {gain >= 0 ? '+' : '-'}{fmtMoney(Math.abs(gain), currency)}
                      </Text>
                    ) : null}
                    <Text style={{ color: palette.inkMuted, fontSize: 10 }}>
                      평단 {fmtNum(p.averageCost)}{p.currentPrice != null ? ` → ${fmtNum(p.currentPrice)}` : ''}
                    </Text>
                  </View>
                </View>
              )
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

function Stat({ label, value, palette }: { label: string; value: string; palette: any }) {
  return (
    <View style={{ flex: 1, backgroundColor: palette.surface, borderRadius: 10, borderWidth: 1, borderColor: palette.border, padding: 10, gap: 2 }}>
      <Text style={{ color: palette.inkMuted, fontSize: 9, fontWeight: '800', letterSpacing: 0.5 }}>{label}</Text>
      <Text style={{ color: palette.ink, fontSize: 13, fontWeight: '900', fontVariant: ['tabular-nums'] }} numberOfLines={1}>{value}</Text>
    </View>
  )
}
