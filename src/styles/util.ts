// 도메인별 스타일에서 공용으로 쓰는 헬퍼.
export const makeShadow = (color: string) => ({
  sm: { shadowColor: color, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3,  elevation: 2 },
  md: { shadowColor: color, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8,  elevation: 4 },
  lg: { shadowColor: color, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 6 },
})

// 숫자 정렬용 — 모든 숫자 표기에 동일 폭 글리프를 강제해서 가격이 흔들리지 않도록.
export const tabularNums = { fontVariant: ['tabular-nums' as const] }

// 도메인 스타일 함수의 반환 타입. StyleSheet.create 가 합칠 때 키 타입을 살리되,
// flexDirection 같은 문자열 리터럴 타입을 일일이 `as const` 로 좁힐 필요가 없도록
// 헬퍼로 한 번만 단언해 둔다.
export type StyleObj = { [key: string]: any }
