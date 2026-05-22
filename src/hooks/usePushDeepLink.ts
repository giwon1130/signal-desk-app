import { useEffect } from 'react'
import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'

type NotificationData = {
  type?: string
  ticker?: string
  market?: string
  direction?: string
  stockCode?: string
  rceptNo?: string
  score?: number
  level?: string
}

/**
 * 푸시 알림 탭 시 알림 종류별로 적절한 화면으로 이동.
 *
 * - DISCLOSURE (DART 공시): stockCode → KR 종목 상세 모달
 * - MORNING_BRIEF (모닝 브리프): Today 탭 (최상단 Hero 카드에 브리프 노출)
 * - COMPOSITE_RISK (합성 위험도): Market 탭 (종합 위험도 카드 노출)
 * - 가격/급등락 알림: market + ticker → 종목 상세 모달
 *
 * 트리거 경로:
 * - 포그라운드/백그라운드: addNotificationResponseReceivedListener
 * - 콜드 스타트: getLastNotificationResponse (앱 종료 상태에서 알림 탭으로 실행)
 * - 웹: expo-notifications 네이티브 바인딩 없음 → 전부 skip (호출 시 즉시 throw 함)
 */
export function usePushDeepLink(
  onOpenDetail: (market: string, ticker: string) => void,
  onNavigateToday: () => void,
  onNavigateMarket: () => void,
) {
  useEffect(() => {
    // 웹 빌드에서는 getLastNotificationResponse 가 호출 즉시 예외를 던져서
    // 리액트 트리 마운트를 통째로 깨먹음. 초기 진입 자체를 스킵.
    if (Platform.OS === 'web') return

    function handle(data: NotificationData | undefined) {
      if (!data) return

      // DART 공시 — 보유/관심 KR 종목 상세로 이동
      if (data.type === 'DISCLOSURE' && data.stockCode) {
        onOpenDetail('KR', data.stockCode)
        return
      }
      // 모닝 브리프 — Today 탭 (Hero 카드)
      if (data.type === 'MORNING_BRIEF') {
        onNavigateToday()
        return
      }
      // 합성 위험도 — Market 탭 (종합 위험도 카드)
      if (data.type === 'COMPOSITE_RISK') {
        onNavigateMarket()
        return
      }
      // 가격/급등락 등 종목 단위 알림
      const market = data.market
      const ticker = data.ticker
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
  }, [onOpenDetail, onNavigateToday, onNavigateMarket])
}
