import { useCallback, useState } from 'react'

/**
 * v2.2: 리딩(종목·시황 콜 공유) 오케스트레이션 — 작성 모달 + 피드 새로고침 트리거 +
 * 리더 프로필 모달 + 구독 코드(딥링크 prefill) 상태와 핸들러.
 */
export function useReadingOrchestration() {
  const [composeOpen, setComposeOpen] = useState(false)
  const [readingRefreshTick, setReadingRefreshTick] = useState(0)
  const [activeLeaderId, setActiveLeaderId] = useState<string | null>(null)
  const [readingSubscribeCode, setReadingSubscribeCode] = useState<string | null>(null)

  // 게시/구독 후 피드 새로고침 트리거.
  const handleReadingRefresh = useCallback(() => {
    setReadingRefreshTick((t) => t + 1)
  }, [])

  return {
    composeOpen, setComposeOpen,
    readingRefreshTick,
    activeLeaderId, setActiveLeaderId,
    readingSubscribeCode, setReadingSubscribeCode,
    handleReadingRefresh,
  }
}
