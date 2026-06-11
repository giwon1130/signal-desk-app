import { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { clearAllAlerts, deleteAlert as deleteAlertApi, markAlertsRead } from '../api/pushDevice'
import { hapticLight } from '../utils/haptics'
import type { AlertHistoryItem } from '../types'

type Args = {
  token: string | null
  alertHistory: AlertHistoryItem[]
  setAlertHistory: Dispatch<SetStateAction<AlertHistoryItem[]>>
}

/**
 * 알림함(최근 받은 알림) 상태 + 핸들러 — 열람/삭제/전체 비우기.
 *
 * 열람 시 서버 읽음 처리(markAlertsRead) + 로컬 readAt 갱신을 하되,
 * 열람 시점의 '안 읽음' id 스냅샷(alertUnreadIds)을 유지해 이번 세션엔 점 표시를 남긴다.
 */
export function useAlertsInbox({ token, alertHistory, setAlertHistory }: Args) {
  const [alertsOpen, setAlertsOpen] = useState(false)
  // 알림함 열람 시점의 '안 읽음' id 스냅샷 — 열면 서버에서 읽음 처리되지만 이번 세션엔 점 표시 유지.
  const [alertUnreadIds, setAlertUnreadIds] = useState<Set<string>>(new Set())
  const unreadAlertCount = alertHistory.reduce((n, a) => (a.readAt ? n : n + 1), 0)

  const handleOpenAlerts = () => {
    void hapticLight()
    setAlertUnreadIds(new Set(alertHistory.filter((a) => !a.readAt).map((a) => a.id)))
    setAlertsOpen(true)
    if (alertHistory.some((a) => !a.readAt)) {
      if (token) void markAlertsRead(token)
      const now = new Date().toISOString()
      setAlertHistory((prev) => prev.map((a) => (a.readAt ? a : { ...a, readAt: now })))
    }
  }

  const handleDeleteAlert = (id: string) => {
    if (token) void deleteAlertApi(token, id)
    setAlertHistory((prev) => prev.filter((a) => a.id !== id))
  }

  const handleClearAlerts = () => {
    if (token) void clearAllAlerts(token)
    setAlertHistory([])
    setAlertsOpen(false)
  }

  return {
    alertsOpen, setAlertsOpen,
    alertUnreadIds, unreadAlertCount,
    handleOpenAlerts, handleDeleteAlert, handleClearAlerts,
  }
}
