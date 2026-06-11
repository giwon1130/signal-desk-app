import { useCallback, useMemo, useRef, useState } from 'react'
import type { ToastType } from '../components/Toast'

export function useToast(duration = 2200) {
  const [visible, setVisible] = useState(false)
  const [message, setMessage] = useState('')
  const [type,    setType]    = useState<ToastType>('success')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = useCallback((msg: string, t: ToastType = 'success') => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setMessage(msg)
    setType(t)
    setVisible(true)
    timerRef.current = setTimeout(() => setVisible(false), duration)
  }, [duration])

  // 객체 identity 유지 — 매 렌더 새 리터럴이면 toast 를 deps 로 갖는 useCallback/memo 가 전부 무효화된다.
  return useMemo(() => ({ visible, message, type, show }), [visible, message, type, show])
}
