/**
 * 시스템 헬스 배너 — 외부 의존성(Gemini 등) 일시 장애 안내.
 * 보통은 안 보이고, 장애 시에만 1줄 노출.
 */
import { Text, View } from 'react-native'
import { AlertCircle } from 'lucide-react-native'
import { useTheme } from '../theme'
import type { SystemStatus } from '../api/system'

type Props = {
  status: SystemStatus | null
}

export function SystemStatusBanner({ status }: Props) {
  const { palette } = useTheme()
  if (!status) return null
  if (status.gemini.healthy) return null

  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: palette.orangeSoft, borderRadius: 8,
      borderLeftWidth: 3, borderLeftColor: palette.orange,
      paddingHorizontal: 12, paddingVertical: 10,
      marginHorizontal: 14, marginTop: 8,
    }}>
      <AlertCircle size={14} color={palette.orange} strokeWidth={2.5} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: palette.orange, fontSize: 12, fontWeight: '800' }}>
          AI 분석 일시 지연
        </Text>
        <Text style={{ color: palette.inkSub, fontSize: 11 }}>
          Google Gemini 과부하 — 자동 복구 중. AI 픽·마켓 인사이트가 잠깐 비어있을 수 있습니다.
        </Text>
      </View>
    </View>
  )
}
