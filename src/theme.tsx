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

// ─── v3 라이트 팔레트 ──────────────────────────────────────────────────────
// 차갑고 무거운 HTS 톤을 덜어낸 금융 앱 팔레트. 정보는 또렷하되 카드 경계는 조용하게.
const light: Palette = {
  scheme: 'light',
  bg: '#f6f7f9',
  surface: '#ffffff',
  surfaceAlt: '#f1f3f6',
  border: '#dde2e9',
  borderLight: '#eaedf2',
  ink: '#111827',
  inkSub: '#374151',
  inkMuted: '#6b7280',
  inkFaint: '#9aa2af',
  brand: '#111827',
  brandAccent: '#16b979',
  blue: '#3578e5',
  blueSoft: '#eaf2ff',
  blueDark: '#245fbd',
  teal: '#0f9f8f',
  tealSoft: '#e4f8f3',
  up: '#dc2626',
  upSoft: '#fee2e2',
  down: '#2563eb',
  downSoft: '#dbeafe',
  green: '#16a36a',
  greenSoft: '#e5f7ee',
  orange: '#c97a10',
  orangeSoft: '#fff5df',
  purple: '#7857d6',
  purpleSoft: '#f0ecfb',
  red: '#dc2626',
  redSoft: '#fee2e2',
  skeleton: '#e8ebf0',
  toastSuccessBg: '#e5f7ee',
  toastErrorBg: '#fee2e2',
  toastInfoBg: '#f1f5f9',
  shadowColor: '#111827',
  headerSubtitle: '#6b7280',
  headerOnDark: '#111827',
}

// ─── v3 다크 팔레트 ─────────────────────────────────────────────────────────
// 순검정 대신 청회색 레이어를 써서 긴 리포트와 야간 사용에서 눈의 피로를 줄인다.
const dark: Palette = {
  scheme: 'dark',
  bg: '#080c12',
  surface: '#10161f',
  surfaceAlt: '#171f2b',
  border: '#283344',
  borderLight: '#1c2633',
  ink: '#f2f5f9',
  inkSub: '#cbd2dc',
  inkMuted: '#8591a3',
  inkFaint: '#596577',
  brand: '#10161f',
  brandAccent: '#35d690',
  blue: '#6aa8ff',
  blueSoft: '#182c47',
  blueDark: '#4d8fe8',
  teal: '#5bd6c2',
  tealSoft: '#12342f',
  up: '#f87171',            // KR 상승 = 빨강
  upSoft: '#3a0e0e',
  down: '#60a5fa',          // KR 하락 = 파랑
  downSoft: '#1e3a5f',
  green: '#35d690',
  greenSoft: '#113424',
  orange: '#f5b94c',
  orangeSoft: '#38290f',
  purple: '#b89cf5',
  purpleSoft: '#292041',
  red: '#f87171',
  redSoft: '#3a0e0e',
  skeleton: '#171f2b',
  toastSuccessBg: '#113424',
  toastErrorBg: '#3a0e0e',
  toastInfoBg: '#171f2b',
  shadowColor: '#000000',
  headerSubtitle: '#8591a3',
  headerOnDark: '#f2f5f9',
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
  // default 'light'. 사용자가 설정에서 'system'/'light'/'dark' 선택 가능.
  // 기존 사용자는 AsyncStorage 에 저장된 값이 있으면 그대로 적용 (마이그레이션 무중단).
  const [mode,   setMode]   = useState<ThemeMode>('light')
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
    // 폴백: Provider 없이 호출되어도 안전하게 라이트 반환 (default)
    return { palette: light, mode: 'light', setMode: () => {}, toggle: () => {} }
  }
  return ctx
}
