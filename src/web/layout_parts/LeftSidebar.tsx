/**
 * 데스크톱 좌측 고정 사이드바 — 브랜드 + LIVE 배지 + 네비 + 하단 유저/툴.
 */
import { Pressable, Text, View } from 'react-native'
import { Bell, LogOut, Moon, Sun, TrendingUp } from 'lucide-react-native'
import { useTheme } from '../../theme'
import { hapticLight } from '../../utils/haptics'
import type { TabKey } from '../../types'
import { SidebarAction } from './SidebarAction'
import { TABS } from './tabs-config'

type Props = {
  width: number
  user: { nickname?: string | null; email?: string | null } | null
  activeTab: TabKey
  isUp: boolean
  lastSyncedAt: string
  isDark: boolean
  onTabChange: (key: TabKey) => void
  onOpenReminder: () => void
  onToggleTheme: () => void
  onLogout: () => void
}

export function LeftSidebar({
  width, user, activeTab, isUp, lastSyncedAt, isDark,
  onTabChange, onOpenReminder, onToggleTheme, onLogout,
}: Props) {
  const { palette } = useTheme()
  return (
    <View
      style={{
        width,
        backgroundColor: palette.surface,
        borderRightWidth: 1,
        borderRightColor: palette.border,
        paddingVertical: 18,
        paddingHorizontal: 14,
        gap: 8,
      }}
    >
      {/* 브랜드 */}
      <View style={{ paddingHorizontal: 6, paddingBottom: 10, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{
            width: 28, height: 28, borderRadius: 8,
            backgroundColor: palette.brand,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <TrendingUp size={16} color={palette.brandAccent} strokeWidth={2.5} />
          </View>
          <Text style={{ color: palette.ink, fontSize: 15, fontWeight: '800' }}>Signal Desk</Text>
        </View>
      </View>

      {/* 상태 배지 */}
      <View style={{
        marginHorizontal: 6,
        marginBottom: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: isUp ? palette.greenSoft : palette.redSoft,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
      }}>
        <View style={{
          width: 7, height: 7, borderRadius: 4,
          backgroundColor: isUp ? palette.green : palette.red,
        }} />
        <Text style={{
          color: isUp ? palette.green : palette.red,
          fontSize: 10, fontWeight: '800', letterSpacing: 0.5,
        }}>{isUp ? 'LIVE' : 'OFFLINE'}</Text>
        <View style={{ flex: 1 }} />
        {lastSyncedAt ? (
          <Text style={{ color: palette.inkMuted, fontSize: 9 }}>{lastSyncedAt}</Text>
        ) : null}
      </View>

      {/* 네비 */}
      <View style={{ gap: 2 }}>
        {TABS.map(({ key, label, Icon }) => {
          const active = activeTab === key
          return (
            <Pressable
              key={key}
              onPress={() => { if (!active) { void hapticLight(); onTabChange(key) } }}
              style={(state) => {
                const { pressed } = state
                const hovered = (state as { hovered?: boolean }).hovered
                return [{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  paddingHorizontal: 10,
                  paddingVertical: 9,
                  borderRadius: 8,
                  backgroundColor: active
                    ? palette.blueSoft
                    : hovered ? palette.surfaceAlt : 'transparent',
                  opacity: pressed ? 0.75 : 1,
                }]
              }}
            >
              <Icon
                size={16}
                color={active ? palette.blue : palette.inkMuted}
                strokeWidth={active ? 2.5 : 2}
              />
              <Text style={{
                color: active ? palette.blue : palette.inkSub,
                fontSize: 13,
                fontWeight: active ? '800' : '600',
              }}>{label}</Text>
            </Pressable>
          )
        })}
      </View>

      {/* 하단 — 유저/툴 */}
      <View style={{ flex: 1 }} />
      <View style={{
        borderTopWidth: 1,
        borderTopColor: palette.border,
        paddingTop: 10,
        gap: 6,
      }}>
        {user ? (
          <View style={{ paddingHorizontal: 6, paddingBottom: 4 }}>
            <Text style={{ color: palette.inkMuted, fontSize: 10, fontWeight: '700' }}>로그인됨</Text>
            <Text style={{ color: palette.ink, fontSize: 12, fontWeight: '700' }} numberOfLines={1}>
              {user.nickname || user.email || '—'}
            </Text>
          </View>
        ) : null}
        <SidebarAction
          icon={<Bell size={14} color={palette.inkSub} />}
          label="알림 설정"
          onPress={onOpenReminder}
        />
        <SidebarAction
          icon={isDark ? <Sun size={14} color={palette.orange} /> : <Moon size={14} color={palette.inkSub} />}
          label={isDark ? '라이트 모드' : '다크 모드'}
          onPress={onToggleTheme}
        />
        <SidebarAction
          icon={<LogOut size={14} color={palette.red} />}
          label="로그아웃"
          onPress={onLogout}
          danger
        />
      </View>
    </View>
  )
}
