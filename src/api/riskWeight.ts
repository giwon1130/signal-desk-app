import { API_BASE_URL } from '../api'

/** 시장 분위기(합성 위험도) 가중 프리셋 — 서버 RiskWeightPreset enum 과 1:1. */
export type RiskWeightPresetId = 'BALANCED' | 'FX_SENSITIVE' | 'RATE_SENSITIVE' | 'DEFENSIVE' | 'AGGRESSIVE'

export type RiskWeightOption = {
  id: RiskWeightPresetId
  label: string
  description: string
}

export type RiskWeightInfo = {
  preset: RiskWeightPresetId
  customizable: boolean        // PRO 여부 — false 면 잠금
  options: RiskWeightOption[]
}

export const DEFAULT_RISK_WEIGHT: RiskWeightInfo = {
  preset: 'BALANCED',
  customizable: false,
  options: [
    { id: 'BALANCED', label: '균형', description: '기본 가중 — 시장 영향력 순 차등' },
    { id: 'FX_SENSITIVE', label: '환율 민감', description: '원/달러 환율 비중을 강하게' },
    { id: 'RATE_SENSITIVE', label: '금리 민감', description: '미 10년물 금리 비중을 강하게' },
    { id: 'DEFENSIVE', label: '방어형', description: '변동성·거시 위험을 더 크게 반영(보수적)' },
    { id: 'AGGRESSIVE', label: '공격형', description: '뉴스·지정학 노이즈는 줄이고 가격·변동성 위주' },
  ],
}

export async function getRiskWeight(authToken: string): Promise<RiskWeightInfo> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/me/risk-weight`, {
      headers: { Accept: 'application/json', Authorization: `Bearer ${authToken}` },
    })
    if (!res.ok) return DEFAULT_RISK_WEIGHT
    return (await res.json()) as RiskWeightInfo
  } catch {
    return DEFAULT_RISK_WEIGHT
  }
}

/** 프리셋 변경(PRO 전용). 실패 시 null — 호출부에서 토스트/롤백. */
export async function updateRiskWeight(authToken: string, preset: RiskWeightPresetId): Promise<RiskWeightInfo | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/me/risk-weight`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ preset }),
    })
    if (!res.ok) return null
    return (await res.json()) as RiskWeightInfo
  } catch {
    return null
  }
}
