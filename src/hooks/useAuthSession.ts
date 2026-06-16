import { useCallback, useEffect, useRef, useState } from 'react'
import { AppState } from 'react-native'
import {
  type AuthUser,
  apiDeleteAccount,
  apiMe,
  clearAuth,
  loadStoredAuth,
  saveAuth,
  setMemoryToken,
} from '../api/auth'
import { setUnauthorizedHandler } from '../api'
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

  /** 서버에서 최신 사용자(plan 등) 재조회 — PRO 승인/포그라운드 복귀 시 즉시 반영. 실패는 조용히 무시. */
  const refreshUser = useCallback(async () => {
    setUser((prev) => {
      if (!prev?.token) return prev
      void (async () => {
        try {
          const fresh = await apiMe(prev.token)
          const merged = { ...fresh, token: prev.token }
          setUser(merged)
          await saveAuth(merged)
        } catch { /* 만료면 authedFetch 의 401 핸들러가 로그아웃 처리 */ }
      })()
      return prev
    })
  }, [])

  // 401(토큰 만료/무효) → 강제 로그아웃 핸들러 등록.
  useEffect(() => {
    setUnauthorizedHandler(() => { void handleLogout() })
    return () => setUnauthorizedHandler(null)
  }, [handleLogout])

  // 앱이 포그라운드로 복귀하면 plan 등 사용자 정보 갱신(백그라운드 중 PRO 승인 반영). 60초 쓰로틀.
  const lastRefreshRef = useRef(0)
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return
      const now = Date.now()
      if (now - lastRefreshRef.current < 60_000) return
      lastRefreshRef.current = now
      void refreshUser()
    })
    return () => sub.remove()
  }, [refreshUser])

  /** 회원 탈퇴 — 서버 삭제 성공 후 로컬 세션 정리. 실패 시 throw (호출부에서 안내). */
  const handleDeleteAccount = useCallback(async () => {
    const token = user?.token
    if (!token) return
    await apiDeleteAccount(token)
    await clearAuth()
    setMemoryToken(null)
    setUser(null)
  }, [user?.token])

  return { authChecked, user, handleAuthDone, handleLogout, handleDeleteAccount, refreshUser }
}
