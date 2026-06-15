import { useCallback, useState } from 'react'
import { LayoutAnimation, Platform, UIManager } from 'react-native'
import { apiErrorMessage } from '../utils/apiError'
import {
  deleteFavoriteItem,
  deletePortfolioPosition,
  quickAddWatchItem,
  savePortfolioPosition,
  saveWatchItemAlerts,
} from '../api'
import type { PortfolioSummary, StockSearchResult, WatchItem } from '../types'
import { hapticError, hapticSuccess } from '../utils/haptics'

type ToastAction = { label: string; onPress: () => void }
type Toast = { show: (text: string, kind?: 'success' | 'error' | 'info', action?: ToastAction | null) => void }

// 구 아키텍처 Android 는 명시적 활성화 필요 (웹/new-arch 에선 no-op).
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

/** 리스트 행 삽입/제거가 '뚝' 바뀌지 않게 — 다음 레이아웃 변경을 부드럽게. */
const animateListChange = () => {
  if (Platform.OS === 'web') return
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
}

type Args = {
  watchlist: WatchItem[]
  setWatchlist: React.Dispatch<React.SetStateAction<WatchItem[]>>
  setPortfolio: React.Dispatch<React.SetStateAction<PortfolioSummary | null>>
  fetchData: () => Promise<void>
  toast: Toast
  /** 상한/PRO 에러 토스트에 '업그레이드' 액션을 붙일 때 호출 (예: 설정 열기). */
  onUpgrade?: () => void
}

/**
 * 워크스페이스 mutation (관심·보유) 핸들러 모음.
 *
 * - quickAddWatch / deleteFavorite / deleteAllFavorites
 * - savePortfolio / deletePortfolio
 * - toggleWatchInDetail (현재 상태 보고 자동으로 추가/해제)
 *
 * 패턴: API 호출 → 즉시 로컬 setX 로 optimistic 갱신 (해제 류) → 백그라운드 fetchData
 * 로 보정. fetchData 가 다른 탭 데이터까지 불러와 느릴 때 UI 가 멈춰 보이던 문제 회피.
 *
 * favoriteDeletingId / bulkDeletingWatch 는 상태 노출 — UI 의 disable/loading 표기용.
 */
export function useWorkspaceMutations(args: Args) {
  const { watchlist, setWatchlist, fetchData, toast, onUpgrade } = args
  const [favoriteDeletingId, setFavoriteDeletingId] = useState('')
  const [bulkDeletingWatch, setBulkDeletingWatch] = useState(false)

  // 상한/PRO 에러면 '업그레이드' 액션을 붙인다(서버 메시지에 'PRO' 포함).
  const showMutationError = useCallback((e: unknown, fallback: string) => {
    const msg = apiErrorMessage(e, fallback)
    const isProLimit = /PRO/i.test(msg)
    toast.show(msg, 'error', isProLimit && onUpgrade ? { label: '💎 업그레이드', onPress: onUpgrade } : null)
  }, [toast, onUpgrade])

  const handleSavePortfolio = useCallback(async (payload: {
    id?: string
    market: string
    ticker: string
    name: string
    buyPrice: number
    currentPrice: number
    quantity: number
  }) => {
    try {
      await savePortfolioPosition(payload)
      await fetchData()
      void hapticSuccess()
      toast.show(payload.id ? '보유 종목을 수정했습니다' : '보유 종목으로 등록했습니다', 'success')
    } catch (e) {
      void hapticError()
      showMutationError(e, '저장에 실패했습니다. 입력값을 확인해 주세요')
      throw new Error('save-portfolio-failed')
    }
  }, [fetchData, toast, showMutationError])

  const handleDeletePortfolio = useCallback(async (id: string) => {
    try {
      await deletePortfolioPosition(id)
      await fetchData()
      void hapticSuccess()
      toast.show('보유 종목을 삭제했습니다', 'info')
    } catch (e) {
      void hapticError()
      toast.show(apiErrorMessage(e, '삭제에 실패했습니다'), 'error')
    }
  }, [fetchData, toast])

  const handleQuickAddWatch = useCallback(async (stock: StockSearchResult) => {
    try {
      await quickAddWatchItem(stock)
      await fetchData()
      void hapticSuccess()
      toast.show('관심종목에 담았습니다', 'success')
    } catch (e) {
      void hapticError()
      showMutationError(e, '관심종목 추가에 실패했습니다')
      throw new Error('quick-add-failed')
    }
  }, [fetchData, toast, showMutationError])

  const handleDeleteFavorite = useCallback(async (id: string) => {
    setFavoriteDeletingId(id)
    try {
      await deleteFavoriteItem(id)
      // 서버 DELETE 성공 즉시 로컬에서 제거 → 버튼 "..." 이 끝난 듯 바로 사라짐.
      // 전체 refetch 는 백그라운드로.
      animateListChange()
      setWatchlist((prev) => prev.filter((w) => w.id !== id))
      void fetchData()
      void hapticSuccess()
      toast.show('관심종목에서 해제했습니다', 'info')
    } catch (e) {
      void hapticError()
      toast.show(apiErrorMessage(e, '해제에 실패했습니다'), 'error')
    } finally {
      setFavoriteDeletingId('')
    }
  }, [fetchData, setWatchlist, toast])

  // 일괄 해제. 개별 DELETE 를 병렬로 보내고 한 번만 refetch.
  const handleDeleteAllFavorites = useCallback(async () => {
    if (!watchlist.length || bulkDeletingWatch) return
    setBulkDeletingWatch(true)
    try {
      await Promise.allSettled(
        watchlist.filter((w) => !!w.id).map((w) => deleteFavoriteItem(w.id)),
      )
      // 전부 지워졌다고 가정하고 즉시 비움 → 남은 건 refetch 에서 보정.
      animateListChange()
      setWatchlist([])
      void fetchData()
      void hapticSuccess()
      toast.show('관심종목을 전부 해제했습니다', 'info')
    } catch (e) {
      void hapticError()
      toast.show(apiErrorMessage(e, '일괄 해제에 실패했습니다'), 'error')
    } finally {
      setBulkDeletingWatch(false)
    }
  }, [watchlist, bulkDeletingWatch, fetchData, setWatchlist, toast])

  // 모달용: 현재 관심 여부에 따라 자동으로 추가/해제 토글
  const handleToggleWatchInDetail = useCallback(async (stock: StockSearchResult) => {
    const existing = watchlist.find((w) => w.market === stock.market && w.ticker === stock.ticker)
    if (existing?.id) {
      await handleDeleteFavorite(existing.id)
    } else {
      await handleQuickAddWatch(stock)
    }
  }, [watchlist, handleDeleteFavorite, handleQuickAddWatch])

  const handleSaveWatchAlerts = useCallback(async (
    watchItem: WatchItem,
    alertBelow: number | null,
    alertAbove: number | null,
    volumeAlert: boolean,
  ) => {
    try {
      await saveWatchItemAlerts({
        id: watchItem.id,
        market: watchItem.market,
        ticker: watchItem.ticker,
        name: watchItem.name,
        price: watchItem.price,
        changeRate: watchItem.changeRate,
        sector: watchItem.sector,
        stance: watchItem.stance,
        note: watchItem.note,
        alertBelow,
        alertAbove,
        volumeAlert,
      })
      setWatchlist((prev) => prev.map((w) =>
        w.id === watchItem.id ? { ...w, alertBelow, alertAbove, volumeAlert } : w,
      ))
      void hapticSuccess()
      toast.show('알림 설정을 저장했습니다.', 'success')
    } catch (e) {
      void hapticError()
      showMutationError(e, '저장에 실패했습니다. 다시 시도해 주세요.')
    }
  }, [setWatchlist, toast, showMutationError])

  return {
    favoriteDeletingId,
    bulkDeletingWatch,
    handleSavePortfolio,
    handleDeletePortfolio,
    handleQuickAddWatch,
    handleDeleteFavorite,
    handleDeleteAllFavorites,
    handleToggleWatchInDetail,
    handleSaveWatchAlerts,
  }
}
