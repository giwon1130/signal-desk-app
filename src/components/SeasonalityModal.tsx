/**
 * 시즈널리티 모달 — 종목의 월별/요일별 역사적 패턴을 정직한 통계로.
 * 핵심 패턴(규칙카드) → 월별 히트맵(등급) → 요일·주말 → 정직 배너.
 * 색: 한국 관례(상승=빨강 palette.up / 하락=파랑 palette.down). 등급은 🟢🟡⚪.
 */
import { useEffect, useState } from 'react'
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Bookmark, BookmarkCheck, CalendarRange, X } from 'lucide-react-native'
import { useTheme, type Palette } from '../theme'
import type { MonthStat, SeasonalityReport, SeasonalityRuleCard, SeasonalityTier } from '../types/backtest'
import { deleteSeasonalityRule, fetchSeasonality, listSeasonalityRules, saveSeasonalityRule } from '../api/backtest'

type Props = { visible: boolean; market: string; ticker: string; name?: string; onClose: () => void }

const TIER_DOT: Record<SeasonalityTier, string> = { STRONG: '🟢', WEAK: '🟡', NOISE: '⚪' }
const signed = (v: number, d = 2) => (v >= 0 ? `+${v.toFixed(d)}` : v.toFixed(d))
const retColor = (v: number, p: Palette) => (v > 0 ? p.up : v < 0 ? p.down : p.inkMuted)

export function SeasonalityModal({ visible, market, ticker, name, onClose }: Props) {
  const { palette } = useTheme()
  const insets = useSafeAreaInsets()
  const [report, setReport] = useState<SeasonalityReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState(false)
  // 저장된 규칙: key=`${kind}:${month}` → ruleId
  const [savedMap, setSavedMap] = useState<Record<string, string>>({})
  const [savingKey, setSavingKey] = useState<string | null>(null)

  useEffect(() => {
    if (!visible) return
    let alive = true
    setLoading(true); setErr(false); setReport(null); setSavedMap({})
    fetchSeasonality(market, ticker, name).then((r) => {
      if (!alive) return
      if (r) setReport(r); else setErr(true)
      setLoading(false)
    })
    listSeasonalityRules().then((rules) => {
      if (!alive) return
      const map: Record<string, string> = {}
      rules
        .filter((rl) => rl.ticker === ticker && rl.market.toUpperCase() === market.toUpperCase())
        .forEach((rl) => { map[`${rl.kind}:${rl.month}`] = rl.id })
      setSavedMap(map)
    })
    return () => { alive = false }
  }, [visible, market, ticker, name])

  const toggleSave = async (h: SeasonalityRuleCard) => {
    if (!report || h.month == null || savingKey) return
    const key = `${h.kind}:${h.month}`
    setSavingKey(key)
    try {
      if (savedMap[key]) {
        const ok = await deleteSeasonalityRule(savedMap[key])
        if (ok) setSavedMap((m) => { const n = { ...m }; delete n[key]; return n })
      } else {
        const stat = report.monthly.find((m) => m.month === h.month)
        const saved = await saveSeasonalityRule({
          market, ticker, name: report.name, kind: h.kind, month: h.month,
          meanPct: stat?.meanPct ?? null, winRatePct: stat?.winRatePct ?? null, sampleYears: stat?.sampleYears ?? null,
        })
        if (saved) setSavedMap((m) => ({ ...m, [key]: saved.id }))
      }
    } finally {
      setSavingKey(null)
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }} onPress={onClose}>
        <View style={{ flex: 1 }} />
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{ backgroundColor: palette.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: insets.bottom + 8, maxHeight: '86%' }}
        >
          {/* 헤더 */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: palette.border }}>
            <CalendarRange size={17} color={palette.purple ?? '#7c3aed'} strokeWidth={2.5} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: palette.ink, fontSize: 16, fontWeight: '900' }} numberOfLines={1}>{report?.name || name || ticker} 시즈널리티</Text>
              {report ? (
                <Text style={{ color: palette.inkFaint, fontSize: 10.5, fontWeight: '600', marginTop: 1 }}>
                  {report.history.years}년({report.history.bars.toLocaleString()}봉) · 비용 {report.costAssumptionPct}% 가정 · {report.history.source}
                </Text>
              ) : null}
            </View>
            <Pressable onPress={onClose} hitSlop={10}><X size={20} color={palette.inkMuted} strokeWidth={2.5} /></Pressable>
          </View>

          {loading ? (
            <View style={{ paddingVertical: 60, alignItems: 'center', gap: 10 }}>
              <ActivityIndicator color={palette.purple ?? '#7c3aed'} />
              <Text style={{ color: palette.inkMuted, fontSize: 12 }}>역사적 패턴 분석 중…</Text>
            </View>
          ) : err || !report ? (
            <View style={{ paddingVertical: 56, alignItems: 'center', gap: 6 }}>
              <CalendarRange size={26} color={palette.inkFaint} strokeWidth={1.8} />
              <Text style={{ color: palette.inkMuted, fontSize: 13, fontWeight: '700' }}>분석할 데이터가 부족합니다</Text>
              <Text style={{ color: palette.inkFaint, fontSize: 11 }}>상장 기간이 짧거나(US 위주) 히스토리를 못 불러왔어요</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
              {/* 핵심 패턴 */}
              {report.highlights.length > 0 ? (
                <View style={{ gap: 8, marginBottom: 16 }}>
                  <Text style={{ color: palette.inkMuted, fontSize: 11, fontWeight: '800', letterSpacing: 0.4 }}>핵심 패턴 (🟢 뚜렷한 것만)</Text>
                  <Text style={{ color: palette.inkFaint, fontSize: 10.5, marginTop: -3 }}>저장하면 그 달이 다가올 때 푸시로 알려드려요</Text>
                  {report.highlights.map((h, i) => {
                    const buy = h.kind === 'BUY_MONTH'
                    const c = buy ? palette.up : palette.down
                    const key = `${h.kind}:${h.month}`
                    const saved = !!savedMap[key]
                    return (
                      <View key={i} style={{ backgroundColor: (buy ? palette.upSoft : palette.downSoft) ?? palette.surfaceAlt, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, borderLeftWidth: 3, borderLeftColor: c }}>
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: c, fontSize: 13.5, fontWeight: '900' }}>{h.title}</Text>
                            <Text style={{ color: palette.inkSub, fontSize: 11.5, lineHeight: 16, marginTop: 2 }}>{h.detail}</Text>
                          </View>
                          <Pressable
                            onPress={() => void toggleSave(h)}
                            disabled={savingKey === key}
                            hitSlop={6}
                            style={{
                              flexDirection: 'row', alignItems: 'center', gap: 3,
                              paddingHorizontal: 8, paddingVertical: 5, borderRadius: 7,
                              backgroundColor: saved ? c + '22' : palette.bg,
                              borderWidth: 1, borderColor: saved ? c : palette.border,
                              opacity: savingKey === key ? 0.5 : 1,
                            }}
                          >
                            {saved ? <BookmarkCheck size={12} color={c} strokeWidth={2.5} /> : <Bookmark size={12} color={palette.inkMuted} strokeWidth={2.5} />}
                            <Text style={{ color: saved ? c : palette.inkMuted, fontSize: 10.5, fontWeight: '800' }}>{saved ? '저장됨' : '저장'}</Text>
                          </Pressable>
                        </View>
                      </View>
                    )
                  })}
                </View>
              ) : null}

              {/* 월별 히트맵 */}
              <Text style={{ color: palette.inkMuted, fontSize: 11, fontWeight: '800', letterSpacing: 0.4, marginBottom: 8 }}>월별 (전부 표시 · 등급)</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 16 }}>
                {report.monthly.map((m) => <MonthCell key={m.month} m={m} palette={palette} />)}
              </View>

              {/* 요일·주말 */}
              <Text style={{ color: palette.inkMuted, fontSize: 11, fontWeight: '800', letterSpacing: 0.4, marginBottom: 8 }}>요일 · 주말</Text>
              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
                {report.weekday.map((d) => (
                  <View key={d.weekday} style={{ flex: 1, alignItems: 'center', backgroundColor: palette.surfaceAlt ?? palette.surface, borderRadius: 8, paddingVertical: 8 }}>
                    <Text style={{ color: palette.inkMuted, fontSize: 11, fontWeight: '800' }}>{d.label}</Text>
                    <Text style={{ color: retColor(d.meanPct, palette), fontSize: 11, fontWeight: '800', marginTop: 2 }}>{signed(d.meanPct, 2)}%</Text>
                    <Text style={{ color: palette.inkFaint, fontSize: 9 }}>{d.winRatePct.toFixed(0)}%</Text>
                  </View>
                ))}
              </View>
              {report.weekendTrade ? (
                <Text style={{ color: palette.inkSub, fontSize: 11, lineHeight: 16, marginBottom: 14 }}>
                  금→월 보유: 평균 {signed(report.weekendTrade.meanPct, 3)}% · 승률 {report.weekendTrade.winRatePct.toFixed(0)}% ·{' '}
                  <Text style={{ color: retColor(report.weekendTrade.netAfterCostPct, palette), fontWeight: '800' }}>
                    비용후 {signed(report.weekendTrade.netAfterCostPct, 3)}%
                  </Text>
                  {report.weekendTrade.netAfterCostPct <= 0 ? ' ⚠️ 수수료가 엣지를 먹음' : ''}
                </Text>
              ) : null}

              {/* 정직 배너 */}
              {report.caveats.map((c, i) => (
                <Text key={i} style={{ color: palette.inkFaint, fontSize: 10.5, lineHeight: 15, marginTop: i === 0 ? 6 : 2 }}>⚠️ {c}</Text>
              ))}
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  )
}

function MonthCell({ m, palette }: { m: MonthStat; palette: Palette }) {
  const c = retColor(m.meanPct, palette)
  const bg = (m.meanPct > 0 ? palette.upSoft : m.meanPct < 0 ? palette.downSoft : palette.surfaceAlt) ?? palette.surfaceAlt
  return (
    <View style={{ width: '31.5%', backgroundColor: bg, borderRadius: 9, paddingVertical: 8, paddingHorizontal: 8, opacity: m.tier === 'NOISE' ? 0.55 : 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
        <Text style={{ fontSize: 10 }}>{TIER_DOT[m.tier]}</Text>
        <Text style={{ color: palette.ink, fontSize: 12, fontWeight: '800' }}>{m.month}월</Text>
      </View>
      <Text style={{ color: c, fontSize: 14, fontWeight: '900', marginTop: 2 }}>{signed(m.meanPct, 1)}%</Text>
      <Text style={{ color: palette.inkFaint, fontSize: 9.5 }}>승률 {m.winRatePct.toFixed(0)}% · {m.sampleYears}년</Text>
    </View>
  )
}
