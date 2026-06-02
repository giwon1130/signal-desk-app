/**
 * 리그 생성 모달 — Trading League.
 *
 * 호스트가 시장/통화/자본금/기간/거래시간/공개여부/아바타 정함.
 * 생성 즉시 open — 시작 시점이 지났으면 RUNNING, 아니면 OPEN(모집).
 */
import { useMemo, useState } from 'react'
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Trophy, X } from 'lucide-react-native'
import { useTheme } from '../../theme'
import type { LeagueCurrency, LeagueVisibility, MarketScope, TradingHours } from '../../types'
import { createLeague, openLeague } from '../../api/league'
import { LEAGUE_AVATARS } from './leagueShared'
import { apiErrorMessage } from '../../utils/apiError'

type Props = {
  visible: boolean
  onClose: () => void
  onCreated: (leagueId: string) => void
  toast?: { show: (msg: string, type?: 'success' | 'error' | 'info') => void }
}

const KRW_PRESETS = [10_000_000, 50_000_000, 100_000_000, 1_000_000_000]
const USD_PRESETS = [10_000, 50_000, 100_000, 1_000_000]
const DURATION_PRESETS: Array<{ label: string; days: number }> = [
  { label: '1주', days: 7 },
  { label: '1달 (권장)', days: 30 },
  { label: '3달', days: 90 },
]
type StartMode = 'NOW' | 'IN_1H' | 'TOMORROW_9'
const START_PRESETS: Array<{ key: StartMode; label: string }> = [
  { key: 'NOW', label: '지금 바로' },
  { key: 'IN_1H', label: '1시간 후' },
  { key: 'TOMORROW_9', label: '내일 오전 9시' },
]

export function CreateLeagueModal({ visible, onClose, onCreated, toast }: Props) {
  const { palette } = useTheme()
  const insets = useSafeAreaInsets()
  const [name, setName] = useState('')
  const [marketScope, setMarketScope] = useState<MarketScope>('BOTH')
  const [currency, setCurrency] = useState<LeagueCurrency>('KRW')
  const [capital, setCapital] = useState<number>(KRW_PRESETS[1])  // 5천만
  const [durationDays, setDurationDays] = useState<number>(30)
  const [startMode, setStartMode] = useState<StartMode>('NOW')
  const [tradingHours, setTradingHours] = useState<TradingHours>('MARKET_HOURS_ONLY')
  const [visibility, setVisibility] = useState<LeagueVisibility>('OPEN')
  const [hostNickname, setHostNickname] = useState('호스트')
  const [avatar, setAvatar] = useState(LEAGUE_AVATARS[0])
  const [busy, setBusy] = useState(false)

  const presets = currency === 'KRW' ? KRW_PRESETS : USD_PRESETS

  // 통화 변경 시 capital 도 맞춰서 swap (가까운 preset 으로).
  const switchCurrency = (c: LeagueCurrency) => {
    setCurrency(c)
    setCapital(c === 'KRW' ? KRW_PRESETS[1] : USD_PRESETS[1])
  }

  const { startedAt, endsAt } = useMemo(() => {
    const now = Date.now()
    let start = now
    if (startMode === 'IN_1H') start = now + 3600_000
    else if (startMode === 'TOMORROW_9') {
      const d = new Date(now)
      d.setDate(d.getDate() + 1)
      d.setHours(9, 0, 0, 0)
      start = d.getTime()
    }
    return {
      startedAt: new Date(start).toISOString(),
      endsAt: new Date(start + durationDays * 86400_000).toISOString(),
    }
  }, [durationDays, startMode])

  const valid = !busy && name.trim().length > 0 && hostNickname.trim().length > 0

  const handleSubmit = async () => {
    if (!valid) return
    setBusy(true)
    try {
      const league = await createLeague({
        name: name.trim(),
        marketScope,
        currency,
        startingCapital: capital,
        startedAt,
        endsAt,
        visibility,
        tradingHours,
        hostNickname: hostNickname.trim(),
        hostAvatarEmoji: avatar,
      })
      // 생성 즉시 open — 시작 시점 지났으면 RUNNING, 아니면 OPEN(모집).
      await openLeague(league.id)
      toast?.show(`리그 생성 완료 — 코드 ${league.joinCode}`, 'success')
      onCreated(league.id)
      onClose()
      // 폼 reset
      setName('')
      setHostNickname('호스트')
      setStartMode('NOW')
    } catch (e: any) {
      toast?.show(apiErrorMessage(e, '리그 생성 실패'), 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom }}>
        {/* 헤더 */}
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          paddingHorizontal: 16, paddingVertical: 14,
          borderBottomWidth: 1, borderBottomColor: palette.border,
          gap: 10,
        }}>
          <Trophy size={20} color={palette.brandAccent} strokeWidth={2.5} />
          <Text style={{ flex: 1, color: palette.ink, fontSize: 17, fontWeight: '900' }}>새 리그 만들기</Text>
          <Pressable onPress={onClose} hitSlop={20} accessibilityRole="button" accessibilityLabel="닫기">
            <X size={20} color={palette.inkMuted} strokeWidth={2.5} />
          </Pressable>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 18, gap: 20 }}>
          {/* 리그 이름 */}
          <Field label="리그 이름" palette={palette}>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="예: 5월 1주차"
              placeholderTextColor={palette.inkFaint}
              maxLength={60}
              style={fieldStyle(palette)}
            />
          </Field>

          {/* 호스트 닉네임 + 아바타 */}
          <Field label="내 닉네임" palette={palette}>
            <TextInput
              value={hostNickname}
              onChangeText={setHostNickname}
              placeholder="게임에 표시될 이름"
              placeholderTextColor={palette.inkFaint}
              maxLength={20}
              style={fieldStyle(palette)}
            />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {LEAGUE_AVATARS.map((emo) => (
                <Pressable
                  key={emo}
                  onPress={() => setAvatar(emo)}
                  accessibilityRole="button"
                  accessibilityLabel={`아바타 ${emo}`}
                  style={{
                    width: 36, height: 36, borderRadius: 8,
                    alignItems: 'center', justifyContent: 'center',
                    backgroundColor: avatar === emo ? palette.brandAccent + '22' : palette.surfaceAlt,
                    borderWidth: 1, borderColor: avatar === emo ? palette.brandAccent : palette.border,
                  }}
                >
                  <Text style={{ fontSize: 19 }}>{emo}</Text>
                </Pressable>
              ))}
            </View>
          </Field>

          {/* 시장 */}
          <Field label="시장" palette={palette}>
            <ChipGroup
              options={[
                { key: 'KR' as MarketScope, label: '🇰🇷 한국' },
                { key: 'US' as MarketScope, label: '🇺🇸 미국' },
                { key: 'BOTH' as MarketScope, label: '🌍 둘 다' },
              ]}
              value={marketScope}
              onChange={setMarketScope}
              palette={palette}
            />
          </Field>

          {/* 통화 */}
          <Field label="통화" palette={palette}>
            <ChipGroup
              options={[
                { key: 'KRW' as LeagueCurrency, label: 'KRW (원)' },
                { key: 'USD' as LeagueCurrency, label: 'USD (달러)' },
              ]}
              value={currency}
              onChange={switchCurrency}
              palette={palette}
            />
            <Text style={{ color: palette.inkFaint, fontSize: 11, marginTop: 6 }}>
              다른 시장 거래 시 환율 자동 변환 (시점 환율 lock)
            </Text>
          </Field>

          {/* 자본금 */}
          <Field label="자본금" palette={palette}>
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
              {presets.map((amt) => (
                <Pressable
                  key={amt}
                  onPress={() => setCapital(amt)}
                  accessibilityRole="button"
                  style={chipStyle(palette, capital === amt)}
                >
                  <Text style={chipTextStyle(palette, capital === amt)}>
                    {formatCapital(amt, currency)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Field>

          {/* 시작 시점 */}
          <Field label="시작 시점" palette={palette}>
            <ChipGroup
              options={START_PRESETS.map((s) => ({ key: s.key, label: s.label }))}
              value={startMode}
              onChange={setStartMode}
              palette={palette}
            />
            <Text style={{ color: palette.inkFaint, fontSize: 11, marginTop: 6 }}>
              {startMode === 'NOW' ? '만들자마자 거래 시작' : '시작 전엔 모집만 — 시작 시점에 자동 개시'}
            </Text>
          </Field>

          {/* 기간 */}
          <Field label="기간" palette={palette}>
            <ChipGroup
              options={DURATION_PRESETS.map((d) => ({ key: d.days, label: d.label }))}
              value={durationDays}
              onChange={setDurationDays}
              palette={palette}
            />
            <Text style={{ color: palette.inkFaint, fontSize: 11, marginTop: 6 }}>
              시작 시점부터 {durationDays}일 후 자동 정산
            </Text>
          </Field>

          {/* 거래 시간 */}
          <Field label="거래 시간" palette={palette}>
            <ChipGroup
              options={[
                { key: 'MARKET_HOURS_ONLY' as TradingHours, label: '장중에만' },
                { key: 'ALWAYS' as TradingHours, label: '24시간' },
              ]}
              value={tradingHours}
              onChange={setTradingHours}
              palette={palette}
            />
            <Text style={{ color: palette.inkFaint, fontSize: 11, marginTop: 6 }}>
              {tradingHours === 'MARKET_HOURS_ONLY' ? '실제 장 열린 시간에만 매매 가능' : '장 마감 후에도 마지막 시세로 매매 가능'}
            </Text>
          </Field>

          {/* 거래 공개 */}
          <Field label="거래 공개" palette={palette}>
            <ChipGroup
              options={[
                { key: 'OPEN' as LeagueVisibility, label: '공개 (피드)' },
                { key: 'CLOSED' as LeagueVisibility, label: '비공개' },
              ]}
              value={visibility}
              onChange={setVisibility}
              palette={palette}
            />
            <Text style={{ color: palette.inkFaint, fontSize: 11, marginTop: 6 }}>
              공개면 친구 거래가 실시간 피드에 보임
            </Text>
          </Field>
        </ScrollView>

        {/* 하단 액션 */}
        <View style={{
          padding: 16, borderTopWidth: 1, borderTopColor: palette.border,
          backgroundColor: palette.surface,
        }}>
          <Pressable
            onPress={() => void handleSubmit()}
            disabled={!valid}
            accessibilityRole="button"
            style={({ pressed }) => ({
              backgroundColor: pressed ? palette.brandAccent + 'cc' : palette.brandAccent,
              borderRadius: 12, paddingVertical: 14, alignItems: 'center',
              opacity: valid ? 1 : 0.5,
            })}
          >
            <Text style={{ color: palette.bg, fontSize: 15, fontWeight: '800' }}>
              {busy ? '만드는 중…' : startMode === 'NOW' ? '리그 만들기 + 바로 시작' : '리그 만들기 + 모집 시작'}
            </Text>
          </Pressable>
        </View>
      </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

// ─── helpers ────────────────────────────────────────────────────────────────
function Field({ label, palette, children }: { label: string; palette: any; children: React.ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: palette.inkMuted, fontSize: 11, fontWeight: '800', letterSpacing: 1 }}>
        {label.toUpperCase()}
      </Text>
      {children}
    </View>
  )
}

function ChipGroup<T extends string | number>({
  options, value, onChange, palette,
}: {
  options: Array<{ key: T; label: string }>
  value: T
  onChange: (v: T) => void
  palette: any
}) {
  return (
    <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
      {options.map((o) => (
        <Pressable
          key={String(o.key)}
          onPress={() => onChange(o.key)}
          accessibilityRole="button"
          style={chipStyle(palette, value === o.key)}
        >
          <Text style={chipTextStyle(palette, value === o.key)}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  )
}

function chipStyle(palette: any, active: boolean) {
  return {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
    backgroundColor: active ? palette.brandAccent : palette.surfaceAlt,
    borderWidth: 1, borderColor: active ? palette.brandAccent : palette.border,
  }
}
function chipTextStyle(palette: any, active: boolean) {
  return { color: active ? palette.bg : palette.inkSub, fontSize: 12, fontWeight: '800' as const }
}
function fieldStyle(palette: any) {
  return {
    backgroundColor: palette.surfaceAlt,
    color: palette.ink,
    borderWidth: 1, borderColor: palette.border, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, fontWeight: '600' as const,
  }
}
function formatCapital(n: number, currency: LeagueCurrency): string {
  if (currency === 'KRW') {
    if (n >= 100_000_000) return `${n / 100_000_000}억`
    if (n >= 10_000) return `${(n / 10_000).toLocaleString('ko-KR')}만`
    return n.toLocaleString('ko-KR')
  }
  return `$${(n).toLocaleString('en-US')}`
}
