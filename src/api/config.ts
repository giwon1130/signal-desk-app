/**
 * 백엔드 API 베이스 URL — 의존성 없는 leaf 모듈.
 * api.ts ↔ api/auth.ts 순환 참조(require cycle)를 끊기 위해 분리했다.
 * (api.ts 는 auth 의 getMemoryToken 이, auth.ts 는 이 URL 이 필요했음)
 */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://signal-desk-api-production.up.railway.app'
