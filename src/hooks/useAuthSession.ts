import { useCallback, useEffect, useState } from 'react'
import {
  type AuthUser,
  apiMe,
  clearAuth,
  loadStoredAuth,
  saveAuth,
  setMemoryToken,
} from '../api/auth'
import { registerPushToken } from '../api/pushDevice'
import { hapticLight } from '../utils/haptics'

/**
 * 인증 세션 상태 + 라이프사이클을 한 곳으로.
 *
 * - 부팅 시 1회: AsyncStorage 의 토큰 로드 → /me 검증 → 만료면 정리
 * - login: setMemoryToken + saveAuth + push token 등록
 * - logout: haptic + clearAuth + 메모리 토큰 정리
 *
 * `authChecked` 가 true 가 되어야 AppShell 이 게이팅 분기 가능.
 */
export function useAuthSession() {
  const [authChecked, setAuthChecked] = useState(false)
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    void (async () => {
      const stored = await loadStoredAuth()
      if (stored) {
        setMemoryToken(stored.token)
        // 토큰 유효성 검증 (서버 me 호출). 만료면 정리.
        try {
          const fresh = await apiMe(stored.token)
          setUser({ ...fresh, token: stored.token })
          await saveAuth({ ...fresh, token: stored.token })
          void registerPushToken(stored.token)
        } catch {
          await clearAuth()
          setMemoryToken(null)
          setUser(null)
        }
      }
      setAuthChecked(true)
    })()
  }, [])

  const handleAuthDone = useCallback(async (u: AuthUser) => {
    setMemoryToken(u.token)
    await saveAuth(u)
    setUser(u)
    void registerPushToken(u.token)
  }, [])

  const handleLogout = useCallback(async () => {
    void hapticLight()
    await clearAuth()
    setMemoryToken(null)
    setUser(null)
  }, [])

  return { authChecked, user, handleAuthDone, handleLogout }
}
