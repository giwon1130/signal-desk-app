import AsyncStorage from '@react-native-async-storage/async-storage'

/**
 * 온보딩 완료 플래그 — v2 신규.
 *
 * - v2 신규 사용자: marketPreference 없음 → 온보딩 진입 → 완료 시 markCompleted
 * - v1 → v2 업그레이드 사용자: marketPreference 있음 → 온보딩 자동 스킵 + markCompleted
 * - 이미 완료된 사용자: 스킵
 *
 * "다시 보기" 메뉴는 v2.0 에선 없음 — 설정에서 marketPreference 변경만 가능.
 */
const KEY = 'signal:onboarding:completed'
const V2_MIGRATION_KEY = 'signal:v2:migration:shown'

export async function getOnboardingCompleted(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(KEY)
    return v === 'true'
  } catch {
    return false
  }
}

export async function markOnboardingCompleted(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, 'true')
  } catch {
    // ignore — 다음 실행에 다시 시도
  }
}

/** v1 사용자가 v2 첫 진입 시 마이그레이션 모달 본 적 있나 — 1회 노출 후 마크. */
export async function getV2MigrationShown(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(V2_MIGRATION_KEY)) === 'true'
  } catch {
    return false
  }
}

export async function markV2MigrationShown(): Promise<void> {
  try {
    await AsyncStorage.setItem(V2_MIGRATION_KEY, 'true')
  } catch {
    // ignore
  }
}
