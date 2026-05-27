/**
 * 타입 barrel — 도메인별 파일에서 re-export.
 *
 * 새 import 는 `import type { X } from '../types/market'` 같은 도메인 경로 권장.
 * 기존 `import type { X } from '../types'` 도 호환 유지.
 *
 * 도메인 매핑:
 *  - types/market — 지수·세션·차트·뉴스·합성위험도·이벤트·top movers
 *  - types/ai — Gemini insight·picks·hidden signals·추천 실행 로그
 *  - types/workspace — watchlist/portfolio/종목 검색·상세
 *  - types/briefing — 일일 브리핑 (HomeTab hero)
 *  - types/media — 모닝/이브닝 브리프, 뉴스 종합
 *  - types/system — API envelope, 공시, 운세, 알림 이력, UI 키
 */

export * from './types/market'
export * from './types/ai'
export * from './types/workspace'
export * from './types/briefing'
export * from './types/media'
export * from './types/system'
export * from './types/league'
