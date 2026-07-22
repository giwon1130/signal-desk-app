/**
 * v2 온보딩 — 5단계.
 *
 * Step 1: 시작 화면 (로고 + 시작)
 * Step 2: 시장 선택 (필수, 3카드 KR/US/BOTH) — Spec 결정 1
 * Step 3: 알림 권한 (스킵 가능) — Spec 결정 3
 * Step 4: 추천 관심종목 + 보유 종목 등록 진입점
 * Step 5: 완료 → 오늘 또는 종목 탭으로 이동
 *
 * 마지막에 onComplete(marketPreference, destination) 호출 — App 이 상태·첫 탭을 갱신.
 */
import { useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Notifications from 'expo-notifications'
import { ArrowRight, Bell, Check, Sparkles } from 'lucide-react-native'
import { useTheme } from '../theme'
import type { MarketPreference } from '../api/alertPreferences'
import { updateAlertPreferences, type AlertPreferences } from '../api/alertPreferences'
import { quickAddWatchItem } from '../api'
import { seedFor } from '../data/seedStocks'
import { markOnboardingCompleted } from '../utils/onboarding'
import type { StockSearchResult } from '../types'
import { setKrOpenEnabled, setUsOpenEnabled } from '../hooks/useMarketReminder'

type Props = {
  authToken: string
  onComplete: (pref: MarketPreference, destination: 'today' | 'stocks') => void
}

type Step = 1 | 2 | 3 | 4 | 5
type NotificationMode = 'essential' | 'signals'

export function OnboardingScreen({ authToken, onComplete }: Props) {
  const { palette } = useTheme()
  const [step, setStep] = useState<Step>(1)
  const [pref, setPref] = useState<MarketPreference | null>(null)
  const [pickedSeeds, setPickedSeeds] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)
  const [destination, setDestination] = useState<'today' | 'stocks'>('today')
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [notificationMode, setNotificationMode] = useState<NotificationMode>('essential')

  // 시장 선택 직후 호출. 추천 시드 default 전체 선택 상태로 초기화.
  const handlePickMarket = (m: MarketPreference) => {
    setPref(m)
    const seeds = seedFor(m)
    setPickedSeeds(new Set(seeds.map((s) => `${s.market}:${s.ticker}`)))
    setStep(3)
  }

  const handleAllowNotifications = async () => {
    setBusy(true)
    try {
      const { status } = await Notifications.requestPermissionsAsync()
      setNotificationsEnabled(status === 'granted')
    } finally {
      setBusy(false)
      setStep(4)
    }
  }

  const handleSaveAndContinue = async (next: 'today' | 'stocks') => {
    if (!pref) return
    setBusy(true)
    try {
      // 시장 선호와 선택한 알림 강도를 함께 저장한다.
      await applyNotificationProfile(authToken, pref, notificationsEnabled, notificationMode)

      // 선택된 시드 종목 일괄 등록
      const seeds = seedFor(pref).filter((s) => pickedSeeds.has(`${s.market}:${s.ticker}`))
      for (const s of seeds) {
        try { await quickAddWatchItem(s) } catch { /* 실패해도 진행 */ }
      }
      await markOnboardingCompleted()
      setDestination(next)
      setStep(5)
      // 잠시 완료 화면을 보여준 뒤 선택한 첫 화면으로 이동.
      setTimeout(() => onComplete(pref, next), 700)
    } finally {
      setBusy(false)
    }
  }

  const handleSkipSeeds = async () => {
    if (!pref) return
    setBusy(true)
    try {
      await applyNotificationProfile(authToken, pref, false, notificationMode)
      await markOnboardingCompleted()
      setDestination('today')
      setStep(5)
      setTimeout(() => onComplete(pref, 'today'), 700)
    } finally {
      setBusy(false)
    }
  }

  const toggleSeed = (s: StockSearchResult) => {
    const k = `${s.market}:${s.ticker}`
    setPickedSeeds((prev) => {
      const next = new Set(prev)
      if (next.has(k)) next.delete(k)
      else next.add(k)
      return next
    })
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 20, flex: 1 }}>
        {/* 진행 도트 */}
        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 24 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <View
              key={n}
              style={{
                flex: 1, height: 3, borderRadius: 2,
                backgroundColor: n <= step ? palette.brandAccent : palette.borderLight,
              }}
            />
          ))}
        </View>

        {step === 1 ? <Step1Welcome palette={palette} onNext={() => setStep(2)} /> : null}
        {step === 2 ? <Step2Market palette={palette} onPick={handlePickMarket} /> : null}
        {step === 3 ? (
          <Step3Notifications
            palette={palette}
            busy={busy}
            mode={notificationMode}
            onModeChange={setNotificationMode}
            onAllow={() => void handleAllowNotifications()}
            onSkip={() => { setNotificationsEnabled(false); setStep(4) }}
          />
        ) : null}
        {step === 4 && pref ? (
          <Step4Seeds
            palette={palette}
            pref={pref}
            picked={pickedSeeds}
            busy={busy}
            onToggle={toggleSeed}
            onStartToday={() => void handleSaveAndContinue('today')}
            onRegisterHoldings={() => void handleSaveAndContinue('stocks')}
            onSkip={() => void handleSkipSeeds()}
          />
        ) : null}
        {step === 5 ? <Step5Done palette={palette} destination={destination} /> : null}
      </View>
    </SafeAreaView>
  )
}

// ─── Step 1: 시작 ────────────────────────────────────────────────────────────
function Step1Welcome({ palette, onNext }: { palette: any; onNext: () => void }) {
  return (
    <View style={{ flex: 1, justifyContent: 'space-between' }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 }}>
        <View style={{
          width: 72, height: 72, borderRadius: 16,
          backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Sparkles size={32} color={palette.brandAccent} strokeWidth={2.2} />
        </View>
        <Text style={{ color: palette.ink, fontSize: 26, fontWeight: '900', textAlign: 'center' }}>
          Signal Desk
        </Text>
        <Text style={{ color: palette.inkSub, fontSize: 14, textAlign: 'center', lineHeight: 22, maxWidth: 280 }}>
          내 시장에 맞춰진{'\n'}투자 대시보드
        </Text>
      </View>
      <PrimaryButton label="시작하기" palette={palette} onPress={onNext} />
    </View>
  )
}

// ─── Step 2: 시장 선택 (필수) ────────────────────────────────────────────────
function Step2Market({ palette, onPick }: { palette: any; onPick: (m: MarketPreference) => void }) {
  const options: Array<{ key: MarketPreference; emoji: string; title: string; desc: string }> = [
    { key: 'KR',   emoji: '🇰🇷', title: '한국 시장',  desc: 'KOSPI/KOSDAQ · DART 공시 · 외인·기관 수급 중심' },
    { key: 'US',   emoji: '🇺🇸', title: '미국 시장',  desc: 'NASDAQ/S&P · SEC EDGAR · Yahoo movers 중심' },
    { key: 'BOTH', emoji: '🌍',  title: '둘 다',       desc: '양쪽 시장을 균형 있게' },
  ]
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
      <Text style={{ color: palette.ink, fontSize: 22, fontWeight: '900', marginBottom: 6 }}>
        어느 시장 보세요?
      </Text>
      <Text style={{ color: palette.inkMuted, fontSize: 13, marginBottom: 24, lineHeight: 19 }}>
        선택한 시장에 맞춰 메인 화면 콘텐츠가 달라집니다. 설정에서 언제든 변경 가능.
      </Text>
      <View style={{ gap: 10 }}>
        {options.map((o) => (
          <Pressable
            key={o.key}
            onPress={() => onPick(o.key)}
            style={({ pressed }) => ({
              backgroundColor: pressed ? palette.surfaceAlt : palette.surface,
              borderRadius: 12, borderWidth: 1, borderColor: palette.border,
              padding: 16, gap: 6,
            })}
          >
            <Text style={{ fontSize: 32 }}>{o.emoji}</Text>
            <Text style={{ color: palette.ink, fontSize: 16, fontWeight: '800' }}>{o.title}</Text>
            <Text style={{ color: palette.inkMuted, fontSize: 12, lineHeight: 17 }}>{o.desc}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  )
}

// ─── Step 3: 알림 권한 (스킵 가능) ───────────────────────────────────────────
function Step3Notifications({ palette, busy, mode, onModeChange, onAllow, onSkip }: {
  palette: any
  busy: boolean
  mode: NotificationMode
  onModeChange: (mode: NotificationMode) => void
  onAllow: () => void
  onSkip: () => void
}) {
  const modes: Array<{ key: NotificationMode; title: string; desc: string }> = [
    { key: 'essential', title: '핵심만', desc: '장 시작·관심/보유 종목·시작 전 브리프만 받아요' },
    { key: 'signals', title: '시장 신호까지', desc: '거래량 급증·위험도·마감 브리프도 받아요' },
  ]
  return (
    <View style={{ flex: 1, justifyContent: 'space-between' }}>
      <ScrollView contentContainerStyle={{ paddingVertical: 20, gap: 14 }}>
        <View style={{
          width: 56, height: 56, borderRadius: 14, alignSelf: 'flex-start',
          backgroundColor: palette.blueSoft, alignItems: 'center', justifyContent: 'center',
        }}>
          <Bell size={26} color={palette.blue} strokeWidth={2.2} />
        </View>
        <Text style={{ color: palette.ink, fontSize: 22, fontWeight: '900' }}>알림 받을래요?</Text>
        <Text style={{ color: palette.inkMuted, fontSize: 13, lineHeight: 19 }}>
          처음부터 너무 많이 울리지 않도록 알림 강도를 골라주세요. 설정에서 언제든 바꿀 수 있어요.
        </Text>
        <View style={{ marginTop: 6, gap: 8 }}>
          {modes.map((item) => {
            const selected = mode === item.key
            return (
              <Pressable
                key={item.key}
                onPress={() => onModeChange(item.key)}
                style={({ pressed }) => ({
                  backgroundColor: selected ? palette.blueSoft : palette.surface,
                  borderWidth: 1.5, borderColor: selected ? palette.blue : palette.border,
                  borderRadius: 12, padding: 13, gap: 3, opacity: pressed ? 0.75 : 1,
                })}
              >
                <Text style={{ color: selected ? palette.blue : palette.ink, fontSize: 14, fontWeight: '800' }}>{item.title}</Text>
                <Text style={{ color: palette.inkMuted, fontSize: 11.5, lineHeight: 16 }}>{item.desc}</Text>
              </Pressable>
            )
          })}
        </View>
      </ScrollView>
      <View style={{ gap: 8 }}>
        <PrimaryButton label={busy ? '권한 요청 중…' : '알림 받기'} palette={palette} onPress={onAllow} disabled={busy} />
        <SecondaryButton label="나중에" palette={palette} onPress={onSkip} disabled={busy} />
      </View>
    </View>
  )
}

/** 신규 사용자의 알림을 선택한 시장·강도에 맞춘다. 건너뛰면 모든 푸시/로컬 알림을 끈다. */
async function applyNotificationProfile(
  authToken: string,
  marketPreference: MarketPreference,
  enabled: boolean,
  mode: NotificationMode,
) {
  const followsKr = marketPreference !== 'US'
  const followsUs = marketPreference !== 'KR'
  const expanded = enabled && mode === 'signals'
  const prefs: AlertPreferences = {
    krEnabled: enabled && followsKr,
    usEnabled: enabled && followsUs,
    premarketEnabled: enabled && followsKr,
    compositeRiskEnabled: expanded,
    marketPreference,
    eveningBriefEnabled: false,
    middayBriefEnabled: false,
    closeBriefEnabled: expanded && followsKr,
    volumeAlertEnabled: expanded,
    quietHoursEnabled: false,
    quietStartHour: 22,
    quietEndHour: 7,
    readingPostEnabled: false,
  }
  await updateAlertPreferences(authToken, prefs)
  await Promise.all([
    setKrOpenEnabled(enabled && followsKr),
    setUsOpenEnabled(enabled && followsUs),
  ])
}

// ─── Step 4: 추천 관심종목 + 보유 종목 등록 진입 ───────────────────────────────
function Step4Seeds({ palette, pref, picked, busy, onToggle, onStartToday, onRegisterHoldings, onSkip }: {
  palette: any
  pref: MarketPreference
  picked: Set<string>
  busy: boolean
  onToggle: (s: StockSearchResult) => void
  onStartToday: () => void
  onRegisterHoldings: () => void
  onSkip: () => void
}) {
  const seeds = seedFor(pref)
  const count = picked.size
  return (
    <View style={{ flex: 1, justifyContent: 'space-between' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 12 }}>
        <Text style={{ color: palette.ink, fontSize: 22, fontWeight: '900', marginBottom: 6 }}>
          관심 종목을 골라보세요
        </Text>
        <Text style={{ color: palette.inkMuted, fontSize: 13, marginBottom: 16, lineHeight: 19 }}>
          시총 상위 종목들이에요. 추적할 종목만 고르고, 보유 종목은 다음 화면에서 매수가와 수량을 입력해 등록할 수 있어요.
        </Text>
        <View style={{ gap: 8 }}>
          {seeds.map((s) => {
            const k = `${s.market}:${s.ticker}`
            const on = picked.has(k)
            return (
              <Pressable
                key={k}
                onPress={() => onToggle(s)}
                style={({ pressed }) => ({
                  flexDirection: 'row', alignItems: 'center', gap: 10,
                  backgroundColor: pressed ? palette.surfaceAlt : palette.surface,
                  borderRadius: 10, borderWidth: 1,
                  borderColor: on ? palette.brandAccent : palette.border,
                  padding: 12,
                })}
              >
                <View style={{
                  width: 22, height: 22, borderRadius: 6,
                  backgroundColor: on ? palette.brandAccent : 'transparent',
                  borderWidth: 1, borderColor: on ? palette.brandAccent : palette.border,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  {on ? <Check size={14} color="#07150f" strokeWidth={3} /> : null}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: palette.ink, fontSize: 14, fontWeight: '800' }}>{s.name}</Text>
                  <Text style={{ color: palette.inkMuted, fontSize: 11 }}>{s.market} · {s.ticker}</Text>
                </View>
              </Pressable>
            )
          })}
        </View>
      </ScrollView>
      <View style={{ gap: 8 }}>
        <PrimaryButton
          label={busy ? '등록 중…' : '보유 종목 등록하기'}
          palette={palette}
          onPress={onRegisterHoldings}
          disabled={busy}
        />
        <SecondaryButton label={count > 0 ? `${count}개 관심종목 등록하고 오늘 보기` : '관심종목 없이 오늘 보기'} palette={palette} onPress={onStartToday} disabled={busy} />
        <SecondaryButton label="모두 나중에 할게" palette={palette} onPress={onSkip} disabled={busy} />
      </View>
    </View>
  )
}

// ─── Step 5: 완료 (잠시 노출 후 선택한 탭으로 이동) ──────────────────────────
function Step5Done({ palette, destination }: { palette: any; destination: 'today' | 'stocks' }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14 }}>
      <View style={{
        width: 64, height: 64, borderRadius: 32,
        backgroundColor: palette.brandAccent + '22',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Check size={32} color={palette.brandAccent} strokeWidth={3} />
      </View>
      <Text style={{ color: palette.ink, fontSize: 18, fontWeight: '800' }}>준비 완료</Text>
      <Text style={{ color: palette.inkMuted, fontSize: 12 }}>
        {destination === 'stocks' ? '보유 종목 등록으로 이동 중…' : '오늘 시장으로 이동 중…'}
      </Text>
    </View>
  )
}

// ─── Reusable Buttons ───────────────────────────────────────────────────────
function PrimaryButton({ label, palette, onPress, disabled }: { label: string; palette: any; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        backgroundColor: disabled ? palette.surfaceAlt : pressed ? palette.brandAccent + 'cc' : palette.brandAccent,
        borderRadius: 12, paddingVertical: 14, paddingHorizontal: 18,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        opacity: disabled ? 0.6 : 1,
      })}
    >
      <Text style={{ color: disabled ? palette.inkMuted : '#07150f', fontSize: 15, fontWeight: '900' }}>{label}</Text>
      {!disabled ? <ArrowRight size={16} color="#07150f" strokeWidth={2.5} /> : null}
    </Pressable>
  )
}

function SecondaryButton({ label, palette, onPress, disabled }: { label: string; palette: any; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        backgroundColor: pressed ? palette.surfaceAlt : 'transparent',
        borderRadius: 12, paddingVertical: 12, alignItems: 'center',
        opacity: disabled ? 0.5 : 1,
      })}
    >
      <Text style={{ color: palette.inkMuted, fontSize: 14, fontWeight: '700' }}>{label}</Text>
    </Pressable>
  )
}
