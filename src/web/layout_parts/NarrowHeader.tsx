/**
 * 좁은 뷰포트(모바일 폭) 상단 헤더 — 브랜드 + LIVE 배지 + 알림/테마/로그아웃.
 */
import { Pressable, Text, View } from 'react-native'
import { Bell, LogOut, Moon, Sun, TrendingUp } from 'lucide-react-native'
import { useTheme } from '../../theme'

export function NarrowHeader({
  isUp, lastSyncedAt, onOpenReminder, onToggleTheme, onLogout, isDark,
}: {
  isUp: boolean; lastSyncedAt: string; onOpenReminder: () => void;
  onToggleTheme: () => void; onLogout: () => void; isDark: boolean;
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
      {lastSyncedAt ? (
        <Text style={{ color: palette.inkFaint, fontSize: 10, fontWeight: '600' }}>{lastSyncedAt}</Text>
      ) : null}
      <Pressable onPress={onOpenReminder} style={({ pressed }) => [{ padding: 6, opacity: pressed ? 0.6 : 1 }]}>
        <Bell size={15} color={palette.inkSub} />
      </Pressable>
      <Pressable onPress={onToggleTheme} style={({ pressed }) => [{ padding: 6, opacity: pressed ? 0.6 : 1 }]}>
        {isDark ? <Sun size={15} color={palette.orange} /> : <Moon size={15} color={palette.inkSub} />}
      </Pressable>
      <Pressable onPress={onLogout} style={({ pressed }) => [{ padding: 6, opacity: pressed ? 0.6 : 1 }]}>
        <LogOut size={15} color={palette.red} />
      </Pressable>
    </View>
  )
}
