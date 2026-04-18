import { useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import { LogIn, TrendingUp, UserPlus } from 'lucide-react-native'
import { apiLogin, apiSignup, type AuthUser } from '../api/auth'
import { useGoogleSignIn } from '../api/socialAuth'
import { useStyles } from '../styles'
import { useTheme } from '../theme'
import { hapticError, hapticSuccess } from '../utils/haptics'

type Mode = 'login' | 'signup'

type Props = {
  onDone: (user: AuthUser) => void
}

export function AuthScreen({ onDone }: Props) {
  const styles = useStyles()
  const { palette } = useTheme()

  const [mode,     setMode]     = useState<Mode>('login')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const handleSocial = async (fn: () => Promise<void>) => {
    setError('')
    setLoading(true)
    try {
      await fn()
      void hapticSuccess()
    } catch (e) {
      void hapticError()
      setError(e instanceof Error ? e.message : '소셜 로그인에 실패했어.')
    } finally {
      setLoading(false)
    }
  }

  const [googleRequest, googleSignIn] = useGoogleSignIn(onDone)

  const handleSubmit = async () => {
    setError('')
    if (!email.trim() || !password.trim()) {
      setError('이메일과 비밀번호를 입력해줘.')
      void hapticError()
      return
    }
    if (mode === 'signup' && !nickname.trim()) {
      setError('닉네임을 입력해줘.')
      void hapticError()
      return
    }
    setLoading(true)
    try {
      const res = mode === 'login'
        ? await apiLogin(email.trim(), password)
        : await apiSignup(email.trim(), password, nickname.trim())
      void hapticSuccess()
      onDone(res)
    } catch (e) {
      void hapticError()
      setError(e instanceof Error ? e.message : '로그인에 실패했어.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: palette.bg }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20, gap: 18 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── 로고 ── */}
        <View style={{ alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <View style={{
            width: 64, height: 64, borderRadius: 18,
            backgroundColor: palette.brand,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <TrendingUp size={32} color={palette.brandAccent} strokeWidth={2.5} />
          </View>
          <Text style={{ color: palette.brandAccent, fontSize: 11, fontWeight: '900', letterSpacing: 2.5 }}>
            SIGNAL DESK
          </Text>
          <Text style={{ color: palette.ink, fontSize: 22, fontWeight: '800' }}>
            {mode === 'login' ? '다시 만나서 반가워요' : '시작해볼까요'}
          </Text>
          <Text style={{ color: palette.inkMuted, fontSize: 13 }}>
            투자 대시보드를 너만의 공간으로
          </Text>
        </View>

        {/* ── 폼 ── */}
        <View style={{ gap: 10 }}>
          {mode === 'signup' && (
            <TextInput
              value={nickname}
              onChangeText={setNickname}
              placeholder="닉네임"
              placeholderTextColor={palette.inkFaint}
              style={styles.searchInput}
              autoCapitalize="none"
              editable={!loading}
            />
          )}
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="이메일"
            placeholderTextColor={palette.inkFaint}
            style={styles.searchInput}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            editable={!loading}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="비밀번호 (6자 이상)"
            placeholderTextColor={palette.inkFaint}
            style={styles.searchInput}
            secureTextEntry
            autoCapitalize="none"
            editable={!loading}
          />
        </View>

        {error ? (
          <Text style={{ color: palette.red, fontSize: 13, textAlign: 'center', fontWeight: '700' }}>
            {error}
          </Text>
        ) : null}

        {/* ── 제출 ── */}
        <Pressable
          onPress={() => void handleSubmit()}
          disabled={loading}
          style={({ pressed }) => [
            styles.primaryActionButton,
            { flexDirection: 'row', gap: 8, opacity: loading || pressed ? 0.7 : 1 },
          ]}
        >
          {loading ? (
            <ActivityIndicator color={palette.surface} />
          ) : mode === 'login' ? (
            <LogIn size={18} color={palette.surface} strokeWidth={2.5} />
          ) : (
            <UserPlus size={18} color={palette.surface} strokeWidth={2.5} />
          )}
          <Text style={styles.primaryActionButtonText}>
            {mode === 'login' ? '로그인' : '가입하기'}
          </Text>
        </Pressable>

        {/* ── 소셜 로그인 ── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 4 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: palette.border }} />
          <Text style={{ color: palette.inkFaint, fontSize: 11, fontWeight: '700' }}>또는</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: palette.border }} />
        </View>

        <Pressable
          onPress={() => void handleSocial(googleSignIn)}
          disabled={loading || !googleRequest}
          style={({ pressed }) => [
            styles.secondaryActionButton,
            {
              flexDirection: 'row', gap: 8, justifyContent: 'center',
              backgroundColor: '#fff', borderColor: '#e2e8f0', borderWidth: 1,
              opacity: loading || pressed ? 0.7 : 1,
            },
          ]}
        >
          <Text style={{ fontSize: 16, fontWeight: '900', color: '#4285F4' }}>G</Text>
          <Text style={[styles.secondaryActionButtonText, { color: '#1f2937' }]}>Google 로 계속하기</Text>
        </Pressable>

        {/* ── 모드 전환 ── */}
        <Pressable onPress={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}>
          <Text style={{ color: palette.blue, fontSize: 13, textAlign: 'center', fontWeight: '700' }}>
            {mode === 'login' ? '계정이 없어? 가입하기' : '이미 계정 있어? 로그인'}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
