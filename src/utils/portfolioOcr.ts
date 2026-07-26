import type { OcrLine, OcrResult } from '../../modules/signal-desk-ocr/src'

export type PortfolioOcrCandidate = {
  query: string
  sourceTop: number
  buyPrice: number | null
  quantity: number | null
}

const EXCLUDED_WORDS = [
  '보유종목', '보유 종목', '잔고', '평가금액', '평가손익', '수익률', '현재가', '매입금액',
  '평균단가', '평단가', '매입단가', '매수가', '평균매입가', '보유수량', '주문가능',
  '총자산', '예수금', '원화', '외화', '국내주식', '해외주식', '전체', '종목명',
  '매도', '매수', '수량', '단가', '손익', '계좌', '조회', '편집', '정렬',
]

const BUY_HEADERS = ['평균단가', '평단가', '매입단가', '매수가', '평균매입가']
const QTY_HEADERS = ['보유수량', '수량']

const centerX = (line: OcrLine) => (line.left + line.right) / 2
const centerY = (line: OcrLine) => (line.top + line.bottom) / 2
const clean = (text: string) => text.replace(/\s+/g, ' ').trim()
const compact = (text: string) => text.replace(/\s+/g, '')

function isStockQuery(text: string): boolean {
  const value = clean(text)
  const valueCompact = compact(value)
  if (!value || value.length > 28) return false
  if (EXCLUDED_WORDS.some((word) => valueCompact.includes(compact(word)))) return false
  if (/[%₩$]/.test(value) || /^[+\-]?[\d,.]+(?:원|주)?$/.test(value)) return false
  if (/[가-힣]/.test(value)) return /^[가-힣A-Za-z0-9&().·\-\s]+$/.test(value)
  return /^[A-Z][A-Z0-9.\-]{0,7}$/.test(value)
}

function numberFrom(text: string): number | null {
  if (/%/.test(text)) return null
  const match = text.replace(/\s/g, '').match(/[₩$]?([0-9][0-9,]*(?:\.[0-9]+)?)/)
  if (!match) return null
  const parsed = Number(match[1].replace(/,/g, ''))
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function labelledValue(text: string, labels: string[]): number | null {
  const joined = labels.map((label) => compact(label)).join('|')
  const match = compact(text).match(
    new RegExp(`(?:${joined})[:：]?([₩$]?[0-9][0-9,]*(?:\\.[0-9]+)?)`, 'i'),
  )
  return match ? numberFrom(match[1]) : null
}

function valueWithSuffix(text: string, suffix: string): number | null {
  const match = compact(text).match(new RegExp(`([0-9][0-9,]*(?:\\.[0-9]+)?)${suffix}`, 'i'))
  return match ? numberFrom(match[1]) : null
}

function closestColumnValue(lines: OcrLine[], columnX: number | null, width: number): number | null {
  if (columnX == null) return null
  const candidates = lines
    .map((line) => ({ value: numberFrom(line.text), distance: Math.abs(centerX(line) - columnX) }))
    .filter((item): item is { value: number; distance: number } => item.value != null && item.distance < width * 0.22)
    .sort((a, b) => a.distance - b.distance)
  return candidates[0]?.value ?? null
}

/**
 * OCR 원문은 이 함수 바깥으로 전송하지 않는다. 여기서는 계좌번호처럼 숫자로만 된 줄을
 * 검색 후보에서 제외하고, 종목명 후보와 매수가·수량만 추린다.
 */
export function extractPortfolioCandidates(result: OcrResult): PortfolioOcrCandidate[] {
  const lines = result.lines
    .map((line) => ({ ...line, text: clean(line.text) }))
    .filter((line) => line.text)
    .sort((a, b) => centerY(a) - centerY(b) || a.left - b.left)

  const buyHeader = lines.find((line) => BUY_HEADERS.some((word) => compact(line.text).includes(word)))
  const qtyHeader = lines.find((line) => QTY_HEADERS.some((word) => compact(line.text).includes(word)))
  const queryLines = lines.filter((line) => isStockQuery(line.text)).slice(0, 20)
  const seen = new Set<string>()

  return queryLines.flatMap((line, index) => {
    const key = compact(line.text).toUpperCase()
    if (seen.has(key)) return []
    seen.add(key)

    const y = centerY(line)
    const nextY = queryLines.slice(index + 1).map(centerY).find((value) => value > y + 2)
    const rowHeight = Math.max(line.bottom - line.top, 12)
    const rowLines = lines.filter((candidate) => {
      const candidateY = centerY(candidate)
      return candidateY >= y - rowHeight && candidateY < (nextY ?? y + rowHeight * 4)
    })
    const rowText = rowLines.map((candidate) => candidate.text).join(' ')
    const buyPrice =
      labelledValue(rowText, BUY_HEADERS) ??
      closestColumnValue(rowLines, buyHeader ? centerX(buyHeader) : null, result.width)
    const quantity =
      labelledValue(rowText, QTY_HEADERS) ??
      valueWithSuffix(rowText, '주') ??
      closestColumnValue(rowLines, qtyHeader ? centerX(qtyHeader) : null, result.width)

    return [{
      query: line.text,
      sourceTop: line.top,
      buyPrice,
      quantity: quantity == null ? null : Math.max(1, Math.round(quantity)),
    }]
  })
}
