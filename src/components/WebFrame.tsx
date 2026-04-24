import type { ReactNode } from 'react'
import { Platform, View } from 'react-native'
import { useTheme } from '../theme'

/**
 * 웹 전용 레이아웃 래퍼.
 *
 * React Native 컴포넌트는 모바일 기준이라 데스크톱 와이드 뷰포트에서
 * 그대로 풀어두면 가로로 쫙 늘어져 보기 싫음. 웹에선
 *
 *  - 최대 너비를 고정 (모바일 폭과 비슷하게 440px)
 *  - 가운데 정렬
 *  - 주변 배경에 무드톤, 카드 경계 살짝
 *
 * 네이티브(iOS/Android) 에서는 아무것도 하지 않고 children 그대로 통과.
 *
 * variant:
 *  - 'auth'  → 로그인 화면용, 가운데 카드형
 *  - 'shell' → 앱 메인 쉘용, 헤더/탭/스크롤 전체 컨테이너
 */
type Props = {
  variant: 'auth' | 'shell'
  children: ReactNode
}

const AUTH_MAX_WIDTH  = 440
const SHELL_MAX_WIDTH = 520   // iPhone Plus ~ iPad mini 중간값. 모바일 느낌 유지.

export function WebFrame({ variant, children }: Props) {
  const { palette } = useTheme()

  if (Platform.OS !== 'web') return <>{children}</>

  // 웹 페이지 전체 배경 (카드 바깥쪽)
  const outerBg = variant === 'auth' ? palette.bg : palette.bg
  const innerBg = palette.surface
  const maxWidth = variant === 'auth' ? AUTH_MAX_WIDTH : SHELL_MAX_WIDTH

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: outerBg,
        alignItems: 'center',
        justifyContent: variant === 'auth' ? 'center' : 'flex-start',
      }}
    >
      <View
        style={{
          width: '100%',
          maxWidth,
          flex: 1,
          backgroundColor: innerBg,
          borderLeftWidth: 1,
          borderRightWidth: 1,
          borderColor: palette.border,
          // 웹에서만 유효한 부드러운 섀도우 (RN iOS 는 shadowColor 계열,
          // web 에선 boxShadow 로 렌더됨)
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 30,
          shadowOffset: { width: 0, height: 4 },
          elevation: 0,
        }}
      >
        {children}
      </View>
    </View>
  )
}
