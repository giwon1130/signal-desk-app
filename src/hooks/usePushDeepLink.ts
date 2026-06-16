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
  leagueId?: string
  leaderUserId?: string
  postId?: string
}

/**
 * 푸시 알림 탭 시 알림 종류별로 적절한 화면으로 이동.
 *
 * - DISCLOSURE (DART 공시): stockCode → KR 종목 상세 모달
 * - MORNING_BRIEF (모닝 브리프): Today 탭 (최상단 Hero 카드에 브리프 노출)
 * - EVENING_BRIEF (미장 이브닝 브리프): Today 탭
 * - COMPOSITE_RISK (합성 위험도): Today 탭 (v2 에서 Market 흡수됨)
 * - US_DISCLOSURE (SEC EDGAR 공시): market+ticker 자동 라우팅 (fall-through)
 * - LEAGUE_STARTED / LEAGUE_FINISHED: 리그 탭 + 상세 모달 자동 진입
 * - 가격/급등락 알림: market + ticker → 종목 상세 모달
 */
export function usePushDeepLink(
  onOpenDetail: (market: string, ticker: string) => void,
  onNavigateToday: () => void,
  onNavigateMarket: () => void,
  onOpenLeague?: (leagueId: string) => void,
  /** 리딩 새 글 — 리딩 탭으로 이동 + (있으면)해당 리더 프로필 열기. */
  onOpenReadingPost?: (leaderUserId?: string) => void,
  /** PRO 승인 알림 — 설정/업그레이드 화면 + 세션 plan 갱신. */
  onPlanApproved?: () => void,
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
      // 리딩 새 글(AI 리더 포함) — 리딩 탭 + 해당 리더 프로필(글 목록)로
      if (data.type === 'READING_POST_NEW') {
        onOpenReadingPost?.(data.leaderUserId)
        return
      }
      // 콜 적중 — 해당 리더 프로필/글로(종목 상세 아님)
      if (data.type === 'READING_CALL_HIT') {
        onOpenReadingPost?.(data.leaderUserId)
        return
      }
      // PRO 승인 — 설정/업그레이드 + 세션 plan 갱신(즉시 PRO 반영)
      if (data.type === 'PLAN_APPROVED') {
        onPlanApproved?.()
        return
      }
      // 운영 장애/PRO 신청(관리자 대상) — 별도 화면 없어 Today 로
      if (data.type === 'ADMIN_ALERT' || data.type === 'PLAN_REQUEST') {
        onNavigateToday()
        return
      }
      // 브리프(모닝/장중/마감/미장 이브닝) — 전부 Today 탭 (Hero 카드)
      if (data.type === 'MORNING_BRIEF' || data.type === 'MIDDAY_BRIEF' ||
          data.type === 'CLOSE_BRIEF' || data.type === 'EVENING_BRIEF') {
        onNavigateToday()
        return
      }
      // 합성 위험도 — Today 탭 (v2 에서 Market 흡수)
      if (data.type === 'COMPOSITE_RISK') {
        onNavigateMarket()
        return
      }
      // Trading League — 리그 탭 + 상세 모달 자동 진입
      if ((data.type === 'LEAGUE_STARTED' || data.type === 'LEAGUE_FINISHED') && data.leagueId) {
        onOpenLeague?.(data.leagueId)
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
  }, [onOpenDetail, onNavigateToday, onNavigateMarket, onOpenLeague, onOpenReadingPost, onPlanApproved])
}
