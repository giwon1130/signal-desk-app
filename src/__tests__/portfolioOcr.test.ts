import { extractPortfolioCandidates } from '../utils/portfolioOcr'

const line = (text: string, left: number, top: number, right = left + 80, bottom = top + 12) => ({
  text, left, top, right, bottom,
})

describe('extractPortfolioCandidates', () => {
  test('표 헤더 열 위치로 종목별 평단과 수량을 읽는다', () => {
    const result = extractPortfolioCandidates({
      width: 400,
      height: 800,
      lines: [
        line('종목명', 20, 80),
        line('평균단가', 180, 80),
        line('보유수량', 300, 80),
        line('삼성전자', 20, 120),
        line('71,000', 180, 120),
        line('12', 300, 120),
        line('SK하이닉스', 20, 170),
        line('198,500', 180, 170),
        line('3', 300, 170),
      ],
    })

    expect(result).toEqual([
      expect.objectContaining({ query: '삼성전자', buyPrice: 71000, quantity: 12 }),
      expect.objectContaining({ query: 'SK하이닉스', buyPrice: 198500, quantity: 3 }),
    ])
  })

  test('계좌번호와 금액·수익률은 종목 검색어로 내보내지 않는다', () => {
    const result = extractPortfolioCandidates({
      width: 400,
      height: 800,
      lines: [
        line('계좌 123-456-7890', 20, 20),
        line('삼성전자', 20, 100),
        line('12.4%', 200, 100),
        line('₩1,230,000', 300, 100),
      ],
    })

    expect(result.map((item) => item.query)).toEqual(['삼성전자'])
  })
})
