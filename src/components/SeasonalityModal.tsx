/**
 * 시즈널리티 모달 — 종목의 월별/요일별 역사적 패턴을 정직한 통계로.
 * 핵심 패턴(규칙카드) → 월별 히트맵(등급) → 요일·주말 → 정직 배너.
 * 색: 한국 관례(상승=빨강 palette.up / 하락=파랑 palette.down). 등급은 🟢🟡⚪.
 */
import { useEffect, useState } from 'react'
import { Modal, Pressable, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Bookmark, BookmarkCheck, CalendarRange, FlaskConical, Minus, Plus, X } from 'lucide-react-native'
import { useTheme, type Palette } from '../theme'
import type { CustomBacktestResult, MonthStat, SeasonalityReport, SeasonalityRuleCard, SeasonalityTier } from '../types/backtest'
import { deleteSeasonalityRule, fetchCustomBacktest, fetchSeasonality, listSeasonalityRules, saveSeasonalityRule } from '../api/backtest'
import { PressableScale, Skeleton } from './effects'
import { hapticSuccess } from '../utils/haptics'

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
  const [saveError, setSaveError] = useState('')
  // 히트맵 셀 탭 → 상세 패널 (STRONG 하이라이트가 아닌 달도 확인·저장 가능하게)
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)

  useEffect(() => {
    if (!visible) return
    let alive = true
    setLoading(true); setErr(false); setReport(null); setSavedMap({}); setSelectedMonth(null)
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

  /** 하이라이트 카드·히트맵 상세 공용 — (kind, month) 규칙 저장/해제 토글. */
  const toggleSave = async (kind: 'BUY_MONTH' | 'AVOID_MONTH', month: number | null) => {
    if (!report || month == null || savingKey) return
    const key = `${kind}:${month}`
    setSavingKey(key)
    setSaveError('')
    try {
      if (savedMap[key]) {
        const ok = await deleteSeasonalityRule(savedMap[key])
        if (ok) setSavedMap((m) => { const n = { ...m }; delete n[key]; return n })
        else setSaveError('삭제하지 못했어요 — 잠시 후 다시 시도해 주세요')
      } else {
        const stat = report.monthly.find((m) => m.month === month)
        const saved = await saveSeasonalityRule({
          market, ticker, name: report.name, kind, month,
          meanPct: stat?.meanPct ?? null, winRatePct: stat?.winRatePct ?? null, sampleYears: stat?.sampleYears ?? null,
        })
        if (saved) {
          setSavedMap((m) => ({ ...m, [key]: saved.id }))
          void hapticSuccess()
        } else setSaveError('저장하지 못했어요 — 로그인 상태와 네트워크를 확인해 주세요')
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
            <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 24, gap: 10 }}>
              <Skeleton width={140} height={12} color={palette.border} />
              <Skeleton width="100%" height={58} radius={10} color={palette.border} />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 4 }}>
                {Array.from({ length: 12 }, (_, i) => (
                  <Skeleton key={i} width="31.5%" height={62} radius={9} color={palette.border} />
                ))}
              </View>
              <Text style={{ color: palette.inkMuted, fontSize: 11, textAlign: 'center', marginTop: 6 }}>역사적 패턴 분석 중…</Text>
            </View>
          ) : err || !report ? (
            <View style={{ paddingVertical: 56, alignItems: 'center', gap: 6 }}>
              <CalendarRange size={26} color={palette.inkFaint} strokeWidth={1.8} />
              <Text style={{ color: palette.inkMuted, fontSize: 13, fontWeight: '700' }}>분석할 데이터가 부족합니다</Text>
              <Text style={{ color: palette.inkFaint, fontSize: 11 }}>상장 기간이 짧거나 데이터가 없는 종목이에요</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
              {/* 핵심 패턴 */}
              {report.highlights.length > 0 ? (
                <View style={{ gap: 8, marginBottom: 16 }}>
                  <Text style={{ color: palette.inkMuted, fontSize: 11, fontWeight: '800', letterSpacing: 0.4 }}>핵심 패턴 (🟢 뚜렷한 것만)</Text>
                  <Text style={{ color: palette.inkFaint, fontSize: 10.5, marginTop: -3 }}>저장하면 그 달이 다가올 때 푸시로 알려드려요</Text>
                  {saveError ? (
                    <Text style={{ color: palette.down, fontSize: 10.5, fontWeight: '700' }}>⚠️ {saveError}</Text>
                  ) : null}
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
                            onPress={() => void toggleSave(h.kind, h.month)}
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
              <Text style={{ color: palette.inkMuted, fontSize: 11, fontWeight: '800', letterSpacing: 0.4, marginBottom: 2 }}>월별 (전부 표시 · 등급)</Text>
              <Text style={{ color: palette.inkFaint, fontSize: 10.5, marginBottom: 8 }}>달을 누르면 상세 · 어느 달이든 규칙으로 저장 가능</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 8 }}>
                {report.monthly.map((m) => (
                  <MonthCell
                    key={m.month}
                    m={m}
                    palette={palette}
                    selected={selectedMonth === m.month}
                    onPress={() => setSelectedMonth((cur) => (cur === m.month ? null : m.month))}
                  />
                ))}
              </View>
              {selectedMonth != null ? (
                <MonthDetailPanel
                  stat={report.monthly.find((m) => m.month === selectedMonth)!}
                  palette={palette}
                  savedMap={savedMap}
                  savingKey={savingKey}
                  onToggleSave={(kind, month) => void toggleSave(kind, month)}
                />
              ) : null}
              <View style={{ marginBottom: 8 }} />

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

              {/* 내 가설 검증 (가설 빌더) */}
              <CustomBuilder market={market} ticker={ticker} name={report.name} palette={palette} />

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

function MonthCell({ m, palette, selected, onPress }: { m: MonthStat; palette: Palette; selected: boolean; onPress: () => void }) {
  const c = retColor(m.meanPct, palette)
  const bg = (m.meanPct > 0 ? palette.upSoft : m.meanPct < 0 ? palette.downSoft : palette.surfaceAlt) ?? palette.surfaceAlt
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: '31.5%', backgroundColor: bg, borderRadius: 9, paddingVertical: 8, paddingHorizontal: 8,
        opacity: pressed ? 0.7 : m.tier === 'NOISE' && !selected ? 0.55 : 1,
        borderWidth: selected ? 1.5 : 0, borderColor: palette.ink,
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
        <Text style={{ fontSize: 10 }}>{TIER_DOT[m.tier]}</Text>
        <Text style={{ color: palette.ink, fontSize: 12, fontWeight: '800' }}>{m.month}월</Text>
      </View>
      <Text style={{ color: c, fontSize: 14, fontWeight: '900', marginTop: 2 }}>{signed(m.meanPct, 1)}%</Text>
      <Text style={{ color: palette.inkFaint, fontSize: 9.5 }}>승률 {m.winRatePct.toFixed(0)}% · {m.sampleYears}년</Text>
    </Pressable>
  )
}

/** 히트맵 셀 상세 — 풀 통계 + 규칙 저장 (STRONG 이 아닌 달도 추적 가능). */
function MonthDetailPanel({ stat, palette, savedMap, savingKey, onToggleSave }: {
  stat: MonthStat
  palette: Palette
  savedMap: Record<string, string>
  savingKey: string | null
  onToggleSave: (kind: 'BUY_MONTH' | 'AVOID_MONTH', month: number) => void
}) {
  const kind: 'BUY_MONTH' | 'AVOID_MONTH' = stat.meanPct >= 0 ? 'BUY_MONTH' : 'AVOID_MONTH'
  const key = `${kind}:${stat.month}`
  const saved = !!savedMap[key]
  const c = kind === 'BUY_MONTH' ? palette.up : palette.down
  return (
    <View style={{ backgroundColor: palette.surfaceAlt ?? palette.surface, borderRadius: 10, padding: 12, gap: 5, borderLeftWidth: 3, borderLeftColor: c }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={{ flex: 1, color: palette.ink, fontSize: 13, fontWeight: '900' }}>
          {TIER_DOT[stat.tier]} {stat.month}월 {kind === 'BUY_MONTH' ? '강세' : '약세'} 상세
        </Text>
        <Pressable
          onPress={() => onToggleSave(kind, stat.month)}
          disabled={savingKey === key}
          hitSlop={6}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 3,
            paddingHorizontal: 9, paddingVertical: 5, borderRadius: 7,
            backgroundColor: saved ? c + '22' : palette.bg,
            borderWidth: 1, borderColor: saved ? c : palette.border,
            opacity: savingKey === key ? 0.5 : 1,
          }}
        >
          {saved ? <BookmarkCheck size={12} color={c} strokeWidth={2.5} /> : <Bookmark size={12} color={palette.inkMuted} strokeWidth={2.5} />}
          <Text style={{ color: saved ? c : palette.inkMuted, fontSize: 10.5, fontWeight: '800' }}>{saved ? '저장됨' : '규칙 저장'}</Text>
        </Pressable>
      </View>
      <Text style={{ color: palette.inkSub, fontSize: 11.5, lineHeight: 16 }}>
        평균 {signed(stat.meanPct)}% · 중앙값 {signed(stat.medianPct)}% · 승률 {stat.winRatePct.toFixed(0)}% ({stat.sampleYears}년)
      </Text>
      <Text style={{ color: palette.inkFaint, fontSize: 10.5 }}>
        최악해 {signed(stat.worstYearPct, 1)}% · 최고해 {signed(stat.bestYearPct, 1)}% · 비용후 {signed(stat.netAfterCostPct)}%
      </Text>
      {stat.tier === 'NOISE' ? (
        <Text style={{ color: palette.orange ?? '#d97706', fontSize: 10.5, fontWeight: '700' }}>
          ⚪ 노이즈 등급 — 통계적 근거가 약한 패턴이에요. 저장은 되지만 참고만 하세요.
        </Text>
      ) : null}
    </View>
  )
}

const MONTH_PRESETS = [
  { label: '여름강세 6/25→7/25', v: { em: 6, ed: 25, xm: 7, xd: 25 } },
  { label: '산타랠리 11/25→12/24', v: { em: 11, ed: 25, xm: 12, xd: 24 } },
  { label: '1월효과 12/20→1/31', v: { em: 12, ed: 20, xm: 1, xd: 31 } },
]
const TIER_LABEL: Record<string, string> = { STRONG: '🟢 뚜렷', WEAK: '🟡 약함', NOISE: '⚪ 노이즈' }

function Stepper({ value, min, max, suffix, onChange, palette }: { value: number; min: number; max: number; suffix: string; onChange: (v: number) => void; palette: Palette }) {
  const btn = { width: 24, height: 24, borderRadius: 6, alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: palette.bg, borderWidth: 1, borderColor: palette.border }
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <Pressable onPress={() => onChange(value <= min ? max : value - 1)} hitSlop={6} style={btn}><Minus size={12} color={palette.inkMuted} strokeWidth={2.5} /></Pressable>
      <Text style={{ minWidth: 30, textAlign: 'center', color: palette.ink, fontSize: 13, fontWeight: '800' }}>{value}{suffix}</Text>
      <Pressable onPress={() => onChange(value >= max ? min : value + 1)} hitSlop={6} style={btn}><Plus size={12} color={palette.inkMuted} strokeWidth={2.5} /></Pressable>
    </View>
  )
}

function CustomBuilder({ market, ticker, name, palette }: { market: string; ticker: string; name: string; palette: Palette }) {
  const [cw, setCw] = useState({ em: 6, ed: 25, xm: 7, xd: 25 })
  const [result, setResult] = useState<CustomBacktestResult | null | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [showYears, setShowYears] = useState(false)
  const run = async () => {
    setLoading(true); setResult(undefined)
    const r = await fetchCustomBacktest(market, ticker, name, cw.em, cw.ed, cw.xm, cw.xd)
    setResult(r); setLoading(false)
  }
  return (
    <View style={{ backgroundColor: palette.surfaceAlt ?? palette.surface, borderRadius: 12, padding: 12, marginBottom: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
        <FlaskConical size={14} color={palette.purple ?? '#7c3aed'} strokeWidth={2.4} />
        <Text style={{ color: palette.ink, fontSize: 13, fontWeight: '800' }}>내 가설 검증</Text>
      </View>
      <Text style={{ color: palette.inkFaint, fontSize: 10.5, marginBottom: 8 }}>매년 진입일에 사서 청산일에 판다면? 직접 윈도우를 정해 검증</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
        {MONTH_PRESETS.map((p) => (
          <Pressable key={p.label} onPress={() => setCw(p.v)} style={{ backgroundColor: palette.bg, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: palette.border }}>
            <Text style={{ color: palette.inkSub, fontSize: 10, fontWeight: '700' }}>{p.label}</Text>
          </Pressable>
        ))}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <Text style={{ width: 32, color: palette.up, fontSize: 12, fontWeight: '800' }}>진입</Text>
        <Stepper value={cw.em} min={1} max={12} suffix="월" onChange={(v) => setCw((s) => ({ ...s, em: v }))} palette={palette} />
        <Stepper value={cw.ed} min={1} max={31} suffix="일" onChange={(v) => setCw((s) => ({ ...s, ed: v }))} palette={palette} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <Text style={{ width: 32, color: palette.down, fontSize: 12, fontWeight: '800' }}>청산</Text>
        <Stepper value={cw.xm} min={1} max={12} suffix="월" onChange={(v) => setCw((s) => ({ ...s, xm: v }))} palette={palette} />
        <Stepper value={cw.xd} min={1} max={31} suffix="일" onChange={(v) => setCw((s) => ({ ...s, xd: v }))} palette={palette} />
      </View>
      <PressableScale onPress={() => void run()} disabled={loading} style={{ backgroundColor: palette.purple ?? '#7c3aed', borderRadius: 9, paddingVertical: 10, alignItems: 'center', opacity: loading ? 0.6 : 1 }}>
        <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>{loading ? '검증 중…' : '검증'}</Text>
      </PressableScale>
      {result === undefined ? null : result === null ? (
        <Text style={{ color: palette.inkMuted, fontSize: 11, marginTop: 10, textAlign: 'center' }}>표본이 부족하거나 데이터가 없어요 (최소 3년)</Text>
      ) : (
        <View style={{ marginTop: 10, gap: 4 }}>
          <Text style={{ color: palette.ink, fontSize: 12, fontWeight: '800' }}>{result.window} · {TIER_LABEL[result.tier] ?? result.tier}</Text>
          <Text style={{ color: palette.inkSub, fontSize: 11.5, lineHeight: 16 }}>평균 {signed(result.meanPct, 2)}% · 승률 {result.winRatePct.toFixed(0)}% · {result.sampleYears}년 · 비용후 {signed(result.netAfterCostPct, 2)}%</Text>
          <Text style={{ color: palette.inkFaint, fontSize: 10.5 }}>최악 {signed(result.worstYearPct, 1)}% · 최고 {signed(result.bestYearPct, 1)}%</Text>
          {/* 연도별 — 평균이 한두 해에 끌려간 패턴인지 직접 확인 (정직한 통계 원칙) */}
          {result.perYear.length > 0 ? (
            <Pressable onPress={() => setShowYears((v) => !v)} hitSlop={4}>
              <Text style={{ color: palette.purple ?? '#7c3aed', fontSize: 10.5, fontWeight: '800' }}>
                {showYears ? '▾ 연도별 결과 접기' : '▸ 연도별 결과 보기'}
              </Text>
            </Pressable>
          ) : null}
          {showYears ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 2 }}>
              {result.perYear.map((y) => (
                <View key={y.year} style={{ backgroundColor: palette.bg, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderColor: palette.border }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: palette.inkFaint }}>
                    {y.year} <Text style={{ color: retColor(y.returnPct, palette), fontWeight: '800' }}>{signed(y.returnPct, 1)}%</Text>
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      )}
    </View>
  )
}
