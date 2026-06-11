import { useCallback, useState } from 'react'
import type { TabKey } from '../types'

/**
 * v2.1: 리그(친구 모의투자) 오케스트레이션 — 생성 모달 + 리그 탭 새로고침 트리거 +
 * 리그 상세 모달 + 코드/링크 참가(닉네임 입력) 모달 상태와 핸들러.
 */
export function useLeagueOrchestration(setActiveTab: (key: TabKey) => void) {
  const [createLeagueOpen, setCreateLeagueOpen] = useState(false)
  const [leagueRefreshTick, setLeagueRefreshTick] = useState(0)
  const [activeLeagueId, setActiveLeagueId] = useState<string | null>(null)
  // v2.1: 코드/링크로 참가 — 닉네임 입력 모달
  const [joinModalCode, setJoinModalCode] = useState<string | null>(null)

  // v2.1: League 푸시 deep link — 리그 탭 + 상세 모달 자동 진입.
  const handleOpenLeagueFromPush = useCallback((leagueId: string) => {
    setActiveTab('league')
    setActiveLeagueId(leagueId)
  }, [setActiveTab])

  // v2.1: 코드 입력 / 링크로 참가 요청 → 닉네임 모달 오픈.
  const handleRequestJoin = useCallback((code: string) => {
    setActiveTab('league')
    setJoinModalCode(code)
  }, [setActiveTab])

  const handleLeagueCreated = useCallback((id: string) => {
    setLeagueRefreshTick((t) => t + 1)
    setActiveLeagueId(id)  // 만든 직후 바로 상세 진입
  }, [])

  const handleLeagueJoined = useCallback((id: string) => {
    setJoinModalCode(null)
    setLeagueRefreshTick((t) => t + 1)
    setActiveLeagueId(id)  // 참가 직후 바로 상세 진입
  }, [])

  return {
    createLeagueOpen, setCreateLeagueOpen,
    leagueRefreshTick,
    activeLeagueId, setActiveLeagueId,
    joinModalCode, setJoinModalCode,
    handleOpenLeagueFromPush, handleRequestJoin,
    handleLeagueCreated, handleLeagueJoined,
  }
}
