import { useEffect, useState } from 'react'
import { searchStocks } from '../api'
import type { StockMarketFilter, StockSearchResult } from '../types'

export function useStockSearch() {
  const [stockSearch, setStockSearch] = useState('')
  const [stockMarketFilter, setStockMarketFilter] = useState<StockMarketFilter>('ALL')
  const [stockResults, setStockResults] = useState<StockSearchResult[]>([])
  const [stockSearchLoading, setStockSearchLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    const timeoutId = setTimeout(() => {
      setStockSearchLoading(true)
      searchStocks(stockSearch, stockMarketFilter)
        .then((results) => { if (!cancelled) setStockResults(results) })
        .catch(() => { if (!cancelled) setStockResults([]) })
        .finally(() => { if (!cancelled) setStockSearchLoading(false) })
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(timeoutId)
    }
  }, [stockSearch, stockMarketFilter])

  return {
    stockSearch,
    stockMarketFilter,
    stockResults,
    stockSearchLoading,
    setStockSearch,
    setStockMarketFilter,
  }
}
