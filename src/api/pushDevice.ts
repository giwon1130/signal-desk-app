import { Platform } from 'react-native'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { API_BASE_URL } from '../api'
import type { AlertHistoryItem, ApiResponse } from '../types'

const PUSH_ENABLED_KEY = 'push.alerts.enabled'

export async function getPushAlertsEnabled(): Promise<boolean> {
  const v = await AsyncStorage.getItem(PUSH_ENABLED_KEY)
  return v !== 'false' // 기본 ON
}

async function setPushAlertsEnabledFlag(enabled: boolean) {
  await AsyncStorage.setItem(PUSH_ENABLED_KEY, String(enabled))
}

async function resolveExpoToken(): Promise<string | null> {
  // 웹에는 expo-notifications 네이티브 바인딩이 없음 → 토큰 자체 없음
  if (Platform.OS === 'web') return null
  if (!Device.isDevice) return null
  const existing = await Notifications.getPermissionsAsync()
  let status = existing.status
  if (status !== 'granted') {
    const req = await Notifications.requestPermissionsAsync()
    status = req.status
  }
  if (status !== 'granted') return null
  const { data } = await Notifications.getExpoPushTokenAsync().catch(() => ({ data: '' as string }))
  return data || null
}

/**
 * Expo 푸시 토큰을 발급받고 서버에 등록한다.
 *
 * - 사용자가 알림을 꺼뒀으면 skip
 * - 시뮬레이터/권한거부 시 조용히 skip
 * - 서버 401/에러는 앱 구동에 영향 없도록 swallow
 */
export async function registerPushToken(authToken: string): Promise<string | null> {
  if (!(await getPushAlertsEnabled())) return null
  const expoToken = await resolveExpoToken()
  if (!expoToken) return null

  try {
    await fetch(`${API_BASE_URL}/api/v1/push/devices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        platform: Platform.OS,
        expoToken,
      }),
    })
  } catch {
    // 서버 등록 실패해도 앱 구동은 영향 없음
  }
  return expoToken
}

export async function unregisterPushToken(authToken: string): Promise<void> {
  const expoToken = await resolveExpoToken()
  if (!expoToken) return
  try {
    await fetch(`${API_BASE_URL}/api/v1/push/devices/${encodeURIComponent(expoToken)}`, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    })
  } catch {
    // 실패해도 앱 구동은 영향 없음
  }
}

export async function setPushAlertsEnabled(authToken: string, enabled: boolean): Promise<void> {
  await setPushAlertsEnabledFlag(enabled)
  if (enabled) await registerPushToken(authToken)
  else await unregisterPushToken(authToken)
}

export async function fetchAlertHistory(authToken: string, limit = 30): Promise<AlertHistoryItem[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/push/alerts?limit=${limit}`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    })
    const json = (await res.json()) as ApiResponse<AlertHistoryItem[]>
    return json.success ? json.data ?? [] : []
  } catch {
    return []
  }
}
