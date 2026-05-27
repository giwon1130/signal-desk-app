/**
 * 웹 셸의 좌측 사이드바 / 좁은 뷰포트 탭바 공용 탭 정의.
 * v2: 5탭(today/home/market/stocks/ai) → 3탭(today/stocks/ai). home/market 콘텐츠는 today 흡수.
 */
import { BarChart3, Bot, Sunrise } from 'lucide-react-native'
import type { TabKey } from '../../types'

export const TABS: Array<{ key: TabKey; label: string; Icon: typeof Sunrise }> = [
  { key: 'today',  label: '오늘', Icon: Sunrise },
  { key: 'stocks', label: '종목', Icon: BarChart3 },
  { key: 'ai',     label: 'AI',   Icon: Bot },
]
