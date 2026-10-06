import { useState } from 'react'
import { Linking, Pressable, Text, View } from 'react-native'
import type { MoverReason } from '../types'
import { useTheme } from '../theme'
import { moveContextLabel, safeEvidenceUrl } from '../utils/moverContext'

/** A sibling of the stock button, never a nested press target. Shared by mobile and web. */
export function MoverContextDetails({ reason }: { reason?: MoverReason }) {
  const { palette } = useTheme()
  const [open, setOpen] = useState(false)
  const [linkError, setLinkError] = useState(false)
  if (!reason) return null
  const context = reason.context
  return <View style={{ gap: 5, marginBottom: 10 }}>
    <Text style={{ color: palette.inkMuted, fontSize: 12, lineHeight: 18 }}>
      {context?.summary ?? reason.reason}
    </Text>
    {context ? <>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }}
        accessibilityLabel={`${reason.name} 소식과 출처 ${open ? '닫기' : '열기'}`} onPress={() => setOpen(!open)}
        style={{ minHeight: 36, justifyContent: 'center', alignSelf: 'flex-start' }}>
        <Text style={{ color: palette.teal, fontSize: 11, fontWeight: '700' }}>{moveContextLabel(context.status)} · {open ? '닫기' : '출처 보기'}</Text>
      </Pressable>
      {open ? <View style={{ gap: 9, borderLeftWidth: 2, borderLeftColor: palette.border, paddingLeft: 8 }}>
        {context.evidence.map((e) => <View key={`${e.kind}-${e.url}`} style={{ gap: 3 }}>
          <Text style={{ color: palette.inkFaint, fontSize: 10 }}>{e.kind === 'DISCLOSURE' ? '공시' : e.kind === 'NEWS' ? '관련 보도' : '시장 비교'} · {e.source}</Text>
          <Text style={{ color: palette.ink, fontSize: 12, lineHeight: 18 }}>{e.title}</Text>
          <Text style={{ color: palette.inkFaint, fontSize: 10 }}>{e.publishedAt ? new Date(e.publishedAt).toLocaleString('ko-KR') : `${e.publishedDate ?? '날짜 미확인'} · 발표 시각 미확인`}</Text>
          {safeEvidenceUrl(e.url) ? <Pressable accessibilityRole="link" onPress={() => { setLinkError(false); void Linking.openURL(e.url).catch(() => setLinkError(true)) }} style={{ minHeight: 36, justifyContent: 'center' }}>
            <Text style={{ color: palette.teal, fontSize: 11 }}>원문 확인</Text>
          </Pressable> : null}
        </View>)}
        {context.notes.map((note) => <Text key={note} style={{ color: palette.inkMuted, fontSize: 11, lineHeight: 16 }}>{note}</Text>)}
        <Text style={{ color: palette.inkFaint, fontSize: 10, lineHeight: 15 }}>{context.sourceChecks.map((c) => `${c.source}: ${c.status === 'SUCCESS' ? '조회 완료' : c.status === 'COLLECTED_ONLY' ? '수집분 조회' : c.status === 'DISABLED' ? '미연결' : '조회 지연'}`).join(' · ')}</Text>
        {linkError ? <Text style={{ color: palette.inkMuted, fontSize: 11 }}>원문을 열지 못했습니다. 잠시 후 다시 시도해 주세요.</Text> : null}
      </View> : null}
    </> : null}
  </View>
}
