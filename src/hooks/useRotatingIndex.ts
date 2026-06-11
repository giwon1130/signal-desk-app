import { useCallback, useEffect, useRef, useState } from 'react'
import { Animated } from 'react-native'

/**
 * 페이드 회전 인덱스 훅 — `length`개 아이템을 `intervalMs`마다 페이드 아웃→인덱스
 * 증가→페이드 인으로 순환한다. (지수 펄스·급등락 미리보기·뉴스 히어로 공용)
 *
 * @returns index   현재 인덱스 (length 축소 시 0으로 리셋)
 * @returns opacity 페이드용 Animated 값 — Animated.View/Text 의 opacity 에 연결
 * @returns goTo    수동 이동(이전/다음 버튼 등) — 동일한 페이드를 거쳐 이동
 */
export function useRotatingIndex(length: number, intervalMs: number, fadeMs = 280) {
  const [index, setIndex] = useState(0)
  const opacity = useRef(new Animated.Value(1)).current

  const goTo = useCallback(
    (next: number | ((prev: number) => number)) => {
      Animated.timing(opacity, { toValue: 0, duration: fadeMs, useNativeDriver: true }).start(() => {
        setIndex(next)
        Animated.timing(opacity, { toValue: 1, duration: fadeMs, useNativeDriver: true }).start()
      })
    },
    [opacity, fadeMs],
  )

  useEffect(() => {
    if (length <= 1) return
    const id = setInterval(() => goTo((p) => (p + 1) % length), intervalMs)
    return () => clearInterval(id)
  }, [length, intervalMs, goTo])

  // 아이템 수가 줄어 인덱스가 범위를 벗어나면 처음으로.
  useEffect(() => { if (index >= length) setIndex(0) }, [length, index])

  return { index, opacity, goTo }
}
