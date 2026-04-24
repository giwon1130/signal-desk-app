import { useMemo, useState } from 'react'
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
import { useStyles } from '../styles'
import { useTheme } from '../theme'
import { hapticError, hapticSuccess } from '../utils/haptics'
import { GoogleSignInButton } from './GoogleSignInButton'
import { WebFooter } from './WebFooter'

type Mode = 'login' | 'signup'

type Props = {
  onDone: (user: AuthUser) => void
}

// 가벼운 이메일 형식 검사 — 풀-RFC 가 아니라 토큰@토큰.토큰 정도면 통과시킨다.
const EMAIL_RE = /^[\w.+-]+@[\w-]+\.[\w.-]+$/
const isValidEmail = (v: string) => EMAIL_RE.test(v.trim())

// 서버/소셜 에러 메시지를 사용자 친화 문구로 변환
function friendlyAuthError(e: unknown, mode: Mode): string {
  const raw = e instanceof Error ? e.message : ''
  const m = raw.toLowerCase()

  if (m.includes('network') || m.includes('failed to fetch') || m.includes('timeout')) {
    return '서버에 연결할 수 없어. 잠시 후 다시 시도해줘.'
  }
  if (m.includes('email') && (m.includes('exists') || m.includes('duplicate') || m.includes('이미'))) {
    return '이미 가입된 이메일이야. 로그인을 눌러줘.'
  }
  if (m.includes('invalid') && m.includes('credential')) {
    return '이메일 또는 비밀번호가 올바르지 않아.'
  }
  if (m.includes('user not found') || m.includes('찾을 수 없')) {
    return '가입된 계정이 없어. 먼저 가입해줘.'
  }
  if (m.includes('password')) {
    return '비밀번호가 올바르지 않아.'
  }
  if (m.includes('cancel')) {
    return '로그인을 취소했어.'
  }
  if (raw && raw !== '요청에 실패했어요.') return raw
  return mode === 'login' ? '로그인에 실패했어. 다시 시도해줘.' : '가입에 실패했어. 다시 시도해줘.'
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
  // 입력 후 blur(또는 제출) 시점부터 인라인 오류를 보여주기 위한 플래그
  const [emailTouched, setEmailTouched]     = useState(false)
  const [pwTouched,    setPwTouched]        = useState(false)
  const [nickTouched,  setNickTouched]      = useState(false)

  const emailError = useMemo(() => {
    if (!emailTouched) return ''
    if (!email.trim()) return '이메일을 입력해줘.'
    if (!isValidEmail(email)) return '이메일 형식이 올바르지 않아. (예: name@example.com)'
    return ''
  }, [email, emailTouched])

  const pwError = useMemo(() => {
    if (!pwTouched) return ''
    if (!password) return '비밀번호를 입력해줘.'
    if (password.length < 6) return '비밀번호는 6자 이상이어야 해.'
    return ''
  }, [password, pwTouched])

  const nickError = useMemo(() => {
    if (mode !== 'signup' || !nickTouched) return ''
    if (!nickname.trim()) return '닉네임을 입력해줘.'
    if (nickname.trim().length < 2) return '닉네임은 2자 이상으로 정해줘.'
    return ''
  }, [nickname, nickTouched, mode])

  const handleGoogleSuccess = (u: AuthUser) => {
    void hapticSuccess()
    onDone(u)
  }
  const handleGoogleError = (message: string) => {
    void hapticError()
    setError(message)
  }

  const handleSubmit = async () => {
    setError('')
    // 모든 필드를 touched 처리해서 인라인 에러를 노출
    setEmailTouched(true)
    setPwTouched(true)
    if (mode === 'signup') setNickTouched(true)

    // 클라이언트 사이드 검증
    if (!email.trim() || !isValidEmail(email) || !password || password.length < 6 ||
        (mode === 'signup' && (!nickname.trim() || nickname.trim().length < 2))) {
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
      setError(friendlyAuthError(e, mode))
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = (hasError: boolean) => [
    styles.searchInput,
    hasError && { borderColor: palette.red, borderWidth: 1.2 },
  ]

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: palette.bg }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 22, gap: 14 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── 로고 ── */}
        <View style={{ alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <View style={{
            width: 56, height: 56, borderRadius: 16,
            backgroundColor: palette.brand,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <TrendingUp size={28} color={palette.brandAccent} strokeWidth={2.5} />
          </View>
          <Text style={{ color: palette.brandAccent, fontSize: 10, fontWeight: '900', letterSpacing: 2.5, marginTop: 2 }}>
            SIGNAL DESK
          </Text>
          <Text style={{ color: palette.ink, fontSize: 19, fontWeight: '800', marginTop: 2 }}>
            {mode === 'login' ? '다시 만나서 반가워요' : '시작해볼까요'}
          </Text>
          <Text style={{ color: palette.inkMuted, fontSize: 12 }}>
            투자 대시보드를 너만의 공간으로
          </Text>
        </View>

        {/* ── 폼 ── */}
        <View style={{ gap: 8 }}>
          {mode === 'signup' && (
            <View style={{ gap: 4 }}>
              <TextInput
                value={nickname}
                onChangeText={(v) => { setNickname(v); if (!nickTouched) setNickTouched(true) }}
                onBlur={() => setNickTouched(true)}
                placeholder="닉네임"
                placeholderTextColor={palette.inkFaint}
                style={inputStyle(!!nickError)}
                autoCapitalize="none"
                editable={!loading}
                returnKeyType="next"
              />
              {nickError ? <Text style={{ color: palette.red, fontSize: 11, fontWeight: '600', marginLeft: 4 }}>{nickError}</Text> : null}
            </View>
          )}

          <View style={{ gap: 4 }}>
            <TextInput
              value={email}
              onChangeText={(v) => { setEmail(v); if (!emailTouched) setEmailTouched(true) }}
              onBlur={() => setEmailTouched(true)}
              placeholder="이메일"
              placeholderTextColor={palette.inkFaint}
              style={inputStyle(!!emailError)}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              keyboardType="email-address"
              editable={!loading}
              returnKeyType="next"
            />
            {emailError ? <Text style={{ color: palette.red, fontSize: 11, fontWeight: '600', marginLeft: 4 }}>{emailError}</Text> : null}
          </View>

          <View style={{ gap: 4 }}>
            <TextInput
              value={password}
              onChangeText={(v) => { setPassword(v); if (!pwTouched) setPwTouched(true) }}
              onBlur={() => setPwTouched(true)}
              placeholder={mode === 'signup' ? '비밀번호 (6자 이상)' : '비밀번호'}
              placeholderTextColor={palette.inkFaint}
              style={inputStyle(!!pwError)}
              secureTextEntry
              autoCapitalize="none"
              editable={!loading}
              returnKeyType="done"
              onSubmitEditing={() => void handleSubmit()}
            />
            {pwError ? <Text style={{ color: palette.red, fontSize: 11, fontWeight: '600', marginLeft: 4 }}>{pwError}</Text> : null}
          </View>
        </View>

        {error ? (
          <View style={{
            backgroundColor: palette.redSoft, borderRadius: 10,
            paddingHorizontal: 12, paddingVertical: 9,
          }}>
            <Text style={{ color: palette.red, fontSize: 12, textAlign: 'center', fontWeight: '700' }}>
              {error}
            </Text>
          </View>
        ) : null}

        {/* ── 제출 ── */}
        <Pressable
          onPress={() => void handleSubmit()}
          disabled={loading}
          style={({ pressed }) => [
            {
              borderRadius: 11, backgroundColor: palette.ink,
              alignItems: 'center', justifyContent: 'center',
              flexDirection: 'row', gap: 7,
              paddingVertical: 11, paddingHorizontal: 14,
              marginTop: 4,
              opacity: loading || pressed ? 0.75 : 1,
            },
          ]}
        >
          {loading ? (
            <ActivityIndicator size="small" color={palette.surface} />
          ) : mode === 'login' ? (
            <LogIn size={15} color={palette.surface} strokeWidth={2.5} />
          ) : (
            <UserPlus size={15} color={palette.surface} strokeWidth={2.5} />
          )}
          <Text style={{ color: palette.surface, fontSize: 13, fontWeight: '800' }}>
            {mode === 'login' ? '로그인' : '가입하기'}
          </Text>
        </Pressable>

        {/* ── 소셜 로그인 ── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 2 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: palette.border }} />
          <Text style={{ color: palette.inkFaint, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 }}>또는</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: palette.border }} />
        </View>

        <GoogleSignInButton
          loading={loading}
          onAuth={handleGoogleSuccess}
          onError={handleGoogleError}
        />

        {/* ── 모드 전환 ── */}
        <Pressable
          onPress={() => {
            setMode(mode === 'login' ? 'signup' : 'login')
            setError(''); setEmailTouched(false); setPwTouched(false); setNickTouched(false)
          }}
          style={{ paddingVertical: 6 }}
        >
          <Text style={{ color: palette.blue, fontSize: 12, textAlign: 'center', fontWeight: '700' }}>
            {mode === 'login' ? '계정이 없어? 가입하기' : '이미 계정 있어? 로그인'}
          </Text>
        </Pressable>

        <WebFooter />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
