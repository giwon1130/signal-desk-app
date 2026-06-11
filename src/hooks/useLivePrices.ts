import { useEffect, useRef, useState } from 'react'
import { API_BASE_URL } from '../api'

type LivePrice = { price: number; changeRate: number; ts: number }
type Snapshot  = { type: 'snapshot'; prices: Record<string, LivePrice & { ticker: string; type: 'price' }> }

/**
 * 실시간 시세 구독 훅.
 *
 *   const prices = useLivePrices(['005930', '035720'])
 *   prices['005930'] => { price: 71200, changeRate: 1.23, ts: ... } | undefined
 *
 * 연결은 한 번만 맺고 티커 목록이 바뀌면 subscribe/unsubscribe diff 만 보낸다 —
 * 예전엔 검색 키 입력마다(목록이 바뀔 때마다) 소켓을 끊고 재연결해서
 * 5글자 타이핑 = 연결 5번이었다.
 */
export function useLivePrices(tickers: string[]): Record<string, LivePrice> {
  const [prices, setPrices] = useState<Record<string, LivePrice>>({})
  const wsRef      = useRef<WebSocket | null>(null)
  const desiredRef = useRef<Set<string>>(new Set())  // 지금 원하는 구독 목록
  const sentRef    = useRef<Set<string>>(new Set())  // 서버에 등록돼 있는 구독 목록
  const tickerKey  = tickers.slice().sort().join(',')
  const wantAny    = tickerKey.length > 0

  const syncSubscription = () => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== 1 /* OPEN */) return
    const desired = desiredRef.current
    const sent = sentRef.current
    const add = [...desired].filter((t) => !sent.has(t))
    const remove = [...sent].filter((t) => !desired.has(t))
    if (remove.length) ws.send(JSON.stringify({ action: 'unsubscribe', tickers: remove }))
    if (add.length) ws.send(JSON.stringify({ action: 'subscribe', tickers: add }))
    sentRef.current = new Set(desired)
  }

  // 구독 목록 변경 — 연결 유지한 채 diff 전송 + 구독 해제된 티커의 잔존 가격 정리.
  useEffect(() => {
    desiredRef.current = new Set(tickerKey ? tickerKey.split(',') : [])
    syncSubscription()
    setPrices((prev) => {
      const keep = desiredRef.current
      const stale = Object.keys(prev).filter((t) => !keep.has(t))
      if (!stale.length) return prev
      const next = { ...prev }
      stale.forEach((t) => delete next[t])
      return next
    })
  }, [tickerKey])

  // 연결 수명 — "구독할 티커가 있는지" 여부에만 반응.
  useEffect(() => {
    if (!wantAny) return
    const wsUrl = API_BASE_URL.replace(/^http/, 'ws') + '/ws/prices'

    let cancelled = false
    let retryTimer: ReturnType<typeof setTimeout> | null = null

    const connect = () => {
      if (cancelled) return
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws
      sentRef.current = new Set()

      ws.onopen = () => { syncSubscription() }
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
      sentRef.current = new Set()
    }
  }, [wantAny])

  return prices
}
