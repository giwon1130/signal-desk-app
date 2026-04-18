import * as AuthSession from 'expo-auth-session'
import * as Google from 'expo-auth-session/providers/google'
import * as WebBrowser from 'expo-web-browser'
import Constants from 'expo-constants'
import { apiGoogleOAuth, apiKakaoOAuth, type AuthUser } from './auth'

WebBrowser.maybeCompleteAuthSession()

type Extra = {
  googleClientIdIos?:     string
  googleClientIdAndroid?: string
  googleClientIdWeb?:     string
  kakaoRestApiKey?:       string
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

// ─── Kakao (REST API + WebBrowser) ──────────────────────────────────────────
//
// 카카오는 expo-auth-session 의 표준 provider 가 없어서 직접 authorize URL 을
// 열고 redirect 를 받아 access_token 을 교환한다.

export async function signInWithKakao(onAuth: (u: AuthUser) => void) {
  const restKey = extra.kakaoRestApiKey
  if (!restKey) throw new Error('Kakao REST API Key 가 app.json extra 에 설정돼 있지 않아요.')

  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'signaldesk', path: 'oauth/kakao' })
  const authorizeUrl =
    `https://kauth.kakao.com/oauth/authorize` +
    `?client_id=${encodeURIComponent(restKey)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code`

  const result = await WebBrowser.openAuthSessionAsync(authorizeUrl, redirectUri)
  if (result.type !== 'success' || !result.url) throw new Error('Kakao 로그인이 취소됐어요.')

  const code = new URL(result.url).searchParams.get('code')
  if (!code) throw new Error('Kakao authorization code 를 받지 못했어요.')

  // code → access_token 교환
  const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:   'authorization_code',
      client_id:    restKey,
      redirect_uri: redirectUri,
      code,
    }).toString(),
  })
  const tokenJson = await tokenRes.json() as { access_token?: string; error?: string }
  if (!tokenJson.access_token) throw new Error(tokenJson.error ?? 'Kakao access_token 교환 실패')

  const user = await apiKakaoOAuth(tokenJson.access_token)
  onAuth(user)
}
