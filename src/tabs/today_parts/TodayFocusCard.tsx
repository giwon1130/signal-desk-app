import { Pressable, Text, View } from 'react-native'
import { ChevronDown, ClipboardCheck, Moon, Radar } from 'lucide-react-native'
import { useTheme } from '../../theme'
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
  const { palette } = useTheme()
  const focus = buildFocus({ sessions, positionsCount, alertCount, isPremarketWindow, hasBrief })
  const accent = focus.tone === 'premarket' ? (palette.purple ?? '#7c3aed') : focus.tone === 'regular' ? palette.brandAccent : palette.blue
  const Icon = focus.tone === 'premarket' ? Moon : focus.tone === 'regular' ? Radar : ClipboardCheck

  return (
    <View style={{ backgroundColor: palette.surface, borderRadius: 16, borderWidth: 1, borderColor: accent + '66', padding: 14, gap: 9 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Icon size={14} color={accent} strokeWidth={2.6} />
        <Text style={{ color: accent, fontSize: 11, fontWeight: '900', letterSpacing: 0.3 }}>지금 할 일 · {focus.label}</Text>
      </View>
      <View style={{ gap: 3 }}>
        <Text style={{ color: palette.ink, fontSize: 16, fontWeight: '900' }}>{focus.title}</Text>
        <Text style={{ color: palette.inkMuted, fontSize: 12, lineHeight: 18 }}>{focus.description}</Text>
      </View>
      <Pressable
        onPress={() => onOpenSection(focus.target)}
        accessibilityRole="button"
        accessibilityLabel={focus.action}
        style={({ pressed }) => ({
          alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4,
          backgroundColor: pressed ? accent + '16' : accent + '0d', borderRadius: 8,
          paddingHorizontal: 10, paddingVertical: 7,
        })}
      >
        <Text style={{ color: accent, fontSize: 12, fontWeight: '800' }}>{focus.action}</Text>
        <ChevronDown size={13} color={accent} strokeWidth={2.8} />
      </Pressable>
    </View>
  )
}

function buildFocus({ sessions, positionsCount, alertCount, isPremarketWindow, hasBrief }: Omit<Props, 'onOpenSection'>): Focus {
  if (isPremarketWindow) {
    return {
      label: '장전', title: '장전 재료부터 확인해',
      description: '야간 방향성과 핵심 뉴스를 본 뒤 개장 직후의 대응 기준을 정해봐.',
      action: '야간 방향성 보기', target: 'premarket', tone: 'premarket',
    }
  }

  if (sessions.some((session) => session.phase === 'REGULAR')) {
    if (positionsCount > 0) {
      return {
        label: '장중', title: '보유 종목 변동부터 확인해',
        description: `보유 ${positionsCount}개 중 손익 변동이 큰 종목을 먼저 점검해봐. 관심 시그널은 ${alertCount}건이야.`,
        action: '보유 종목 모니터 보기', target: 'portfolio', tone: 'regular',
      }
    }
    if (alertCount > 0) {
      return {
        label: '장중', title: '관심종목 시그널을 확인해',
        description: `지금 확인할 관심종목 시그널이 ${alertCount}건 있어. 근거를 보고 대응 여부를 정해봐.`,
        action: '관심종목 시그널 보기', target: 'watch', tone: 'regular',
      }
    }
    return {
      label: '장중', title: '시장 분위기부터 확인해',
      description: '급하게 진입하기보다 지금 시장의 위험도와 뉴스 흐름을 먼저 확인해봐.',
      action: '시장 분위기 보기', target: 'mood', tone: 'regular',
    }
  }

  if (hasBrief) {
    return {
      label: '마감 후', title: '오늘 흐름을 짧게 복기해',
      description: positionsCount > 0
        ? `보유 ${positionsCount}개의 손익과 마감 브리프를 함께 보고 다음 장 계획을 정해봐.`
        : '마감 브리프로 오늘 시장 재료를 정리하고 다음 장의 관찰 포인트를 골라봐.',
      action: '오늘 브리프 보기', target: 'brief', tone: 'closed',
    }
  }

  return {
    label: '마감 후', title: '다음 장을 위한 재료를 정리해',
    description: positionsCount > 0 ? '보유 종목의 손익과 대응 기준을 다시 확인해봐.' : '시장 분위기와 핵심 뉴스를 보고 다음 장을 준비해봐.',
    action: positionsCount > 0 ? '보유 종목 모니터 보기' : '시장 분위기 보기',
    target: positionsCount > 0 ? 'portfolio' : 'mood', tone: 'closed',
  }
}
