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
    title: 'AI 시황 브리핑',
    desc: "매일 아침·마감, 한국·미국 증시를 AI가 요약해 드려요. '오늘' 탭에서 확인하세요.",
  },
  {
    icon: Bell,
    title: '관심종목 알림',
    desc: '종목을 관심목록에 담고 목표가를 설정하면, 도달했을 때 푸시로 알려드려요.',
  },
  {
    icon: Trophy,
    title: '투자 리그',
    desc: '친구와 모의투자로 수익률 대결. 초대 코드로 함께 시작할 수 있어요.',
  },
  {
    icon: Bot,
    title: '시데 AI 비서',
    desc: '궁금한 종목·시황을 물어보면 바로 답해드려요.',
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
              💡 헤더의 시장 칩으로 한국·미국 화면을 언제든 전환할 수 있어요.
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
            <Text style={{ color: palette.bg, fontSize: 14, fontWeight: '800' }}>
              시작하기
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}
