import { Pressable, Text, View } from 'react-native'
import { BarChart3, Bell, Bot, Megaphone, Settings as SettingsIcon, Sunrise, Trophy } from 'lucide-react-native'
import { useStyles } from '../styles'
import { useTheme } from '../theme'
import type { MarketPreference } from '../api/alertPreferences'
import type { TabKey } from '../types'

// v2.2: 5탭 (today/stocks/ai/league/reading). reading 은 종목·시황 콜 공유 신규.
const TABS: Array<{ key: TabKey; label: string; Icon: typeof Sunrise }> = [
  { key: 'today',   label: '오늘', Icon: Sunrise },
  { key: 'stocks',  label: '종목', Icon: BarChart3 },
  { key: 'ai',      label: 'AI',   Icon: Bot },
  { key: 'league',  label: '리그', Icon: Trophy },
  { key: 'reading', label: '리딩', Icon: Megaphone },
]

type Props = {
  isUp: boolean
  lastSyncedAt: string | null
  marketPreference: MarketPreference
  unreadAlertCount: number
  activeTab: TabKey
  onOpenAlerts: () => void
  onOpenSettings: () => void
  onTabChange: (key: TabKey) => void
}

/** 네이티브 셸 크롬 — 상단 헤더(LIVE 핍·알림함·설정) + 5탭 탭바. */
export function NativeShellChrome({
  isUp, lastSyncedAt, marketPreference, unreadAlertCount, activeTab,
  onOpenAlerts, onOpenSettings, onTabChange,
}: Props) {
  const styles = useStyles()
  const { palette } = useTheme()

  return (
    <>
      {/* ── 헤더 ─────────────────────────────────────── */}
      <View style={styles.headerWrap}>
        <View style={styles.headerGradient}>
          <View style={styles.headerTopRow}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, flexShrink: 1 }}>
              <Text style={styles.headerTitle} numberOfLines={1}>투자 대시보드</Text>
              <Text style={styles.brand}>SIGNAL</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={[styles.headerStatusPill, isUp ? styles.headerStatusPillUp : styles.headerStatusPillDown]}>
                <View style={[styles.headerStatusDot, isUp ? styles.headerStatusDotUp : styles.headerStatusDotDown]} />
                <Text style={[styles.headerStatusText, isUp ? styles.headerStatusTextUp : styles.headerStatusTextDown]}>
                  {isUp ? 'LIVE' : 'OFF'}
                </Text>
              </View>
              {/* 최근 받은 알림 — 종 아이콘. 미수신 시에도 진입은 가능 */}
              <Pressable
                onPress={onOpenAlerts}
                style={({ pressed }) => [styles.headerIconBtn, pressed && { opacity: 0.6 }]}
                accessibilityLabel="최근 받은 알림"
                hitSlop={6}
              >
                <Bell size={18} color={palette.orange ?? '#ea580c'} strokeWidth={2.4} />
                {unreadAlertCount > 0 ? (
                  <View style={styles.headerIconBadge}>
                    <Text style={styles.headerIconBadgeText}>{unreadAlertCount > 9 ? '9+' : unreadAlertCount}</Text>
                  </View>
                ) : null}
              </Pressable>
              {/* v2.2: 설정 진입 — 시장 선호도 여기로 이동. 잘 보이도록 라벨+테두리 강조 */}
              <Pressable
                onPress={onOpenSettings}
                style={({ pressed }) => [styles.themeToggleBtn, pressed && { opacity: 0.6 }]}
                accessibilityLabel="설정"
              >
                <SettingsIcon size={18} color={palette.blue} strokeWidth={2.4} />
                <Text style={{ color: palette.blue, fontSize: 11, fontWeight: '800' }}>설정</Text>
              </Pressable>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, gap: 8 }}>
            {/* v2.2: 시장 선호는 설정으로 이동 — 현재 선택만 작게 표시 */}
            <Text style={[styles.headerSubtitle, { flexShrink: 0 }]}>
              {marketPreference === 'KR' ? '🇰🇷 한국장' : marketPreference === 'US' ? '🇺🇸 미국장' : '🌐 한국·미국'}
            </Text>
            <Text style={[styles.headerSubtitle, { flexShrink: 1, textAlign: 'right' }]}>
              {lastSyncedAt ? `${lastSyncedAt}` : '오늘 하루를 한 화면에서'}
            </Text>
          </View>
        </View>
      </View>

      {/* ── 탭 바 ────────────────────────────────────── */}
      <View style={styles.tabBar}>
        {TABS.map(({ key, label, Icon }) => {
          const active = activeTab === key
          return (
            <Pressable
              key={key}
              onPress={() => onTabChange(key)}
              style={({ pressed }) => [styles.tabItem, active && styles.tabItemActive, pressed && styles.tabItemPressed]}
            >
              <Icon
                size={20}
                color={active ? palette.blue : palette.inkFaint}
                strokeWidth={active ? 2.5 : 1.8}
              />
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
              {active && <View style={styles.tabActiveBar} />}
            </Pressable>
          )
        })}
      </View>
    </>
  )
}
