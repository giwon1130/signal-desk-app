import type { Palette } from '../theme'
import { type StyleObj } from './util'

// AuthScreen 은 자체 스타일을 갖고 있고, 현재 styles.ts 에는 auth 전용 키가 없음.
// 향후 AuthScreen 을 useStyles 로 마이그레이션할 때 채울 자리.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function authStyles(_C: Palette): StyleObj {
  return {}
}
