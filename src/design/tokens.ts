/**
 * v2 디자인 토큰 — "대시보드 프로" 톤.
 *
 * 색은 [[theme.tsx]] 의 Palette 를 참고. 본 파일은 색 외 토큰(spacing/radius/typography/shadow).
 * v1 컴포넌트는 인라인 스타일을 많이 써서 점진 마이그레이션 — Phase 1+ 에서 styles 와 함께 적용.
 *
 * 원칙:
 *  - radius 작게 (단단한 모서리)
 *  - spacing 컴팩트 (정보 밀도↑)
 *  - typography 계층 단단하게 (4~5 단계)
 *  - 숫자는 tabular-nums 전역 적용
 */

/** Spacing scale — 4의 배수 + 6/10 (정보 밀도 위해 미세한 단계 허용) */
export const SPACING = {
  xs: 4,
  s: 6,
  m: 8,
  l: 10,
  xl: 12,
  xxl: 14,
  '3xl': 16,
  '4xl': 20,
  '5xl': 24,
} as const

/** Border radius — v1 의 14 → v2 8 기본. hero 카드만 10. */
export const RADIUS = {
  xs: 4,    // chip / badge
  s: 6,     // small pill
  m: 8,     // card 기본
  l: 10,    // hero card
  xl: 12,   // modal corners
  pill: 999,
} as const

/** Typography — fontSize / lineHeight / weight / letterSpacing */
export const TYPO = {
  // hero — Today 탭 상단, 합성 위험도 점수 등
  hero: { fontSize: 22, lineHeight: 28, fontWeight: '900' as const, letterSpacing: -0.3 },
  // section title — 각 카드 제목
  title: { fontSize: 14, lineHeight: 18, fontWeight: '800' as const, letterSpacing: 0 },
  // body — 카드 내 일반 텍스트
  body: { fontSize: 12, lineHeight: 18, fontWeight: '500' as const, letterSpacing: 0 },
  // caption — 부가 설명, 메타 정보
  caption: { fontSize: 11, lineHeight: 16, fontWeight: '600' as const, letterSpacing: 0 },
  // meta — 매우 작은 라벨, 대문자 + 스페이싱
  meta: { fontSize: 10, lineHeight: 12, fontWeight: '800' as const, letterSpacing: 0.8 },
  // number — 수치 강조 (tabular-nums 별도 적용)
  number: { fontSize: 16, lineHeight: 20, fontWeight: '800' as const, letterSpacing: -0.2 },
} as const

/** Shadow elevation — 다크모드 기본이라 box-shadow 보다 border 강조 */
export const ELEVATION = {
  none: { shadowOpacity: 0, elevation: 0 },
  card: { shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  modal: { shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 8 },
} as const

/** 모든 숫자는 tabular-nums 로 — 차트/수치 정렬용 */
export const TABULAR_NUMS = { fontVariant: ['tabular-nums' as const] }

/** 화면 분기 — 웹 빌드(src/web)에서 사용 */
export const BREAKPOINT = {
  phone: 640,
  tablet: 960,
  desktop: 1280,
} as const
