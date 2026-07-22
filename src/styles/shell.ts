import type { ViewStyle } from 'react-native'
import type { Palette } from '../theme'
import { makeShadow, type StyleObj } from './util'

export function shellStyles(C: Palette): StyleObj {
  const shadow = makeShadow(C.shadowColor)

  return {
    // ── App Shell ───────────────────────────────────────────────────────────────
    container: { flex: 1, backgroundColor: C.bg },

    // ── Header (compact: 헤더는 짧게, 콘텐츠 영역은 넓게) ──────────────────────
    headerWrap: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 6 },
    headerGradient: {
      paddingHorizontal: 0, paddingTop: 2, paddingBottom: 2,
      backgroundColor: 'transparent',
    },
    headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    brand: { color: C.brandAccent, fontWeight: '900', fontSize: 9, letterSpacing: 1.4 },
    headerTitle: { fontSize: 20, fontWeight: '900', color: C.ink, letterSpacing: -0.6 },
    headerSubtitle: { color: C.inkMuted, fontSize: 10.5, fontWeight: '600' },
    headerStatusPill: {
      flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999,
      paddingHorizontal: 7, paddingVertical: 4,
    },
    headerStatusPillUp:   { backgroundColor: C.greenSoft },
    headerStatusPillDown: { backgroundColor: C.redSoft },
    headerStatusDot:      { width: 5, height: 5, borderRadius: 999 },
    headerStatusDotUp:    { backgroundColor: C.green },
    headerStatusDotDown:  { backgroundColor: C.red },
    headerStatusText:     { fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
    headerStatusTextUp:   { color: C.green },
    headerStatusTextDown: { color: C.red },
    themeToggleBtn: {
      width: 36, height: 36, borderRadius: 12,
      backgroundColor: C.surface, borderWidth: 1, borderColor: C.borderLight,
      alignItems: 'center', justifyContent: 'center',
    },
    headerIconBtn: {
      width: 36, height: 36, borderRadius: 12,
      backgroundColor: C.surface, borderWidth: 1, borderColor: C.borderLight,
      alignItems: 'center', justifyContent: 'center',
    },
    headerIconBadge: {
      position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 999,
      backgroundColor: C.orange, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
    },
    headerIconBadgeText: { color: '#1a1205', fontSize: 9, fontWeight: '900' },

    // ── Tab Bar ─────────────────────────────────────────────────────────────────
    tabBar: {
      flexDirection: 'row', backgroundColor: C.surface, marginHorizontal: 16, marginTop: 4, marginBottom: 2,
      borderRadius: 16, borderWidth: 1, borderColor: C.borderLight, ...shadow.sm, padding: 4,
    },
    tabItem: {
      flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 7, gap: 2,
      position: 'relative', borderRadius: 12,
    },
    tabItemActive:  { backgroundColor: C.greenSoft },
    tabItemPressed: { opacity: 0.7 },
    tabLabel:       { fontSize: 10, fontWeight: '700', color: C.inkFaint },
    tabLabelActive: { color: C.green, fontWeight: '900' },
    tabActiveBar:   { display: 'none' },

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
    content: { padding: 16, gap: 14, paddingBottom: 40 },
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
