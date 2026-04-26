/**
 * 웹 셸의 좌측 사이드바 / 좁은 뷰포트 탭바 공용 탭 정의.
 */
import { BarChart3, Bot, Home, Sunrise, TrendingUp } from 'lucide-react-native'
import type { TabKey } from '../../types'

export const TABS: Array<{ key: TabKey; label: string; Icon: typeof Home }> = [
  { key: 'today',  label: '오늘', Icon: Sunrise },
  { key: 'home',   label: '홈',   Icon: Home },
  { key: 'market', label: '시장', Icon: TrendingUp },
  { key: 'stocks', label: '종목', Icon: BarChart3 },
  { key: 'ai',     label: 'AI',   Icon: Bot },
]
