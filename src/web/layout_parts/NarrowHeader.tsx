/**
 * 좁은 뷰포트(모바일 폭) 상단 헤더 — 브랜드 + LIVE 배지 + 시장 칩 + 톱니(통합 설정).
 * v2.1: 종/Sun/로그아웃 3개 → 톱니 1개 (모바일 폭 단순화). 설정 모달이 다 처리.
 */
import { Pressable, Text, View } from 'react-native'
import { Settings as SettingsIcon, TrendingUp } from 'lucide-react-native'
import { useTheme } from '../../theme'
import { MarketProfileChip } from '../../components/MarketProfileChip'
import type { MarketPreference } from '../../api/alertPreferences'

export function NarrowHeader({
  isUp, lastSyncedAt, onOpenSettings,
  marketPreference, onMarketPreferenceChange,
}: {
  isUp: boolean
  lastSyncedAt: string
  onOpenSettings: () => void
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
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    }}>
      <View style={{
        width: 26, height: 26, borderRadius: 7,
        backgroundColor: palette.brand,
        alignItems: 'center', justifyContent: 'center',
      }}>
        <TrendingUp size={14} color={palette.brandAccent} strokeWidth={2.5} />
      </View>
      <Text style={{ color: palette.ink, fontSize: 14, fontWeight: '800' }}>Signal Desk</Text>
      <View style={{
        marginLeft: 6,
        paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
        backgroundColor: isUp ? palette.greenSoft : palette.redSoft,
        flexDirection: 'row', alignItems: 'center', gap: 5,
      }}>
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: isUp ? palette.green : palette.red }} />
        <Text style={{ color: isUp ? palette.green : palette.red, fontSize: 10, fontWeight: '800' }}>
          {isUp ? 'LIVE' : 'OFF'}
        </Text>
      </View>
      <View style={{ flex: 1 }} />
      <MarketProfileChip value={marketPreference} onChange={onMarketPreferenceChange} />
      {lastSyncedAt ? (
        <Text style={{ color: palette.inkFaint, fontSize: 10, fontWeight: '600' }}>{lastSyncedAt}</Text>
      ) : null}
      <Pressable onPress={onOpenSettings} style={({ pressed }) => [{ padding: 6, opacity: pressed ? 0.6 : 1 }]}>
        <SettingsIcon size={15} color={palette.inkSub} />
      </Pressable>
    </View>
  )
}
