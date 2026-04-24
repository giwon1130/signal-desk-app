import Constants from 'expo-constants'
import { useEffect, useState } from 'react'
import { Platform } from 'react-native'
import { apiGoogleOAuth, type AuthUser } from './auth'

type Extra = {
  googleClientIdIos?:     string
  googleClientIdAndroid?: string
  googleClientIdWeb?:     string
}
const extra = ((Constants.expoConfig?.extra ?? {}) as Extra)

// @react-native-google-signin/google-signin 은 네이티브 전용.
// 웹 번들에서 top-level import 하면 TurboModuleRegistry 에러로 트리 전체가 죽음.
// 런타임에 필요할 때만 require 로 끌어온다.
type GoogleSigninModule = typeof import('@react-native-google-signin/google-signin')
let googleModule: GoogleSigninModule | null = null
function loadGoogleModule(): GoogleSigninModule {
  if (googleModule) return googleModule
  if (Platform.OS === 'web') {
    throw new Error('Google 로그인은 웹에서 아직 지원하지 않아.')
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  googleModule = require('@react-native-google-signin/google-signin') as GoogleSigninModule
  return googleModule
}

let configured = false
function ensureConfigured() {
  if (configured) return
  // webClientId 가 backend(서버) idToken 검증의 audience 가 되므로 반드시 필요.
  // iosClientId 는 네이티브 SDK 가 자체적으로 Info.plist 에 등록된 reversed scheme 으로 처리.
  if (!extra.googleClientIdWeb) {
    throw new Error('Google webClientId 가 app.json extra.googleClientIdWeb 에 설정돼 있지 않아.')
  }
  const { GoogleSignin } = loadGoogleModule()
  GoogleSignin.configure({
    webClientId: extra.googleClientIdWeb,
    iosClientId: extra.googleClientIdIos,
    offlineAccess: false,
  })
  configured = true
}

// 컴포넌트 호환을 위해 [request, signIn] 페어를 돌려준다.
// request 는 항상 truthy (네이티브 SDK 는 prepare 단계가 없음).
export function useGoogleSignIn(onAuth: (u: AuthUser) => void) {
  const [request, setRequest] = useState<boolean>(false)

  useEffect(() => {
    // 웹은 네이티브 SDK 가 없어 버튼 disabled 로 유지.
    if (Platform.OS === 'web') {
      setRequest(false)
      return
    }
    try {
      ensureConfigured()
      setRequest(true)
    } catch {
      setRequest(false)
    }
  }, [])

  const signIn = async () => {
    ensureConfigured()
    const { GoogleSignin, statusCodes } = loadGoogleModule()
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true })
      const result = await GoogleSignin.signIn()
      // v13+ 에서는 { type: 'success', data: { idToken, ... } } 구조
      const data = (result as { data?: { idToken?: string } }).data ?? (result as unknown as { idToken?: string })
      const idToken = data?.idToken
      if (!idToken) throw new Error('Google id_token 을 받지 못했어.')
      const user = await apiGoogleOAuth(idToken)
      onAuth(user)
    } catch (e) {
      const code = (e as { code?: string }).code
      if (code === statusCodes.SIGN_IN_CANCELLED) throw new Error('로그인을 취소했어.')
      if (code === statusCodes.IN_PROGRESS) throw new Error('이미 로그인 진행 중이야.')
      if (code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) throw new Error('Google Play 서비스를 사용할 수 없어.')
      throw e
    }
  }

  return [request, signIn] as const
}
