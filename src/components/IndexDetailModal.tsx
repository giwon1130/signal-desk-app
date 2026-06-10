import { useEffect } from 'react'
import { Modal, ScrollView, View, useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Activity } from 'lucide-react-native'
import { ChartSection } from '../tabs/market_parts/ChartSection'
import { ModalHeader } from './ModalHeader'
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
  const insets = useSafeAreaInsets()
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
      {/* Modal 내부에선 SafeAreaView 가 top inset 을 못 받는 경우가 있어 useSafeAreaInsets 로 직접 패딩
          (SettingsModal 등 다른 풀스크린 모달과 동일 패턴). */}
      <View style={{ flex: 1, backgroundColor: palette.bg, paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <ModalHeader icon={Activity} title="지수" onClose={onClose} />
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
      </View>
    </Modal>
  )
}
