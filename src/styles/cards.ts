import type { Palette } from '../theme'
import { makeShadow, tabularNums, type StyleObj } from './util'

export function cardStyles(C: Palette): StyleObj {
  const shadow = makeShadow(C.shadowColor)
  const num = tabularNums

  return {
    // ── Cards ───────────────────────────────────────────────────────────────────
    primaryCard: {
      borderRadius: 18, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
      padding: 16, gap: 8, ...shadow.md,
    },
    card: {
      borderRadius: 16, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
      padding: 14, gap: 10, ...shadow.sm,
    },
    cardEyebrow: { color: C.blue, fontSize: 10, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' },
    cardTitle:   { color: C.ink, fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },

    // ── Inputs ──────────────────────────────────────────────────────────────────
    searchInput: {
      borderRadius: 12, borderWidth: 1, borderColor: C.border, backgroundColor: C.surfaceAlt,
      paddingHorizontal: 14, paddingVertical: 11, color: C.ink, fontSize: 14,
    },
    noteInput: { minHeight: 88, textAlignVertical: 'top' },

    // ── Quick Stats ──────────────────────────────────────────────────────────────
    quickStatsRow: { flexDirection: 'row', gap: 8 },
    quickStatCard: {
      flex: 1, borderRadius: 14, borderWidth: 1, borderColor: C.border,
      backgroundColor: C.surfaceAlt, padding: 12, ...shadow.sm,
    },
    quickStatValue: { marginTop: 4, color: C.ink, fontSize: 22, fontWeight: '800', ...num },

    // ── Card section / actions ──────────────────────────────────────────────────
    cardSection: { gap: 10, marginTop: 6 },
    inlineButtonRow: { flexDirection: 'row', gap: 8 },
    primaryActionButton: {
      flex: 1, borderRadius: 12, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center',
      paddingHorizontal: 14, paddingVertical: 13,
    },
    primaryActionButtonText: { color: C.surface, fontSize: 14, fontWeight: '800' },
    secondaryActionButton: {
      borderRadius: 12, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.surface,
      alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, paddingVertical: 13,
    },
    secondaryActionButtonText: { color: C.inkSub, fontSize: 14, fontWeight: '700' },

    // ── Primary Value / Notes ────────────────────────────────────────────────────
    primaryValue: { color: C.ink, fontSize: 24, fontWeight: '800', letterSpacing: -0.5, ...num },
    cardNote:     { color: C.inkSub, fontSize: 13, lineHeight: 19 },
    metaText:     { color: C.inkMuted, fontSize: 12, fontWeight: '500' },

    // ── KPI Row ─────────────────────────────────────────────────────────────────
    kpiRow:    { flexDirection: 'row', gap: 8 },
    kpiCard:   {
      flex: 1, borderRadius: 14, backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border,
      padding: 12, alignItems: 'center', gap: 4, ...shadow.sm,
    },
    kpiLabel:  { color: C.inkMuted, fontSize: 11, fontWeight: '700', textAlign: 'center' },
    kpiValue:  { color: C.ink, fontSize: 18, fontWeight: '800', ...num },

    // ── Hero Metrics ─────────────────────────────────────────────────────────────
    heroMetricsRow: { flexDirection: 'row', gap: 8 },
    heroMetricCard: {
      flex: 1, borderRadius: 16, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
      padding: 14, gap: 6, ...shadow.sm,
    },
    heroMetricCardDark:       { backgroundColor: C.ink, borderColor: C.ink },
    heroMetricLabel:          { color: C.inkMuted, fontSize: 11, fontWeight: '700' },
    heroMetricLabelOnDark:    { color: '#93c5fd' },
    heroMetricValue:          { color: C.ink, fontSize: 18, fontWeight: '800', ...num },
    heroMetricValueOnDark:    { color: '#f8fafc' },
    heroMetricFootnote:       { color: C.inkMuted, fontSize: 11, lineHeight: 16 },
    heroMetricFootnoteOnDark: { color: '#cbd5e1' },

    // ── Session Cards ─────────────────────────────────────────────────────────────
    sessionCard: {
      borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 12,
      backgroundColor: C.surfaceAlt, gap: 4, ...shadow.sm,
    },
    sessionTop:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    sessionName:  { color: C.ink, fontSize: 14, fontWeight: '700' },
    sessionBadge: {
      borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3, fontSize: 11,
      fontWeight: '700', overflow: 'hidden',
    },
    sessionMeta:  { color: C.inkSub, fontSize: 12, fontWeight: '600' },
    sessionNote:  { color: C.inkMuted, fontSize: 12 },

    // ── Metric Rows ──────────────────────────────────────────────────────────────
    metricRow: {
      borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 12,
      backgroundColor: C.surfaceAlt, gap: 4, ...shadow.sm,
    },
    metricLeft:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    metricName:   { color: C.ink, fontSize: 13, fontWeight: '700' },
    metricState:  { color: C.inkSub, fontSize: 12, fontWeight: '600' },
    metricScore:  { color: C.teal, fontSize: 18, fontWeight: '800', ...num },
    metricNote:   { color: C.inkMuted, fontSize: 12 },
    metricSource: { color: C.blue, fontSize: 11, fontWeight: '700' },

    // ── Section Header ────────────────────────────────────────────────────────────
    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
    cardTitleRow:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
    emptyStateRow:    { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },

    // ── Summary Row ──────────────────────────────────────────────────────────────
    summaryRow: {
      borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 12,
      backgroundColor: C.surfaceAlt, flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'center', gap: 10,
    },
    summaryValueBox:      { alignItems: 'flex-end', gap: 2 },
    summaryMeta:          { color: C.inkMuted, fontSize: 11, fontWeight: '700' },
    summaryDelta:         { fontSize: 12, fontWeight: '700', ...num },

    // ── Briefing ─────────────────────────────────────────────────────────────────
    briefingList:      { gap: 8, marginTop: 10 },
    briefingBulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    briefingBullet:    { color: C.teal, fontSize: 14, fontWeight: '800', marginTop: 1 },
    briefingItem:      { flex: 1, color: C.inkSub, fontSize: 13, lineHeight: 20 },

    briefingSlotBadge: {
      alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
      backgroundColor: C.blueSoft,
    },
    briefingSlotBadgeText: { color: C.blue, fontSize: 10, fontWeight: '900', letterSpacing: 0.6 },
    briefingNarrative: { color: C.ink, fontSize: 15, fontWeight: '700', lineHeight: 22, marginTop: 8 },
    briefingContextRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
    briefingContextChip: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
      backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border,
    },
    briefingContextChipLabel: { color: C.inkMuted, fontSize: 10, fontWeight: '700' },
    briefingContextChipValue: { color: C.ink, fontSize: 11, fontWeight: '800', ...num },
    briefingActionList: { gap: 8, marginTop: 12 },
    briefingActionRow: {
      flexDirection: 'row', gap: 10, padding: 10, borderRadius: 8,
      backgroundColor: C.surfaceAlt,
    },
    briefingActionBar: { width: 3, borderRadius: 2, alignSelf: 'stretch' },
    briefingActionBody: { flex: 1, gap: 2 },
    briefingActionTitle: { color: C.ink, fontSize: 13, fontWeight: '800' },
    briefingActionDetail: { color: C.inkSub, fontSize: 12, fontWeight: '500', lineHeight: 17 },
    briefingActionMeta: { color: C.inkMuted, fontSize: 10, fontWeight: '700', ...num, marginTop: 2 },

    // ── Filter Chips ─────────────────────────────────────────────────────────────
    filterRow:        { flexDirection: 'row', gap: 6, marginTop: 4, marginBottom: 4, flexWrap: 'wrap' },
    filterChip: {
      borderRadius: 999, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.surface,
      paddingHorizontal: 14, paddingVertical: 7,
    },
    filterChipActive: { borderColor: C.ink, backgroundColor: C.ink },
    filterText:       { color: C.inkSub, fontWeight: '700', fontSize: 12 },
    filterTextActive: { color: C.surface },

    // ── Index Chips ───────────────────────────────────────────────────────────────
    indexChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    indexChip: {
      borderRadius: 10, borderWidth: 1.5, borderColor: C.border,
      paddingHorizontal: 12, paddingVertical: 7, backgroundColor: C.surface,
    },
    indexChipActive:     { borderColor: C.blue, backgroundColor: C.blueSoft },
    indexChipText:       { color: C.inkSub, fontWeight: '700', fontSize: 12 },
    indexChipTextActive: { color: C.blueDark, fontWeight: '800' },

    // ── Collapsible 카드 공통 ─────────────────────────────────────────────────────
    collapsibleHeader: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
    },
    // 제목 쪽이 flex: 1 로 남은 공간을 먹어야 한국어 텍스트가 한 글자씩 세로로 떨어지지 않음.
    collapsibleHeaderMain:    { flex: 1, flexShrink: 1, minWidth: 0 },
    collapsibleHeaderPreview: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8, flexShrink: 0 },
    collapsibleBody:          { marginTop: 10, gap: 10 },

    // ── Badge (공용) ────────────────────────────────────────────────────────────
    badge: {
      color: C.inkSub, fontSize: 11, fontWeight: '700', backgroundColor: C.surfaceAlt,
      borderWidth: 1, borderColor: C.border, borderRadius: 8, paddingHorizontal: 9,
      paddingVertical: 4, overflow: 'hidden',
    },

    // ── Quick add (one-tap watchlist toggle) ────────────────────────────────────
    quickAddPill: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5,
      backgroundColor: C.blue, alignSelf: 'flex-start', marginTop: 6,
    },
    quickAddPillActive: { backgroundColor: C.tealSoft, borderWidth: 1, borderColor: C.teal },
    quickAddPillText:   { color: '#ffffff', fontSize: 11, fontWeight: '800' },
    quickAddPillTextActive: { color: C.teal, fontSize: 11, fontWeight: '800' },
  }
}
