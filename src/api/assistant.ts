import { API_BASE_URL, authedFetch } from '../api'

type AskResponse = { success: boolean; answer: string | null; error?: string | null }

/**
 * 시데 AI 비서 — 단발 질문/답변 (인증 필요).
 * 실패 시 사용자에게 보여줄 에러 메시지를 담아 반환한다 (throw 하지 않음).
 */
export async function askAssistant(question: string): Promise<{ answer: string | null; error: string | null }> {
  try {
    const res = await authedFetch(`${API_BASE_URL}/api/v1/assistant/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ question }),
    })
    if (res.status === 429) return { answer: null, error: '질문이 너무 잦아요 — 잠시 후 다시 시도해 주세요.' }
    const json = (await res.json()) as AskResponse
    if (json.success && json.answer) return { answer: json.answer, error: null }
    return { answer: null, error: json.error ?? '답변을 만들지 못했어요. 잠시 후 다시 시도해 주세요.' }
  } catch {
    return { answer: null, error: '서버에 연결할 수 없어요.' }
  }
}
