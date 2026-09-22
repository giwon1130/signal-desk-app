import type { TraderConnectionStatus } from '../types/trader'

export function traderConnectionPresentation(status: TraderConnectionStatus, now = Date.now()) {
  if (!status.connected) return { label: '미연결', receiving: false }
  if (!status.snapshot) return { label: '첫 상태 수신 대기', receiving: false }
  const lastSeen = Date.parse(status.lastSeenAt ?? status.snapshot.asOf)
  const receiving = Number.isFinite(lastSeen) && lastSeen <= now + 60_000 && now - lastSeen <= 180_000
  return { label: receiving ? '최근 수신 확인' : '상태 수신 지연', receiving }
}
