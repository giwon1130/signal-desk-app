import Constants from 'expo-constants'
import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Platform, Pressable, Text } from 'react-native'
import { apiGoogleOAuth, type AuthUser } from '../api/auth'
import { useGoogleSignIn } from '../api/socialAuth'
import { useTheme } from '../theme'

type Props = {
  loading: boolean
  onAuth: (user: AuthUser) => void
  onError?: (message: string) => void
}

type Extra = {
  googleClientIdWeb?: string
}
const extra = (Constants.expoConfig?.extra ?? {}) as Extra

type GsiWindow = Window & {
  google?: {
    accounts: {
      id: {
        initialize: (opts: {
          client_id: string
          callback: (resp: { credential?: string }) => void
          auto_select?: boolean
          use_fedcm_for_prompt?: boolean
        }) => void
        renderButton: (el: HTMLElement, opts: {
          theme?: 'outline' | 'filled_blue' | 'filled_black'
          size?: 'small' | 'medium' | 'large'
          text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
          shape?: 'rectangular' | 'pill'
          logo_alignment?: 'left' | 'center'
          width?: number
          locale?: string
        }) => void
      }
    }
  }
}

let gisScriptPromise: Promise<void> | null = null
function loadGisScript(): Promise<void> {
  if (gisScriptPromise) return gisScriptPromise
  if (typeof document === 'undefined') return Promise.resolve()
  gisScriptPromise = new Promise<void>((resolve, reject) => {
    const w = window as GsiWindow
    if (w.google?.accounts?.id) return resolve()
    const existing = document.querySelector<HTMLScriptElement>('script[data-gis-loader]')
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('GIS 스크립트 로드 실패')), { once: true })
      return
    }
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.async = true
    s.defer = true
    s.setAttribute('data-gis-loader', 'true')
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('GIS 스크립트 로드 실패'))
    document.head.appendChild(s)
  })
  return gisScriptPromise
}

/** 웹 전용 — GIS 가 그려주는 공식 버튼을 임베드해서 id_token 을 받는다. */
function GoogleWebButton({ loading, onAuth, onError }: Props) {
  const { palette } = useTheme()
  const hostRef = useRef<HTMLDivElement | null>(null)
  const [ready, setReady] = useState(false)

  // ⚠️ 부모(AuthScreen)에서 onAuth/onError 는 매 렌더마다 새 함수로 만들어져 내려온다.
  //   예전엔 이 함수들을 useEffect deps 에 그대로 넣어놔서, 사용자가 이메일/비번을
  //   한 글자 칠 때마다 GIS 가 재-initialize + renderButton 을 반복 호출 → 같은 호스트에
  //   iframe 이 쌓이거나 상태가 꼬여 버튼이 먹통이 되던 "구글 로그인 고장" 의 원인.
  //   콜백은 ref 에 담아두고 init/렌더는 테마/클라이언트ID 변화에만 반응하도록 한다.
  const onAuthRef = useRef(onAuth)
  const onErrorRef = useRef(onError)
  useEffect(() => { onAuthRef.current = onAuth }, [onAuth])
  useEffect(() => { onErrorRef.current = onError }, [onError])

  useEffect(() => {
    const clientId = extra.googleClientIdWeb
    if (!clientId) {
      onErrorRef.current?.('Google webClientId 가 설정돼 있지 않아.')
      return
    }
    let disposed = false
    loadGisScript()
      .then(() => {
        if (disposed) return
        const w = window as GsiWindow
        const gid = w.google?.accounts?.id
        if (!gid || !hostRef.current) return
        gid.initialize({
          client_id: clientId,
          callback: async (resp) => {
            const credential = resp.credential
            if (!credential) {
              onErrorRef.current?.('Google 응답에 id_token 이 없어.')
              return
            }
            try {
              const user = await apiGoogleOAuth(credential)
              onAuthRef.current(user)
            } catch (e) {
              onErrorRef.current?.(e instanceof Error ? e.message : 'Google 로그인에 실패했어.')
            }
          },
          auto_select: false,
        })
        // renderButton 은 호스트를 덮어쓰지 않고 자식으로 iframe 을 "추가" 한다.
        // 테마 변경 등으로 재호출될 때 버튼이 쌓이지 않도록 명시적으로 비워준다.
        hostRef.current.innerHTML = ''
        gid.renderButton(hostRef.current, {
          theme: palette.scheme === 'dark' ? 'filled_black' : 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          locale: 'ko',
        })
        setReady(true)
      })
      .catch((e) => {
        onErrorRef.current?.(e instanceof Error ? e.message : 'Google Identity Services 로드 실패')
      })
    return () => { disposed = true }
  }, [palette.scheme])

  // RN 의 View 로 감싸면 GIS iframe 버튼의 너비/높이 계산이 이상해질 때가 있어서
  // 루트를 DOM div 로 직접 둠 (웹 전용 컴포넌트라 안전).
  return (
    <div
      style={{
        width: '100%',
        minHeight: 44,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: loading ? 0.5 : 1,
        position: 'relative',
      }}
    >
      <div ref={hostRef} />
      {!ready ? (
        <div
          style={{
            position: 'absolute',
            color: palette.inkFaint,
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          Google 로그인 준비 중…
        </div>
      ) : null}
    </div>
  )
}

/** 네이티브 전용 — 기존 Pressable 스타일 유지. */
function GoogleNativeButton({ loading, onAuth, onError }: Props) {
  const { palette } = useTheme()
  const [submitting, setSubmitting] = useState(false)
  const [request, signIn] = useGoogleSignIn(onAuth)

  const handle = async () => {
    if (loading || submitting || !request) return
    setSubmitting(true)
    try {
      await signIn()
    } catch (e) {
      onError?.(e instanceof Error ? e.message : 'Google 로그인에 실패했어.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Pressable
      onPress={() => void handle()}
      disabled={loading || submitting || !request}
      style={({ pressed }) => [
        {
          borderRadius: 11,
          backgroundColor: palette.scheme === 'dark' ? palette.surface : '#ffffff',
          borderColor: palette.border,
          borderWidth: 1,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 8,
          paddingVertical: 10,
          paddingHorizontal: 14,
          opacity: (loading || submitting || pressed) ? 0.75 : 1,
        },
      ]}
    >
      {submitting ? (
        <ActivityIndicator size="small" color={palette.inkSub} />
      ) : (
        <Text style={{ fontSize: 14, fontWeight: '900', color: '#4285F4' }}>G</Text>
      )}
      <Text style={{ color: palette.ink, fontSize: 13, fontWeight: '700' }}>
        Google 로 계속하기
      </Text>
    </Pressable>
  )
}

export function GoogleSignInButton(props: Props) {
  if (Platform.OS === 'web') return <GoogleWebButton {...props} />
  return <GoogleNativeButton {...props} />
}
