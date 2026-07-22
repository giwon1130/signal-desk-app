/**
 * 리딩 글 카드 — 피드(ReadingTab)와 리더 프로필(LeaderProfileModal) 공용.
 */
import { memo } from 'react'
import { Text, View } from 'react-native'
import { TrendingUp } from 'lucide-react-native'
import { useTheme } from '../../theme'
import type { ReadingCall, ReadingPost } from '../../types'
import { callStatusBadge, fmtPct, fmtPrice, returnColor } from './readingShared'
import { PressableScale } from '../effects'

// memo — 피드/프로필 글 목록에서 부모 상태 변화 시 변경 없는 글이 재렌더되지 않게.
// onPressLeader 는 (leaderUserId)=>void 안정 참조를 받아 인라인 클로저 없이 memo 가 동작하도록.
export const PostCard = memo(function PostCard({ post, onPressLeader, showLeader = true }: {
  post: ReadingPost
  onPressLeader?: (leaderUserId: string) => void
  showLeader?: boolean
}) {
  const { palette } = useTheme()
  const isPublic = post.visibility === 'PUBLIC'
  return (
    <View style={{ paddingVertical: 12, borderTopWidth: 1, borderTopColor: palette.border, gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {showLeader ? (
          <PressableScale onPress={() => onPressLeader?.(post.leaderUserId)} accessibilityLabel={`${post.leaderName} 프로필`} scaleTo={0.93} style={{ borderRadius: 999 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingRight: 8, paddingVertical: 3, borderRadius: 999 }}>
              <View style={{ width: 22, height: 22, borderRadius: 8, backgroundColor: palette.greenSoft, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: palette.brandAccent, fontSize: 10, fontWeight: '900' }}>{post.leaderName.slice(0, 1)}</Text>
              </View>
              <Text style={{ color: palette.inkSub, fontSize: 12, fontWeight: '900' }}>{post.leaderName}</Text>
            </View>
          </PressableScale>
        ) : null}
        <View style={{
          backgroundColor: (isPublic ? palette.blue : palette.inkMuted) + '22',
          borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1,
        }}>
          <Text style={{ color: isPublic ? palette.blue : palette.inkMuted, fontSize: 9, fontWeight: '800' }}>
            {isPublic ? '전체공개' : '구독자'}
          </Text>
        </View>
        <View style={{ flex: 1 }} />
        <Text style={{ color: palette.inkFaint, fontSize: 10 }}>{formatWhen(post.createdAt)}</Text>
      </View>
      <Text style={{ color: palette.ink, fontSize: 15, fontWeight: '800' }}>{post.title}</Text>
      {post.body ? (
        <Text style={{ color: palette.inkMuted, fontSize: 13, lineHeight: 19 }}>{post.body}</Text>
      ) : null}
      {post.calls.length > 0 ? (
        <View style={{ gap: 6, marginTop: 2 }}>
          {post.calls.map((c) => <CallRow key={c.id} call={c} palette={palette} />)}
        </View>
      ) : null}
    </View>
  )
})

function CallRow({ call, palette }: { call: ReadingCall; palette: any }) {
  const ret = call.returnPct
  const retColor = returnColor(ret, palette)
  const flag = call.market === 'KR' ? '🇰🇷' : '🇺🇸'
  const badge = callStatusBadge(call.status, palette)
  const closed = call.status === 'CLOSED'
  return (
    <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: palette.surfaceAlt, borderRadius: 12,
        borderWidth: 1, borderColor: palette.borderLight,
        paddingHorizontal: 11, paddingVertical: 9,
        opacity: closed ? 0.6 : 1,
      }}>
      <Text style={{ fontSize: 12 }}>{flag}</Text>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ color: palette.ink, fontSize: 13, fontWeight: '800' }}>{call.name}</Text>
          {badge ? (
            <View style={{ backgroundColor: badge.color + '22', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 }}>
              <Text style={{ color: badge.color, fontSize: 9, fontWeight: '900' }}>{badge.label}</Text>
            </View>
          ) : null}
        </View>
        <Text style={{ color: palette.inkFaint, fontSize: 10 }}>
          진입 {fmtPrice(call.entryPrice, call.entryCurrency)}
          {call.currentPrice != null ? ` → ${fmtPrice(call.currentPrice, call.entryCurrency)}` : ''}
          {call.targetReturnPct != null ? ` · 목표 ${fmtPct(call.targetReturnPct, 0)}` : ''}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end', minWidth: 56 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
          {ret != null ? <TrendingUp size={12} color={retColor} strokeWidth={2.5} /> : null}
          <Text style={{ color: retColor, fontSize: 13, fontWeight: '900', fontVariant: ['tabular-nums'] }}>
            {ret == null ? '—' : fmtPct(ret)}
          </Text>
        </View>
        <Text style={{ color: palette.inkFaint, fontSize: 8.5, fontWeight: '700', marginTop: 1 }}>
          {ret == null ? '시세대기' : closed ? '최종 수익' : '콜 이후'}
        </Text>
      </View>
    </View>
  )
}

function formatWhen(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return '방금'
  if (min < 60) return `${min}분 전`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}시간 전`
  return `${Math.floor(hr / 24)}일 전`
}
