/**
 * PRO 전용 — 한 종목 AI 심층 리포트 모달.
 * 열릴 때 자동 fetch. 잠김(PRO 아님)·한도·실패는 메시지로 안내.
 */
import { useEffect, useState } from 'react'
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Sparkles, X } from 'lucide-react-native'
import { useTheme } from '../theme'
import { fetchDeepReport } from '../api/assistant'

type Props = {
  visible: boolean
  market: string
  ticker: string
  name: string
  onClose: () => void
  /** PRO 가 아니라 잠겼을 때 업그레이드 시트로 유도 */
  onUpgrade?: () => void
}

export function DeepReportModal({ visible, market, ticker, name, onClose, onUpgrade }: Props) {
  const { palette } = useTheme()
  const purple = palette.purple ?? '#7c3aed'
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [remaining, setRemaining] = useState<number | null>(null)

  useEffect(() => {
    if (!visible) return
    let alive = true
    setLoading(true); setReport(null); setError(null)
    void fetchDeepReport(market, ticker).then((r) => {
      if (!alive) return
      setReport(r.report)
      setError(r.error)
      setRemaining(r.remaining)
      setLoading(false)
      if (r.locked && onUpgrade) { onClose(); onUpgrade() }
    })
    return () => { alive = false }
  }, [visible, market, ticker])

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }} edges={['top', 'bottom']}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: palette.border }}>
          <Sparkles size={18} color={purple} strokeWidth={2.4} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ color: palette.ink, fontSize: 15, fontWeight: '900' }} numberOfLines={1}>AI 심층 리포트</Text>
            <Text style={{ color: palette.inkMuted, fontSize: 11 }} numberOfLines={1}>{name} · {market}:{ticker}</Text>
          </View>
          <Pressable onPress={onClose} hitSlop={10}><X size={20} color={palette.inkMuted} strokeWidth={2.5} /></Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
          {loading ? (
            <View style={{ paddingVertical: 48, alignItems: 'center', gap: 12 }}>
              <ActivityIndicator color={purple} />
              <Text style={{ color: palette.inkMuted, fontSize: 12.5 }}>시데 AI가 {name}을(를) 분석하고 있어요…</Text>
            </View>
          ) : error ? (
            <View style={{ paddingVertical: 40, alignItems: 'center', gap: 6 }}>
              <Text style={{ color: palette.inkMuted, fontSize: 13, fontWeight: '700', textAlign: 'center' }}>{error}</Text>
            </View>
          ) : report ? (
            <>
              <Text style={{ color: palette.ink, fontSize: 14, lineHeight: 22 }}>{report}</Text>
              <Text style={{ color: palette.inkFaint, fontSize: 11, lineHeight: 16, marginTop: 4 }}>
                AI가 제공 데이터로 작성한 참고용 분석이에요. 투자 판단·책임은 본인에게 있어요.
                {remaining != null ? `  ·  오늘 ${remaining}회 남음` : ''}
              </Text>
            </>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  )
}
