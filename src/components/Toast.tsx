import { useEffect, useRef } from 'react'
import { Animated, Text } from 'react-native'
import { useTheme } from '../theme'

export type ToastType = 'success' | 'error' | 'info'

type Props = {
  message: string
  type?: ToastType
  visible: boolean
}

export function Toast({ message, type = 'success', visible }: Props) {
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
    </Animated.View>
  )
}
