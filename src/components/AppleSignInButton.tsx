import { Platform, View } from 'react-native'
import { appleSignIn } from '../api/socialAuth'
import type { AuthUser } from '../api/auth'

/**
 * Sign in with Apple 버튼 — iOS 전용(App Store 가이드라인 4.8: 타사 소셜 로그인 제공 시 필수).
 * expo-apple-authentication 은 네이티브 전용이라 iOS 가 아닐 땐 아무것도 렌더하지 않고
 * 모듈도 require 하지 않는다(웹/안드로이드 번들 안전).
 */
export function AppleSignInButton({
  loading,
  onAuth,
  onError,
}: {
  loading?: boolean
  onAuth: (u: AuthUser) => void
  onError: (message: string) => void
}) {
  if (Platform.OS !== 'ios') return null

  // iOS 에서만 도달 — 여기서만 네이티브 모듈 로드.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const AppleAuthentication = require('expo-apple-authentication') as typeof import('expo-apple-authentication')

  const handlePress = async () => {
    if (loading) return
    try {
      const user = await appleSignIn()
      onAuth(user)
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Apple 로그인에 실패했습니다.')
    }
  }

  return (
    <View style={{ opacity: loading ? 0.6 : 1 }}>
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE_OUTLINE}
        cornerRadius={10}
        style={{ width: '100%', height: 46 }}
        onPress={() => void handlePress()}
      />
    </View>
  )
}
