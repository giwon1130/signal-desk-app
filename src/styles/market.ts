import type { Palette } from '../theme'
import { makeShadow, tabularNums, type StyleObj } from './util'

export function marketStyles(C: Palette): StyleObj {
  const shadow = makeShadow(C.shadowColor)
  const num = tabularNums

  return {
    // ── Chart ────────────────────────────────────────────────────────────────────
    chartWrap: {
      borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: C.border,
      backgroundColor: C.surfaceAlt, ...shadow.sm,
    },
    chartAxisRow:   { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, paddingBottom: 10 },
    chartAxisLabel: { color: C.inkMuted, fontSize: 11, fontWeight: '600' },
    emptyChart: {
      borderRadius: 12, borderWidth: 1, borderColor: C.border, backgroundColor: C.surfaceAlt,
      minHeight: 220, alignItems: 'center', justifyContent: 'center',
    },
    legendRow:       { flexDirection: 'row', gap: 12, marginTop: 2, alignItems: 'center' },
    legendText:      { fontSize: 12, fontWeight: '700' },
    chartStatsRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
    chartStat: {
      minWidth: '47%', borderRadius: 10, borderWidth: 1, borderColor: C.border,
      backgroundColor: C.surfaceAlt, padding: 10,
    },
    chartStatValue: { marginTop: 2, color: C.ink, fontSize: 13, fontWeight: '700', ...num },

    // ── Candle tooltip (탭 시 표시) ──
    candleTip: {
      paddingHorizontal: 12, paddingVertical: 10, gap: 8,
      borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.surface,
    },
    candleTipHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    candleTipLabel:  { color: C.ink, fontSize: 12, fontWeight: '800', letterSpacing: 0.3 },
    candleTipChange: { fontSize: 12, fontWeight: '800', ...num },
    candleTipRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    candleTipCell:   {
      flexBasis: '18%', flexGrow: 1, minWidth: 60,
      borderRadius: 8, backgroundColor: C.surfaceAlt,
      paddingHorizontal: 8, paddingVertical: 6,
    },
    candleTipKey:    { color: C.inkMuted, fontSize: 10, fontWeight: '700' },
    candleTipVal:    { color: C.ink, fontSize: 12, fontWeight: '800', marginTop: 1, ...num },

    // ── Alternative / Alert Metric Rows ─────────────────────────────────────────
    alternativeMetricRow:    { gap: 8 },
    alertMetricRow:          { gap: 8 },
    alternativeMetricTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
    alternativeScoreBadge: {
      borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, fontSize: 11,
      fontWeight: '800', overflow: 'hidden',
    },
    alternativeHighlightsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    alternativeHighlightChip: {
      borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4,
      backgroundColor: C.scheme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)',
      color: C.inkSub, fontSize: 11, fontWeight: '700', overflow: 'hidden',
    },
    alternativePersonalImpact: {
      color: C.blue, fontSize: 12, fontWeight: '800', lineHeight: 17,
      paddingTop: 6, borderTopWidth: 1, borderTopColor: C.border, marginTop: 4,
    },

    // ── Composite Risk (합성 위험도) ──────────────────────────────────────────────
    riskHeroRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 4 },
    riskScoreBox: {
      alignItems: 'center', justifyContent: 'center', minWidth: 84,
      borderRadius: 14, borderWidth: 1, paddingVertical: 10, paddingHorizontal: 8,
    },
    riskScoreValue: { fontSize: 32, fontWeight: '900', lineHeight: 34, ...num },
    riskScoreOutOf:  { fontSize: 11, fontWeight: '700', marginTop: -2 },
    riskLevelBadge: {
      borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3, marginTop: 6,
      fontSize: 12, fontWeight: '800', overflow: 'hidden',
    },
    riskHeadline: { flex: 1, color: C.ink, fontSize: 13, lineHeight: 19, fontWeight: '600' },
    riskComponentRow:  { gap: 5, marginTop: 12 },
    riskComponentHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    riskComponentLabel: { color: C.ink, fontSize: 12, fontWeight: '800' },
    riskComponentWeight: {
      color: C.inkMuted, fontSize: 10, fontWeight: '700',
      backgroundColor: C.scheme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)',
      borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1, overflow: 'hidden',
    },
    riskComponentScore:  { fontSize: 12, fontWeight: '800', ...num },
    riskTrack: {
      height: 6, borderRadius: 3, overflow: 'hidden', marginTop: 1,
      backgroundColor: C.scheme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.07)',
    },
    riskTrackFill:       { height: '100%', borderRadius: 3 },
    riskComponentDetail: { color: C.inkMuted, fontSize: 11, fontWeight: '600', lineHeight: 15 },
    riskComponentState:  { fontSize: 11, fontWeight: '700' },
    riskPersonalImpact: {
      color: C.blue, fontSize: 12, fontWeight: '800', lineHeight: 17,
      paddingTop: 8, borderTopWidth: 1, borderTopColor: C.border, marginTop: 12,
    },
    riskFootnote: { color: C.inkMuted, fontSize: 11, fontWeight: '600', marginTop: 10 },
    riskEmptyBox: { paddingVertical: 18, alignItems: 'center' },
  }
}
