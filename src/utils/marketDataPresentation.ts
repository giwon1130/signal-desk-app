export function formatChartDate(date: string | null | undefined): string {
  if (!date) return '기준일 미확인'
  return /^\d{8}$/.test(date) ? `${date.slice(0, 4)}.${date.slice(4, 6)}.${date.slice(6, 8)}` : date
}

export function earningsCoverageNote(status?: string): string | null {
  if (!status) return null
  return status === 'AVAILABLE'
    ? '미국 실적은 주요 25종목과 내 관심·보유 종목을 확인합니다. 제공 범위 밖 일정이나 변경 사항은 누락될 수 있습니다.'
    : '미국 실적 일정을 현재 확인하지 못했습니다. 일정이 없다는 뜻은 아니며, 기업 IR 공지를 함께 확인해 주세요.'
}
