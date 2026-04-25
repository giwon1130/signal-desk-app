import { useEffect, useMemo, useState } from 'react'
import type {
  ChartPeriodSnapshot,
  IndexMetric,
  MarketKey,
  MarketSection,
  MarketSectionsData,
  PeriodKey,
} from '../types'

/**
 * 차트 탭의 KR/US · 지수 · 기간 (D/W/M) 선택 상태를 한 곳으로.
 *
 * App.tsx 의 chartMarket / chartPeriod / selectedIndexLabel 3개 useState
 * + activeSection / activeIndex / activePeriod 3개 useMemo
 * + selectedIndexLabel 동기화 useEffect 를 흡수.
 *
 * sections 가 바뀌어도 (예: 새 fetch) 현재 선택된 라벨이 살아있으면 유지,
 * 없어졌으면 첫 번째 지수로 자동 폴백.
 */
export type ChartSelection = {
  chartMarket: MarketKey
  chartPeriod: PeriodKey
  selectedIndexLabel: string
  setChartMarket: (m: MarketKey) => void
  setChartPeriod: (p: PeriodKey) => void
  setSelectedIndexLabel: (label: string) => void
  activeSection: MarketSection | null
  activeIndex: IndexMetric | null
  activePeriod: ChartPeriodSnapshot | null
}

export function useChartSelection(sections: MarketSectionsData | null): ChartSelection {
  const [chartMarket, setChartMarket] = useState<MarketKey>('KR')
  const [chartPeriod, setChartPeriod] = useState<PeriodKey>('D')
  const [selectedIndexLabel, setSelectedIndexLabel] = useState('')

  const activeSection = useMemo<MarketSection | null>(() => {
    if (!sections) return null
    return chartMarket === 'KR' ? sections.koreaMarket : sections.usMarket
  }, [sections, chartMarket])

  // sections 바뀔 때 선택 라벨이 더 이상 존재하지 않으면 첫 번째로 폴백.
  useEffect(() => {
    if (!activeSection?.indices.length) return
    if (activeSection.indices.some((item) => item.label === selectedIndexLabel)) return
    setSelectedIndexLabel(activeSection.indices[0].label)
  }, [activeSection, selectedIndexLabel])

  const activeIndex = useMemo<IndexMetric | null>(() => {
    if (!activeSection) return null
    return activeSection.indices.find((item) => item.label === selectedIndexLabel) ?? activeSection.indices[0] ?? null
  }, [activeSection, selectedIndexLabel])

  const activePeriod = useMemo<ChartPeriodSnapshot | null>(() => {
    if (!activeIndex) return null
    return activeIndex.periods.find((item) => item.key === chartPeriod) ?? activeIndex.periods[0] ?? null
  }, [activeIndex, chartPeriod])

  return {
    chartMarket, chartPeriod, selectedIndexLabel,
    setChartMarket, setChartPeriod, setSelectedIndexLabel,
    activeSection, activeIndex, activePeriod,
  }
}
