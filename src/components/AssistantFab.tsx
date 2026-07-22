/**
 * 시데 AI 플로팅 버튼 — 어느 탭에서든 챗봇처럼 바로 연다.
 * 네이티브: 하단 지수 펄스 위 우측 / 웹: 우하단 고정 (인터콤 스타일).
 */
import { Platform, Pressable, View } from 'react-native'
import { Sparkles } from 'lucide-react-native'
import { useTheme } from '../theme'
import { hapticLight } from '../utils/haptics'

export function AssistantFab({ onPress }: { onPress: () => void }) {
  const { palette } = useTheme()

  return (
    <Pressable
      onPress={() => { void hapticLight(); onPress() }}
      accessibilityRole="button"
      accessibilityLabel="시데 AI에게 물어보기"
      style={{
        position: 'absolute',
        right: 16,
        // 네이티브는 하단 지수 펄스(≈36px)를 피해서, 웹은 여백만.
        bottom: Platform.OS === 'web' ? 24 : 52,
        zIndex: 50,
      }}
    >
      {({ pressed }) => (
        <View
          style={{
            width: 48, height: 48, borderRadius: 17,
            backgroundColor: palette.brandAccent,
            alignItems: 'center', justifyContent: 'center',
            borderWidth: 1, borderColor: palette.scheme === 'dark' ? '#70e9b5' : '#0e9b63',
            shadowColor: palette.shadowColor, shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
            elevation: 4,
            transform: [{ scale: pressed ? 0.94 : 1 }],
          }}
        >
          <Sparkles size={21} color="#07150f" strokeWidth={2.4} />
        </View>
      )}
    </Pressable>
  )
}
