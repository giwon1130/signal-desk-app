import { Platform } from 'react-native'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import { API_BASE_URL } from '../api'

/**
 * Expo 푸시 토큰을 발급받고 서버에 등록한다.
 *
 * - 시뮬레이터에서는 토큰 발급이 불가 → 조용히 skip
 * - 권한 거부 시 조용히 skip (앱 실사용 흐름은 막지 않음)
 * - 서버 401/에러는 앱 구동에 영향 없도록 swallow
 */
export async function registerPushToken(authToken: string): Promise<string | null> {
  if (!Device.isDevice) return null

  const existing = await Notifications.getPermissionsAsync()
  let status = existing.status
  if (status !== 'granted') {
    const req = await Notifications.requestPermissionsAsync()
    status = req.status
  }
  if (status !== 'granted') return null

  const { data: expoToken } = await Notifications.getExpoPushTokenAsync().catch(() => ({ data: '' as string }))
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
