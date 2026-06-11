import { API_BASE_URL, authedFetch } from '../api'

type AskResponse = {
  success: boolean
  answer: string | null
  error?: string | null
  /** 오늘 남은 질문 수 — 무제한이면 null */
  remaining?: number | null
  dailyLimit?: number | null
}

export type AskResult = {
  answer: string | null
  error: string | null
  remaining: number | null
  dailyLimit: number | null
}

export type HistoryTurn = { role: 'user' | 'assistant'; text: string }

/**
 * 시데 AI 비서 — 질문/답변 (인증 필요). history 로 직전 대화를 보내면 후속 질문 맥락이 이어진다.
 * 실패 시 사용자에게 보여줄 에러 메시지를 담아 반환한다 (throw 하지 않음).
 */
export async function askAssistant(question: string, history: HistoryTurn[] = []): Promise<AskResult> {
  try {
    const res = await authedFetch(`${API_BASE_URL}/api/v1/assistant/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ question, history: history.slice(-6) }),
    })
    if (res.status === 429) return { answer: null, error: '질문이 너무 잦아요 — 잠시 후 다시 시도해 주세요.', remaining: null, dailyLimit: null }
    const json = (await res.json()) as AskResponse
    const remaining = json.remaining ?? null
    const dailyLimit = json.dailyLimit ?? null
    if (json.success && json.answer) return { answer: json.answer, error: null, remaining, dailyLimit }
    return { answer: null, error: json.error ?? '답변을 만들지 못했어요. 잠시 후 다시 시도해 주세요.', remaining, dailyLimit }
  } catch {
    return { answer: null, error: '서버에 연결할 수 없어요.', remaining: null, dailyLimit: null }
  }
}
