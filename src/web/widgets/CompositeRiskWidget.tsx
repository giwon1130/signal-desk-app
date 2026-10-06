import type { MarketSummaryData } from '../../types'
import type { Palette } from '../../theme'
import { MarketMoodCard } from '../../tabs/market_parts/MarketMoodCard'

export function CompositeRiskWidget({ summary, marketPreference = 'BOTH' }: {
  summary: MarketSummaryData | null
  palette: Palette
  marketPreference?: 'KR' | 'US' | 'BOTH'
}) {
  return <MarketMoodCard conditions={summary?.marketConditions} marketPreference={marketPreference} />
}
