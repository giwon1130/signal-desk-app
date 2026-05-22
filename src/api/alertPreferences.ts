import { API_BASE_URL } from '../api'

export type AlertPreferences = {
  krEnabled: boolean
  usEnabled: boolean
  premarketEnabled: boolean
  compositeRiskEnabled: boolean
}

const DEFAULT: AlertPreferences = {
  krEnabled: true,
  usEnabled: false,
  premarketEnabled: true,
  compositeRiskEnabled: true,
}

export async function getAlertPreferences(authToken: string): Promise<AlertPreferences> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/me/alert-preferences`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    })
    if (!res.ok) return DEFAULT
    return (await res.json()) as AlertPreferences
  } catch {
    return DEFAULT
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
