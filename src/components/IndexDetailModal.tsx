import { useEffect } from 'react'
import { Modal, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Activity, X } from 'lucide-react-native'
import { ChartSection } from '../tabs/market_parts/ChartSection'
import { useChartSelection } from '../hooks/useChartSelection'
import { useTheme } from '../theme'
import type { MarketKey, MarketSectionsData } from '../types'

type Props = {
  visible: boolean
  sections: MarketSectionsData | null
  /** 열 때 점프할 초기 지수 (지수 펄스에서 탭한 항목). */
  initialMarket: MarketKey
  initialLabel: string
  onClose: () => void
}

/**
 * 지수 상세 — 코스피/코스닥/S&P/나스닥을 시장·기간(일/주/월)별 캔들+통계로.
 * 기존 ChartSection + useChartSelection 을 그대로 재사용 (백엔드/차트 신규 없음).
 */
export function IndexDetailModal({ visible, sections, initialMarket, initialLabel, onClose }: Props) {
  const { palette } = useTheme()
  const sel = useChartSelection(sections)
  const { width } = useWindowDimensions()
  const chartWidth = Math.max(280, Math.min(width, 600) - 56)

  // 열릴 때 탭한 지수로 점프.
  useEffect(() => {
    if (!visible) return
    if (initialMarket) sel.setChartMarket(initialMarket)
    if (initialLabel) sel.setSelectedIndexLabel(initialLabel)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, initialMarket, initialLabel])

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }} edges={['top', 'bottom']}>
        <View
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 10,
            paddingHorizontal: 16, paddingVertical: 12,
            borderBottomWidth: 1, borderBottomColor: palette.border,
          }}
        >
          <Activity size={18} color={palette.brandAccent} strokeWidth={2.5} />
          <Text style={{ flex: 1, color: palette.ink, fontSize: 17, fontWeight: '900' }}>지수</Text>
          <Pressable onPress={onClose} hitSlop={20} accessibilityLabel="닫기">
            <X size={20} color={palette.inkMuted} strokeWidth={2.5} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
          <ChartSection
            activeSection={sel.activeSection}
            activeIndex={sel.activeIndex}
            activePeriod={sel.activePeriod}
            chartMarket={sel.chartMarket}
            chartPeriod={sel.chartPeriod}
            selectedIndexLabel={sel.selectedIndexLabel}
            chartWidth={chartWidth}
            onChartMarketChange={sel.setChartMarket}
            onChartPeriodChange={sel.setChartPeriod}
            onSelectedIndexLabelChange={sel.setSelectedIndexLabel}
          />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  )
}
