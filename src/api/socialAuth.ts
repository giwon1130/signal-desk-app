import Constants from 'expo-constants'
import { useEffect, useState } from 'react'
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin'
import { apiGoogleOAuth, type AuthUser } from './auth'

type Extra = {
  googleClientIdIos?:     string
  googleClientIdAndroid?: string
  googleClientIdWeb?:     string
}
const extra = ((Constants.expoConfig?.extra ?? {}) as Extra)

let configured = false
function ensureConfigured() {
  if (configured) return
  // webClientId 가 backend(서버) idToken 검증의 audience 가 되므로 반드시 필요.
  // iosClientId 는 네이티브 SDK 가 자체적으로 Info.plist 에 등록된 reversed scheme 으로 처리.
  if (!extra.googleClientIdWeb) {
    throw new Error('Google webClientId 가 app.json extra.googleClientIdWeb 에 설정돼 있지 않아.')
  }
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
    try {
      ensureConfigured()
      setRequest(true)
    } catch {
      setRequest(false)
    }
  }, [])

  const signIn = async () => {
    ensureConfigured()
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
