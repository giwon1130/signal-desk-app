import { Pressable, Text, View } from 'react-native'
import { ChevronDown, ClipboardCheck, Moon, Radar } from 'lucide-react-native'
import type { MarketSessionStatus } from '../../types'

export type TodayFocusTarget = 'portfolio' | 'watch' | 'mood' | 'news' | 'premarket' | 'brief'

type Props = {
  sessions: MarketSessionStatus[]
  positionsCount: number
  alertCount: number
  isPremarketWindow: boolean
  hasBrief: boolean
  onOpenSection: (target: TodayFocusTarget) => void
}

type Focus = {
  label: string
  title: string
  description: string
  action: string
  target: TodayFocusTarget
  tone: 'premarket' | 'regular' | 'closed'
}

/**
 * Today 탭의 첫 판단을 한 문장으로 줄인다. 시간대에 맞는 다음 행동만 제안하고,
 * 버튼은 같은 화면의 관련 섹션으로 이동한다.
 */
export function TodayFocusCard({ sessions, positionsCount, alertCount, isPremarketWindow, hasBrief, onOpenSection }: Props) {
  const focus = buildFocus({ sessions, positionsCount, alertCount, isPremarketWindow, hasBrief })
  const accent = '#85ead0'
  const Icon = focus.tone === 'premarket' ? Moon : focus.tone === 'regular' ? Radar : ClipboardCheck

  return (
    <View style={{ backgroundColor: '#153c40', borderRadius: 18, padding: 16, gap: 12, overflow: 'hidden' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Icon size={17} color={accent} strokeWidth={2.3} />
        <Text style={{ color: accent, fontSize: 12, fontWeight: '700', letterSpacing: 0.3 }}>지금 확인할 내용 · {focus.label}</Text>
      </View>
      <View style={{ gap: 10 }}>
        <Text style={{ color: '#ffffff', fontSize: 18, lineHeight: 26, fontWeight: '800', letterSpacing: -0.4 }}>{focus.title}</Text>
        <Text style={{ color: '#d0e1e2', fontSize: 14, lineHeight: 22 }}>{focus.description}</Text>
      </View>
      <Pressable
        onPress={() => onOpenSection(focus.target)}
        accessibilityRole="button"
        accessibilityLabel={focus.action}
        style={({ pressed }) => ({
          alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4,
          backgroundColor: pressed ? '#a1f0da' : accent, borderRadius: 12,
          paddingHorizontal: 14, paddingVertical: 12, minHeight: 44,
        })}
      >
        <Text style={{ color: '#153c40', fontSize: 13, fontWeight: '800' }}>{focus.action}</Text>
        <ChevronDown size={15} color="#153c40" strokeWidth={2.8} />
      </Pressable>
    </View>
  )
}

export function buildFocus({ sessions, positionsCount, alertCount, isPremarketWindow, hasBrief }: Omit<Props, 'onOpenSection'>): Focus {
  if (isPremarketWindow) {
    return {
      label: '장전', title: '개장 전, 달라진 재료를 확인하세요',
      description: '밤사이 시장 변화와 주요 뉴스를 살펴보세요. 개장 방향은 실제 시세로 다시 확인해야 합니다.',
      action: '야간 방향성 보기', target: 'premarket', tone: 'premarket',
    }
  }

  if (sessions.some((session) => session.phase === 'REGULAR')) {
    if (positionsCount > 0) {
      return {
        label: '장중', title: '내 종목의 변화를 먼저 확인하세요',
        description: `보유 ${positionsCount}종목의 목표가·손절가 도달 여부를 점검해 주세요.${alertCount ? ` 관심종목 신호도 ${alertCount}건 있습니다.` : ''}`,
        action: '보유 종목 모니터 보기', target: 'portfolio', tone: 'regular',
      }
    }
    if (alertCount > 0) {
      return {
        label: '장중', title: '관심종목에 새로운 신호가 있습니다',
        description: `확인할 신호는 ${alertCount}건입니다. 신호만으로 매매를 결정하지 말고 종목의 최근 상황을 함께 살펴보세요.`,
        action: '관심종목 시그널 보기', target: 'watch', tone: 'regular',
      }
    }
    return {
      label: '장중', title: '시장 분위기부터 살펴보세요',
      description: '지금 시장의 위험도와 주요 뉴스를 차례로 확인할 수 있습니다.',
      action: '시장 분위기 보기', target: 'mood', tone: 'regular',
    }
  }

  if (hasBrief) {
    return {
      label: sessions.some((s) => s.phase === 'PRE_MARKET') ? '장전' : '장외', title: '브리프로 시장 흐름을 살펴보세요',
      description: '핵심 내용을 먼저 읽고, 궁금한 판단 근거만 펼쳐보세요. 브리프의 발행 시각도 함께 확인해 주세요.',
      action: '오늘 브리프 보기', target: 'brief', tone: 'closed',
    }
  }

  return {
    label: sessions.length ? '장외' : '상태 확인 중', title: '다음 장을 차분하게 준비하세요',
    description: positionsCount > 0 ? '보유종목의 손익과 미리 정한 대응 기준을 점검해 주세요.' : '새 브리프를 기다리는 동안 시장 분위기와 주요 뉴스를 확인해 주세요.',
    action: positionsCount > 0 ? '보유 종목 모니터 보기' : '시장 분위기 보기',
    target: positionsCount > 0 ? 'portfolio' : 'mood', tone: 'closed',
  }
}
