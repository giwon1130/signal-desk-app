import { useMemo } from 'react'
import { StyleSheet } from 'react-native'
import { useTheme } from '../theme'
import type { Palette } from '../theme'
import { shellStyles } from './shell'
import { cardStyles } from './cards'
import { todayStyles } from './today'
import { homeStyles } from './home'
import { marketStyles } from './market'
import { stocksStyles } from './stocks'
import { aiStyles } from './ai'
import { authStyles } from './auth'
import { modalStyles } from './modal'

function buildStyles(C: Palette) {
  return StyleSheet.create({
    ...shellStyles(C),
    ...cardStyles(C),
    ...todayStyles(C),
    ...homeStyles(C),
    ...marketStyles(C),
    ...stocksStyles(C),
    ...aiStyles(C),
    ...authStyles(C),
    ...modalStyles(C),
  } as any)
}

/** 컴포넌트 내부에서 호출. 테마가 바뀌면 자동으로 새 styles 반환. */
export function useStyles() {
  const { palette } = useTheme()
  return useMemo(() => buildStyles(palette), [palette])
}
