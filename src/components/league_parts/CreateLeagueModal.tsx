/**
 * 리그 생성 모달 — Trading League.
 *
 * 호스트가 시장/통화/자본금/기간/공개여부 정함. 생성 즉시 OPEN 상태로 (참가 모집 가능).
 * spec: docs/mock-investment-game-spec.md
 */
import { useMemo, useState } from 'react'
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Trophy, X } from 'lucide-react-native'
import { useTheme } from '../../theme'
import type { LeagueCurrency, LeagueVisibility, MarketScope } from '../../types'
import { createLeague, openLeague } from '../../api/league'

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

export function CreateLeagueModal({ visible, onClose, onCreated, toast }: Props) {
  const { palette } = useTheme()
  const insets = useSafeAreaInsets()
  const [name, setName] = useState('')
  const [marketScope, setMarketScope] = useState<MarketScope>('BOTH')
  const [currency, setCurrency] = useState<LeagueCurrency>('KRW')
  const [capital, setCapital] = useState<number>(KRW_PRESETS[1])  // 5천만
  const [durationDays, setDurationDays] = useState<number>(30)
  const [visibility, setVisibility] = useState<LeagueVisibility>('OPEN')
  const [hostNickname, setHostNickname] = useState('호스트')
  const [busy, setBusy] = useState(false)

  const presets = currency === 'KRW' ? KRW_PRESETS : USD_PRESETS

  // 통화 변경 시 capital 도 맞춰서 swap (가까운 preset 으로).
  const switchCurrency = (c: LeagueCurrency) => {
    setCurrency(c)
    setCapital(c === 'KRW' ? KRW_PRESETS[1] : USD_PRESETS[1])
  }

  const { startedAt, endsAt } = useMemo(() => {
    const now = Date.now()
    return {
      startedAt: new Date(now).toISOString(),
      endsAt: new Date(now + durationDays * 86400_000).toISOString(),
    }
  }, [durationDays])

  const handleSubmit = async () => {
    if (busy || !name.trim() || !hostNickname.trim()) return
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
        tradingHours: 'MARKET_HOURS_ONLY',
        hostNickname: hostNickname.trim(),
        hostAvatarEmoji: '🦊',
      })
      // 생성 즉시 OPEN 으로 — 참가 모집 시작.
      await openLeague(league.id)
      toast?.show(`리그 생성 완료 — 코드 ${league.joinCode}`, 'success')
      onCreated(league.id)
      onClose()
      // 폼 reset
      setName('')
      setHostNickname('호스트')
    } catch (e: any) {
      toast?.show('리그 생성 실패', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: palette.bg, paddingTop: insets.top, paddingBottom: insets.bottom }}>
        {/* 헤더 */}
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          paddingHorizontal: 16, paddingVertical: 14,
          borderBottomWidth: 1, borderBottomColor: palette.border,
          gap: 10,
        }}>
          <Trophy size={20} color={palette.brandAccent} strokeWidth={2.5} />
          <Text style={{ flex: 1, color: palette.ink, fontSize: 17, fontWeight: '900' }}>새 리그 만들기</Text>
          <Pressable onPress={onClose} hitSlop={10}>
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
              maxLength={40}
              style={fieldStyle(palette)}
            />
          </Field>

          {/* 호스트 닉네임 */}
          <Field label="내 닉네임" palette={palette}>
            <TextInput
              value={hostNickname}
              onChangeText={setHostNickname}
              placeholder="게임 안 표시될 이름"
              placeholderTextColor={palette.inkFaint}
              maxLength={20}
              style={fieldStyle(palette)}
            />
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
                  style={chipStyle(palette, capital === amt)}
                >
                  <Text style={chipTextStyle(palette, capital === amt)}>
                    {formatCapital(amt, currency)}
                  </Text>
                </Pressable>
              ))}
            </View>
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
              지금부터 {durationDays}일 후 자동 정산
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
            disabled={busy || !name.trim() || !hostNickname.trim()}
            style={({ pressed }) => ({
              backgroundColor: pressed ? palette.brandAccent + 'cc' : palette.brandAccent,
              borderRadius: 12, paddingVertical: 14, alignItems: 'center',
              opacity: busy || !name.trim() || !hostNickname.trim() ? 0.5 : 1,
            })}
          >
            <Text style={{ color: palette.bg, fontSize: 15, fontWeight: '800' }}>
              {busy ? '만드는 중…' : '리그 만들기 + 모집 시작'}
            </Text>
          </Pressable>
        </View>
      </View>
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
