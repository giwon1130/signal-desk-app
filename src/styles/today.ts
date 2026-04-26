import type { Palette } from '../theme'
import { makeShadow, tabularNums, type StyleObj } from './util'

export function todayStyles(C: Palette): StyleObj {
  const shadow = makeShadow(C.shadowColor)
  const num = tabularNums

  return {
    // ── Today Tab ────────────────────────────────────────────────────────────────
    todayHeroCard: {
      borderRadius: 16, padding: 14, gap: 4, borderWidth: 1, borderColor: C.border,
      backgroundColor: C.surface, ...shadow.sm,
    },
    todayHeroValue: { fontSize: 20, fontWeight: '900', letterSpacing: -0.3, marginTop: 2 },

    // ── Fortune 카드 (오늘의 투자 운세) ───────────────────────────────────────────
    fortuneCard: {
      borderRadius: 16, padding: 14, gap: 10,
      borderWidth: 1, borderColor: C.border, backgroundColor: C.surface, ...shadow.sm,
    },
    fortuneTopRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    fortuneScoreCircle: {
      width: 58, height: 58, borderRadius: 999, alignItems: 'center', justifyContent: 'center',
      borderWidth: 2,
    },
    fortuneScoreValue: { fontSize: 20, fontWeight: '900', ...num, letterSpacing: -0.5 },
    fortuneScoreUnit:  { fontSize: 9, fontWeight: '700', marginTop: -2 },
    fortuneTopText:    { flex: 1, gap: 2 },
    fortuneLabel:      { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' },
    fortuneHeadline:   { color: C.ink, fontSize: 16, fontWeight: '900', letterSpacing: -0.3, lineHeight: 22 },
    fortuneMessage:    { color: C.inkSub, fontSize: 13, fontWeight: '500', lineHeight: 20 },

    fortuneSubScoreRow: { flexDirection: 'row', gap: 8, marginTop: 2 },
    fortuneSubScoreCell: {
      flex: 1, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 6, alignItems: 'center',
      backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border, gap: 2,
    },
    fortuneSubScoreLabel: { color: C.inkMuted, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
    fortuneSubScoreValue: { color: C.ink, fontSize: 16, fontWeight: '900', ...num },
    fortuneSubScoreBar:   { width: '80%', height: 3, borderRadius: 999, backgroundColor: C.border, overflow: 'hidden', marginTop: 2 },
    fortuneSubScoreBarFill: { height: 3, borderRadius: 999 },

    fortuneMetaGrid: { gap: 6 },
    fortuneMetaRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
    fortuneMetaKey:  { color: C.inkMuted, fontSize: 11, fontWeight: '800', letterSpacing: 0.5, width: 66 },
    fortuneMetaVal:  { flex: 1, color: C.ink, fontSize: 12, fontWeight: '700' },

    fortuneCaution: {
      flexDirection: 'row', alignItems: 'flex-start', gap: 6,
      borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8,
      backgroundColor: C.scheme === 'dark' ? '#3a2a10' : '#fff7ed',
      borderWidth: 1, borderColor: C.scheme === 'dark' ? '#78350f' : '#fed7aa',
    },
    fortuneCautionText: { flex: 1, color: C.scheme === 'dark' ? '#fcd34d' : '#9a3412', fontSize: 12, fontWeight: '700', lineHeight: 17 },

    fortuneMantra: {
      color: C.ink, fontSize: 14, fontWeight: '900', textAlign: 'center', letterSpacing: -0.2,
      paddingVertical: 10, paddingHorizontal: 12,
      borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: C.border,
      backgroundColor: C.surfaceAlt,
    },
    fortuneDisclaimer: { color: C.inkFaint, fontSize: 10, fontWeight: '600', textAlign: 'center' },

    todaySessionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    todaySessionPill: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999,
    },
    todaySessionLabel:  { fontSize: 11, fontWeight: '800' },
    todaySessionStatus: { fontSize: 10, fontWeight: '700', opacity: 0.85 },

    // sentiment 카드
    todaySentimentCard: {
      borderRadius: 12, padding: 12, gap: 6, marginTop: 4,
      borderWidth: 1, borderColor: C.border, backgroundColor: C.surfaceAlt,
    },
    todaySentimentHead:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
    todaySentimentMarket:{ flex: 1, color: C.ink, fontSize: 13, fontWeight: '800' },
    todaySentimentLabel: { fontSize: 12, fontWeight: '800' },
    todaySentimentScore: { fontSize: 22, fontWeight: '900', ...num, marginLeft: 4 },
    todaySentimentBarTrack: {
      height: 6, borderRadius: 999, backgroundColor: C.border, overflow: 'hidden', marginTop: 2,
    },
    todaySentimentBarFill: { height: 6, borderRadius: 999 },
    todaySentimentMetaRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
    todaySentimentMeta:    { color: C.inkMuted, fontSize: 11, fontWeight: '700', ...num },
    todaySentimentRationale: { color: C.inkSub, fontSize: 12, fontWeight: '600', lineHeight: 18 },

    todayHeadlineRow: {
      flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6,
      borderTopWidth: 1, borderTopColor: C.border,
    },
    todayHeadlineDot:    { width: 6, height: 6, borderRadius: 999 },
    todayHeadlineText:   { flex: 1, color: C.ink, fontSize: 12, fontWeight: '600', lineHeight: 17 },
    todayHeadlineSource: { color: C.inkFaint, fontSize: 10, fontWeight: '700' },

    // 단타 픽
    todayPickRow: {
      borderRadius: 12, padding: 12, gap: 4, marginTop: 6,
      borderWidth: 1, borderColor: C.border, backgroundColor: C.surfaceAlt,
    },
    todayPickTopLine:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    todayPickName:     { color: C.ink, fontSize: 14, fontWeight: '800', flex: 1 },
    todayPickStanceBadge: {
      backgroundColor: C.brand, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2,
    },
    todayPickStanceBadgeText: { color: C.brandAccent, fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
    pickUserStatusBadge: {
      borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
      borderWidth: 1, borderColor: C.border, backgroundColor: C.surface,
    },
    pickUserStatusBadgeHeld:    { borderColor: C.red,  backgroundColor: C.redSoft },
    pickUserStatusBadgeWatched: { borderColor: C.blue, backgroundColor: C.blueSoft },
    pickUserStatusBadgeNew:     { borderColor: C.border, backgroundColor: C.surfaceAlt },
    pickUserStatusBadgeText:         { fontSize: 9, fontWeight: '900', letterSpacing: 0.5, color: C.inkMuted },
    pickUserStatusBadgeTextHeld:     { color: C.red },
    pickUserStatusBadgeTextWatched:  { color: C.blue },
    todayPickHeaderBadges: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    todayPickMeta:      { color: C.inkMuted, fontSize: 11, fontWeight: '600', ...num },
    todayPickRationale: { color: C.inkSub, fontSize: 12, fontWeight: '500', lineHeight: 17 },
    todayPickReturn:    { fontSize: 12, fontWeight: '800', ...num, marginTop: 2 },

    // 모니터
    todayMonitorRow: {
      flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10,
      borderTopWidth: 1, borderTopColor: C.border,
    },
    todayMonitorLeft:  { flex: 1, gap: 2 },
    todayMonitorRight: { alignItems: 'flex-end', gap: 2 },
    todayMonitorName:  { color: C.ink, fontSize: 13, fontWeight: '800' },
    todayMonitorMeta:  { color: C.inkMuted, fontSize: 11, fontWeight: '600', ...num },
    todayMonitorAdvice:{ color: C.inkSub, fontSize: 11, fontWeight: '700', marginTop: 2 },
    todayMonitorRate:  { fontSize: 14, fontWeight: '900', ...num },
    todayMonitorPrice: { color: C.inkMuted, fontSize: 11, fontWeight: '700', ...num },
  }
}
