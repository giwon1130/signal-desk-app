/**
 * 운영자 콘솔 (웹 전용) — admin 계정에만 사이드바 탭 노출.
 * 핵심 지표 + 사용자 목록/플랜 전환(FREE ↔ PRO). 결제 인프라 전까지의 수동 운영 도구.
 */
import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native'
import { RefreshCcw, ShieldCheck } from 'lucide-react-native'
import { useTheme, type Palette } from '../theme'
import { webGrid } from './shared'
import {
  changeUserPlan, fetchAdminOverview, fetchAdminUsers, fetchPlanRequests, resolvePlanRequest,
  type AdminOverview, type AdminUser, type PlanRequest,
} from '../api/admin'

export function AdminPage() {
  const { palette } = useTheme()
  const [overview, setOverview] = useState<AdminOverview | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [requests, setRequests] = useState<PlanRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [changingId, setChangingId] = useState('')

  const load = async () => {
    setLoading(true)
    const [o, u, r] = await Promise.all([fetchAdminOverview(), fetchAdminUsers(), fetchPlanRequests()])
    setOverview(o); setUsers(u); setRequests(r); setLoading(false)
  }
  useEffect(() => { void load() }, [])

  const handleResolve = async (req: PlanRequest, action: 'approve' | 'dismiss') => {
    if (changingId) return
    setChangingId(req.userId)
    const ok = await resolvePlanRequest(req.userId, action)
    if (ok) {
      setRequests((list) => list.filter((x) => x.userId !== req.userId))
      if (action === 'approve') {
        setUsers((list) => list.map((x) => (x.id === req.userId ? { ...x, plan: 'PRO' } : x)))
      }
    }
    setChangingId('')
  }

  const togglePlan = async (u: AdminUser) => {
    if (changingId) return
    setChangingId(u.id)
    const next = u.plan === 'PRO' ? 'FREE' : 'PRO'
    const ok = await changeUserPlan(u.id, next)
    if (ok) setUsers((list) => list.map((x) => (x.id === u.id ? { ...x, plan: next } : x)))
    setChangingId('')
  }

  const stats: Array<{ label: string; value: number | string }> = overview ? [
    { label: '전체 사용자', value: overview.totalUsers },
    { label: 'PRO 사용자', value: overview.proUsers },
    { label: '푸시 디바이스', value: overview.pushDevices },
    { label: '관심종목 수', value: overview.watchItems },
    { label: '보유종목 수', value: overview.portfolioPositions },
    { label: '오늘 AI 질문', value: overview.assistantQuestionsToday },
    { label: '오늘 발송 알림', value: overview.alertsSentToday },
  ] : []

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 14, paddingBottom: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <ShieldCheck size={18} color={palette.teal ?? '#0d9488'} strokeWidth={2.5} />
        <Text style={{ flex: 1, color: palette.ink, fontSize: 18, fontWeight: '900' }}>운영자 콘솔</Text>
        <Pressable onPress={() => void load()} hitSlop={8} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
          <RefreshCcw size={16} color={palette.inkMuted} strokeWidth={2.4} />
        </Pressable>
      </View>

      {loading && !overview ? (
        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
          <ActivityIndicator color={palette.teal ?? '#0d9488'} />
        </View>
      ) : (
        <>
          {/* 핵심 지표 */}
          <View style={[{ gap: 10 }, webGrid('repeat(auto-fit, minmax(140px, 1fr))')]}>
            {stats.map((s) => (
              <View key={s.label} style={{ backgroundColor: palette.surface, borderRadius: 12, borderWidth: 1, borderColor: palette.border, paddingHorizontal: 14, paddingVertical: 12, gap: 2 }}>
                <Text style={{ color: palette.inkMuted, fontSize: 10.5, fontWeight: '700' }}>{s.label}</Text>
                <Text style={{ color: palette.ink, fontSize: 22, fontWeight: '900', fontVariant: ['tabular-nums'] }}>{s.value}</Text>
              </View>
            ))}
          </View>

          {/* PRO 신청 대기 — 있을 때만 표시 */}
          {requests.length > 0 ? (
            <View style={{ backgroundColor: (palette.purpleSoft ?? palette.surface), borderRadius: 12, borderWidth: 1, borderColor: palette.purple ?? '#7c3aed', padding: 14, gap: 4 }}>
              <Text style={{ color: palette.purple ?? '#7c3aed', fontSize: 11, fontWeight: '800', letterSpacing: 0.4, marginBottom: 6 }}>
                💎 PRO 신청 대기 ({requests.length})
              </Text>
              {requests.map((r) => (
                <View key={r.userId} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: palette.border }}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text numberOfLines={1} style={{ color: palette.ink, fontSize: 13, fontWeight: '700' }}>
                      {r.nickname} <Text style={{ color: palette.inkMuted, fontWeight: '500' }}>{r.email}</Text>
                    </Text>
                    <Text style={{ color: palette.inkFaint, fontSize: 10.5 }}>신청 {r.requestedAt.slice(0, 16).replace('T', ' ')}</Text>
                  </View>
                  <Pressable
                    onPress={() => void handleResolve(r, 'approve')}
                    disabled={changingId === r.userId}
                    style={({ pressed }) => ({
                      paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
                      backgroundColor: palette.purple ?? '#7c3aed',
                      opacity: pressed || changingId === r.userId ? 0.6 : 1,
                    })}
                  >
                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>승인</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => void handleResolve(r, 'dismiss')}
                    disabled={changingId === r.userId}
                    style={({ pressed }) => ({
                      paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
                      backgroundColor: palette.surfaceAlt, borderWidth: 1, borderColor: palette.border,
                      opacity: pressed || changingId === r.userId ? 0.6 : 1,
                    })}
                  >
                    <Text style={{ color: palette.inkSub, fontSize: 11, fontWeight: '800' }}>보류</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}

          {/* 사용자 목록 */}
          <View style={{ backgroundColor: palette.surface, borderRadius: 12, borderWidth: 1, borderColor: palette.border, padding: 14, gap: 4 }}>
            <Text style={{ color: palette.inkMuted, fontSize: 11, fontWeight: '800', letterSpacing: 0.4, marginBottom: 6 }}>
              사용자 ({users.length}) — 플랜 버튼으로 FREE ↔ PRO 전환
            </Text>
            {users.map((u) => {
              const pro = u.plan === 'PRO'
              return (
                <View key={u.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: palette.border }}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text numberOfLines={1} style={{ color: palette.ink, fontSize: 13, fontWeight: '700' }}>
                      {u.nickname} <Text style={{ color: palette.inkMuted, fontWeight: '500' }}>{u.email}</Text>
                    </Text>
                    <Text style={{ color: palette.inkFaint, fontSize: 10.5 }}>
                      가입 {u.createdAt.slice(0, 10)} · 오늘 AI 질문 {u.questionsToday}회
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => void togglePlan(u)}
                    disabled={changingId === u.id}
                    style={({ pressed }) => ({
                      paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
                      backgroundColor: pro ? (palette.purple ?? '#7c3aed') : palette.surfaceAlt,
                      borderWidth: 1, borderColor: pro ? (palette.purple ?? '#7c3aed') : palette.border,
                      opacity: pressed || changingId === u.id ? 0.6 : 1,
                    })}
                  >
                    <Text style={{ color: pro ? '#fff' : palette.inkSub, fontSize: 11, fontWeight: '800' }}>
                      {changingId === u.id ? '...' : u.plan}
                    </Text>
                  </Pressable>
                </View>
              )
            })}
          </View>
        </>
      )}
    </ScrollView>
  )
}
