import { useMemo } from 'react'
import { StyleSheet } from 'react-native'
import { useTheme } from './theme'
import type { Palette } from './theme'

const makeShadow = (color: string) => ({
  sm: { shadowColor: color, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3,  elevation: 2 },
  md: { shadowColor: color, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8,  elevation: 4 },
  lg: { shadowColor: color, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 6 },
})

export function makeStyles(C: Palette) {
  const shadow = makeShadow(C.shadowColor)

  return StyleSheet.create({
    // ── App Shell ───────────────────────────────────────────────────────────────
    container: { flex: 1, backgroundColor: C.bg },

    // ── Header ──────────────────────────────────────────────────────────────────
    headerWrap: { paddingHorizontal: 14, paddingTop: 6, paddingBottom: 2 },
    headerGradient: {
      borderRadius: 20, paddingHorizontal: 18, paddingTop: 16, paddingBottom: 14,
      backgroundColor: C.brand, ...shadow.lg,
    },
    headerTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 },
    brand: { color: C.brandAccent, fontWeight: '900', fontSize: 11, letterSpacing: 2.5, marginBottom: 3 },
    headerTitle: { fontSize: 22, fontWeight: '800', color: C.headerOnDark, letterSpacing: -0.3 },
    headerSubtitle: { color: C.headerSubtitle, fontSize: 12, fontWeight: '500', marginTop: 2 },
    headerStatusPill: {
      flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999,
      paddingHorizontal: 10, paddingVertical: 5, marginTop: 2,
    },
    headerStatusPillUp:   { backgroundColor: 'rgba(34,197,94,0.15)' },
    headerStatusPillDown: { backgroundColor: 'rgba(239,68,68,0.15)' },
    headerStatusDot:      { width: 6, height: 6, borderRadius: 999 },
    headerStatusDotUp:    { backgroundColor: '#4ade80' },
    headerStatusDotDown:  { backgroundColor: '#f87171' },
    headerStatusText:     { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
    headerStatusTextUp:   { color: '#4ade80' },
    headerStatusTextDown: { color: '#f87171' },
    themeToggleBtn: {
      borderRadius: 999, paddingHorizontal: 8, paddingVertical: 6,
      backgroundColor: 'rgba(255,255,255,0.08)', marginLeft: 6,
    },

    // ── Tab Bar ─────────────────────────────────────────────────────────────────
    tabBar: {
      flexDirection: 'row', backgroundColor: C.surface, marginHorizontal: 14, marginTop: 10,
      borderRadius: 16, borderWidth: 1, borderColor: C.border, ...shadow.sm, paddingVertical: 4,
    },
    tabItem: {
      flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, gap: 3,
      position: 'relative', borderRadius: 12,
    },
    tabItemActive:  { backgroundColor: C.scheme === 'dark' ? '#1e293b' : '#eff6ff' },
    tabItemPressed: { opacity: 0.7 },
    tabLabel:       { fontSize: 11, fontWeight: '600', color: C.inkFaint },
    tabLabelActive: { color: C.blue, fontWeight: '700' },
    tabActiveBar:   { position: 'absolute', bottom: 0, width: 20, height: 2, backgroundColor: C.blue, borderRadius: 999 },

    // ── Loading / Error ──────────────────────────────────────────────────────────
    loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    loadingText: { color: C.inkMuted, fontSize: 14, fontWeight: '600' },
    errorBox: {
      marginHorizontal: 14, marginTop: 14, borderRadius: 16, borderWidth: 1,
      borderColor: C.scheme === 'dark' ? '#7f1d1d' : '#fecaca',
      backgroundColor: C.scheme === 'dark' ? '#3a0e0e' : '#fef2f2',
      padding: 16, gap: 6, ...shadow.sm,
    },
    errorTitle: { color: C.red, fontSize: 15, fontWeight: '800' },
    errorText:  { color: C.scheme === 'dark' ? '#fca5a5' : '#991b1b', fontSize: 13, lineHeight: 20 },
    retryButton: {
      alignSelf: 'flex-start', marginTop: 8, borderRadius: 999,
      backgroundColor: C.red, paddingHorizontal: 16, paddingVertical: 8,
    },
    retryButtonText: { color: '#ffffff', fontSize: 13, fontWeight: '800' },

    // ── Scroll / Content ────────────────────────────────────────────────────────
    scroll:  { flex: 1 },
    content: { padding: 14, gap: 10, paddingBottom: 32 },

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
    quickStatValue: { marginTop: 4, color: C.ink, fontSize: 22, fontWeight: '800' },

    // ── Stock Results ────────────────────────────────────────────────────────────
    stockResultRow: { gap: 8 },
    stockResultCard: {
      borderRadius: 14, borderWidth: 1, borderColor: C.border, backgroundColor: C.surfaceAlt,
      padding: 12, gap: 6, ...shadow.sm,
    },
    stockResultCardActive: {
      borderColor: C.teal,
      backgroundColor: C.scheme === 'dark' ? '#0f3530' : '#f0fdf9',
    },
    stockResultTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
    stockResultName:   { flex: 1, color: C.ink, fontSize: 15, fontWeight: '800' },
    stockMarketBadge:  {
      borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, fontSize: 10,
      fontWeight: '800', overflow: 'hidden', letterSpacing: 0.5,
    },
    stockMarketBadgeKr: { backgroundColor: C.blueSoft, color: C.blueDark },
    stockMarketBadgeUs: { backgroundColor: C.purpleSoft, color: C.purple },
    stockResultMeta:    { color: C.inkMuted, fontSize: 12, fontWeight: '600' },
    stockResultBottom:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    stockResultPrice:   { color: C.ink, fontSize: 16, fontWeight: '800' },
    stockResultDelta:   { fontSize: 13, fontWeight: '800' },
    favoriteHint:       { color: C.teal, fontSize: 11, fontWeight: '700' },

    // ── Stock Detail ─────────────────────────────────────────────────────────────
    stockDetailHero:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
    stockDetailName:  { color: C.ink, fontSize: 20, fontWeight: '800' },
    stockDetailPrice: { color: C.ink, fontSize: 18, fontWeight: '800' },
    cardSection:      { gap: 10, marginTop: 6 },

    // ── Action Buttons ───────────────────────────────────────────────────────────
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

    // ── Insight / Favorite Rows ──────────────────────────────────────────────────
    stockInsightCard: {
      borderRadius: 12, borderWidth: 1, borderColor: C.border, backgroundColor: C.surfaceAlt,
      padding: 12, gap: 6,
    },
    favoriteRow: {
      borderRadius: 12, borderWidth: 1, borderColor: C.border, backgroundColor: C.surfaceAlt,
      padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10,
    },
    favoriteDeleteButton: {
      borderRadius: 10, backgroundColor: C.redSoft, paddingHorizontal: 12, paddingVertical: 8,
    },
    favoriteDeleteText: { color: C.red, fontSize: 12, fontWeight: '800' },

    // ── Primary Value / Notes ────────────────────────────────────────────────────
    primaryValue: { color: C.ink, fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
    cardNote:     { color: C.inkSub, fontSize: 13, lineHeight: 19 },
    metaText:     { color: C.inkMuted, fontSize: 12, fontWeight: '500' },

    // ── KPI Row ─────────────────────────────────────────────────────────────────
    kpiRow:    { flexDirection: 'row', gap: 8 },
    kpiCard:   {
      flex: 1, borderRadius: 14, backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border,
      padding: 12, alignItems: 'center', gap: 4, ...shadow.sm,
    },
    kpiLabel:  { color: C.inkMuted, fontSize: 11, fontWeight: '700', textAlign: 'center' },
    kpiValue:  { color: C.ink, fontSize: 18, fontWeight: '800' },

    // ── Hero Metrics ─────────────────────────────────────────────────────────────
    heroMetricsRow: { flexDirection: 'row', gap: 8 },
    heroMetricCard: {
      flex: 1, borderRadius: 16, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
      padding: 14, gap: 6, ...shadow.sm,
    },
    heroMetricCardDark:       { backgroundColor: C.ink, borderColor: C.ink },
    heroMetricLabel:          { color: C.inkMuted, fontSize: 11, fontWeight: '700' },
    heroMetricLabelOnDark:    { color: '#93c5fd' },
    heroMetricValue:          { color: C.ink, fontSize: 18, fontWeight: '800' },
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
    metricScore:  { color: C.teal, fontSize: 18, fontWeight: '800' },
    metricNote:   { color: C.inkMuted, fontSize: 12 },
    metricSource: { color: C.blue, fontSize: 11, fontWeight: '700' },

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

    // ── Section Header ────────────────────────────────────────────────────────────
    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
    cardTitleRow:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
    emptyStateRow:    { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },

    // ── Summary Row / Portfolio ───────────────────────────────────────────────────
    summaryRow: {
      borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 12,
      backgroundColor: C.surfaceAlt, flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'center', gap: 10,
    },
    summaryValueBox:      { alignItems: 'flex-end', gap: 2 },
    summaryMeta:          { color: C.inkMuted, fontSize: 11, fontWeight: '700' },
    summaryDelta:         { fontSize: 12, fontWeight: '700' },
    portfolioSummaryRow:  { flexDirection: 'row', gap: 8 },
    portfolioSummaryCard: {
      flex: 1, borderRadius: 12, borderWidth: 1, borderColor: C.border,
      backgroundColor: C.surfaceAlt, padding: 10,
    },

    // ── Briefing ─────────────────────────────────────────────────────────────────
    briefingList:      { gap: 8, marginTop: 10 },
    briefingBulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    briefingBullet:    { color: C.teal, fontSize: 14, fontWeight: '800', marginTop: 1 },
    briefingItem:      { flex: 1, color: C.inkSub, fontSize: 13, lineHeight: 20 },

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
    chartStatValue: { marginTop: 2, color: C.ink, fontSize: 13, fontWeight: '700' },

    // ── AI Log ────────────────────────────────────────────────────────────────────
    logTop:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
    logName:  { flex: 1, color: C.ink, fontSize: 14, fontWeight: '700' },
    logStage: {
      color: C.inkSub, fontSize: 10, fontWeight: '800', backgroundColor: C.border,
      borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, overflow: 'hidden', letterSpacing: 0.5,
    },
    logMeta:   { color: C.inkSub, fontSize: 12, fontWeight: '600' },
    logBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    badge: {
      color: C.inkSub, fontSize: 11, fontWeight: '700', backgroundColor: C.surfaceAlt,
      borderWidth: 1, borderColor: C.border, borderRadius: 8, paddingHorizontal: 9,
      paddingVertical: 4, overflow: 'hidden',
    },

    // ── (unused but kept for compat) ─────────────────────────────────────────────
    apiText: { display: 'none' },
    tabRow: { display: 'none' },
    tabButton: { display: 'none' },
    tabButtonActive: { display: 'none' },
    tabText: { display: 'none' },
    tabTextActive: { display: 'none' },
    headerMetaRow: { display: 'none' },
    headerStatusBadge: { display: 'none' },
    headerStatusBadgeUp: { display: 'none' },
    headerStatusBadgeDown: { display: 'none' },
    headerMetaText: { display: 'none' },
  })
}

/** 컴포넌트 내부에서 호출. 테마가 바뀌면 자동으로 새 styles 반환. */
export function useStyles() {
  const { palette } = useTheme()
  return useMemo(() => makeStyles(palette), [palette])
}

/** 모듈 단에서 import 하는 기존 코드 호환용 (라이트 테마 고정).
 *  새 코드는 useStyles() 사용 권장. */
export const styles = makeStyles({
  scheme: 'light',
  bg: '#f0f4f8', surface: '#ffffff', surfaceAlt: '#f8fafc',
  border: '#e2e8f0', borderLight: '#f1f5f9',
  ink: '#0f172a', inkSub: '#334155', inkMuted: '#64748b', inkFaint: '#94a3b8',
  brand: '#1e3a5f', brandAccent: '#60a5fa',
  blue: '#3b82f6', blueSoft: '#dbeafe', blueDark: '#1d4ed8',
  teal: '#0d9488', tealSoft: '#ccfbf1',
  up: '#ef4444', upSoft: '#fee2e2', down: '#3b82f6', downSoft: '#dbeafe',
  green: '#16a34a', greenSoft: '#dcfce7', orange: '#f59e0b', orangeSoft: '#fef3c7',
  purple: '#7c3aed', purpleSoft: '#ede9fe', red: '#dc2626', redSoft: '#fee2e2',
  skeleton: '#e2e8f0',
  toastSuccessBg: '#dcfce7', toastErrorBg: '#fee2e2', toastInfoBg: '#f1f5f9',
  shadowColor: '#0f172a',
  headerSubtitle: '#93c5fd', headerOnDark: '#f8fafc',
})
