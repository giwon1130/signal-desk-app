import { useEffect } from 'react'
import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import AsyncStorage from '@react-native-async-storage/async-storage'

/**
 * 시장 시작 알림 — baby-log 패턴(로컬 알림)으로 구현.
 *
 * - 백엔드 푸시 인프라 없이 디바이스 자체에 매일 반복 예약.
 * - KR 정규장 09:00 KST, US 정규장 평균 KST 23:30 (서머타임은 평균값으로 단순화).
 * - 사용자가 설정한 "분 전"만큼 앞서 알림.
 */

// ── 설정 키 ─────────────────────────────────────────────
const KR_ENABLED_KEY      = 'reminder.krOpen.enabled'
const US_ENABLED_KEY      = 'reminder.usOpen.enabled'
const MINUTES_BEFORE_KEY  = 'reminder.minutesBefore'

// 알림 식별자 (덮어쓰기 위함)
const KR_OPEN_ID = 'reminder.krOpen'
const US_OPEN_ID = 'reminder.usOpen'

// 기본값
const DEFAULT_MINUTES_BEFORE = 10
const KR_OPEN_HOUR_KST = 9     // 09:00 KST
const KR_OPEN_MINUTE   = 0
const US_OPEN_HOUR_KST = 23    // 23:30 KST (EST/EDT 평균)
const US_OPEN_MINUTE   = 30

// 포그라운드에서도 알림이 보이도록 핸들러 설정 (모듈 로드 시 1회)
// 웹은 expo-notifications 네이티브 바인딩이 없어서 setNotificationHandler 가 throw.
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  })
}

// ── 설정 getter / setter ───────────────────────────────
export async function getKrOpenEnabled(): Promise<boolean> {
  const v = await AsyncStorage.getItem(KR_ENABLED_KEY)
  return v !== 'false'  // 기본 ON
}
export async function setKrOpenEnabled(enabled: boolean) {
  await AsyncStorage.setItem(KR_ENABLED_KEY, String(enabled))
  if (!enabled) await cancelKrOpenReminder()
  else await scheduleKrOpenReminder()
}

export async function getUsOpenEnabled(): Promise<boolean> {
  const v = await AsyncStorage.getItem(US_ENABLED_KEY)
  return v !== 'false'  // 기본 ON
}
export async function setUsOpenEnabled(enabled: boolean) {
  await AsyncStorage.setItem(US_ENABLED_KEY, String(enabled))
  if (!enabled) await cancelUsOpenReminder()
  else await scheduleUsOpenReminder()
}

export async function getMinutesBefore(): Promise<number> {
  const v = await AsyncStorage.getItem(MINUTES_BEFORE_KEY)
  const n = v != null ? parseInt(v, 10) : NaN
  return Number.isFinite(n) ? n : DEFAULT_MINUTES_BEFORE
}
export async function setMinutesBefore(minutes: number) {
  await AsyncStorage.setItem(MINUTES_BEFORE_KEY, String(minutes))
  // 분 변경 시 켜져 있는 알림 모두 다시 예약
  await rescheduleAll()
}

// ── 권한 ───────────────────────────────────────────────
export async function ensurePermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false
  if (!Device.isDevice) return false

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('market-open', {
      name: '장 시작 알림',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    })
  }

  const { status: existing } = await Notifications.getPermissionsAsync()
  if (existing === 'granted') return true
  const { status } = await Notifications.requestPermissionsAsync()
  return status === 'granted'
}

// ── 예약 ───────────────────────────────────────────────
function clampMinute(value: number): number {
  if (value < 0) return value + 60
  if (value >= 60) return value - 60
  return value
}

async function scheduleDaily(opts: {
  identifier: string
  hour: number
  minute: number
  title: string
  body: string
  channelId?: string
}) {
  if (Platform.OS === 'web') return
  // 동일 ID 기존 알림 제거 후 새로 등록
  await Notifications.cancelScheduledNotificationAsync(opts.identifier).catch(() => {})
  await Notifications.scheduleNotificationAsync({
    identifier: opts.identifier,
    content: {
      title: opts.title,
      body:  opts.body,
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour:   opts.hour,
      minute: opts.minute,
      ...(Platform.OS === 'android' && opts.channelId ? { channelId: opts.channelId } : {}),
    },
  })
}

export async function scheduleKrOpenReminder() {
  const enabled = await getKrOpenEnabled()
  if (!enabled) return
  const ok = await ensurePermission()
  if (!ok) return
  const minutesBefore = await getMinutesBefore()
  // 시간/분 보정 (KST 기준; DAILY trigger는 디바이스 로컬 시간 사용)
  let hour   = KR_OPEN_HOUR_KST
  let minute = KR_OPEN_MINUTE - minutesBefore
  if (minute < 0) { hour -= 1; minute = clampMinute(minute) }
  await scheduleDaily({
    identifier: KR_OPEN_ID,
    hour, minute,
    title: '🇰🇷 한국장 곧 시작',
    body:  `오늘 한국장이 ${minutesBefore}분 뒤 09:00에 열려. 시나리오 한 번 점검!`,
    channelId: 'market-open',
  })
}

export async function scheduleUsOpenReminder() {
  const enabled = await getUsOpenEnabled()
  if (!enabled) return
  const ok = await ensurePermission()
  if (!ok) return
  const minutesBefore = await getMinutesBefore()
  let hour   = US_OPEN_HOUR_KST
  let minute = US_OPEN_MINUTE - minutesBefore
  if (minute < 0) { hour -= 1; minute = clampMinute(minute) }
  await scheduleDaily({
    identifier: US_OPEN_ID,
    hour, minute,
    title: '🇺🇸 미국장 곧 시작',
    body:  `미국장이 ${minutesBefore}분 뒤(KST 23:30 기준)에 열려. 단타 픽 확인해봐!`,
    channelId: 'market-open',
  })
}

export async function cancelKrOpenReminder() {
  if (Platform.OS === 'web') return
  await Notifications.cancelScheduledNotificationAsync(KR_OPEN_ID).catch(() => {})
}
export async function cancelUsOpenReminder() {
  if (Platform.OS === 'web') return
  await Notifications.cancelScheduledNotificationAsync(US_OPEN_ID).catch(() => {})
}

export async function rescheduleAll() {
  await Promise.all([scheduleKrOpenReminder(), scheduleUsOpenReminder()])
}

/** 앱 부팅 시 1회 호출 — 권한 확인 + 켜진 알림들 다시 예약. */
export function useMarketReminderBootstrap(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return
    void (async () => {
      try {
        await ensurePermission()
        await rescheduleAll()
      } catch {
        // 권한 거부/시뮬레이터 등 실패는 조용히 무시
      }
    })()
  }, [enabled])
}
