/**
 * 내 시즌 규칙 대시보드 — 저장한 시즈널리티 패턴(알고리즘 포트폴리오)을 한눈에.
 * 다음 알림이 임박한 순으로 정렬, 삭제·종목 진입. 트리거: BUY=월 시작 2일 전, AVOID=1일(백엔드와 일치).
 */
import { useEffect, useState } from 'react'
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { CalendarRange, Trash2, X } from 'lucide-react-native'
import { useTheme, type Palette } from '../theme'
import type { SeasonalityRule } from '../types/backtest'
import { deleteSeasonalityRule, listSeasonalityRules } from '../api/backtest'

type Props = { visible: boolean; onClose: () => void; onOpenDetail: (market: string, ticker: string, name?: string) => void }

function triggerInfo(kind: string, month: number) {
  const now = new Date(); now.setHours(0, 0, 0, 0)
  const inSeason = now.getMonth() + 1 === month
  const lead = kind === 'BUY_MONTH' ? 2 : 0
  const year = now.getFullYear()
  let trigger = new Date(year, month - 1, 1); trigger.setDate(trigger.getDate() - lead)
  if (trigger.getTime() < now.getTime()) { trigger = new Date(year + 1, month - 1, 1); trigger.setDate(trigger.getDate() - lead) }
  const days = Math.round((trigger.getTime() - now.getTime()) / 86400000)
  return { inSeason, trigger, days }
}
const signed = (v: number | null, d = 1) => (v == null ? '—' : v >= 0 ? `+${v.toFixed(d)}` : v.toFixed(d))

export function SeasonalityRulesModal({ visible, onClose, onOpenDetail }: Props) {
  const { palette } = useTheme()
  const insets = useSafeAreaInsets()
  const [rules, setRules] = useState<SeasonalityRule[]>([])
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (!visible) return
    let alive = true
    setLoading(true)
    listSeasonalityRules().then((r) => { if (alive) { setRules(r); setLoading(false) } })
    return () => { alive = false }
  }, [visible])

  const sorted = [...rules].sort((a, b) => {
    const ta = triggerInfo(a.kind, a.month); const tb = triggerInfo(b.kind, b.month)
    return (ta.inSeason ? -1 : ta.days) - (tb.inSeason ? -1 : tb.days)
  })

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    const ok = await deleteSeasonalityRule(id)
    if (ok) setRules((rs) => rs.filter((r) => r.id !== id))
    setDeletingId(null)
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }} onPress={onClose}>
        <View style={{ flex: 1 }} />
        <Pressable onPress={(e) => e.stopPropagation()} style={{ backgroundColor: palette.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: insets.bottom + 8, maxHeight: '82%' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: palette.border }}>
            <CalendarRange size={17} color={palette.purple ?? '#7c3aed'} strokeWidth={2.6} />
            <Text style={{ flex: 1, color: palette.ink, fontSize: 16, fontWeight: '900' }}>내 시즌 규칙</Text>
            <Text style={{ color: palette.inkFaint, fontSize: 12, fontWeight: '700' }}>{rules.length}개</Text>
            <Pressable onPress={onClose} hitSlop={10} style={{ marginLeft: 4 }}><X size={20} color={palette.inkMuted} strokeWidth={2.5} /></Pressable>
          </View>

          {loading ? (
            <View style={{ paddingVertical: 56, alignItems: 'center' }}><ActivityIndicator color={palette.purple ?? '#7c3aed'} /></View>
          ) : rules.length === 0 ? (
            <View style={{ paddingVertical: 50, alignItems: 'center', gap: 6 }}>
              <CalendarRange size={28} color={palette.inkFaint} strokeWidth={1.8} />
              <Text style={{ color: palette.inkMuted, fontSize: 13, fontWeight: '700' }}>저장한 시즌 규칙이 없어요</Text>
              <Text style={{ color: palette.inkFaint, fontSize: 11, textAlign: 'center', paddingHorizontal: 30 }}>
                종목 상세 → 시즈널리티에서 강한 패턴을 저장하면{'\n'}여기 모이고, 그 달이 오면 알림이 와요
              </Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ paddingHorizontal: 14, paddingVertical: 8 }}>
              {sorted.map((r) => <RuleRow key={r.id} rule={r} palette={palette} deleting={deletingId === r.id}
                onOpen={() => { onClose(); onOpenDetail(r.market, r.ticker, r.name) }} onDelete={() => void handleDelete(r.id)} />)}
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  )
}

function RuleRow({ rule, palette, deleting, onOpen, onDelete }: { rule: SeasonalityRule; palette: Palette; deleting: boolean; onOpen: () => void; onDelete: () => void }) {
  const buy = rule.kind === 'BUY_MONTH'
  const c = buy ? palette.up : palette.down
  const t = triggerInfo(rule.kind, rule.month)
  const triggerLabel = t.inSeason
    ? `🔥 이번 달 ${buy ? '강세' : '약세'} 진행 중`
    : t.days === 0 ? '오늘 알림 예정' : `D-${t.days} · ${t.trigger.getMonth() + 1}월 ${t.trigger.getDate()}일 알림`
  const hit = rule.winRatePct != null && rule.sampleYears != null ? Math.round(rule.winRatePct / 100 * rule.sampleYears) : null
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: palette.border }}>
      <Pressable onPress={onOpen} style={({ pressed }) => ({ flex: 1, paddingVertical: 11, paddingHorizontal: 6, opacity: pressed ? 0.6 : 1 })}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
          <View style={{ backgroundColor: c + '22', borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 }}>
            <Text style={{ color: c, fontSize: 10.5, fontWeight: '900' }}>{rule.month}월 {buy ? '강세' : '약세'}</Text>
          </View>
          <Text style={{ flex: 1, color: palette.ink, fontSize: 14, fontWeight: '800' }} numberOfLines={1}>{rule.name}</Text>
          <Text style={{ color: palette.inkFaint, fontSize: 10, fontWeight: '700' }}>{rule.market} · {rule.ticker}</Text>
        </View>
        <Text style={{ color: palette.inkMuted, fontSize: 11, marginTop: 3 }}>
          평균 {signed(rule.meanPct)}%{hit != null ? ` · ${rule.sampleYears}년 중 ${hit}년 ${buy ? '상승' : '하락'}` : ''}
        </Text>
        <Text style={{ color: t.inSeason ? c : palette.inkSub, fontSize: 11, fontWeight: '800', marginTop: 2 }}>{triggerLabel}</Text>
      </Pressable>
      <Pressable onPress={onDelete} disabled={deleting} hitSlop={8} style={{ padding: 10, opacity: deleting ? 0.4 : 0.7 }}>
        <Trash2 size={16} color={palette.inkFaint} strokeWidth={2.2} />
      </Pressable>
    </View>
  )
}
