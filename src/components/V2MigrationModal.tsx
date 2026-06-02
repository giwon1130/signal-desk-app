/**
 * v1 → v2 첫 진입 시 1회성 마이그레이션 카드.
 *
 * v1 사용자는 OnboardingScreen 자동 스킵 → v2 신규 가치(프로필별 화면)를 못 본 채 메인 진입.
 * 본 모달이 1회 노출되어 시장 프로필 재확인 + v2 변경 사항 안내.
 *
 * AsyncStorage key 'signal:v2:migration:shown' 으로 1회만 노출.
 */
import { useState } from 'react'
import { Modal, Pressable, Text, View } from 'react-native'
import { Sparkles, X } from 'lucide-react-native'
import { useTheme } from '../theme'
import type { MarketPreference } from '../api/alertPreferences'
import { MarketProfileChip } from './MarketProfileChip'

type Props = {
  visible: boolean
  currentPreference: MarketPreference
  onConfirm: (pref: MarketPreference) => void
  onClose: () => void
}

export function V2MigrationModal({ visible, currentPreference, onConfirm, onClose }: Props) {
  const { palette } = useTheme()
  const [pref, setPref] = useState<MarketPreference>(currentPreference)

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
          maxWidth: 380,
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
              v2.0 — 내 시장에 맞춰진 화면
            </Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <X size={18} color={palette.inkMuted} strokeWidth={2.5} />
            </Pressable>
          </View>

          <Text style={{ color: palette.inkSub, fontSize: 13, lineHeight: 19 }}>
            시장 프로필에 따라 카드·종목·이벤트가 달라져요.
            지금 한 번 확인해 보세요 — 헤더에서 언제든 변경 가능.
          </Text>

          <View style={{ alignItems: 'center', gap: 6 }}>
            <Text style={{ color: palette.inkMuted, fontSize: 11, fontWeight: '800', letterSpacing: 1 }}>
              내 시장
            </Text>
            <MarketProfileChip value={pref} onChange={setPref} />
            <Text style={{ color: palette.inkFaint, fontSize: 11 }}>
              {pref === 'KR' ? '한국 시장 중심 (코스피·코스닥·DART)'
                : pref === 'US' ? '미국 시장 중심 (NASDAQ·S&P·SEC)'
                : '양쪽 시장 균형'}
            </Text>
          </View>

          <Pressable
            onPress={() => onConfirm(pref)}
            style={({ pressed }) => ({
              backgroundColor: pressed ? palette.brandAccent + 'cc' : palette.brandAccent,
              borderRadius: 10,
              paddingVertical: 12,
              alignItems: 'center',
            })}
          >
            <Text style={{ color: palette.bg, fontSize: 14, fontWeight: '800' }}>
              확인하고 시작
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}
