import { Platform } from 'react-native'

/**
 * 웹 번들에서만 딱 한번 실행되는 DOM 초기화 헬퍼.
 *
 * - viewport meta 에 viewport-fit=cover 를 붙여 iOS 사파리 노치/홈 인디케이터 영역을
 *   안전하게 사용할 수 있도록.
 * - body 배경색과 폰트 스무딩을 앱 테마와 맞춰 "브라우저가 잠깐 흰색으로 깜빡"
 *   하는 문제를 방지.
 * - <html> 에 기본 스크롤 제거 (앱은 SafeAreaView 안에서 자체 스크롤).
 */
let bootstrapped = false
export function webBootstrap(themeBg: string) {
  if (Platform.OS !== 'web') return
  if (typeof document === 'undefined') return
  if (bootstrapped) {
    document.body.style.backgroundColor = themeBg
    return
  }
  bootstrapped = true

  // viewport meta 보강
  let meta = document.querySelector<HTMLMetaElement>('meta[name=viewport]')
  if (!meta) {
    meta = document.createElement('meta')
    meta.name = 'viewport'
    document.head.appendChild(meta)
  }
  meta.setAttribute(
    'content',
    'width=device-width, initial-scale=1, viewport-fit=cover, shrink-to-fit=no',
  )

  // 전역 스타일
  const style = document.createElement('style')
  style.setAttribute('data-signal-desk-global', 'true')
  style.textContent = `
    html, body, #root { height: 100%; margin: 0; }
    body {
      background-color: ${themeBg};
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      overscroll-behavior: none;
    }
    /* iOS 사파리 전용 safe-area — SafeAreaView 가 처리 안 하는 노치 영역 보정 */
    @supports (padding: max(0px)) {
      body {
        padding-top:    env(safe-area-inset-top);
        padding-left:   env(safe-area-inset-left);
        padding-right:  env(safe-area-inset-right);
        padding-bottom: env(safe-area-inset-bottom);
      }
    }
  `
  document.head.appendChild(style)
}
