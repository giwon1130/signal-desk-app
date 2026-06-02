/**
 * 공용 API 에러 → 사용자 친절 메시지.
 *
 * 우선순위:
 *  1. 네트워크 장애(오프라인/타임아웃) → "네트워크 연결을 확인해줘."
 *  2. 서버가 준 사람이 읽을 메시지({"error": "..."} 본문 또는 throw 된 텍스트)
 *  3. fallback
 *
 * 백엔드는 모든 에러를 `{"error": "<한국어 메시지>"}` 로 주고, api 클라이언트가
 * 그 텍스트를 Error.message 로 throw 하므로 여기서 그대로 노출하면 된다.
 */
export function apiErrorMessage(e: unknown, fallback = '문제가 생겼습니다. 잠시 후 다시 시도해 주세요.'): string {
  const raw = (e instanceof Error ? e.message : String(e ?? '')).trim()
  const lower = raw.toLowerCase()

  // 1) 네트워크 레벨 (fetch reject)
  if (
    lower.includes('network') || lower.includes('failed to fetch') ||
    lower.includes('timeout') || lower.includes('timed out') ||
    lower.includes('econnrefused') || lower.includes('load failed')
  ) {
    return '네트워크 연결을 확인해 주세요.'
  }

  // 2) 서버가 준 친절 메시지로 보이면 그대로 (영문 코드/JSON/스택은 제외)
  if (raw && isHumanMessage(raw)) {
    // {"error":"..."} 형태면 추출
    try {
      const j = JSON.parse(raw)
      if (j && typeof j.error === 'string' && j.error) return j.error
    } catch { /* not json */ }
    return raw
  }

  return fallback
}

/** 사람이 읽을 한국어/문장형 메시지인지(영문 코드 'xxx-failed', 긴 스택 등 제외). */
function isHumanMessage(s: string): boolean {
  if (s.length > 120) return false
  if (/^[a-z][a-z0-9]*(-[a-z0-9]+)+$/.test(s)) return false // 'create-league-failed' 류
  if (s.startsWith('{') && !s.includes('"error"')) return false
  if (/internal server error/i.test(s)) return false
  return true
}
