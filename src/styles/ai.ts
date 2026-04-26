import type { Palette } from '../theme'
import { tabularNums, type StyleObj } from './util'

export function aiStyles(C: Palette): StyleObj {
  const num = tabularNums

  return {
    // ── AI Log ────────────────────────────────────────────────────────────────────
    logTop:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
    logName:  { flex: 1, color: C.ink, fontSize: 14, fontWeight: '700' },
    logStage: {
      color: C.inkSub, fontSize: 10, fontWeight: '800', backgroundColor: C.border,
      borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, overflow: 'hidden', letterSpacing: 0.5,
    },
    logMeta:   { color: C.inkSub, fontSize: 12, fontWeight: '600' },
    logBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    logNewsLink: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      marginTop: 2, paddingVertical: 4,
    },
    logNewsLinkText: { flex: 1, color: C.blue, fontSize: 11, fontWeight: '700' },

    // ── Metrics cards (AI hit rate) ──────────────────────────────────────────────
    metricsRow:   { flexDirection: 'row', gap: 10, marginTop: 6 },
    metricsCell:  {
      flex: 1, padding: 10, borderRadius: 10,
      backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border, gap: 2,
    },
    metricsLabel: { color: C.inkMuted, fontSize: 11, fontWeight: '700' },
    metricsValue: { color: C.ink, fontSize: 20, fontWeight: '900', ...num },
    metricsSub:   { color: C.inkFaint, fontSize: 10, fontWeight: '600', ...num },
  }
}
