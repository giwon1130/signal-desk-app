/**
 * 웹 셸의 좌측 사이드바 / 좁은 뷰포트 탭바 공용 탭 정의.
 * v2.1: 5탭 (today/stocks/ai/league/reading). league 는 친구 모의투자,
 * reading 은 PC 작성용 리딩(종목 콜 공유) — 웹 앱의 핵심 용도.
 */
import { BarChart3, Bot, Megaphone, ShieldCheck, Sunrise, Trophy } from 'lucide-react-native'
import type { TabKey } from '../../types'

export const TABS: Array<{ key: TabKey; label: string; Icon: typeof Sunrise }> = [
  { key: 'today',   label: '오늘',   Icon: Sunrise },
  { key: 'stocks',  label: '종목',   Icon: BarChart3 },
  { key: 'ai',      label: 'AI',     Icon: Bot },
  { key: 'league',  label: '리그',   Icon: Trophy },
  { key: 'reading', label: '리딩',   Icon: Megaphone },
]

/** 운영자 전용 탭 — admin 계정에만 노출 (LeftSidebar/NarrowTabBar 에서 조건부 결합). */
export const ADMIN_TAB: { key: TabKey; label: string; Icon: typeof Sunrise } =
  { key: 'admin', label: '운영', Icon: ShieldCheck }
