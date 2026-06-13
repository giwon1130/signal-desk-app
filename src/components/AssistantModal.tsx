/**
 * 시데 AI 비서 (Phase 1) — 내 보유/관심/알림/시장 데이터를 아는 단발 질문/답변 채팅.
 * 대화 이력은 화면에만 유지(전송은 질문 단발) — 멀티턴은 Phase 2.
 */
import { useRef, useState } from 'react'
import {
  ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { RotateCcw, Send, Sparkles, X } from 'lucide-react-native'
import { useTheme } from '../theme'
import { askAssistant } from '../api/assistant'
import { requestPro } from '../api/plan'

type Props = { visible: boolean; onClose: () => void }
type Msg = { role: 'user' | 'assistant'; text: string; isError?: boolean }

const STARTERS = [
  '오늘 시장 분위기 어때?',
  '내 포트폴리오 점검해줘',
  '최근 받은 알림 요약해줘',
]

export function AssistantModal({ visible, onClose }: Props) {
  const { palette } = useTheme()
  const insets = useSafeAreaInsets()
  const scrollRef = useRef<ScrollView>(null)
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [asking, setAsking] = useState(false)
  // 오늘 남은 질문 수 — 서버 응답에 실려 옴 (무제한이면 null 유지)
  const [quota, setQuota] = useState<{ remaining: number; limit: number } | null>(null)
  // 한도 도달 → PRO 신청 CTA 노출
  const [showProCta, setShowProCta] = useState(false)
  const [proRequesting, setProRequesting] = useState(false)

  const send = async (raw?: string) => {
    const q = (raw ?? input).trim()
    if (!q || asking) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', text: q }])
    setAsking(true)
    try {
      // 직전 대화(에러 버블 제외)를 함께 보내 후속 질문 맥락 유지
      const history = messages
        .filter((m) => !m.isError)
        .map((m) => ({ role: m.role, text: m.text }))
      const { answer, error, remaining, dailyLimit } = await askAssistant(q, history)
      if (remaining != null && dailyLimit != null) setQuota({ remaining, limit: dailyLimit })
      const limitHit = !answer && remaining === 0 && /한도/.test(error ?? '')
      if (limitHit) setShowProCta(true)
      setMessages((m) => [...m, answer
        ? { role: 'assistant', text: answer }
        : { role: 'assistant', text: error ?? '답변을 만들지 못했어요.', isError: true }])
    } finally {
      setAsking(false)
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80)
    }
  }

  const handleProRequest = async () => {
    if (proRequesting) return
    setProRequesting(true)
    const { message } = await requestPro()
    setMessages((m) => [...m, { role: 'assistant', text: `💎 ${message}` }])
    setShowProCta(false)
    setProRequesting(false)
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80)
  }

  const isWeb = Platform.OS === 'web'

  // 채팅 본문(헤더+대화+입력) — 웹/네이티브 래퍼가 공유.
  const body = (
    <>
          {/* 헤더 */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: palette.border }}>
              <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: (palette.purple ?? '#7c3aed') + '1f', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={16} color={palette.purple ?? '#7c3aed'} strokeWidth={2.5} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ color: palette.ink, fontSize: 15, fontWeight: '900' }}>시데 AI</Text>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#22c55e' }} />
                </View>
                <Text style={{ color: palette.inkFaint, fontSize: 10.5, marginTop: 1 }}>내 보유·관심 종목과 오늘 시장을 알고 답해요</Text>
              </View>
              {messages.length > 0 ? (
                <Pressable onPress={() => setMessages([])} hitSlop={10} accessibilityLabel="대화 초기화">
                  <RotateCcw size={17} color={palette.inkMuted} strokeWidth={2.4} />
                </Pressable>
              ) : null}
              <Pressable onPress={onClose} hitSlop={10}><X size={20} color={palette.inkMuted} strokeWidth={2.5} /></Pressable>
            </View>

            {/* 대화 */}
            <ScrollView
              ref={scrollRef}
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingHorizontal: 14, paddingVertical: 12, gap: 10 }}
              onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
            >
              {messages.length === 0 ? (
                <View style={{ gap: 8, paddingTop: 8 }}>
                  <Text style={{ color: palette.inkMuted, fontSize: 12, fontWeight: '700' }}>이런 걸 물어보세요</Text>
                  {STARTERS.map((s) => (
                    <Pressable
                      key={s}
                      onPress={() => void send(s)}
                      style={({ pressed }) => ({
                        backgroundColor: palette.surfaceAlt ?? palette.surface,
                        borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11,
                        borderWidth: 1, borderColor: palette.border,
                        opacity: pressed ? 0.6 : 1,
                      })}
                    >
                      <Text style={{ color: palette.inkSub, fontSize: 13, fontWeight: '600' }}>💬 {s}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}

              {messages.map((m, i) => (
                <View
                  key={i}
                  style={{
                    alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '86%',
                    backgroundColor: m.role === 'user'
                      ? (palette.purple ?? '#7c3aed')
                      : m.isError ? (palette.downSoft ?? palette.surfaceAlt) : (palette.surfaceAlt ?? palette.surface),
                    borderRadius: 14,
                    borderBottomRightRadius: m.role === 'user' ? 4 : 14,
                    borderTopLeftRadius: m.role === 'user' ? 14 : 4,
                    paddingHorizontal: 13, paddingVertical: 9,
                  }}
                >
                  <Text style={{
                    color: m.role === 'user' ? '#fff' : m.isError ? palette.down : palette.ink,
                    fontSize: 13.5, lineHeight: 20,
                  }}>
                    {m.text}
                  </Text>
                </View>
              ))}

              {asking ? (
                <View style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: palette.surfaceAlt ?? palette.surface, borderRadius: 14, borderTopLeftRadius: 4, paddingHorizontal: 13, paddingVertical: 10 }}>
                  <ActivityIndicator size="small" color={palette.purple ?? '#7c3aed'} />
                  <Text style={{ color: palette.inkMuted, fontSize: 12 }}>데이터 확인하고 답변 만드는 중…</Text>
                </View>
              ) : null}

              {/* 한도 도달 → PRO 신청 CTA */}
              {showProCta ? (
                <View style={{ alignSelf: 'flex-start', gap: 4 }}>
                  <Pressable
                    onPress={() => void handleProRequest()}
                    disabled={proRequesting}
                    style={({ pressed }) => ({
                      backgroundColor: palette.purple ?? '#7c3aed',
                      borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
                      opacity: pressed || proRequesting ? 0.6 : 1,
                    })}
                  >
                    <Text style={{ color: '#fff', fontSize: 12.5, fontWeight: '800' }}>
                      {proRequesting ? '신청 중...' : '💎 PRO 신청하기 — 하루 100회로 늘리기'}
                    </Text>
                  </Pressable>
                  <Text style={{ color: palette.inkMuted, fontSize: 10.5 }}>
                    🎉 베타 기간엔 결제 없이 무료로 승인해 드려요
                  </Text>
                </View>
              ) : null}
            </ScrollView>

            {/* 입력 */}
            <View style={{ paddingHorizontal: 12, paddingTop: 8, paddingBottom: insets.bottom + 10, borderTopWidth: 1, borderTopColor: palette.border, gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
                <TextInput
                  value={input}
                  onChangeText={setInput}
                  placeholder="궁금한 걸 물어보세요 (최대 500자)"
                  placeholderTextColor={palette.inkMuted}
                  multiline
                  maxLength={500}
                  style={{
                    flex: 1, minHeight: 42, maxHeight: 110,
                    backgroundColor: palette.surfaceAlt ?? palette.surface,
                    borderRadius: 12, borderWidth: 1, borderColor: palette.border,
                    paddingHorizontal: 13, paddingVertical: 10,
                    color: palette.ink, fontSize: 14,
                  }}
                  onSubmitEditing={() => void send()}
                />
                <Pressable
                  onPress={() => void send()}
                  disabled={asking || !input.trim()}
                  style={{
                    width: 42, height: 42, borderRadius: 12,
                    backgroundColor: asking || !input.trim() ? palette.border : (palette.purple ?? '#7c3aed'),
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Send size={17} color="#fff" strokeWidth={2.4} />
                </Pressable>
              </View>
              <Text style={{ color: palette.inkFaint, fontSize: 9.5, textAlign: 'center' }}>
                AI 답변은 참고용이며 투자 판단의 책임은 본인에게 있어요
                {quota ? ` · 오늘 ${quota.remaining}/${quota.limit}회 남음` : ''}
              </Text>
            </View>
    </>
  )

  // 웹 — 우하단 도킹 챗봇 패널(전체화면 X). 페이지 위에 떠 있고 바깥 클릭 시 닫힘.
  if (isWeb) {
    return (
      <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
        <Pressable
          style={{ flex: 1, backgroundColor: 'transparent', justifyContent: 'flex-end', alignItems: 'flex-end' }}
          onPress={onClose}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              width: 392, maxWidth: '92%', height: 620, maxHeight: '82%',
              marginRight: 16, marginBottom: 88,
              backgroundColor: palette.bg, borderRadius: 18,
              borderWidth: 1, borderColor: palette.border, overflow: 'hidden',
              shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 28, shadowOffset: { width: 0, height: 10 },
            }}
          >
            {body}
          </Pressable>
        </Pressable>
      </Modal>
    )
  }

  // 네이티브 — 하단 바텀시트. 키보드 회피는 최외곽에서(시트가 키보드 위로 올라오게).
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }} onPress={onClose}>
        <View style={{ flex: 1 }} />
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{ backgroundColor: palette.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20, height: '82%' }}
        >
          {body}
        </Pressable>
      </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  )
}
