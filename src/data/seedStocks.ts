import type { StockSearchResult } from '../types'

/**
 * 온보딩 Step 4 추천 종목 시드 — 시총 상위 고정 (v2 spec 결정 2).
 *
 * 매 분기 교체 X — 시총 상위는 안정적. 1년 단위로 점검.
 * sector/price/changeRate 는 0/빈문자 — 백엔드가 quickAddWatchItem 시 자동 보강.
 */

const SEED_KR: StockSearchResult[] = [
  { ticker: '005930', name: '삼성전자',      market: 'KR', sector: '', price: 0, changeRate: 0, stance: 'WATCH' },
  { ticker: '000660', name: 'SK하이닉스',    market: 'KR', sector: '', price: 0, changeRate: 0, stance: 'WATCH' },
  { ticker: '035420', name: 'NAVER',         market: 'KR', sector: '', price: 0, changeRate: 0, stance: 'WATCH' },
  { ticker: '035720', name: '카카오',         market: 'KR', sector: '', price: 0, changeRate: 0, stance: 'WATCH' },
  { ticker: '005380', name: '현대차',        market: 'KR', sector: '', price: 0, changeRate: 0, stance: 'WATCH' },
  { ticker: '373220', name: 'LG에너지솔루션', market: 'KR', sector: '', price: 0, changeRate: 0, stance: 'WATCH' },
]

const SEED_US: StockSearchResult[] = [
  { ticker: 'NVDA',  name: 'NVIDIA',     market: 'US', sector: '', price: 0, changeRate: 0, stance: 'WATCH' },
  { ticker: 'MSFT',  name: 'Microsoft',  market: 'US', sector: '', price: 0, changeRate: 0, stance: 'WATCH' },
  { ticker: 'AAPL',  name: 'Apple',      market: 'US', sector: '', price: 0, changeRate: 0, stance: 'WATCH' },
  { ticker: 'GOOGL', name: 'Alphabet',   market: 'US', sector: '', price: 0, changeRate: 0, stance: 'WATCH' },
  { ticker: 'AMZN',  name: 'Amazon',     market: 'US', sector: '', price: 0, changeRate: 0, stance: 'WATCH' },
  { ticker: 'TSLA',  name: 'Tesla',      market: 'US', sector: '', price: 0, changeRate: 0, stance: 'WATCH' },
]

/** marketPreference 에 따른 추천 종목 시드. BOTH 는 양쪽 시총 1~3위. */
export function seedFor(pref: 'KR' | 'US' | 'BOTH'): StockSearchResult[] {
  if (pref === 'KR') return SEED_KR
  if (pref === 'US') return SEED_US
  return [SEED_KR[0], SEED_KR[1], SEED_KR[2], SEED_US[0], SEED_US[1], SEED_US[2]]
}
