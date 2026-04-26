import { Platform, Pressable, Text, View } from 'react-native'
import { ChevronDown, ChevronUp } from 'lucide-react-native'
import type { Palette } from '../../theme'

export type SortKey = 'name' | 'market' | 'sector' | 'price' | 'changeRate' | 'profitRate' | 'evaluation'
export type SortDir = 'asc' | 'desc'

export function HeaderCell({
  label, width, flex, align, sortable, sortKey, currentKey, currentDir, onPress, palette,
}: {
  label: string
  width?: number
  flex?: number
  align?: 'left' | 'right'
  sortable?: boolean
  sortKey?: SortKey
  currentKey?: SortKey
  currentDir?: SortDir
  onPress?: (k: SortKey) => void
  palette: Palette
}) {
  const active = sortable && sortKey && sortKey === currentKey
  const content = (
    <View style={{
      flex, width,
      flexDirection: 'row', alignItems: 'center',
      justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
      gap: 3,
    }}>
      <Text style={{
        color: active ? palette.ink : palette.inkMuted,
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
      }}>
        {label}
      </Text>
      {sortable && sortKey ? (
        active
          ? (currentDir === 'asc'
              ? <ChevronUp size={10} color={palette.ink} strokeWidth={3} />
              : <ChevronDown size={10} color={palette.ink} strokeWidth={3} />)
          : <ChevronDown size={10} color={palette.inkFaint} strokeWidth={2.5} />
      ) : null}
    </View>
  )
  if (!sortable || !sortKey || !onPress) return content
  return (
    <Pressable
      onPress={() => onPress(sortKey)}
      style={(state) => {
        const hovered = (state as { hovered?: boolean }).hovered
        return [{
          flex, width,
          flexDirection: 'row', alignItems: 'center',
          justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
          gap: 3,
          paddingVertical: 2,
          borderRadius: 4,
          backgroundColor: hovered ? (Platform.OS === 'web' ? (palette.scheme === 'dark' ? '#243244' : '#e2e8f0') : 'transparent') : 'transparent',
        }]
      }}
    >
      <Text style={{
        color: active ? palette.ink : palette.inkMuted,
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
      }}>
        {label}
      </Text>
      {active
        ? (currentDir === 'asc'
            ? <ChevronUp size={10} color={palette.ink} strokeWidth={3} />
            : <ChevronDown size={10} color={palette.ink} strokeWidth={3} />)
        : <ChevronDown size={10} color={palette.inkFaint} strokeWidth={2.5} />}
    </Pressable>
  )
}
