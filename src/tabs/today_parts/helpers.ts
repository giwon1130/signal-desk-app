import type { UserPickStatus } from '../../types'

export const toneColor = (tone: string) =>
  tone === '긍정' ? '#dc2626' : tone === '부정' ? '#2563eb' : '#94a3b8'

export const slotLabel = (slot: string | undefined) => {
  switch (slot) {
    case 'PRE_MARKET': return '장 전'
    case 'INTRADAY':   return '장 중'
    case 'POST_MARKET': return '마감 후'
    case 'WEEKEND':    return '주말'
    case 'HOLIDAY':    return '휴장'
    default:           return '오늘'
  }
}

export const userStatusLabel = (status: UserPickStatus | undefined) => {
  switch (status) {
    case 'HELD':    return '보유'
    case 'WATCHED': return '관심'
    default:        return '신규'
  }
}

export const priorityColor = (priority: string) => {
  switch (priority) {
    case 'high':   return '#dc2626'
    case 'medium': return '#f59e0b'
    default:       return '#94a3b8'
  }
}

export const fortuneToneColor = (tone: string) => {
  if (tone === 'good') return '#dc2626'    // 빨강 (상승색)
  if (tone === 'bad')  return '#2563eb'    // 파랑 (하락색)
  return '#94a3b8'                          // 중립 회색
}
