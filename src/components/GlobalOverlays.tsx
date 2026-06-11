import { useEffect, useRef, useState, type ComponentProps } from 'react'
import { Animated, Platform } from 'react-native'
import { Toast } from './Toast'
import { StockDetailModal, type StockDetailContext } from './StockDetailModal'
import { ReminderSettingsModal } from './ReminderSettingsModal'
import { RecentAlertsModal } from './RecentAlertsModal'
import { V2MigrationModal } from './V2MigrationModal'
import { CreateLeagueModal } from './league_parts/CreateLeagueModal'
import { LeagueDetailModal } from './league_parts/LeagueDetailModal'
import { JoinLeagueModal } from './league_parts/JoinLeagueModal'
import { ComposePostModal } from './reading_parts/ComposePostModal'
import { LeaderProfileModal } from './reading_parts/LeaderProfileModal'
import { SettingsModal } from './SettingsModal'
import { DailyGreetingModal } from './DailyGreetingModal'
import { AssistantModal } from './AssistantModal'
import { LoadingScreen } from './LoadingScreen'
import { CommandPalette } from '../web/CommandPalette'
import { useTheme } from '../theme'
import { markV2MigrationShown } from '../utils/onboarding'
import type { MarketPreference } from '../api/alertPreferences'
import type { AuthUser } from '../api/auth'
import type { useToast } from '../hooks/useToast'
import type { useAlertsInbox } from '../hooks/useAlertsInbox'
import type { useLeagueOrchestration } from '../hooks/useLeagueOrchestration'
import type { useReadingOrchestration } from '../hooks/useReadingOrchestration'
import type { AlertHistoryItem, DailyFortune, MarketSummaryData, TabKey, WatchItem } from '../types'

type StockDetailModalProps = ComponentProps<typeof StockDetailModal>

type Props = {
  user: AuthUser
  toast: ReturnType<typeof useToast>
  loading: boolean
  marketPreference: MarketPreference
  summary: MarketSummaryData | null
  fortune: DailyFortune | null
  watchlist: WatchItem[]
  alertHistory: AlertHistoryItem[]
  // 종목 상세
  detailKey: string
  detailContext: StockDetailContext | null
  onCloseDetail: () => void
  onToggleWatch: StockDetailModalProps['onToggleWatch']
  onSaveWatchAlerts: StockDetailModalProps['onSaveWatchAlerts']
  onSavePortfolio: StockDetailModalProps['onSavePortfolio']
  onDeletePortfolio: (id: string) => Promise<void>
  // 공통 내비/오픈
  onOpenDetail: (market: string, ticker: string, name?: string) => void
  onNavigateTab: (tab: TabKey) => void
  // 알림 설정 / 알림함
  reminderOpen: boolean
  setReminderOpen: (v: boolean) => void
  alerts: ReturnType<typeof useAlertsInbox>
  // v1 → v2 마이그레이션
  v2MigrationOpen: boolean
  setV2MigrationOpen: (v: boolean) => void
  onV2MigrationConfirm: (p: MarketPreference) => Promise<void>
  // 리그 / 리딩
  league: ReturnType<typeof useLeagueOrchestration>
  reading: ReturnType<typeof useReadingOrchestration>
  // 통합 설정
  settingsOpen: boolean
  setSettingsOpen: (v: boolean) => void
  onMarketPreferenceChange: (p: MarketPreference) => void
  onLogout: () => void
  onDeleteAccount: () => void
  // 오늘의 운세 팝업
  greetingOpen: boolean
  setGreetingOpen: (v: boolean) => void
  assistantOpen: boolean
  setAssistantOpen: (v: boolean) => void
}

/**
 * 전역 모달/오버레이 스택 — 웹·네이티브 레이아웃이 공유.
 * (종목 상세·알림함·설정·리그·리딩·마이그레이션·운세·토스트·로딩 오버레이)
 */
export function GlobalOverlays({
  user, toast, loading, marketPreference, summary, fortune, watchlist, alertHistory,
  detailKey, detailContext, onCloseDetail, onToggleWatch, onSaveWatchAlerts, onSavePortfolio, onDeletePortfolio,
  onOpenDetail, onNavigateTab,
  reminderOpen, setReminderOpen, alerts,
  v2MigrationOpen, setV2MigrationOpen, onV2MigrationConfirm,
  league, reading,
  settingsOpen, setSettingsOpen, onMarketPreferenceChange, onLogout, onDeleteAccount,
  greetingOpen, setGreetingOpen,
  assistantOpen, setAssistantOpen,
}: Props) {
  const { mode, setMode } = useTheme()

  return (
    <>
      <Toast visible={toast.visible} message={toast.message} type={toast.type} />
      <StockDetailModal
        visible={!!detailKey}
        onClose={onCloseDetail}
        context={detailContext}
        onToggleWatch={onToggleWatch}
        onSaveWatchAlerts={onSaveWatchAlerts}
        onSavePortfolio={onSavePortfolio}
        onDeletePortfolio={(id) => void onDeletePortfolio(id)}
      />
      <ReminderSettingsModal
        visible={reminderOpen}
        authToken={user?.token ?? null}
        onClose={() => setReminderOpen(false)}
      />
      <RecentAlertsModal
        visible={alerts.alertsOpen}
        alerts={alertHistory}
        unreadIds={alerts.alertUnreadIds}
        onClose={() => alerts.setAlertsOpen(false)}
        onOpenDetail={onOpenDetail}
        onDelete={alerts.handleDeleteAlert}
        onClearAll={alerts.handleClearAlerts}
      />
      <V2MigrationModal
        visible={v2MigrationOpen}
        currentPreference={marketPreference}
        onConfirm={(p) => void onV2MigrationConfirm(p)}
        onClose={() => {
          setV2MigrationOpen(false)
          void markV2MigrationShown()
        }}
      />
      <CreateLeagueModal
        visible={league.createLeagueOpen}
        onClose={() => league.setCreateLeagueOpen(false)}
        onCreated={league.handleLeagueCreated}
        toast={toast}
      />
      <LeagueDetailModal
        visible={!!league.activeLeagueId}
        leagueId={league.activeLeagueId}
        myUserId={user?.userId}
        marketSessions={summary?.marketSessions ?? []}
        onClose={() => league.setActiveLeagueId(null)}
        toast={toast}
      />
      <JoinLeagueModal
        visible={!!league.joinModalCode}
        code={league.joinModalCode ?? ''}
        onClose={() => league.setJoinModalCode(null)}
        onJoined={league.handleLeagueJoined}
        toast={toast}
      />
      <ComposePostModal
        visible={reading.composeOpen}
        onClose={() => reading.setComposeOpen(false)}
        onPublished={reading.handleReadingRefresh}
        toast={toast}
      />
      <LeaderProfileModal
        visible={!!reading.activeLeaderId}
        leaderUserId={reading.activeLeaderId}
        myUserId={user?.userId}
        onClose={() => reading.setActiveLeaderId(null)}
        onSubscribed={reading.handleReadingRefresh}
        toast={toast}
      />
      <SettingsModal
        visible={settingsOpen}
        user={user}
        marketPreference={marketPreference}
        themeMode={mode}
        authToken={user?.token ?? null}
        onClose={() => setSettingsOpen(false)}
        onMarketPreferenceChange={onMarketPreferenceChange}
        onThemeChange={(m) => setMode(m)}
        onOpenReminder={() => setReminderOpen(true)}
        onLogout={() => { setSettingsOpen(false); onLogout() }}
        onDeleteAccount={() => { setSettingsOpen(false); onDeleteAccount() }}
      />
      <DailyGreetingModal
        visible={greetingOpen}
        fortune={fortune ?? null}
        onClose={() => setGreetingOpen(false)}
      />
      {/* 시데 AI — 글로벌 1개 인스턴스 (mounted 유지로 세션 동안 대화 보존) */}
      <AssistantModal visible={assistantOpen} onClose={() => setAssistantOpen(false)} />
      {Platform.OS === 'web' ? (
        <CommandPalette
          watchlist={watchlist}
          onNavigateTab={onNavigateTab}
          onOpenDetail={onOpenDetail}
          onOpenReminder={() => setReminderOpen(true)}
        />
      ) : null}

      {/* 로딩 오버레이 — 헤더·탭바 포함 전체를 덮어 로딩 중 탭 전환 차단 (#1) */}
      <LoadingOverlay loading={loading} />
    </>
  )
}

/** 로딩 → 메인 진입을 페이드로 — 뚝 바뀌지 않게 오버레이가 서서히 걷힌다. */
function LoadingOverlay({ loading }: { loading: boolean }) {
  const [mounted, setMounted] = useState(loading)
  const opacity = useRef(new Animated.Value(loading ? 1 : 0)).current
  useEffect(() => {
    if (loading) {
      setMounted(true)
      opacity.setValue(1)
      return
    }
    Animated.timing(opacity, { toValue: 0, duration: 420, useNativeDriver: true })
      .start(({ finished }) => { if (finished) setMounted(false) })
  }, [loading, opacity])
  if (!mounted) return null
  return (
    <Animated.View
      pointerEvents={loading ? 'auto' : 'none'}
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, opacity }}
    >
      <LoadingScreen />
    </Animated.View>
  )
}
