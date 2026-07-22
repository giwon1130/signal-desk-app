import type { Palette } from '../theme'
import { type StyleObj } from './util'

export function homeStyles(C: Palette): StyleObj {
  return {
    // ── Portfolio ───────────────────────────────────────────────────────────────
    portfolioSummaryRow:  { flexDirection: 'row', gap: 8 },
    portfolioSummaryCard: {
      flex: 1, borderRadius: 12, borderWidth: 1, borderColor: C.border,
      backgroundColor: C.surfaceAlt, padding: 10,
    },

    // ── Watchlist / Favorites ───────────────────────────────────────────────────
    favoriteRow: {
      borderRadius: 14, borderWidth: 1, borderColor: C.borderLight, backgroundColor: C.surfaceAlt,
      padding: 13, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10,
    },
    favoriteDeleteButton: {
      borderRadius: 9, backgroundColor: 'transparent', borderWidth: 1, borderColor: C.border,
      paddingHorizontal: 10, paddingVertical: 6,
    },
    favoriteDeleteText: { color: C.inkMuted, fontSize: 11, fontWeight: '800' },
    favoriteHint:       { color: C.teal, fontSize: 11, fontWeight: '700' },
  }
}
