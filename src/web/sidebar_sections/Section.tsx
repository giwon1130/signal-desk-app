import { Pressable, Text, View } from 'react-native'
import { ArrowRight } from 'lucide-react-native'
import type { Palette } from '../../theme'

export type SectionProps = {
  icon: React.ReactNode
  title: string
  meta?: string
  onMore?: () => void
  onMoreLabel?: string
  palette: Palette
  children: React.ReactNode
}

export function Section({ icon, title, meta, onMore, onMoreLabel, palette, children }: SectionProps) {
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 2 }}>
        {icon}
        <Text style={{ color: palette.ink, fontSize: 12, fontWeight: '800' }}>{title}</Text>
        {meta ? (
          <Text style={{ color: palette.inkFaint, fontSize: 11, fontWeight: '700' }}>{meta}</Text>
        ) : null}
        <View style={{ flex: 1 }} />
        {onMore ? (
          <Pressable
            onPress={onMore}
            style={(state) => {
              const hovered = (state as { hovered?: boolean }).hovered
              return [{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 3,
                paddingVertical: 2,
                paddingHorizontal: 4,
                borderRadius: 5,
                backgroundColor: hovered ? palette.blueSoft : 'transparent',
              }]
            }}
          >
            <Text style={{ color: palette.blue, fontSize: 10, fontWeight: '800' }}>
              {onMoreLabel ?? '더 보기'}
            </Text>
            <ArrowRight size={9} color={palette.blue} strokeWidth={3} />
          </Pressable>
        ) : null}
      </View>
      <View style={{ gap: 1 }}>{children}</View>
    </View>
  )
}

export function EmptyRow({ text, hint, palette }: { text: string; hint?: string; palette: Palette }) {
  return (
    <View style={{ paddingVertical: 10, alignItems: 'center', gap: 2 }}>
      <Text style={{ color: palette.inkFaint, fontSize: 11, fontWeight: '600' }}>{text}</Text>
      {hint ? <Text style={{ color: palette.inkFaint, fontSize: 10 }}>{hint}</Text> : null}
    </View>
  )
}
