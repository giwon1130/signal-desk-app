/**
 * 첫 진입 시 1회성 앱 활용 가이드.
 *
 * 로그인 후 "이 앱을 이렇게 활용하세요" 를 한 번만 안내한다.
 * AsyncStorage key 'signal:usageGuide:shown' 으로 1회만 노출 (onboarding.ts).
 */
import { Modal, Pressable, ScrollView, Text, View } from 'react-native'
import { Sparkles, Newspaper, Bell, Trophy, Bot, X } from 'lucide-react-native'
import { useTheme } from '../theme'

type Props = {
  visible: boolean
  onClose: () => void
}

type Tip = {
  icon: typeof Newspaper
  title: string
  desc: string
}

const TIPS: Tip[] = [
  {
    icon: Newspaper,
    title: '오늘의 브리프',
    desc: "'오늘'에서 시장의 핵심을 먼저 읽어보세요. 상세 흐름과 판단 근거는 필요할 때 펼쳐볼 수 있습니다.",
  },
  {
    icon: Bell,
    title: '관심종목 알림',
    desc: '관심종목과 가격 기준을 등록하면 확인된 신호를 안내합니다. 푸시를 받으려면 기기의 알림 권한도 켜 주세요.',
  },
  {
    icon: Trophy,
    title: '모의투자',
    desc: '실제 자금 없이 친구들과 가상 투자를 연습합니다. 초대 코드로 함께 시작할 수 있습니다.',
  },
  {
    icon: Bot,
    title: '시데 AI 비서',
    desc: '궁금한 종목과 시황을 질문할 수 있습니다. 답변의 근거와 기준 시각을 함께 확인해 주세요.',
  },
]

export function AppGuideModal({ visible, onClose }: Props) {
  const { palette } = useTheme()

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{
        flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
        alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}>
        <View style={{
          backgroundColor: palette.surface,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: palette.border,
          padding: 24,
          gap: 16,
          width: '100%',
          maxWidth: 400,
          maxHeight: '85%',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{
              width: 36, height: 36, borderRadius: 10,
              backgroundColor: palette.brandAccent + '22',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Sparkles size={18} color={palette.brandAccent} strokeWidth={2.5} />
            </View>
            <Text style={{ flex: 1, color: palette.ink, fontSize: 16, fontWeight: '800' }}>
              이렇게 활용해보세요
            </Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <X size={18} color={palette.inkMuted} strokeWidth={2.5} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
            {TIPS.map((tip) => {
              const Icon = tip.icon
              return (
                <View key={tip.title} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                  <View style={{
                    width: 32, height: 32, borderRadius: 9,
                    backgroundColor: palette.brandAccent + '18',
                    alignItems: 'center', justifyContent: 'center',
                    marginTop: 1,
                  }}>
                    <Icon size={17} color={palette.brandAccent} strokeWidth={2.4} />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ color: palette.ink, fontSize: 14, fontWeight: '800' }}>{tip.title}</Text>
                    <Text style={{ color: palette.inkSub, fontSize: 12.5, lineHeight: 18 }}>{tip.desc}</Text>
                  </View>
                </View>
              )
            })}
            <Text style={{ color: palette.inkFaint, fontSize: 11.5, lineHeight: 17 }}>
              설정의 시장 선호에서 한국·미국 화면을 선택할 수 있습니다. 이 앱은 투자 참고 정보를 제공하며 실제 주문을 실행하지 않습니다.
            </Text>
          </ScrollView>

          <Pressable
            onPress={onClose}
            style={({ pressed }) => ({
              backgroundColor: pressed ? palette.brandAccent + 'cc' : palette.brandAccent,
              borderRadius: 10,
              paddingVertical: 12,
              alignItems: 'center',
            })}
          >
            <Text style={{ color: '#07150f', fontSize: 14, fontWeight: '900' }}>
              시작하기
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}
