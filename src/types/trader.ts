export type TraderHoldingSnapshot = {
  symbol: string
  market: 'KR' | 'US'
  quantity: number
  marketValue: number
  currency: 'KRW' | 'USD'
}

export type TraderOrderStatus =
  | 'PENDING_APPROVAL'
  | 'SUBMITTING'
  | 'SUBMITTED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'SUBMISSION_UNCERTAIN'

export type TraderOrderSnapshot = {
  approvalId: string
  symbol: string
  market: 'KR' | 'US'
  side: 'BUY' | 'SELL'
  quantity: number
  status: TraderOrderStatus
  reason: string
  createdAt: string
  expiresAt?: string | null
  submittedAt?: string | null
}

export type TraderSnapshot = {
  asOf: string
  mode: 'DRY_RUN' | 'READ_ONLY' | 'LIVE'
  killSwitchEnabled: boolean
  killSwitchReason?: string | null
  holdings: TraderHoldingSnapshot[]
  orders: TraderOrderSnapshot[]
}

export type TraderConnectionStatus = {
  connected: boolean
  secretHint?: string | null
  createdAt?: string | null
  lastSeenAt?: string | null
  snapshot?: TraderSnapshot | null
}

export type TraderConnectionCreated = {
  connectionKey: string
  status: TraderConnectionStatus
}
