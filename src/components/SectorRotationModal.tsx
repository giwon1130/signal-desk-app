/**
 * 섹터 로테이션 — 계절별로 어떤 섹터가 강한지. 섹터 ETF 시즈널리티 매트릭스.
 * ① 이번 달 섹터 랭킹(로테이션 대상) ② 연간 히트맵 ③ 섹터 탭 → 그 ETF 상세 시즈널리티.
 * 색: 상승=빨강(palette.up) / 하락=파랑(palette.down), 한국 관례.
 */
import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Layers, X } from 'lucide-react-native'
import { useTheme, type Palette } from '../theme'
import type { SectorRotationReport, SectorSeasonality } from '../types/backtest'
import { fetchSectorRotation } from '../api/backtest'
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

  useEffect(() => {
    if (!visible) return
    let alive = true
    setLoading(true); setReport(null)
    fetchSectorRotation(market).then((r) => { if (alive) { setReport(r); setLoading(false) } })
    return () => { alive = false }
  }, [visible, market])

  const cm = report?.currentMonth ?? new Date().getMonth() + 1
  const ranked = useMemo(() => {
    if (!report) return []
    const meanOf = (s: SectorSeasonality) => s.monthly.find((m) => m.month === cm)?.meanPct ?? 0
    return [...report.sectors].sort((a, b) => meanOf(b) - meanOf(a))
  }, [report, cm])

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
            <View style={{ paddingVertical: 56, alignItems: 'center' }}><ActivityIndicator color={palette.teal ?? '#0d9488'} /></View>
          ) : !report ? (
            <View style={{ paddingVertical: 50, alignItems: 'center' }}><Text style={{ color: palette.inkMuted, fontSize: 13 }}>데이터를 불러오지 못했어요</Text></View>
          ) : (
            <ScrollView contentContainerStyle={{ paddingHorizontal: 14, paddingVertical: 10 }}>
              {/* 이번 달 랭킹 */}
              <Text style={{ color: palette.inkMuted, fontSize: 11, fontWeight: '800', letterSpacing: 0.4 }}>이번 달({cm}월) 섹터 — 강한 순</Text>
              <Text style={{ color: palette.inkFaint, fontSize: 10.5, marginBottom: 8 }}>위가 역사적으로 강했던(로테이션 후보) 섹터 · 섹터를 누르면 상세</Text>
              <View style={{ gap: 5, marginBottom: 18 }}>
                {ranked.map((s) => {
                  const mm = s.monthly.find((m) => m.month === cm)
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
                    <Text key={m} style={{ flex: 1, textAlign: 'center', fontSize: 8, fontWeight: m === cm ? '900' : '700', color: m === cm ? palette.teal : palette.inkFaint }}>{m}</Text>
                  ))}
                </View>
                {report.sectors.map((s) => (
                  <View key={s.key} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                    <Text style={{ width: 62, fontSize: 9.5, fontWeight: '700', color: palette.inkSub }} numberOfLines={1}>{s.name}</Text>
                    {s.monthly.map((mm) => (
                      <View key={mm.month} style={{ flex: 1, height: 17, marginHorizontal: 0.5, borderRadius: 2, backgroundColor: cellColor(mm.meanPct, palette), borderWidth: mm.month === cm ? 1 : 0, borderColor: palette.teal }} />
                    ))}
                  </View>
                ))}
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
