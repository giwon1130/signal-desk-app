import { useCallback, useMemo, useRef, useState } from 'react'
import type { ToastType } from '../components/Toast'

export type ToastAction = { label: string; onPress: () => void }

export function useToast(duration = 2200) {
  const [visible, setVisible] = useState(false)
  const [message, setMessage] = useState('')
  const [type,    setType]    = useState<ToastType>('success')
  const [action,  setAction]  = useState<ToastAction | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 액션이 있으면 탭할 시간을 주려 약간 더 길게 표시.
  const show = useCallback((msg: string, t: ToastType = 'success', a: ToastAction | null = null) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setMessage(msg)
    setType(t)
    setAction(a)
    setVisible(true)
    timerRef.current = setTimeout(() => setVisible(false), a ? duration + 2000 : duration)
  }, [duration])

  // 객체 identity 유지 — 매 렌더 새 리터럴이면 toast 를 deps 로 갖는 useCallback/memo 가 전부 무효화된다.
  return useMemo(() => ({ visible, message, type, action, show }), [visible, message, type, action, show])
}
