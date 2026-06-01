/**
 * 리딩 글 작성 모달 — 제목/본문 작성 → 종목 자동 인식 → 작성자 확정 → 게시.
 *
 * §12: 종목 오탐 방지 위해 검출 결과는 후보일 뿐, 체크한 종목만 콜로 등록.
 * 각 콜에 목표 수익률(%) 지정 (비우면 기본 +15%). 하락 콜은 음수 입력.
 * spec: docs/leading-call-spec.md
 */
import { useState } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Megaphone, Search, X } from 'lucide-react-native'
import { useTheme } from '../../theme'
import type { CallInput, DetectedMention, PostVisibility } from '../../types'
import { detectMentions, publishPost } from '../../api/reading'

type Props = {
  visible: boolean
  onClose: () => void
  onPublished: () => void
  toast?: { show: (msg: string, type?: 'success' | 'error' | 'info') => void }
}

type Candidate = DetectedMention & { selected: boolean; targetText: string }

export function ComposePostModal({ visible, onClose, onPublished, toast }: Props) {
  const { palette } = useTheme()
  const insets = useSafeAreaInsets()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [visibility, setVisibility] = useState<PostVisibility>('FOLLOWERS')
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [detecting, setDetecting] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [detected, setDetected] = useState(false)

  const reset = () => {
    setTitle(''); setBody(''); setVisibility('FOLLOWERS')
    setCandidates([]); setDetected(false)
  }

  const handleClose = () => { reset(); onClose() }

  const handleDetect = async () => {
    if (!body.trim() || detecting) return
    setDetecting(true)
    try {
      const found = await detectMentions(body)
      setCandidates(found.map((m) => ({ ...m, selected: m.confidence === 'HIGH', targetText: '' })))
      setDetected(true)
      if (found.length === 0) toast?.show('인식된 종목이 없어요. 직접 확인해주세요.', 'info')
    } catch {
      toast?.show('종목 인식 실패', 'error')
    } finally {
      setDetecting(false)
    }
  }

  const toggle = (i: number) =>
    setCandidates((cs) => cs.map((c, idx) => (idx === i ? { ...c, selected: !c.selected } : c)))

  const setTarget = (i: number, v: string) =>
    setCandidates((cs) => cs.map((c, idx) => (idx === i ? { ...c, targetText: v } : c)))

  const handlePublish = async () => {
    if (!title.trim() || publishing) return
    const calls: CallInput[] = candidates
      .filter((c) => c.selected)
      .map((c) => {
        const t = c.targetText.trim()
        const parsed = t === '' ? null : Number(t)
        return {
          market: c.market,
          ticker: c.ticker,
          name: c.name,
          targetReturnPct: parsed != null && Number.isFinite(parsed) ? parsed : null,
        }
      })
    setPublishing(true)
    try {
      await publishPost({ title: title.trim(), body: body.trim(), visibility, calls })
      toast?.show('리딩 게시 완료', 'success')
      reset()
      onPublished()
      onClose()
    } catch {
      toast?.show('게시 실패 — 시세 확인 후 재시도', 'error')
    } finally {
      setPublishing(false)
    }
  }

  const selectedCount = candidates.filter((c) => c.selected).length

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom }}>
        {/* 헤더 */}
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          paddingHorizontal: 16, paddingVertical: 14,
          borderBottomWidth: 1, borderBottomColor: palette.border, gap: 10,
        }}>
          <Megaphone size={20} color={palette.brandAccent} strokeWidth={2.5} />
          <Text style={{ flex: 1, color: palette.ink, fontSize: 17, fontWeight: '900' }}>새 리딩 쓰기</Text>
          <Pressable onPress={handleClose} hitSlop={20} accessibilityLabel="닫기">
            <X size={20} color={palette.inkMuted} strokeWidth={2.5} />
          </Pressable>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 18, gap: 18 }} keyboardShouldPersistTaps="handled">
          {/* 제목 */}
          <View style={{ gap: 6 }}>
            <Text style={{ color: palette.inkMuted, fontSize: 12, fontWeight: '700' }}>제목</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="예: 오늘 반도체 시황 + 관심 종목"
              placeholderTextColor={palette.inkFaint}
              maxLength={80}
              style={inputStyle(palette)}
            />
          </View>

          {/* 본문 */}
          <View style={{ gap: 6 }}>
            <Text style={{ color: palette.inkMuted, fontSize: 12, fontWeight: '700' }}>본문</Text>
            <TextInput
              value={body}
              onChangeText={setBody}
              placeholder={'시황과 종목 의견을 자유롭게 적어주세요.\n종목명을 적거나 $005930, $AAPL 형태로 쓰면 자동 인식돼요.'}
              placeholderTextColor={palette.inkFaint}
              multiline
              style={[inputStyle(palette), { minHeight: 140, textAlignVertical: 'top' }]}
            />
          </View>

          {/* 종목 인식 */}
          <Pressable
            onPress={() => void handleDetect()}
            disabled={!body.trim() || detecting}
            style={({ pressed }) => ({
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
              backgroundColor: pressed ? palette.surfaceAlt : palette.surface,
              borderWidth: 1, borderColor: palette.border, borderRadius: 10, paddingVertical: 11,
              opacity: !body.trim() || detecting ? 0.5 : 1,
            })}
          >
            {detecting ? <ActivityIndicator size="small" color={palette.brandAccent} />
              : <Search size={14} color={palette.brandAccent} strokeWidth={2.5} />}
            <Text style={{ color: palette.ink, fontSize: 13, fontWeight: '800' }}>
              {detecting ? '인식 중…' : '본문에서 종목 인식'}
            </Text>
          </Pressable>

          {/* 검출 결과 — 확정 */}
          {detected ? (
            <View style={{ gap: 8 }}>
              <Text style={{ color: palette.inkMuted, fontSize: 12, fontWeight: '700' }}>
                등록할 종목 확정 ({selectedCount}개) · 목표% 비우면 기본 +15%
              </Text>
              {candidates.length === 0 ? (
                <Text style={{ color: palette.inkFaint, fontSize: 12 }}>인식된 종목이 없습니다.</Text>
              ) : (
                candidates.map((c, i) => (
                  <View
                    key={`${c.market}:${c.ticker}`}
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 8,
                      backgroundColor: palette.surface, borderWidth: 1,
                      borderColor: c.selected ? palette.brandAccent : palette.border,
                      borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8,
                    }}
                  >
                    <Pressable onPress={() => toggle(i)} hitSlop={8} style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ fontSize: 14 }}>{c.selected ? '☑️' : '⬜'}</Text>
                        <Text style={{ color: palette.ink, fontSize: 13, fontWeight: '800' }}>
                          {c.market === 'KR' ? '🇰🇷' : '🇺🇸'} {c.name}
                        </Text>
                        <Text style={{ color: palette.inkFaint, fontSize: 10 }}>
                          {c.ticker}{c.confidence === 'MEDIUM' ? ' · 추정' : ''}
                        </Text>
                      </View>
                    </Pressable>
                    <TextInput
                      value={c.targetText}
                      onChangeText={(v) => setTarget(i, v)}
                      placeholder="목표%"
                      placeholderTextColor={palette.inkFaint}
                      keyboardType="numbers-and-punctuation"
                      style={{
                        width: 64, textAlign: 'center',
                        backgroundColor: palette.surfaceAlt, color: palette.ink,
                        borderWidth: 1, borderColor: palette.border, borderRadius: 8,
                        paddingVertical: 7, fontSize: 12, fontWeight: '700',
                      }}
                    />
                  </View>
                ))
              )}
            </View>
          ) : null}

          {/* 게시 */}
          <Pressable
            onPress={() => void handlePublish()}
            disabled={!title.trim() || publishing}
            style={({ pressed }) => ({
              backgroundColor: pressed ? palette.brandAccent + 'cc' : palette.brandAccent,
              borderRadius: 12, paddingVertical: 14, alignItems: 'center',
              opacity: !title.trim() || publishing ? 0.5 : 1,
            })}
          >
            <Text style={{ color: palette.bg, fontSize: 15, fontWeight: '900' }}>
              {publishing ? '게시 중…' : selectedCount > 0 ? `게시 + ${selectedCount}개 콜 박제` : '게시'}
            </Text>
          </Pressable>
          <Text style={{ color: palette.inkFaint, fontSize: 10, textAlign: 'center', lineHeight: 15 }}>
            게시 즉시 선택 종목의 현재 시세가 진입가로 박제됩니다. 투자 권유가 아닌 개인 의견입니다.
          </Text>
        </ScrollView>
      </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

function inputStyle(palette: ReturnType<typeof useTheme>['palette']) {
  return {
    backgroundColor: palette.surface, color: palette.ink,
    borderWidth: 1, borderColor: palette.border, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, fontWeight: '600' as const,
  }
}
