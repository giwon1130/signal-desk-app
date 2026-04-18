import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Appearance } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

// ─── Palettes ────────────────────────────────────────────────────────────────

export type Palette = {
  scheme: 'light' | 'dark'
  bg: string
  surface: string
  surfaceAlt: string
  border: string
  borderLight: string
  ink: string
  inkSub: string
  inkMuted: string
  inkFaint: string
  brand: string
  brandAccent: string
  blue: string
  blueSoft: string
  blueDark: string
  teal: string
  tealSoft: string
  up: string
  upSoft: string
  down: string
  downSoft: string
  green: string
  greenSoft: string
  orange: string
  orangeSoft: string
  purple: string
  purpleSoft: string
  red: string
  redSoft: string
  // 추가
  skeleton: string
  toastSuccessBg: string
  toastErrorBg: string
  toastInfoBg: string
  shadowColor: string
  // 헤더 그라데이션 텍스트
  headerSubtitle: string
  headerOnDark: string
}

const light: Palette = {
  scheme: 'light',
  bg: '#f0f4f8',
  surface: '#ffffff',
  surfaceAlt: '#f8fafc',
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  ink: '#0f172a',
  inkSub: '#334155',
  inkMuted: '#64748b',
  inkFaint: '#94a3b8',
  brand: '#1e3a5f',
  brandAccent: '#60a5fa',
  blue: '#3b82f6',
  blueSoft: '#dbeafe',
  blueDark: '#1d4ed8',
  teal: '#0d9488',
  tealSoft: '#ccfbf1',
  up: '#ef4444',
  upSoft: '#fee2e2',
  down: '#3b82f6',
  downSoft: '#dbeafe',
  green: '#16a34a',
  greenSoft: '#dcfce7',
  orange: '#f59e0b',
  orangeSoft: '#fef3c7',
  purple: '#7c3aed',
  purpleSoft: '#ede9fe',
  red: '#dc2626',
  redSoft: '#fee2e2',
  skeleton: '#e2e8f0',
  toastSuccessBg: '#dcfce7',
  toastErrorBg: '#fee2e2',
  toastInfoBg: '#f1f5f9',
  shadowColor: '#0f172a',
  headerSubtitle: '#93c5fd',
  headerOnDark: '#f8fafc',
}

const dark: Palette = {
  scheme: 'dark',
  // toss-style soft dark — 코어 배경이 너무 검지 않도록 톤 다운
  bg: '#17181c',
  surface: '#1f2024',
  surfaceAlt: '#26272d',
  border: '#2c2d33',
  borderLight: '#33343a',
  ink: '#f1f5f9',
  inkSub: '#d4d4d8',
  inkMuted: '#a1a1aa',
  inkFaint: '#71717a',
  brand: '#0f172a',
  brandAccent: '#60a5fa',
  blue: '#3b82f6',
  blueSoft: '#1e3a5f',
  blueDark: '#60a5fa',
  teal: '#14b8a6',
  tealSoft: '#0f3530',
  up: '#f87171',
  upSoft: '#3a0e0e',
  down: '#60a5fa',
  downSoft: '#1e3a5f',
  green: '#4ade80',
  greenSoft: '#0f3520',
  orange: '#fbbf24',
  orangeSoft: '#3a2a0e',
  purple: '#a78bfa',
  purpleSoft: '#2d1b69',
  red: '#f87171',
  redSoft: '#3a0e0e',
  skeleton: '#2c2d33',
  toastSuccessBg: '#0f3520',
  toastErrorBg: '#3a0e0e',
  toastInfoBg: '#26272d',
  shadowColor: '#000000',
  headerSubtitle: '#93c5fd',
  headerOnDark: '#f8fafc',
}

export const PALETTES = { light, dark }

// ─── Market-aware up/down colors ────────────────────────────────────────────
//
// 한국 시장: 빨강 = 상승, 파랑 = 하락 (전통)
// 미국 시장: 초록 = 상승, 빨강 = 하락 (글로벌 표준)
// changeRate >= 0 일 때의 색을, 시장에 맞춰 돌려준다.
export type Market = 'KR' | 'US' | string

export function marketColor(palette: Palette, market: Market | undefined, changeRate: number): string {
  const isUp = changeRate >= 0
  if (market === 'US') {
    // 미국식: 상승 = green, 하락 = red
    return isUp ? palette.green : palette.red
  }
  // 한국식 (기본): 상승 = up(빨강), 하락 = down(파랑)
  return isUp ? palette.up : palette.down
}

export function marketColorSoft(palette: Palette, market: Market | undefined, changeRate: number): string {
  const isUp = changeRate >= 0
  if (market === 'US') {
    return isUp ? palette.greenSoft : palette.redSoft
  }
  return isUp ? palette.upSoft : palette.downSoft
}

// ─── Context ─────────────────────────────────────────────────────────────────

type ThemeMode = 'system' | 'light' | 'dark'
const STORAGE_KEY = 'signal:themeMode'

type ThemeCtx = {
  palette: Palette
  mode: ThemeMode
  setMode: (m: ThemeMode) => void
  toggle: () => void
}

const Ctx = createContext<ThemeCtx | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode,   setMode]   = useState<ThemeMode>('system')
  const [system, setSystem] = useState<'light' | 'dark'>(Appearance.getColorScheme() === 'dark' ? 'dark' : 'light')

  // 저장된 모드 로드
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((v) => {
      if (v === 'light' || v === 'dark' || v === 'system') setMode(v)
    })
  }, [])

  // 시스템 변경 구독
  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystem(colorScheme === 'dark' ? 'dark' : 'light')
    })
    return () => sub.remove()
  }, [])

  const setModePersist = useCallback((m: ThemeMode) => {
    setMode(m)
    void AsyncStorage.setItem(STORAGE_KEY, m)
  }, [])

  const effective = mode === 'system' ? system : mode
  const palette   = effective === 'dark' ? dark : light

  const toggle = useCallback(() => {
    setModePersist(effective === 'dark' ? 'light' : 'dark')
  }, [effective, setModePersist])

  const value = useMemo<ThemeCtx>(() => ({ palette, mode, setMode: setModePersist, toggle }),
    [palette, mode, setModePersist, toggle])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useTheme(): ThemeCtx {
  const ctx = useContext(Ctx)
  if (!ctx) {
    // 폴백: Provider 없이 호출되어도 안전하게 light 반환
    return { palette: light, mode: 'system', setMode: () => {}, toggle: () => {} }
  }
  return ctx
}
