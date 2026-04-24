import { Platform, Pressable, Text, View, Linking } from 'react-native'
import { useTheme } from '../theme'

/**
 * 웹 전용 푸터. 로그인 화면 / 메인 쉘 바닥에 배치.
 * 네이티브에선 렌더 안 함 (앱은 스토어 정보 자체가 UI 밖에 있으니).
 */
export function WebFooter() {
  const { palette } = useTheme()
  if (Platform.OS !== 'web') return null

  const year = new Date().getFullYear()

  return (
    <View
      style={{
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderTopWidth: 1,
        borderTopColor: palette.border,
        alignItems: 'center',
        gap: 4,
      }}
    >
      <Text style={{ color: palette.inkFaint, fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>
        SIGNAL DESK
      </Text>
      <Text style={{ color: palette.inkMuted, fontSize: 11, textAlign: 'center', lineHeight: 16 }}>
        © {year} Signal Desk · 시장/종목/단타 시그널을 한눈에
      </Text>
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
        <Pressable onPress={() => void Linking.openURL('https://github.com/giwon1130/signal-desk-app')}>
          <Text style={{ color: palette.blue, fontSize: 11, fontWeight: '700' }}>GitHub</Text>
        </Pressable>
        <Text style={{ color: palette.inkFaint, fontSize: 11 }}>·</Text>
        <Pressable onPress={() => void Linking.openURL('https://signal-desk-api-production.up.railway.app/health')}>
          <Text style={{ color: palette.blue, fontSize: 11, fontWeight: '700' }}>API 상태</Text>
        </Pressable>
      </View>
    </View>
  )
}
