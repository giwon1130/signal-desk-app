/** 좁은 화면에서는 브랜드·동작과 시장 선택을 두 줄로 분리한다. */
import { Pressable, Text, View } from 'react-native'
import { Bell, Settings as SettingsIcon, TrendingUp } from 'lucide-react-native'
import { useTheme } from '../../theme'
import { MarketProfileChip } from '../../components/MarketProfileChip'
import type { MarketPreference } from '../../api/alertPreferences'

export function NarrowHeader({
  isUp, lastSyncedAt, onOpenSettings, onOpenAlerts,
  marketPreference, onMarketPreferenceChange,
}: {
  isUp: boolean
  lastSyncedAt: string
  onOpenSettings: () => void
  onOpenAlerts: () => void
  marketPreference: MarketPreference
  onMarketPreferenceChange: (p: MarketPreference) => void
}) {
  const { palette } = useTheme()
  return (
    <View style={{
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: palette.border,
      backgroundColor: palette.surface,
      gap: 6,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View style={{
        width: 26, height: 26, borderRadius: 7,
        backgroundColor: palette.brand,
        alignItems: 'center', justifyContent: 'center',
      }}>
        <TrendingUp size={14} color={palette.brandAccent} strokeWidth={2.5} />
      </View>
      <Text style={{ color: palette.ink, fontSize: 14, fontWeight: '800' }}>Signal Desk</Text>
      <View style={{ flex: 1 }} />
      <Pressable accessibilityRole="button" accessibilityLabel="알림함" onPress={onOpenAlerts} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
        <Bell size={18} color={palette.inkSub} />
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="설정" onPress={onOpenSettings} style={({ pressed }) => [{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 }]}>
        <SettingsIcon size={18} color={palette.inkSub} />
      </Pressable>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <View style={{
        paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
        backgroundColor: isUp ? palette.greenSoft : palette.redSoft,
        flexDirection: 'row', alignItems: 'center', gap: 5,
      }}>
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: isUp ? palette.green : palette.red }} />
        <Text style={{ color: isUp ? palette.green : palette.red, fontSize: 10, fontWeight: '800' }}>
          {isUp ? '서버 연결' : '연결 확인 필요'}
        </Text>
      </View>
      <MarketProfileChip value={marketPreference} onChange={onMarketPreferenceChange} textLabels />
      </View>
    </View>
  )
}
