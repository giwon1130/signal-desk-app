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

// ─── v2 라이트 팔레트 ──────────────────────────────────────────────────────
// "대시보드 프로" 라이트 변종 — 단단한 grey, contrast 강화. v1 보다 또렷.
const light: Palette = {
  scheme: 'light',
  bg: '#f5f7fa',
  surface: '#ffffff',
  surfaceAlt: '#f0f4f9',
  border: '#d4dae3',
  borderLight: '#e8edf3',
  ink: '#0a0d12',
  inkSub: '#3a4256',
  inkMuted: '#5a6478',
  inkFaint: '#8b95a8',
  brand: '#0a0d12',
  brandAccent: '#16a34a',
  blue: '#2563eb',
  blueSoft: '#dbeafe',
  blueDark: '#1d4ed8',
  teal: '#0d9488',
  tealSoft: '#ccfbf1',
  up: '#dc2626',
  upSoft: '#fee2e2',
  down: '#2563eb',
  downSoft: '#dbeafe',
  green: '#16a34a',
  greenSoft: '#dcfce7',
  orange: '#d97706',
  orangeSoft: '#fef3c7',
  purple: '#7c3aed',
  purpleSoft: '#ede9fe',
  red: '#dc2626',
  redSoft: '#fee2e2',
  skeleton: '#e2e8f0',
  toastSuccessBg: '#dcfce7',
  toastErrorBg: '#fee2e2',
  toastInfoBg: '#f1f5f9',
  shadowColor: '#0a0d12',
  headerSubtitle: '#93c5fd',
  headerOnDark: '#f8fafc',
}

// ─── v2 다크 팔레트 (기본) ─────────────────────────────────────────────────
// "대시보드 프로" — Bloomberg/HTS 톤. 거의 검정 배경 + 푸른빛 grey + mint accent.
// 야간 사용 (US 이브닝 브리프 06:30 KST, 미장 새벽 시간) 부담 최소화.
const dark: Palette = {
  scheme: 'dark',
  bg: '#0a0d12',           // 거의 검정, 미세한 푸른빛
  surface: '#131820',       // 카드 배경
  surfaceAlt: '#1c2330',    // hover/active/입력 필드
  border: '#2a3445',        // 단단한 grey — 카드 경계 또렷
  borderLight: '#1f2632',
  ink: '#e8eef5',           // 본문 — 순백 대비 약간 부드럽게
  inkSub: '#c5cdd9',        // 부제 / 강조 안된 본문
  inkMuted: '#8b95a8',      // 메타 / 보조
  inkFaint: '#5a6478',      // 미세 텍스트 / disabled
  brand: '#0a0d12',         // flat — bg 와 동일
  brandAccent: '#4ade80',   // mint — accent (US 상승)
  blue: '#60a5fa',
  blueSoft: '#1e3a5f',
  blueDark: '#3b82f6',
  teal: '#5eead4',
  tealSoft: '#0f3530',
  up: '#f87171',            // KR 상승 = 빨강
  upSoft: '#3a0e0e',
  down: '#60a5fa',          // KR 하락 = 파랑
  downSoft: '#1e3a5f',
  green: '#4ade80',         // US 상승 = 민트
  greenSoft: '#0f3520',
  orange: '#fbbf24',
  orangeSoft: '#3a2a0e',
  purple: '#c084fc',        // AI 강조
  purpleSoft: '#2d1b69',
  red: '#f87171',
  redSoft: '#3a0e0e',
  skeleton: '#1c2330',
  toastSuccessBg: '#0f3520',
  toastErrorBg: '#3a0e0e',
  toastInfoBg: '#1c2330',
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
  // v2: default 'dark' (대시보드 프로 톤). 사용자가 설정에서 'system'/'light'/'dark' 선택 가능.
  // 기존 v1 사용자는 AsyncStorage 에 저장된 값이 있으면 그대로 적용 (마이그레이션 무중단).
  const [mode,   setMode]   = useState<ThemeMode>('dark')
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
    // 폴백: Provider 없이 호출되어도 안전하게 다크 반환 (v2 default)
    return { palette: dark, mode: 'dark', setMode: () => {}, toggle: () => {} }
  }
  return ctx
}
