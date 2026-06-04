/**
 * 리딩 첫 진입 환영 모달 — 월 구독료(정식 유료) 대비 '지금 무료(오픈 이벤트)' 안내.
 * 처음 1회만 노출 (호출부에서 AsyncStorage 플래그로 제어).
 */
import { useEffect, useRef } from 'react'
import { Animated, Modal, Pressable, Text, View } from 'react-native'
import { useTheme } from '../../theme'
import { GradientBackground, glow } from '../effects'

export function ReadingEventModal({ visible, monthlyPriceWon = 9900, onClose }: {
  visible: boolean
  monthlyPriceWon?: number
  onClose: () => void
}) {
  const { palette } = useTheme()
  const scale = useRef(new Animated.Value(0.9)).current
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!visible) return
    scale.setValue(0.9)
    opacity.setValue(0)
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 12, bounciness: 9 }),
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start()
  }, [visible])

  const price = monthlyPriceWon.toLocaleString('ko-KR')

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{ flex: 1, backgroundColor: '#000a', alignItems: 'center', justifyContent: 'center', padding: 28 }}
      >
        <Animated.View style={{ width: '100%', maxWidth: 380, opacity, transform: [{ scale }] }}>
          {/* 카드 내부 탭은 닫히지 않게 */}
          <Pressable
            onPress={() => {}}
            style={[{ borderRadius: 22, overflow: 'hidden', padding: 24, alignItems: 'center', gap: 9 }, glow(palette.brandAccent, 22, 0.6)]}
          >
            <GradientBackground
              colors={[{ offset: '0', color: palette.brandAccent }, { offset: '0.5', color: palette.blue }, { offset: '1', color: '#4f46e5' }]}
              radius={22} x1="0" y1="0" x2="1" y2="1"
            />
            <Text style={{ fontSize: 40 }}>🎉</Text>
            <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '900', letterSpacing: 3 }}>리딩 멤버십</Text>
            <Text style={{ color: '#ffffff', fontSize: 21, fontWeight: '900', textAlign: 'center', lineHeight: 29 }}>
              검증된 리더의 콜,{'\n'}지금 무료로 받아보세요
            </Text>

            {/* 가격: 월 X원 → 무료 */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 }}>
              <Text style={{ color: '#ffffffb0', fontSize: 16, fontWeight: '800', textDecorationLine: 'line-through' }}>월 {price}원</Text>
              <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '900' }}>→</Text>
              <View style={[{ backgroundColor: '#ffffff', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 5 }, glow('#fbbf24', 10, 0.85)]}>
                <Text style={{ color: '#b45309', fontSize: 18, fontWeight: '900' }}>무료</Text>
              </View>
            </View>

            <View style={{ backgroundColor: '#ffffff26', borderRadius: 999, paddingHorizontal: 11, paddingVertical: 4, marginTop: 2 }}>
              <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '800' }}>🎉 오픈 이벤트 한정</Text>
            </View>

            <Text style={{ color: '#ffffffd0', fontSize: 12, textAlign: 'center', lineHeight: 18, marginTop: 2 }}>
              오픈 이벤트 기간엔 모든 리더 구독이 무료입니다.{'\n'}정식 오픈 시 월 {price}원으로 전환돼요.
            </Text>

            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="무료로 시작하기"
              style={({ pressed }) => ({
                marginTop: 10, alignSelf: 'stretch', alignItems: 'center',
                backgroundColor: '#ffffff', borderRadius: 13, paddingVertical: 13,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Text style={{ color: palette.blue, fontSize: 15, fontWeight: '900' }}>무료로 시작하기</Text>
            </Pressable>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  )
}
