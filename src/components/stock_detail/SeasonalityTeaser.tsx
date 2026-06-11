/**
 * 시즈널리티 진입 버튼의 미리보기 한 줄 — "이번 달 역사적 평균 +2.1% · 승률 58% (12년)".
 * 종목 상세는 가장 자주 여는 화면이라 즉시 호출하지 않고 600ms 지연 — 스치듯 열고
 * 닫는 경우 백테스트 호출(캐시 미스 시 야후 15y fetch)이 나가지 않게.
 * 서버가 24h 캐시하므로 같은 종목 재조회는 가볍다. 실패/데이터 없음이면 기본 문구.
 */
import { useEffect, useState } from 'react'
import { Text } from 'react-native'
import { useTheme } from '../../theme'
import { fetchSeasonality } from '../../api/backtest'

const FALLBACK = '역사적으로 어느 달에 강하고 약했는지'

export function SeasonalityTeaser({ market, ticker }: { market: string; ticker: string }) {
  const { palette } = useTheme()
  const [preview, setPreview] = useState<{ text: string; up: boolean } | null>(null)

  useEffect(() => {
    let alive = true
    setPreview(null)
    const t = setTimeout(() => {
      fetchSeasonality(market, ticker).then((r) => {
        if (!alive || !r) return
        const month = new Date().getMonth() + 1
        const s = r.monthly.find((x) => x.month === month)
        if (!s || s.sampleYears === 0) return
        setPreview({
          text: `📅 ${month}월 역사적 평균 ${s.meanPct >= 0 ? '+' : ''}${s.meanPct.toFixed(1)}% · 승률 ${s.winRatePct.toFixed(0)}% (${s.sampleYears}년)`,
          up: s.meanPct >= 0,
        })
      }).catch(() => {})
    }, 600)
    return () => { alive = false; clearTimeout(t) }
  }, [market, ticker])

  return (
    <Text style={{ color: preview ? (preview.up ? palette.up : palette.down) : palette.inkMuted, fontSize: 11, fontWeight: preview ? '700' : '400' }} numberOfLines={1}>
      {preview?.text ?? FALLBACK}
    </Text>
  )
}
