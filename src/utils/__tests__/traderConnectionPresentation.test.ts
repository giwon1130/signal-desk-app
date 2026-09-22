import { traderConnectionPresentation } from '../traderConnectionPresentation'
import type { TraderSnapshot } from '../../types/trader'

const now = Date.parse('2026-09-22T10:00:00Z')
const snapshot: TraderSnapshot = { asOf: new Date(now).toISOString(), mode: 'DRY_RUN', killSwitchEnabled: false, holdings: [], orders: [] }
test('a registered key does not imply an active trader', () => {
  expect(traderConnectionPresentation({ connected: false }, now).label).toBe('미연결')
  expect(traderConnectionPresentation({ connected: true }, now).label).toBe('첫 상태 수신 대기')
})
test('old or invalid snapshots are not shown as receiving', () => {
  expect(traderConnectionPresentation({ connected: true, snapshot }, now).receiving).toBe(true)
  expect(traderConnectionPresentation({ connected: true, snapshot }, now + 180001).receiving).toBe(false)
  expect(traderConnectionPresentation({ connected: true, snapshot, lastSeenAt: 'bad-date' }, now).receiving).toBe(false)
  expect(traderConnectionPresentation({ connected: true, snapshot: { ...snapshot, asOf: new Date(now + 120000).toISOString() } }, now).receiving).toBe(false)
})
