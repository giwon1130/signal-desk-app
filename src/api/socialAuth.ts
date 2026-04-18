import * as Google from 'expo-auth-session/providers/google'
import * as WebBrowser from 'expo-web-browser'
import Constants from 'expo-constants'
import { apiGoogleOAuth, type AuthUser } from './auth'

WebBrowser.maybeCompleteAuthSession()

type Extra = {
  googleClientIdIos?:     string
  googleClientIdAndroid?: string
  googleClientIdWeb?:     string
}
const extra = ((Constants.expoConfig?.extra ?? {}) as Extra)

// ─── Google ─────────────────────────────────────────────────────────────────
//
// 사용처에서 useGoogleSignIn() 훅을 호출하면 [request, signIn] 페어를 돌려준다.
//   const [request, signIn] = useGoogleSignIn(setUser)
//   <Pressable disabled={!request} onPress={signIn}>...</Pressable>

export function useGoogleSignIn(onAuth: (u: AuthUser) => void) {
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    iosClientId:     extra.googleClientIdIos,
    androidClientId: extra.googleClientIdAndroid,
    webClientId:     extra.googleClientIdWeb,
  })

  const signIn = async () => {
    if (!extra.googleClientIdIos && !extra.googleClientIdAndroid && !extra.googleClientIdWeb) {
      throw new Error('Google clientId 가 app.json extra 에 설정돼 있지 않아요.')
    }
    const result = await promptAsync()
    if (result.type !== 'success') throw new Error('Google 로그인이 취소됐어요.')
    const idToken = (result.params as { id_token?: string }).id_token
    if (!idToken) throw new Error('Google id_token 을 받지 못했어요.')
    const user = await apiGoogleOAuth(idToken)
    onAuth(user)
  }

  return [request, signIn] as const
}
