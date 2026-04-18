import AsyncStorage from '@react-native-async-storage/async-storage'
import { API_BASE_URL } from '../api'

const TOKEN_KEY = 'signal:authToken'
const USER_KEY  = 'signal:authUser'

export type AuthUser = {
  token:    string
  userId:   string
  email:    string
  nickname: string
}

// ─── Storage ─────────────────────────────────────────────────────────────────

export async function loadStoredAuth(): Promise<AuthUser | null> {
  const [token, raw] = await Promise.all([
    AsyncStorage.getItem(TOKEN_KEY),
    AsyncStorage.getItem(USER_KEY),
  ])
  if (!token || !raw) return null
  try { return { ...JSON.parse(raw), token } as AuthUser } catch { return null }
}

export async function saveAuth(user: AuthUser): Promise<void> {
  await Promise.all([
    AsyncStorage.setItem(TOKEN_KEY, user.token),
    AsyncStorage.setItem(USER_KEY,  JSON.stringify(user)),
  ])
}

export async function clearAuth(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(TOKEN_KEY),
    AsyncStorage.removeItem(USER_KEY),
  ])
}

// 메모리 캐시 (api.ts 헤더 주입용)
let memoryToken: string | null = null
export function setMemoryToken(t: string | null) { memoryToken = t }
export function getMemoryToken(): string | null { return memoryToken }

// ─── HTTP ────────────────────────────────────────────────────────────────────

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = (json as { error?: string }).error ?? '요청에 실패했어요.'
    throw new Error(msg)
  }
  return json as T
}

export const apiSignup = (email: string, password: string, nickname: string) =>
  postJson<AuthUser>('/auth/signup', { email, password, nickname })

export const apiLogin = (email: string, password: string) =>
  postJson<AuthUser>('/auth/login', { email, password })

export const apiGoogleOAuth = (idToken: string) =>
  postJson<AuthUser>('/auth/oauth/google', { idToken })

export const apiKakaoOAuth = (accessToken: string) =>
  postJson<AuthUser>('/auth/oauth/kakao', { accessToken })

export async function apiMe(token: string): Promise<AuthUser> {
  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('토큰이 만료됐어요.')
  return await res.json() as AuthUser
}
