/**
 * 탭 상단 인트로 — 모든 탭 공통.
 * 기본은 컴팩트 타이틀(아이콘 + 이름 + 한 줄). 신규 사용자는 처음 N번 펼쳐진 설명을
 * 보고, 닫거나 N회 노출 후엔 컴팩트로 고정. (?) 아이콘으로 언제든 다시 펼침.
 *
 * "항상 큰 히어로"의 공간 낭비 없이, 처음엔 가르치고 익숙해지면 비켜준다.
 */
import { useEffect, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { HelpCircle, X } from 'lucide-react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useTheme } from '../../theme'

type Props = {
  /** 탭 식별자 — 노출 횟수 저장 키. */
  tabKey: string
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>
  title: string
  /** 한 줄 요약 — 컴팩트 상태에서도 항상 보임. */
  tagline: string
  /** 펼침 설명 — 이 탭이 뭐고 어떻게 쓰는지. */
  description: string
  accent: string
  /** 처음 몇 번까지 자동 펼침 (기본 2). */
  autoExpandTimes?: number
}

export function TabIntro({ tabKey, icon: Icon, title, tagline, description, accent, autoExpandTimes = 2 }: Props) {
  const { palette } = useTheme()
  const [expanded, setExpanded] = useState(false)
  const storeKey = `signal:tabintro:${tabKey}`

  // 노출 횟수 기반 자동 펼침 — 처음 autoExpandTimes 회는 펼친 채로 보여주고, 그 뒤엔 접힘.
  useEffect(() => {
    let alive = true
    AsyncStorage.getItem(storeKey).then((v) => {
      const seen = v ? parseInt(v, 10) || 0 : 0
      if (!alive) return
      if (seen < autoExpandTimes) {
        setExpanded(true)
        void AsyncStorage.setItem(storeKey, String(seen + 1)).catch(() => {})
      }
    }).catch(() => {})
    return () => { alive = false }
  }, [storeKey, autoExpandTimes])

  return (
    <View style={{
      backgroundColor: expanded ? palette.surface : 'transparent',
      borderWidth: expanded ? 1 : 0, borderColor: palette.borderLight,
      borderRadius: 16, paddingHorizontal: expanded ? 14 : 2, paddingVertical: expanded ? 13 : 2,
      gap: expanded ? 10 : 0,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: accent + '18', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={17} color={accent} strokeWidth={2.5} />
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
          <Text style={{ color: palette.ink, fontSize: 18, fontWeight: '900', letterSpacing: -0.4 }}>{title}</Text>
          <Text style={{ color: palette.inkMuted, fontSize: 11.5 }} numberOfLines={1}>{tagline}</Text>
        </View>
        {expanded ? (
          <Pressable onPress={() => setExpanded(false)} hitSlop={8} accessibilityLabel="설명 접기">
            <X size={16} color={palette.inkMuted} strokeWidth={2.4} />
          </Pressable>
        ) : (
          <Pressable onPress={() => setExpanded(true)} hitSlop={8} accessibilityLabel="이 탭 설명 보기">
            <HelpCircle size={15} color={palette.inkFaint} strokeWidth={2.2} />
          </Pressable>
        )}
      </View>
      {expanded ? (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ width: 2, borderRadius: 2, backgroundColor: accent, opacity: 0.75 }} />
          <Text style={{ flex: 1, color: palette.inkSub, fontSize: 12.5, lineHeight: 19 }}>{description}</Text>
        </View>
      ) : null}
    </View>
  )
}
