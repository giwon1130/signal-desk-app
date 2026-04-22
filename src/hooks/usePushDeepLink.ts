import { useEffect } from 'react'
import * as Notifications from 'expo-notifications'

type NotificationData = {
  ticker?: string
  market?: string
  direction?: string
}

/**
 * 푸시 알림 탭 시 해당 종목 상세 모달로 이동.
 *
 * - 포그라운드/백그라운드: addNotificationResponseReceivedListener
 * - 콜드 스타트: getLastNotificationResponseAsync (앱이 종료된 상태에서 알림 탭으로 실행)
 */
export function usePushDeepLink(onOpenDetail: (market: string, ticker: string) => void) {
  useEffect(() => {
    function handle(data: NotificationData | undefined) {
      const market = data?.market
      const ticker = data?.ticker
      if (market && ticker) onOpenDetail(market, ticker)
    }

    // 콜드 스타트 (앱이 종료 상태에서 알림 탭으로 실행)
    const initial = Notifications.getLastNotificationResponse()
    if (initial) handle(initial.notification.request.content.data as NotificationData)

    // 포그라운드/백그라운드
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      handle(response.notification.request.content.data as NotificationData)
    })
    return () => sub.remove()
  }, [onOpenDetail])
}
