import { Pressable, Text } from 'react-native'
import { Plus, X } from 'lucide-react-native'
import { useStyles } from '../../styles'
import { useTheme } from '../../theme'

type Props = {
  hasWatch: boolean
  toggling: boolean
  onToggle: () => void
}

export function WatchToggle({ hasWatch, toggling, onToggle }: Props) {
  const styles = useStyles()
  const { palette } = useTheme()
  return (
    <Pressable
      onPress={onToggle}
      disabled={toggling}
      style={[
        styles.quickAddPill,
        hasWatch && styles.quickAddPillActive,
        { alignSelf: 'stretch', justifyContent: 'center', paddingVertical: 12, marginTop: 12 },
      ]}
    >
      {hasWatch ? (
        <>
          <X size={14} color={palette.teal} strokeWidth={3} />
          <Text style={[styles.quickAddPillTextActive, { fontSize: 13 }]}>
            관심종목에서 해제
          </Text>
        </>
      ) : (
        <>
          <Plus size={14} color="#ffffff" strokeWidth={3} />
          <Text style={[styles.quickAddPillText, { fontSize: 13 }]}>관심종목에 담기</Text>
        </>
      )}
    </Pressable>
  )
}
