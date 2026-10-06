import { useEffect } from 'react'
import { AppState, Platform } from 'react-native'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { API_BASE_URL } from '../api/config'
import { marketReminderSchedule, type TradingCalendar } from '../utils/marketReminderSchedule'

const KR_ENABLED_KEY = 'reminder.krOpen.enabled'
const US_ENABLED_KEY = 'reminder.usOpen.enabled'
const MINUTES_BEFORE_KEY = 'reminder.minutesBefore'
const CALENDAR_KEY = 'reminder.tradingCalendar.v1'
const PREFIXES = ['reminder.krOpen', 'reminder.usOpen']
let scheduling: Promise<void> = Promise.resolve()

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false,
      shouldShowBanner: true, shouldShowList: true,
    }),
  })
}

export async function getKrOpenEnabled() { return (await AsyncStorage.getItem(KR_ENABLED_KEY)) !== 'false' }
export async function getUsOpenEnabled() { return (await AsyncStorage.getItem(US_ENABLED_KEY)) !== 'false' }
export async function setKrOpenEnabled(enabled: boolean) {
  await AsyncStorage.setItem(KR_ENABLED_KEY, String(enabled)); await rescheduleAll()
}
export async function setUsOpenEnabled(enabled: boolean) {
  await AsyncStorage.setItem(US_ENABLED_KEY, String(enabled)); await rescheduleAll()
}
export async function getMinutesBefore() {
  const value = Number(await AsyncStorage.getItem(MINUTES_BEFORE_KEY))
  return [5, 10, 15, 30, 60].includes(value) ? value : 10
}
export async function setMinutesBefore(minutes: number) {
  await AsyncStorage.setItem(MINUTES_BEFORE_KEY, String(minutes)); await rescheduleAll()
}

export async function ensurePermission(): Promise<boolean> {
  if (Platform.OS === 'web' || !Device.isDevice) return false
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('market-open', {
      name: '장 시작 알림', importance: Notifications.AndroidImportance.HIGH, sound: 'default',
    })
  }
  if ((await Notifications.getPermissionsAsync()).status === 'granted') return true
  return (await Notifications.requestPermissionsAsync()).status === 'granted'
}

async function cancelPrefix(prefix: string) {
  if (Platform.OS === 'web') return
  const all = await Notifications.getAllScheduledNotificationsAsync()
  await Promise.all(all.filter((n) => n.identifier === prefix || n.identifier.startsWith(prefix + '.'))
    .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)))
}
export async function cancelKrOpenReminder() { await cancelPrefix(PREFIXES[0]) }
export async function cancelUsOpenReminder() { await cancelPrefix(PREFIXES[1]) }
export async function scheduleKrOpenReminder() { await rescheduleAll() }
export async function scheduleUsOpenReminder() { await rescheduleAll() }

async function loadCalendar(): Promise<TradingCalendar | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)
  try {
    const response = await fetch(API_BASE_URL + '/api/v1/market/trading-calendar', { signal: controller.signal })
    if (!response.ok) throw new Error('calendar unavailable')
    const body = await response.json()
    if (!body.success || !Array.isArray(body.data?.sessions) || !body.data?.coverageThrough) throw new Error('invalid calendar')
    await AsyncStorage.setItem(CALENDAR_KEY, JSON.stringify(body.data))
    return body.data
  } catch {
    try { return JSON.parse((await AsyncStorage.getItem(CALENDAR_KEY)) || 'null') } catch { return null }
  } finally { clearTimeout(timer) }
}

async function reschedule() {
  if (Platform.OS === 'web') return
  // Remove legacy weekday repeats even when permission/calendar is unavailable.
  await Promise.all(PREFIXES.map(cancelPrefix))
  const [KR, US, minutes] = await Promise.all([getKrOpenEnabled(), getUsOpenEnabled(), getMinutesBefore()])
  if ((!KR && !US) || !(await ensurePermission())) return
  const calendar = await loadCalendar()
  if (!calendar) return // Never invent weekday schedules while offline.
  for (const item of marketReminderSchedule(calendar, { KR, US }, minutes)) {
    const name = item.market === 'KR' ? '한국장' : '미국장'
    await Notifications.scheduleNotificationAsync({
      identifier: item.id,
      content: {
        title: name + ' 시작 안내',
        body: `${name} 정규장이 ${item.minutesBefore}분 뒤 시작됩니다. 주요 일정과 관심종목을 확인해 주세요.${item.earlyClose ? ' 오늘은 조기 종료일입니다.' : ''}`,
        sound: 'default',
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(item.at),
        ...(Platform.OS === 'android' ? { channelId: 'market-open' } : {}) },
    })
  }
}

/** Serialize toggle/bootstrap updates so obsolete schedules cannot survive a newer setting. */
export function rescheduleAll() {
  scheduling = scheduling.catch(() => {}).then(reschedule)
  return scheduling
}

/** Refresh the next 28 days on launch and foreground; no indefinite weekday repeats. */
export function useMarketReminderBootstrap(enabled: boolean) {
  useEffect(() => {
    if (!enabled || Platform.OS === 'web') return
    const refresh = () => { void rescheduleAll().catch(() => {}) }
    refresh()
    const listener = AppState.addEventListener('change', (state) => { if (state === 'active') refresh() })
    return () => listener.remove()
  }, [enabled])
}
