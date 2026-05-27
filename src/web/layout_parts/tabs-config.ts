/**
 * 웹 셸의 좌측 사이드바 / 좁은 뷰포트 탭바 공용 탭 정의.
 * v2.1: 4탭 (today/stocks/ai/league). league 는 친구 모의투자 신규.
 */
import { BarChart3, Bot, Sunrise, Trophy } from 'lucide-react-native'
import type { TabKey } from '../../types'

export const TABS: Array<{ key: TabKey; label: string; Icon: typeof Sunrise }> = [
  { key: 'today',  label: '오늘',   Icon: Sunrise },
  { key: 'stocks', label: '종목',   Icon: BarChart3 },
  { key: 'ai',     label: 'AI',     Icon: Bot },
  { key: 'league', label: '리그',   Icon: Trophy },
]
