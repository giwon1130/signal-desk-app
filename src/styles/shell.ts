import type { ViewStyle } from 'react-native'
import type { Palette } from '../theme'
import { makeShadow, type StyleObj } from './util'

export function shellStyles(C: Palette): StyleObj {
  const shadow = makeShadow(C.shadowColor)

  return {
    // ── App Shell ───────────────────────────────────────────────────────────────
    container: { flex: 1, backgroundColor: C.bg },

    // ── Header (compact: 헤더는 짧게, 콘텐츠 영역은 넓게) ──────────────────────
    headerWrap: { paddingHorizontal: 14, paddingTop: 4, paddingBottom: 2 },
    headerGradient: {
      borderRadius: 16, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10,
      backgroundColor: C.brand, ...shadow.md,
    },
    headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    brand: { color: C.brandAccent, fontWeight: '900', fontSize: 10, letterSpacing: 2 },
    headerTitle: { fontSize: 17, fontWeight: '800', color: C.headerOnDark, letterSpacing: -0.3 },
    headerSubtitle: { color: C.headerSubtitle, fontSize: 11, fontWeight: '500', marginTop: 4 },
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
      flexDirection: 'row', backgroundColor: C.surface, marginHorizontal: 14, marginTop: 6,
      borderRadius: 14, borderWidth: 1, borderColor: C.border, ...shadow.sm, paddingVertical: 3,
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
    // 웹 데스크톱 전용: 카드를 CSS grid 로 재배치. 420px 이상 컬럼을 auto-fit.
    // 특정 카드는 cardFull 로 컬럼 span 을 덮어씀.
    // (RN Web 은 display/grid/gridTemplateColumns 등을 그대로 CSS 로 넘김)
    contentWeb: {
      padding: 0,
      paddingBottom: 32,
      gap: 14,
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
      gridAutoFlow: 'dense',
      alignItems: 'start',
    } as unknown as ViewStyle,
    // 카드가 grid 안에서 전체 폭을 차지하도록 강제
    cardFull: {
      gridColumn: '1 / -1',
    } as unknown as ViewStyle,

    // ── Trading day banner ──────────────────────────────────────────────────────
    tradingDayBanner: {
      borderRadius: 14, padding: 14, marginBottom: 12, gap: 6,
      backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border,
    },
    tradingDayBannerHeadline: { color: C.ink, fontSize: 14, fontWeight: '900' },
    tradingDayBannerAdvice:   { color: C.inkSub, fontSize: 12, fontWeight: '600', lineHeight: 18 },
    tradingDayBannerNext:     { color: C.inkMuted, fontSize: 11, fontWeight: '700' },

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
  }
}
