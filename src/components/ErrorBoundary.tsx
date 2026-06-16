import { Component, type ReactNode } from 'react'
import { Platform, Pressable, Text, View } from 'react-native'

type Props = { children: ReactNode }
type State = { hasError: boolean }

/**
 * 최상위 에러 경계 — 렌더 중 잡히지 않은 예외로 앱 전체가 흰 화면이 되는 것을 막는다.
 * 폴백 UI 는 테마/컨텍스트에 의존하지 않는 고정 색상(테마 자체가 원인이어도 안전).
 * "다시 시도": 웹은 새로고침, 네이티브는 경계 상태만 리셋해 하위 트리를 재마운트.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: unknown, info: unknown) {
    // 콘솔/네이티브 로그로 남김(원격 수집기 붙이면 여기서 전송).
    console.error('[ErrorBoundary] uncaught render error', error, info)
  }

  private reset = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') window.location.reload()
    else this.setState({ hasError: false })
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#0b0e14', gap: 12 }}>
        <Text style={{ color: '#e6e9ef', fontSize: 16, fontWeight: '800' }}>일시적인 오류가 발생했어요</Text>
        <Text style={{ color: '#9aa3b2', fontSize: 13, textAlign: 'center', lineHeight: 19 }}>
          화면을 그리는 중 문제가 생겼습니다. 다시 시도해 주세요. 계속되면 앱을 재시작해 주세요.
        </Text>
        <Pressable
          onPress={this.reset}
          accessibilityRole="button"
          accessibilityLabel="다시 시도"
          style={({ pressed }) => ({
            backgroundColor: pressed ? '#2f6fd0' : '#3b82f6',
            borderRadius: 10, paddingHorizontal: 20, paddingVertical: 11, marginTop: 4,
          })}
        >
          <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '800' }}>다시 시도</Text>
        </Pressable>
      </View>
    )
  }
}
