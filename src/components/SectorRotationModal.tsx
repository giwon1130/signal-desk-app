/**
 * 섹터 로테이션 — 계절별로 어떤 섹터가 강한지. 섹터 ETF 시즈널리티 매트릭스.
 * ① 이번 달 섹터 랭킹(로테이션 대상) ② 연간 히트맵 ③ 섹터 탭 → 그 ETF 상세 시즈널리티.
 * 색: 상승=빨강(palette.up) / 하락=파랑(palette.down), 한국 관례.
 */
import { useEffect, useMemo, useState } from 'react'
import { Modal, Pressable, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Layers, X } from 'lucide-react-native'
import { useTheme, type Palette } from '../theme'
import type { SectorRotationReport, SectorSeasonality } from '../types/backtest'
import { fetchSectorRotation } from '../api/backtest'
import { Skeleton } from './effects'
import { SeasonalityModal } from './SeasonalityModal'

type Props = { visible: boolean; onClose: () => void }
type Mkt = 'US' | 'KR'

const signed = (v: number, d = 1) => (v >= 0 ? `+${v.toFixed(d)}` : v.toFixed(d))
const retColor = (v: number, p: Palette) => (v > 0 ? p.up : v < 0 ? p.down : p.inkMuted)
const TIER_DOT: Record<string, string> = { STRONG: '🟢', WEAK: '🟡', NOISE: '⚪' }

function cellColor(mean: number, p: Palette): string {
  const intensity = Math.min(Math.abs(mean) / 6, 1)
  const base = mean > 0 ? p.up : mean < 0 ? p.down : p.inkFaint
  const a = Math.round((0.1 + intensity * 0.62) * 255).toString(16).padStart(2, '0')
  return base + a
}

export function SectorRotationModal({ visible, onClose }: Props) {
  const { palette } = useTheme()
  const insets = useSafeAreaInsets()
  const [market, setMarket] = useState<Mkt>('US')
  const [report, setReport] = useState<SectorRotationReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [drill, setDrill] = useState<{ etf: string; name: string } | null>(null)
  // 로테이션의 본질은 "다음 달 강해질 섹터로 미리 이동" — 이번 달/다음 달 토글.
  const [monthView, setMonthView] = useState<'current' | 'next'>('current')
  // 히트맵 셀 탭 → 수치 표시 (색만으론 +2%와 +6% 구분 불가)
  const [cellInfo, setCellInfo] = useState<{ name: string; month: number; meanPct: number; winRatePct: number; tier: string } | null>(null)

  useEffect(() => {
    if (!visible) return
    let alive = true
    setLoading(true); setReport(null); setCellInfo(null)
    fetchSectorRotation(market).then((r) => { if (alive) { setReport(r); setLoading(false) } })
    return () => { alive = false }
  }, [visible, market])

  const cm = report?.currentMonth ?? new Date().getMonth() + 1
  const viewMonth = monthView === 'current' ? cm : (cm % 12) + 1
  const ranked = useMemo(() => {
    if (!report) return []
    const meanOf = (s: SectorSeasonality) => s.monthly.find((m) => m.month === viewMonth)?.meanPct ?? 0
    return [...report.sectors].sort((a, b) => meanOf(b) - meanOf(a))
  }, [report, viewMonth])

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }} onPress={onClose}>
        <View style={{ flex: 1 }} />
        <Pressable onPress={(e) => e.stopPropagation()} style={{ backgroundColor: palette.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: insets.bottom + 8, maxHeight: '88%' }}>
          {/* 헤더 */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: palette.border }}>
            <Layers size={17} color={palette.teal ?? '#0d9488'} strokeWidth={2.5} />
            <Text style={{ flex: 1, color: palette.ink, fontSize: 16, fontWeight: '900' }}>섹터 로테이션</Text>
            {(['US', 'KR'] as const).map((m) => (
              <Pressable key={m} onPress={() => setMarket(m)} style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: market === m ? palette.teal + '22' : 'transparent', borderWidth: 1, borderColor: market === m ? palette.teal : palette.border }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: market === m ? palette.teal : palette.inkMuted }}>{m === 'US' ? '🇺🇸 US' : '🇰🇷 KR'}</Text>
              </Pressable>
            ))}
            <Pressable onPress={onClose} hitSlop={10} style={{ marginLeft: 2 }}><X size={20} color={palette.inkMuted} strokeWidth={2.5} /></Pressable>
          </View>

          {loading ? (
            <View style={{ paddingHorizontal: 14, paddingVertical: 14, gap: 7 }}>
              <Skeleton width={150} height={12} color={palette.border} />
              {Array.from({ length: 8 }, (_, i) => (
                <Skeleton key={i} width="100%" height={38} radius={9} color={palette.border} />
              ))}
              <Text style={{ color: palette.inkMuted, fontSize: 11, textAlign: 'center', marginTop: 8 }}>
                섹터별 15년 패턴을 모으는 중 — 처음엔 시간이 좀 걸려요
              </Text>
            </View>
          ) : !report ? (
            <View style={{ paddingVertical: 50, alignItems: 'center' }}><Text style={{ color: palette.inkMuted, fontSize: 13 }}>데이터를 불러오지 못했어요</Text></View>
          ) : (
            <ScrollView contentContainerStyle={{ paddingHorizontal: 14, paddingVertical: 10 }}>
              {/* 이번 달 / 다음 달 랭킹 */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <Text style={{ flex: 1, color: palette.inkMuted, fontSize: 11, fontWeight: '800', letterSpacing: 0.4 }}>
                  {viewMonth}월 섹터 — 강한 순
                </Text>
                {([['current', `${cm}월`], ['next', `${(cm % 12) + 1}월 미리`]] as const).map(([k, label]) => (
                  <Pressable key={k} onPress={() => setMonthView(k)}
                    style={{ paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999, backgroundColor: monthView === k ? (palette.teal ?? '#0d9488') + '22' : 'transparent', borderWidth: 1, borderColor: monthView === k ? palette.teal ?? '#0d9488' : palette.border }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: monthView === k ? palette.teal ?? '#0d9488' : palette.inkMuted }}>{label}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={{ color: palette.inkFaint, fontSize: 10.5, marginBottom: 8 }}>
                {monthView === 'next' ? '다음 달 강해질 섹터로 미리 움직이는 게 로테이션의 핵심' : '위가 역사적으로 강했던(로테이션 후보) 섹터'} · 섹터를 누르면 상세
              </Text>
              <View style={{ gap: 5, marginBottom: 18 }}>
                {ranked.map((s) => {
                  const mm = s.monthly.find((m) => m.month === viewMonth)
                  const mean = mm?.meanPct ?? 0
                  return (
                    <Pressable key={s.key} onPress={() => setDrill({ etf: s.etf, name: s.name })}
                      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: palette.surfaceAlt ?? palette.surface, borderRadius: 9, paddingHorizontal: 11, paddingVertical: 9, opacity: pressed ? 0.7 : 1 })}>
                      <Text style={{ fontSize: 11 }}>{TIER_DOT[mm?.tier ?? 'NOISE']}</Text>
                      <Text style={{ flex: 1, color: palette.ink, fontSize: 13.5, fontWeight: '800' }}>{s.name}</Text>
                      <Text style={{ color: palette.inkFaint, fontSize: 10 }}>승률 {(mm?.winRatePct ?? 0).toFixed(0)}%</Text>
                      <Text style={{ color: retColor(mean, palette), fontSize: 14, fontWeight: '900', fontVariant: ['tabular-nums'], minWidth: 52, textAlign: 'right' }}>{signed(mean)}%</Text>
                    </Pressable>
                  )
                })}
              </View>

              {/* 연간 히트맵 */}
              <Text style={{ color: palette.inkMuted, fontSize: 11, fontWeight: '800', letterSpacing: 0.4, marginBottom: 8 }}>연간 히트맵 (빨강=강세 · 파랑=약세)</Text>
              <View style={{ marginBottom: 14 }}>
                {/* 월 헤더 */}
                <View style={{ flexDirection: 'row', marginBottom: 3 }}>
                  <View style={{ width: 62 }} />
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <Text key={m} style={{ flex: 1, textAlign: 'center', fontSize: 8, fontWeight: m === viewMonth ? '900' : '700', color: m === viewMonth ? palette.teal : palette.inkFaint }}>{m}</Text>
                  ))}
                </View>
                {report.sectors.map((s) => (
                  <View key={s.key} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                    <Text style={{ width: 62, fontSize: 9.5, fontWeight: '700', color: palette.inkSub }} numberOfLines={1}>{s.name}</Text>
                    {s.monthly.map((mm) => {
                      const selected = cellInfo?.name === s.name && cellInfo?.month === mm.month
                      return (
                        <Pressable
                          key={mm.month}
                          onPress={() => setCellInfo({ name: s.name, month: mm.month, meanPct: mm.meanPct, winRatePct: mm.winRatePct, tier: mm.tier })}
                          style={{ flex: 1, height: 17, marginHorizontal: 0.5, borderRadius: 2, backgroundColor: cellColor(mm.meanPct, palette), borderWidth: selected ? 1.5 : mm.month === viewMonth ? 1 : 0, borderColor: selected ? palette.ink : palette.teal }}
                        />
                      )
                    })}
                  </View>
                ))}
                {/* 셀 탭 → 수치 (색만으론 정보 부족) */}
                <Text style={{ marginTop: 6, fontSize: 11, fontWeight: '700', color: cellInfo ? palette.inkSub : palette.inkFaint }}>
                  {cellInfo
                    ? `${TIER_DOT[cellInfo.tier] ?? '⚪'} ${cellInfo.name} ${cellInfo.month}월 — 평균 ${signed(cellInfo.meanPct)}% · 승률 ${cellInfo.winRatePct.toFixed(0)}%`
                    : '칸을 누르면 평균·승률이 표시됩니다'}
                </Text>
              </View>

              <Text style={{ color: palette.inkFaint, fontSize: 10.5, lineHeight: 15 }}>⚠️ 섹터 ETF의 과거 월별 평균입니다(US=SPDR, KR=KODEX/TIGER). 미래 보장이 아니며 비용은 미반영.</Text>
            </ScrollView>
          )}
        </Pressable>
      </Pressable>

      {/* 섹터 드릴다운 — 해당 ETF 상세 시즈널리티 */}
      <SeasonalityModal visible={!!drill} market={market} ticker={drill?.etf ?? ''} name={drill?.name} onClose={() => setDrill(null)} />
    </Modal>
  )
}
