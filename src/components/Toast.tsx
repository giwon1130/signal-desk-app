import { useEffect, useRef } from 'react'
import { Animated, Pressable, Text, View } from 'react-native'
import { useTheme } from '../theme'

export type ToastType = 'success' | 'error' | 'info'

type Props = {
  message: string
  type?: ToastType
  visible: boolean
  action?: { label: string; onPress: () => void } | null
}

export function Toast({ message, type = 'success', visible, action }: Props) {
  const { palette } = useTheme()
  const opacity    = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(16)).current

  const BG     = { success: palette.toastSuccessBg, error: palette.toastErrorBg, info: palette.toastInfoBg }[type]
  const BORDER = { success: palette.green,           error: palette.red,           info: palette.border       }[type]
  const COLOR  = { success: palette.green,           error: palette.red,           info: palette.inkSub       }[type]

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity,    { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0,               useNativeDriver: true }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(opacity,    { toValue: 0,  duration: 180, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 16, duration: 180, useNativeDriver: true }),
      ]).start()
    }
  }, [visible])

  return (
    <Animated.View style={{
      position: 'absolute', bottom: 24, left: 20, right: 20, zIndex: 999,
      backgroundColor: BG, borderRadius: 14, padding: 14,
      borderWidth: 1.5, borderColor: BORDER,
      opacity, transform: [{ translateY }],
    }}>
      <Text style={{ color: COLOR, fontSize: 14, fontWeight: '700', textAlign: 'center' }}>
        {message}
      </Text>
      {action ? (
        <View style={{ alignItems: 'center', marginTop: 8 }}>
          <Pressable
            onPress={action.onPress}
            style={({ pressed }) => ({ backgroundColor: COLOR, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7, opacity: pressed ? 0.7 : 1 })}
          >
            <Text style={{ color: palette.bg, fontSize: 12.5, fontWeight: '800' }}>{action.label}</Text>
          </Pressable>
        </View>
      ) : null}
    </Animated.View>
  )
}
