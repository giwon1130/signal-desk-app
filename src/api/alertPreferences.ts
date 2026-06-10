import { API_BASE_URL } from '../api'

export type MarketPreference = 'KR' | 'US' | 'BOTH'

export type AlertPreferences = {
  krEnabled: boolean
  usEnabled: boolean
  premarketEnabled: boolean
  compositeRiskEnabled: boolean
  marketPreference: MarketPreference
  eveningBriefEnabled: boolean
  middayBriefEnabled: boolean
  closeBriefEnabled: boolean
  /** 거래량 급증 알림 전역 토글 (종목별 설정과 별개, 켜면 전 종목 적용) */
  volumeAlertEnabled: boolean
  /** 방해금지: 켜면 야간 시간대 푸시 보류 */
  quietHoursEnabled: boolean
  quietStartHour: number   // 0~23 (KST)
  quietEndHour: number     // 0~23 (KST)
}

export const DEFAULT_ALERT_PREFERENCES: AlertPreferences = {
  krEnabled: true,
  usEnabled: false,
  premarketEnabled: true,
  compositeRiskEnabled: true,
  marketPreference: 'BOTH',
  eveningBriefEnabled: false,
  middayBriefEnabled: false,
  closeBriefEnabled: true,
  volumeAlertEnabled: true,
  quietHoursEnabled: false,
  quietStartHour: 22,
  quietEndHour: 7,
}

export async function getAlertPreferences(authToken: string): Promise<AlertPreferences> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/me/alert-preferences`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    })
    if (!res.ok) return DEFAULT_ALERT_PREFERENCES
    return (await res.json()) as AlertPreferences
  } catch {
    return DEFAULT_ALERT_PREFERENCES
  }
}

export async function updateAlertPreferences(
  authToken: string,
  prefs: AlertPreferences,
): Promise<AlertPreferences> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/me/alert-preferences`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(prefs),
    })
    if (!res.ok) return prefs
    return (await res.json()) as AlertPreferences
  } catch {
    return prefs
  }
}
