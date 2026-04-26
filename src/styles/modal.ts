import type { Palette } from '../theme'
import { makeShadow, type StyleObj } from './util'

export function modalStyles(C: Palette): StyleObj {
  const shadow = makeShadow(C.shadowColor)

  return {
    // ── Signal modal ─────────────────────────────────────────────────────────────
    signalModalBackdrop: {
      flex: 1, backgroundColor: 'rgba(15,23,42,0.55)',
      alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20,
    },
    signalModalCard: {
      width: '100%', maxWidth: 520, backgroundColor: C.surface,
      borderRadius: 16, padding: 18, ...shadow.lg,
    },
    signalModalHeader: {
      flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12,
    },
    signalModalTitle:    { color: C.ink, fontSize: 18, fontWeight: '900' },
    signalModalSubtitle: { color: C.inkMuted, fontSize: 12, fontWeight: '700', marginTop: 2 },
    signalModalSection:  { marginTop: 12, gap: 4 },
    signalModalSectionTitle: {
      color: C.blue, fontSize: 11, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase',
    },
    signalModalBody:     { color: C.ink, fontSize: 13, lineHeight: 19, fontWeight: '500' },
    signalModalLink:     { color: C.blue, fontSize: 12, fontWeight: '700', marginTop: 4 },
    signalModalDisclaimer: {
      color: C.inkMuted, fontSize: 11, fontWeight: '600',
      marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border,
      lineHeight: 17,
    },
  }
}
