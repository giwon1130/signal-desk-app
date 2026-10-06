export type TradingSession = { market: 'KR' | 'US'; tradingDate: string; opensAt: string; closesAt: string; earlyClose: boolean }
export type TradingCalendar = { generatedAt: string; sessions: TradingSession[]; coverageThrough: Record<string, string> }

export function marketReminderSchedule(calendar: TradingCalendar, enabled: { KR: boolean; US: boolean }, minutes: number, now = Date.now()) {
  const before = [5, 10, 15, 30, 60].includes(minutes) ? minutes : 10
  const generated = Date.parse(calendar.generatedAt)
  if (!Number.isFinite(generated) || generated > now + 60_000 || now - generated > 86_400_000) return []
  const seen = new Set<string>()
  return calendar.sessions.flatMap((session) => {
    if (!['KR', 'US'].includes(session.market) || !enabled[session.market]) return []
    if (!calendar.coverageThrough[session.market] || session.tradingDate > calendar.coverageThrough[session.market]) return []
    const opens = Date.parse(session.opensAt)
    const closes = Date.parse(session.closesAt)
    const at = opens - before * 60_000
    const id = `reminder.${session.market === 'KR' ? 'krOpen' : 'usOpen'}.${session.tradingDate}`
    if (seen.has(id) || !Number.isFinite(at) || !(closes > opens) || at <= now || opens > now + 28 * 86_400_000) return []
    seen.add(id)
    return [{ id, market: session.market, at, minutesBefore: before, earlyClose: session.earlyClose }]
  }).sort((a, b) => a.at - b.at).slice(0, 40)
}
