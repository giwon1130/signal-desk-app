/**
 * 리그 참가 모달 — 코드(링크/입력)로 진입하면 들어가기 직전 닉네임+아바타를 받는다.
 * 링크 클릭(딥링크) 또는 코드 입력 둘 다 이 모달을 거친다.
 */
import { useEffect, useState } from 'react'
import { KeyboardAvoidingView, Modal, Platform, Pressable, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Trophy } from 'lucide-react-native'
import { ModalHeader } from '../ModalHeader'
import { useTheme } from '../../theme'
import { joinLeague } from '../../api/league'
import { LEAGUE_AVATARS, joinErrorMessage } from './leagueShared'

type Props = {
  visible: boolean
  code: string                 // 링크/입력에서 넘어온 코드 (편집 가능)
  onClose: () => void
  onJoined: (leagueId: string) => void
  toast?: { show: (msg: string, type?: 'success' | 'error' | 'info') => void }
}

export function JoinLeagueModal({ visible, code, onClose, onJoined, toast }: Props) {
  const { palette } = useTheme()
  const insets = useSafeAreaInsets()
  const [joinCode, setJoinCode] = useState(code)
  const [nickname, setNickname] = useState('')
  const [avatar, setAvatar] = useState(LEAGUE_AVATARS[0])
  const [joining, setJoining] = useState(false)

  // 열릴 때마다 넘어온 코드로 동기화 (닉네임/아바타는 reset).
  useEffect(() => {
    if (visible) { setJoinCode(code); setNickname(''); setAvatar(LEAGUE_AVATARS[0]) }
  }, [visible, code])

  const canJoin = joinCode.trim().length >= 4 && nickname.trim().length > 0 && !joining

  const handleJoin = async () => {
    if (!canJoin) return
    setJoining(true)
    try {
      const detail = await joinLeague(joinCode.trim().toUpperCase(), nickname.trim(), avatar)
      toast?.show('리그 참가 완료', 'success')
      onJoined(detail.league.id)
      onClose()
    } catch (e: any) {
      toast?.show(joinErrorMessage(e?.message || ''), 'error')
    } finally {
      setJoining(false)
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <ModalHeader icon={Trophy} title="리그 참가" onClose={onClose} />

        <View style={{ padding: 18, gap: 20 }}>
          <Text style={{ color: palette.inkMuted, fontSize: 13, lineHeight: 19 }}>
            들어가기 전에 게임에서 쓸 이름과 아바타를 정해 주세요.
          </Text>

          {/* 참가 코드 */}
          <View style={{ gap: 8 }}>
            <Text style={{ color: palette.inkMuted, fontSize: 11, fontWeight: '800', letterSpacing: 1 }}>참가 코드</Text>
            <TextInput
              value={joinCode}
              onChangeText={(v) => setJoinCode(v.toUpperCase())}
              placeholder="예: X7K2M"
              placeholderTextColor={palette.inkFaint}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={5}
              style={{
                backgroundColor: palette.surfaceAlt, color: palette.ink,
                borderWidth: 1, borderColor: palette.border, borderRadius: 8,
                paddingHorizontal: 14, paddingVertical: 12,
                fontSize: 18, fontWeight: '800', letterSpacing: 4, textAlign: 'center',
              }}
            />
          </View>

          {/* 닉네임 */}
          <View style={{ gap: 8 }}>
            <Text style={{ color: palette.inkMuted, fontSize: 11, fontWeight: '800', letterSpacing: 1 }}>내 닉네임</Text>
            <TextInput
              value={nickname}
              onChangeText={setNickname}
              placeholder="게임에 표시될 이름"
              placeholderTextColor={palette.inkFaint}
              maxLength={20}
              autoFocus
              style={{
                backgroundColor: palette.surfaceAlt, color: palette.ink,
                borderWidth: 1, borderColor: palette.border, borderRadius: 8,
                paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontWeight: '700',
              }}
            />
          </View>

          {/* 아바타 */}
          <View style={{ gap: 8 }}>
            <Text style={{ color: palette.inkMuted, fontSize: 11, fontWeight: '800', letterSpacing: 1 }}>아바타</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {LEAGUE_AVATARS.map((emo) => (
                <Pressable
                  key={emo}
                  onPress={() => setAvatar(emo)}
                  accessibilityRole="button"
                  accessibilityLabel={`아바타 ${emo}`}
                  style={{
                    width: 40, height: 40, borderRadius: 8,
                    alignItems: 'center', justifyContent: 'center',
                    backgroundColor: avatar === emo ? palette.brandAccent + '22' : palette.surfaceAlt,
                    borderWidth: 1, borderColor: avatar === emo ? palette.brandAccent : palette.border,
                  }}
                >
                  <Text style={{ fontSize: 20 }}>{emo}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        <View style={{ flex: 1 }} />

        {/* 하단 참가 버튼 */}
        <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: palette.border, backgroundColor: palette.surface }}>
          <Pressable
            onPress={() => void handleJoin()}
            disabled={!canJoin}
            accessibilityRole="button"
            style={({ pressed }) => ({
              backgroundColor: pressed ? palette.brandAccent + 'cc' : palette.brandAccent,
              borderRadius: 12, paddingVertical: 14, alignItems: 'center',
              opacity: canJoin ? 1 : 0.5,
            })}
          >
            <Text style={{ color: '#07150f', fontSize: 15, fontWeight: '900' }}>
              {joining ? '참가 중…' : `${avatar} ${nickname.trim() || '닉네임'} 으로 참가`}
            </Text>
          </Pressable>
        </View>
      </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}
