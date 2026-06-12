/**
 * 빈 상태 가이드 — 데이터가 없을 때(리그 0개, 미구독 등) 그 자리에 "이게 뭐고 어떻게
 * 시작하는지"를 크게 보여준다. 데이터가 생기면 호출부에서 미렌더 → 가이드가 저절로 사라짐.
 * 가르침이 필요한 순간에만 나타나는 자가소멸 온보딩.
 */
import { Pressable, Text, View } from 'react-native'
import { useTheme } from '../../theme'

export type GuideStep = { n: number; text: string }
export type GuideAction = { label: string; onPress: () => void; primary?: boolean }

type Props = {
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>
  accent: string
  title: string
  description: string
  steps?: GuideStep[]
  actions?: GuideAction[]
}

export function EmptyGuide({ icon: Icon, accent, title, description, steps, actions }: Props) {
  const { palette } = useTheme()
  return (
    <View style={{
      alignItems: 'center', gap: 12, paddingVertical: 28, paddingHorizontal: 18,
      backgroundColor: palette.surface, borderRadius: 16, borderWidth: 1, borderColor: palette.border,
    }}>
      <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: accent + '1c', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={26} color={accent} strokeWidth={2.2} />
      </View>
      <Text style={{ color: palette.ink, fontSize: 16, fontWeight: '900', textAlign: 'center' }}>{title}</Text>
      <Text style={{ color: palette.inkMuted, fontSize: 12.5, lineHeight: 19, textAlign: 'center', maxWidth: 320 }}>{description}</Text>

      {steps && steps.length > 0 ? (
        <View style={{ gap: 8, alignSelf: 'stretch', maxWidth: 360, marginTop: 2 }}>
          {steps.map((s) => (
            <View key={s.n} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
              <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: accent + '22', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                <Text style={{ color: accent, fontSize: 11, fontWeight: '900' }}>{s.n}</Text>
              </View>
              <Text style={{ color: palette.inkSub, fontSize: 12.5, lineHeight: 18, flex: 1 }}>{s.text}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {actions && actions.length > 0 ? (
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
          {actions.map((a) => (
            <Pressable
              key={a.label}
              onPress={a.onPress}
              style={({ pressed }) => ({
                paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999,
                backgroundColor: a.primary ? accent : 'transparent',
                borderWidth: a.primary ? 0 : 1, borderColor: palette.border,
                opacity: pressed ? 0.75 : 1,
              })}
            >
              <Text style={{ color: a.primary ? '#fff' : palette.inkSub, fontSize: 13, fontWeight: '800' }}>{a.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  )
}
