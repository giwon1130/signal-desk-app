import { useCallback, useState } from 'react'
import {
  deleteFavoriteItem,
  deletePortfolioPosition,
  quickAddWatchItem,
  savePortfolioPosition,
} from '../api'
import type { PortfolioSummary, StockSearchResult, WatchItem } from '../types'
import { hapticError, hapticSuccess } from '../utils/haptics'

type Toast = { show: (text: string, kind?: 'success' | 'error' | 'info') => void }

type Args = {
  watchlist: WatchItem[]
  setWatchlist: React.Dispatch<React.SetStateAction<WatchItem[]>>
  setPortfolio: React.Dispatch<React.SetStateAction<PortfolioSummary | null>>
  fetchData: () => Promise<void>
  toast: Toast
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
  const { watchlist, setWatchlist, fetchData, toast } = args
  const [favoriteDeletingId, setFavoriteDeletingId] = useState('')
  const [bulkDeletingWatch, setBulkDeletingWatch] = useState(false)

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
      toast.show(payload.id ? '보유 종목을 수정했어요' : '보유 종목으로 등록했어요', 'success')
    } catch {
      void hapticError()
      toast.show('저장에 실패했어요. 입력값을 확인해줘', 'error')
      throw new Error('save-portfolio-failed')
    }
  }, [fetchData, toast])

  const handleDeletePortfolio = useCallback(async (id: string) => {
    try {
      await deletePortfolioPosition(id)
      await fetchData()
      void hapticSuccess()
      toast.show('보유 종목을 삭제했어요', 'info')
    } catch {
      void hapticError()
      toast.show('삭제에 실패했어요', 'error')
    }
  }, [fetchData, toast])

  const handleQuickAddWatch = useCallback(async (stock: StockSearchResult) => {
    try {
      await quickAddWatchItem(stock)
      await fetchData()
      void hapticSuccess()
      toast.show('관심종목에 담았어요', 'success')
    } catch {
      void hapticError()
      toast.show('관심종목 추가에 실패했어요', 'error')
      throw new Error('quick-add-failed')
    }
  }, [fetchData, toast])

  const handleDeleteFavorite = useCallback(async (id: string) => {
    setFavoriteDeletingId(id)
    try {
      await deleteFavoriteItem(id)
      // 서버 DELETE 성공 즉시 로컬에서 제거 → 버튼 "..." 이 끝난 듯 바로 사라짐.
      // 전체 refetch 는 백그라운드로.
      setWatchlist((prev) => prev.filter((w) => w.id !== id))
      void fetchData()
      void hapticSuccess()
      toast.show('관심종목에서 해제했어요', 'info')
    } catch {
      void hapticError()
      toast.show('해제에 실패했어요', 'error')
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
      setWatchlist([])
      void fetchData()
      void hapticSuccess()
      toast.show('관심종목을 전부 해제했어요', 'info')
    } catch {
      void hapticError()
      toast.show('일괄 해제에 실패했어요', 'error')
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

  return {
    favoriteDeletingId,
    bulkDeletingWatch,
    handleSavePortfolio,
    handleDeletePortfolio,
    handleQuickAddWatch,
    handleDeleteFavorite,
    handleDeleteAllFavorites,
    handleToggleWatchInDetail,
  }
}
