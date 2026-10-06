/** Reject malformed input instead of changing its meaning (0.5 must never become 5). */
export function decimalInput(text: string): number {
  const input = text.trim().replace(/^[₩$]\s*/, '')
  if (input.includes(',') && !/^\d{1,3}(?:,\d{3})+(?:\.\d{1,8})?$/.test(input)) return 0
  const cleaned = input.replace(/,/g, '')
  if (!/^(?:\d+\.?\d{0,8}|\.\d{1,8})$/.test(cleaned)) return 0
  const value = Number(cleaned)
  return Number.isFinite(value) && value > 0 && value <= 1_000_000_000 ? value : 0
}

export function validHoldingInput(market: string, price: number, quantity: number): boolean {
  return ['KR', 'US'].includes(market) && [price, quantity].every(n => Number.isFinite(n) && n > 0 && n <= 1_000_000_000)
    && (market !== 'KR' || (Number.isInteger(price) && Number.isInteger(quantity)))
}
