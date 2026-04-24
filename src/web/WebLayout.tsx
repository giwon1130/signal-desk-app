import { Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native'
import type { ReactNode } from 'react'
import { BarChart3, Bell, Bot, Home, LogOut, Moon, Sun, Sunrise, TrendingUp } from 'lucide-react-native'
import { useTheme } from '../theme'
import { hapticLight } from '../utils/haptics'
import type { TabKey } from '../types'
import { WebFooter } from '../components/WebFooter'

/**
 * 웹 전용 셸.
 * - 좌측 220px 사이드바: 브랜드/탭 네비/상태 배지/테마 토글/로그아웃
 * - 본문: 풀폭 (최대 1400px 센터링), 상단 미니 헤더 + 콘텐츠 스크롤
 * - 좁은 뷰포트(<960px)에선 사이드바 숨기고 상단 탭바 모드로 폴백
 *
 * 모바일 셸은 App.tsx 에서 Platform.OS !== 'web' 브랜치가 담당. 여기는 "웹에서만" 쓰임.
 */

const SIDEBAR_WIDTH = 220
const CONTENT_MAX_WIDTH = 1400
const MOBILE_BREAKPOINT = 960

const TABS: Array<{ key: TabKey; label: string; Icon: typeof Home }> = [
  { key: 'today',  label: '오늘', Icon: Sunrise },
  { key: 'home',   label: '홈',   Icon: Home },
  { key: 'market', label: '시장', Icon: TrendingUp },
  { key: 'stocks', label: '종목', Icon: BarChart3 },
  { key: 'ai',     label: 'AI',   Icon: Bot },
]

type Props = {
  user: { nickname?: string | null; email?: string | null } | null
  activeTab: TabKey
  isUp: boolean
  lastSyncedAt: string
  onTabChange: (key: TabKey) => void
  onLogout: () => void
  onOpenReminder: () => void
  children: ReactNode
}

export function WebLayout(props: Props) {
  const { user, activeTab, isUp, lastSyncedAt, onTabChange, onLogout, onOpenReminder, children } = props
  const { palette, toggle } = useTheme()
  const { width } = useWindowDimensions()
  const isNarrow = width < MOBILE_BREAKPOINT
  const isDark = palette.scheme === 'dark'

  // 좁은 뷰포트: 기존 모바일 셸 같은 "상단 탭 바" 모드
  if (isNarrow) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg }}>
        <NarrowHeader
          isUp={isUp}
          lastSyncedAt={lastSyncedAt}
          onOpenReminder={onOpenReminder}
          onToggleTheme={() => { void hapticLight(); toggle() }}
          onLogout={onLogout}
          isDark={isDark}
        />
        <NarrowTabBar activeTab={activeTab} onTabChange={onTabChange} />
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
          <View style={{ paddingHorizontal: 14, paddingTop: 10 }}>{children}</View>
          <WebFooter />
        </ScrollView>
      </View>
    )
  }

  // 넓은 뷰포트: 사이드바 + 메인
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg, flexDirection: 'row' }}>
      {/* ── 사이드바 ───────────────────────────────────────── */}
      <View
        style={{
          width: SIDEBAR_WIDTH,
          backgroundColor: palette.surface,
          borderRightWidth: 1,
          borderRightColor: palette.border,
          paddingVertical: 20,
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
          <Text style={{ color: palette.inkFaint, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginLeft: 36, marginTop: -2 }}>
            SIGNAL
          </Text>
        </View>

        {/* 상태 배지 */}
        <View style={{
          marginHorizontal: 6,
          marginBottom: 6,
          paddingHorizontal: 10,
          paddingVertical: 7,
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
            <Text style={{ color: palette.inkMuted, fontSize: 10 }}>{lastSyncedAt}</Text>
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
                // RN Web 의 Pressable 은 { hovered } 도 주지만 RN core 타입엔 없어서 캐스팅
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
            onPress={() => { void hapticLight(); toggle() }}
          />
          <SidebarAction
            icon={<LogOut size={14} color={palette.red} />}
            label="로그아웃"
            onPress={onLogout}
            danger
          />
        </View>
      </View>

      {/* ── 메인 ─────────────────────────────────────────── */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ minHeight: '100%' }}>
        <View style={{
          maxWidth: CONTENT_MAX_WIDTH,
          width: '100%',
          alignSelf: 'center',
          paddingHorizontal: 28,
          paddingVertical: 22,
          gap: 18,
        }}>
          <MainHeader activeTab={activeTab} lastSyncedAt={lastSyncedAt} />
          {children}
        </View>
        <WebFooter />
      </ScrollView>
    </View>
  )
}

/* ── 내부 컴포넌트 ─────────────────────────────────────────── */

function SidebarAction({ icon, label, onPress, danger }: { icon: ReactNode; label: string; onPress: () => void; danger?: boolean }) {
  const { palette } = useTheme()
  return (
    <Pressable
      onPress={onPress}
      style={(state) => {
        const { pressed } = state
        const hovered = (state as { hovered?: boolean }).hovered
        return [{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingHorizontal: 10,
          paddingVertical: 8,
          borderRadius: 8,
          backgroundColor: hovered ? (danger ? palette.redSoft : palette.surfaceAlt) : 'transparent',
          opacity: pressed ? 0.7 : 1,
        }]
      }}
    >
      {icon}
      <Text style={{
        color: danger ? palette.red : palette.inkSub,
        fontSize: 12,
        fontWeight: '700',
      }}>{label}</Text>
    </Pressable>
  )
}

function MainHeader({ activeTab, lastSyncedAt }: { activeTab: TabKey; lastSyncedAt: string }) {
  const { palette } = useTheme()
  const tabMeta = TABS.find((t) => t.key === activeTab)
  const tabLabel = tabMeta?.label ?? ''
  const descriptionMap: Record<TabKey, string> = {
    today:  '오늘의 시장 상태와 단타 후보를 한눈에',
    home:   '관심종목과 보유 포트폴리오 요약',
    market: 'KR/US 지수·섹터·Top Movers',
    stocks: '종목 탐색과 관심종목 관리',
    ai:     'AI 추천 로그와 성과 분석',
  }
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
      <View style={{ gap: 2 }}>
        <Text style={{ color: palette.inkFaint, fontSize: 10, fontWeight: '800', letterSpacing: 2 }}>
          SIGNAL DESK
        </Text>
        <Text style={{ color: palette.ink, fontSize: 22, fontWeight: '800' }}>{tabLabel}</Text>
        <Text style={{ color: palette.inkMuted, fontSize: 12 }}>{descriptionMap[activeTab]}</Text>
      </View>
      {lastSyncedAt ? (
        <Text style={{ color: palette.inkFaint, fontSize: 11, fontWeight: '600' }}>
          마지막 동기화 {lastSyncedAt}
        </Text>
      ) : null}
    </View>
  )
}

/* ── 좁은 뷰포트용 (사이드바 숨김 폴백) ─────────────────────── */

function NarrowHeader({
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

function NarrowTabBar({ activeTab, onTabChange }: { activeTab: TabKey; onTabChange: (k: TabKey) => void }) {
  const { palette } = useTheme()
  return (
    <View style={{
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: palette.border,
      backgroundColor: palette.surface,
      paddingHorizontal: 4,
    }}>
      {TABS.map(({ key, label, Icon }) => {
        const active = activeTab === key
        return (
          <Pressable
            key={key}
            onPress={() => { if (!active) { void hapticLight(); onTabChange(key) } }}
            style={({ pressed }) => [
              {
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 8,
                gap: 2,
                opacity: pressed ? 0.6 : 1,
                borderBottomWidth: 2,
                borderBottomColor: active ? palette.blue : 'transparent',
              },
            ]}
          >
            <Icon size={16} color={active ? palette.blue : palette.inkFaint} strokeWidth={active ? 2.5 : 1.8} />
            <Text style={{
              color: active ? palette.blue : palette.inkFaint,
              fontSize: 10, fontWeight: active ? '800' : '600',
            }}>{label}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

