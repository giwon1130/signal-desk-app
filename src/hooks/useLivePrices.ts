import { useEffect, useRef, useState } from 'react'
import { API_BASE_URL } from '../api'

type LivePrice = { price: number; changeRate: number; ts: number }
type Snapshot  = { type: 'snapshot'; prices: Record<string, LivePrice & { ticker: string; type: 'price' }> }

/**
 * 실시간 시세 구독 훅.
 *
 *   const prices = useLivePrices(['005930', '035720'])
 *   prices['005930'] => { price: 71200, changeRate: 1.23, ts: ... } | undefined
 */
export function useLivePrices(tickers: string[]): Record<string, LivePrice> {
  const [prices, setPrices] = useState<Record<string, LivePrice>>({})
  const wsRef       = useRef<WebSocket | null>(null)
  const tickerKey   = tickers.slice().sort().join(',')

  useEffect(() => {
    if (!tickerKey) return
    // http(s) → ws(s) 변환
    const wsUrl = API_BASE_URL.replace(/^http/, 'ws') + '/ws/prices'

    let cancelled = false
    let retryTimer: ReturnType<typeof setTimeout> | null = null

    const connect = () => {
      if (cancelled) return
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        ws.send(JSON.stringify({ action: 'subscribe', tickers: tickerKey.split(',') }))
      }
      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data) as Snapshot
          if (data.type === 'snapshot') {
            setPrices((prev) => {
              const next = { ...prev }
              for (const [t, p] of Object.entries(data.prices)) {
                next[t] = { price: p.price, changeRate: p.changeRate, ts: p.ts }
              }
              return next
            })
          }
        } catch {/* ignore */}
      }
      ws.onclose = () => {
        if (cancelled) return
        retryTimer = setTimeout(connect, 3000)  // 3초 후 재연결
      }
      ws.onerror = () => { try { ws.close() } catch {/* ignore */} }
    }

    connect()
    return () => {
      cancelled = true
      if (retryTimer) clearTimeout(retryTimer)
      try { wsRef.current?.close() } catch {/* ignore */}
      wsRef.current = null
    }
  }, [tickerKey])

  return prices
}
