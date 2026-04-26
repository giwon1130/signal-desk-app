import type { Palette } from '../theme'
import { makeShadow, tabularNums, type StyleObj } from './util'

export function stocksStyles(C: Palette): StyleObj {
  const shadow = makeShadow(C.shadowColor)
  const num = tabularNums

  return {
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
    stockResultPrice:   { color: C.ink, fontSize: 16, fontWeight: '800', ...num },
    stockResultDelta:   { fontSize: 13, fontWeight: '800', ...num },

    // ── Stock Detail ─────────────────────────────────────────────────────────────
    stockDetailHero:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
    stockDetailName:  { color: C.ink, fontSize: 20, fontWeight: '800' },
    stockDetailPrice: { color: C.ink, fontSize: 18, fontWeight: '800', ...num },

    // ── Insight ──────────────────────────────────────────────────────────────────
    stockInsightCard: {
      borderRadius: 12, borderWidth: 1, borderColor: C.border, backgroundColor: C.surfaceAlt,
      padding: 12, gap: 6,
    },
  }
}
