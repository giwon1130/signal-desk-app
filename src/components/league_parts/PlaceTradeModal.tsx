/**
 * 리그 안에서 매수/매도. 백엔드가 시세 lock + 검증 + 체결.
 * FE 는 체결 전 미리보기(수수료 포함)·현금부족·수량초과로 헛주문을 막는다.
 */
import { useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowDownToLine, ArrowUpFromLine, Search, X } from 'lucide-react-native'
import { useTheme } from '../../theme'
import { placeTrade } from '../../api/league'
import { searchStocks } from '../../api'
import type { LeaguePosition, MarketScope, MarketSessionStatus, StockSearchResult, TradeSide, TradingHours } from '../../types'
import { LEAGUE_FEE, fmtMoney, fmtNum, tradeErrorMessage } from './leagueShared'

type Props = {
  visible: boolean
  leagueId: string
  positions: LeaguePosition[]            // 내 보유 — 매도 시 종목 빠른 선택용
  cashBalance: number                    // league 통화
  currency: 'KRW' | 'USD'
  marketScope: MarketScope
  tradingHours: TradingHours             // 장중에만 / 24시간
  marketSessions: MarketSessionStatus[]  // KR/US 개장 여부 (장 마감 안내용)
  onClose: () => void
  onTraded: () => void
  toast?: { show: (msg: string, type?: 'success' | 'error' | 'info') => void }
}

type Selected = {
  market: 'KR' | 'US'
  ticker: string
  name: string
  price: number          // 미리보기 기준가 — BUY=현재가, SELL=현재가(없으면 평단)
  changeRate: number
  avgCost?: number       // SELL 표시용 평단
  heldQty?: number       // SELL 수량 상한
}

export function PlaceTradeModal({
  visible, leagueId, positions, cashBalance, currency, marketScope, tradingHours, marketSessions, onClose, onTraded, toast,
}: Props) {
  const { palette } = useTheme()
  const insets = useSafeAreaInsets()
  const [side, setSide] = useState<TradeSide>('BUY')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<StockSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState(false)
  const [selected, setSelected] = useState<Selected | null>(null)
  const [quantity, setQuantity] = useState('1')
  const [busy, setBusy] = useState(false)
  const [tradeFeedback, setTradeFeedback] = useState<string | null>(null)

  // 모달 재진입 시 reset.
  useEffect(() => {
    if (visible) {
      setSide('BUY'); setQuery(''); setResults([]); setSelected(null); setQuantity('1'); setSearchError(false); setTradeFeedback(null)
    }
  }, [visible])

  useEffect(() => {
    setTradeFeedback(null)
  }, [side, selected?.market, selected?.ticker, quantity])

  // 검색 시장 파라미터 — 리그 시장 범위로 제한.
  const searchMarket: 'KR' | 'US' | 'ALL' = marketScope === 'BOTH' ? 'ALL' : marketScope

  // 검색 (debounce 300ms)
  useEffect(() => {
    if (!query.trim() || side === 'SELL') {
      setResults([])
      return
    }
    let cancelled = false
    setSearching(true)
    setSearchError(false)
    const t = setTimeout(async () => {
      try {
        const list = await searchStocks(query.trim(), searchMarket)
        // 방어적으로 범위 밖 종목 제외.
        const scoped = marketScope === 'BOTH' ? list : list.filter((s) => s.market === marketScope)
        if (!cancelled) setResults(scoped.slice(0, 20))
      } catch {
        if (!cancelled) { setResults([]); setSearchError(true) }
      } finally {
        if (!cancelled) setSearching(false)
      }
    }, 300)
    return () => { cancelled = true; clearTimeout(t) }
  }, [query, side, searchMarket, marketScope])

  // 매도 모드면 results 자리에 보유 종목 노출.
  const sellOptions = positions.filter((p) => p.quantity > 0)

  const qty = parseInt(quantity, 10) || 0
  // 선택 종목의 통화가 리그 통화와 같은지 (KR↔KRW / US↔USD). 같을 때만 정확한 금액 계산.
  const sameCcy = selected
    ? (selected.market === 'KR' && currency === 'KRW') || (selected.market === 'US' && currency === 'USD')
    : false
  const notional = selected ? selected.price * qty : 0
  const fee = notional * LEAGUE_FEE
  const buyCost = notional + fee          // 매수 총비용
  const sellProceeds = notional - fee     // 매도 수령액
  const remainingCash = side === 'BUY' ? cashBalance - buyCost : cashBalance + sellProceeds // 체결 후 잔여 현금

  // 검증
  const overQty = side === 'SELL' && selected?.heldQty != null && qty > selected.heldQty
  const insufficientCash = side === 'BUY' && sameCcy && qty > 0 && buyCost > cashBalance
  // 선택 종목 시장의 개장 여부 (백엔드 marketSessions 권위값). 없으면 열린 것으로 간주.
  const marketClosed = !!selected && marketSessions.find((s) => s.market === selected.market)?.isOpen === false
  // 장중에만 리그는 마감 시 막힘(백엔드도 거부). 24시간 리그는 마지막 시세로 허용 + 안내만.
  const hoursBlocked = marketClosed && tradingHours === 'MARKET_HOURS_ONLY'

  // 백엔드가 거절하는 조건은 전송 전에 안내한다. 버튼 자체는 busy 외에는 탭을 받아
  // 사용자가 "왜 안 되는지" 주문 화면 안에서 바로 확인할 수 있게 한다.
  const validationMessage = qty <= 0
    ? '매수할 수량을 1주 이상 입력해 주세요.'
    : overQty
      ? `보유 수량(${selected?.heldQty ?? 0}주)보다 많이 팔 수 없습니다.`
      : insufficientCash
        ? `현금이 부족합니다. 현재 보유 현금은 ${fmtMoney(cashBalance, currency)}입니다.`
        : hoursBlocked
          ? `${selected?.market === 'KR' ? '한국장' : '미국장'}이 마감됐습니다. 이 리그는 장중에만 거래할 수 있습니다.`
          : null
  const buttonLabel = busy
    ? '체결 중…'
    : validationMessage
      ? '거래 조건 확인'
      : side === 'BUY'
        ? '매수 체결'
        : '매도 체결'

  // 빠른 비율 — 매수: 보유 현금 기준 최대 매수가능 수량의 %, 매도: 보유 수량의 %.
  // (매수 100% 는 수수료까지 포함해 현금 안에서 살 수 있는 최대치)
  const canQuickPct = !!selected && selected.price > 0 && (side === 'SELL' ? (selected.heldQty ?? 0) > 0 : sameCcy)
  const applyPct = (pct: number) => {
    if (!selected || selected.price <= 0) return
    let q = 0
    if (side === 'SELL') {
      q = Math.floor((selected.heldQty ?? 0) * pct)
    } else if (sameCcy) {
      const maxAffordable = Math.floor(cashBalance / (selected.price * (1 + LEAGUE_FEE)))
      q = Math.floor(maxAffordable * pct)
    }
    setQuantity(String(Math.max(0, q)))
  }

  const handleConfirm = async () => {
    if (!selected || busy) return
    if (validationMessage) {
      setTradeFeedback(validationMessage)
      return
    }
    setTradeFeedback(null)
    setBusy(true)
    try {
      await placeTrade(leagueId, {
        market: selected.market, ticker: selected.ticker, name: selected.name, side, quantity: qty,
      })
      toast?.show(`${side === 'BUY' ? '매수' : '매도'} 체결 — ${selected.name} ${qty}주`, 'success')
      onTraded()
      onClose()
    } catch (e: any) {
      const message = tradeErrorMessage(e?.message || '')
      setTradeFeedback(message)
      toast?.show(message, 'error')
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
          paddingHorizontal: 16, paddingVertical: 12,
          borderBottomWidth: 1, borderBottomColor: palette.border, gap: 10,
        }}>
          <Text style={{ flex: 1, color: palette.ink, fontSize: 17, fontWeight: '900' }}>거래하기</Text>
          <Text style={{ color: palette.inkMuted, fontSize: 11 }}>
            보유 현금 {fmtMoney(cashBalance, currency)}
          </Text>
          <Pressable onPress={onClose} hitSlop={20} accessibilityRole="button" accessibilityLabel="닫기">
            <X size={20} color={palette.inkMuted} strokeWidth={2.5} />
          </Pressable>
        </View>

        {/* BUY/SELL 토글 */}
        <View style={{ flexDirection: 'row', padding: 12, gap: 8 }}>
          <SideButton label="매수" active={side === 'BUY'} onPress={() => { setSide('BUY'); setSelected(null) }} palette={palette} />
          <SideButton label="매도" active={side === 'SELL'} onPress={() => { setSide('SELL'); setSelected(null) }} palette={palette} />
        </View>

        {/* 선택 영역 */}
        {!selected ? (
          side === 'BUY' ? (
            <View style={{ flex: 1, paddingHorizontal: 16, gap: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8,
                backgroundColor: palette.surfaceAlt, borderRadius: 10,
                borderWidth: 1, borderColor: palette.border, paddingHorizontal: 12 }}>
                <Search size={14} color={palette.inkMuted} strokeWidth={2.5} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder={marketScope === 'KR' ? '한국 종목 검색 (예: 삼성)' : marketScope === 'US' ? '미국 종목 검색 (예: AAPL)' : '종목명 / ticker (예: 삼성, AAPL)'}
                  placeholderTextColor={palette.inkFaint}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={{ flex: 1, color: palette.ink, paddingVertical: 12, fontSize: 14 }}
                />
                {searching ? <ActivityIndicator size="small" color={palette.brandAccent} /> : null}
              </View>
              <FlatList
                data={results}
                keyExtractor={(it) => `${it.market}:${it.ticker}`}
                renderItem={({ item }) => (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setSelected({ market: item.market as 'KR' | 'US', ticker: item.ticker, name: item.name, price: item.price, changeRate: item.changeRate })}
                    style={({ pressed }) => ({
                      flexDirection: 'row', alignItems: 'center', gap: 8,
                      paddingVertical: 10, paddingHorizontal: 4,
                      borderBottomWidth: 1, borderBottomColor: palette.border,
                      opacity: pressed ? 0.6 : 1,
                    })}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: palette.ink, fontSize: 14, fontWeight: '700' }}>{item.name}</Text>
                      <Text style={{ color: palette.inkMuted, fontSize: 11 }}>{item.market} · {item.ticker} · {item.sector || ''}</Text>
                    </View>
                    {item.price > 0 ? (
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ color: palette.ink, fontSize: 13, fontWeight: '800' }}>{fmtPrice(item.price, item.market as 'KR' | 'US')}</Text>
                        <Text style={{ color: item.changeRate >= 0 ? palette.up : palette.down, fontSize: 11, fontWeight: '700' }}>
                          {item.changeRate >= 0 ? '+' : ''}{item.changeRate.toFixed(2)}%
                        </Text>
                      </View>
                    ) : null}
                  </Pressable>
                )}
                ListEmptyComponent={
                  searchError ? (
                    <Text style={{ color: palette.down, fontSize: 12, textAlign: 'center', paddingVertical: 20 }}>
                      검색 실패 — 다시 시도해 주세요
                    </Text>
                  ) : query.trim() && !searching ? (
                    <Text style={{ color: palette.inkFaint, fontSize: 12, textAlign: 'center', paddingVertical: 20 }}>
                      검색 결과 없음
                    </Text>
                  ) : null
                }
              />
            </View>
          ) : (
            // SELL — 보유 목록에서 선택
            <View style={{ flex: 1, paddingHorizontal: 16 }}>
              {sellOptions.length === 0 ? (
                <Text style={{ color: palette.inkMuted, fontSize: 12, textAlign: 'center', paddingTop: 40 }}>
                  매도할 보유 종목이 없습니다
                </Text>
              ) : (
                <FlatList
                  data={sellOptions}
                  keyExtractor={(p) => `${p.market}:${p.ticker}`}
                  renderItem={({ item }) => (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setSelected({
                        market: item.market as 'KR' | 'US', ticker: item.ticker, name: item.name,
                        price: item.currentPrice ?? item.averageCost, changeRate: 0,
                        avgCost: item.averageCost, heldQty: item.quantity,
                      })}
                      style={({ pressed }) => ({
                        paddingVertical: 12, paddingHorizontal: 4,
                        borderBottomWidth: 1, borderBottomColor: palette.border,
                        opacity: pressed ? 0.6 : 1,
                      })}
                    >
                      <Text style={{ color: palette.ink, fontSize: 14, fontWeight: '700' }}>{item.name}</Text>
                      <Text style={{ color: palette.inkMuted, fontSize: 11 }}>
                        {item.market} · {item.ticker} · 보유 {item.quantity}주 · 평단 {fmtNum(item.averageCost)}
                        {item.currentPrice != null ? ` · 현재 ${fmtNum(item.currentPrice)}` : ''}
                      </Text>
                    </Pressable>
                  )}
                />
              )}
            </View>
          )
        ) : (
          // 선택 후 수량 입력 + 체결
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16, paddingBottom: 24, gap: 14 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            showsVerticalScrollIndicator={false}
          >
            <View style={{
              backgroundColor: palette.surfaceAlt, borderRadius: 10, padding: 14, gap: 4,
              borderLeftWidth: 3, borderLeftColor: side === 'BUY' ? palette.up : palette.down,
            }}>
              <Text style={{ color: palette.inkMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1 }}>선택 종목</Text>
              <Text style={{ color: palette.ink, fontSize: 17, fontWeight: '900' }}>{selected.name}</Text>
              <Text style={{ color: palette.inkMuted, fontSize: 12 }}>{selected.market} · {selected.ticker}</Text>
              {selected.price > 0 ? (
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
                  <Text style={{ color: palette.ink, fontSize: 20, fontWeight: '900' }}>{fmtPrice(selected.price, selected.market)}</Text>
                  {side === 'BUY' && selected.changeRate !== 0 ? (
                    <Text style={{ color: selected.changeRate >= 0 ? palette.up : palette.down, fontSize: 13, fontWeight: '800' }}>
                      {selected.changeRate >= 0 ? '+' : ''}{selected.changeRate.toFixed(2)}%
                    </Text>
                  ) : null}
                  <Text style={{ color: palette.inkFaint, fontSize: 10 }}>현재가</Text>
                  {side === 'SELL' && selected.avgCost != null ? (
                    <Text style={{ color: palette.inkFaint, fontSize: 10 }}>· 평단 {fmtPrice(selected.avgCost, selected.market)}</Text>
                  ) : null}
                </View>
              ) : null}
              {side === 'SELL' && selected.heldQty != null ? (
                <Text style={{ color: palette.inkFaint, fontSize: 11, marginTop: 2 }}>보유 {selected.heldQty}주</Text>
              ) : null}
            </View>

            {/* 장 마감 안내 */}
            {marketClosed ? (
              <View style={{
                backgroundColor: (hoursBlocked ? palette.down : palette.orange) + '1a',
                borderRadius: 10, borderWidth: 1, borderColor: (hoursBlocked ? palette.down : palette.orange) + '55',
                paddingHorizontal: 12, paddingVertical: 10, gap: 2,
              }}>
                <Text style={{ color: hoursBlocked ? palette.down : palette.orange, fontSize: 12, fontWeight: '900' }}>
                  🌙 {selected.market === 'KR' ? '한국장' : '미국장'} 마감
                </Text>
                <Text style={{ color: palette.inkMuted, fontSize: 11, lineHeight: 16 }}>
                  {hoursBlocked
                    ? '이 리그는 장중에만 거래됩니다. 장이 열린 뒤 다시 시도해 주세요.'
                    : '지금은 장이 끝나서 마지막 시세로 체결됩니다. 정상 거래는 장이 열린 뒤에 하는 걸 추천합니다 🙂'}
                </Text>
              </View>
            ) : null}

            <View style={{ gap: 6 }}>
              <Text style={{ color: palette.inkMuted, fontSize: 11, fontWeight: '800', letterSpacing: 1 }}>수량</Text>
              <TextInput
                value={quantity}
                onChangeText={(v) => setQuantity(v.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                maxLength={7}
                style={{
                  backgroundColor: palette.surfaceAlt, color: palette.ink,
                  borderWidth: 1, borderColor: overQty ? palette.down : palette.border, borderRadius: 8,
                  paddingHorizontal: 14, paddingVertical: 14,
                  fontSize: 22, fontWeight: '900', textAlign: 'right',
                }}
              />
              {/* 빠른 비율 (25 / 50 / 전액) */}
              {canQuickPct ? (
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {[{ l: '25%', p: 0.25 }, { l: '50%', p: 0.5 }, { l: '전액', p: 1 }].map((b) => (
                    <Pressable
                      key={b.l}
                      onPress={() => applyPct(b.p)}
                      accessibilityRole="button"
                      accessibilityLabel={`${side === 'BUY' ? '매수' : '매도'} ${b.l}`}
                      style={({ pressed }) => ({
                        flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center',
                        backgroundColor: pressed ? palette.surface : palette.surfaceAlt,
                        borderWidth: 1, borderColor: palette.border,
                      })}
                    >
                      <Text style={{ color: palette.inkSub, fontSize: 12, fontWeight: '800' }}>{b.l}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
              {/* 예상 금액 + 수수료 */}
              {selected.price > 0 && qty > 0 ? (
                sameCcy ? (
                  <View style={{ gap: 3, marginTop: 2 }}>
                    <Row label="주문 금액" value={fmtMoney(notional, currency)} palette={palette} />
                    <Row label="수수료 (0.3%)" value={`${side === 'BUY' ? '+' : '−'} ${fmtMoney(fee, currency)}`} palette={palette} faint />
                    <Row
                      label={side === 'BUY' ? '예상 매수 비용' : '예상 수령액'}
                      value={fmtMoney(side === 'BUY' ? buyCost : sellProceeds, currency)}
                      palette={palette}
                      strong
                    />
                    <View style={{ height: 1, backgroundColor: palette.border, marginVertical: 3 }} />
                    <Row
                      label="체결 후 잔여 현금"
                      value={fmtMoney(remainingCash, currency)}
                      palette={palette}
                      danger={remainingCash < 0}
                    />
                  </View>
                ) : (
                  <View style={{ gap: 3, marginTop: 2 }}>
                    <Row label={`주문 금액 (${selected.market === 'KR' ? '원' : '$'})`} value={fmtPrice(notional, selected.market)} palette={palette} />
                    <Text style={{ color: palette.inkFaint, fontSize: 11 }}>
                      리그 통화({currency})와 달라 체결 시점 환율로 변환·확정 — 수수료 0.3% 별도
                    </Text>
                  </View>
                )
              ) : null}
              {/* 경고들 */}
              {overQty ? (
                <Text style={{ color: palette.down, fontSize: 12, fontWeight: '700' }}>
                  보유 수량({selected.heldQty}주)보다 많이 팔 수 없습니다
                </Text>
              ) : null}
              {insufficientCash ? (
                <Text style={{ color: palette.down, fontSize: 12, fontWeight: '700' }}>
                  현금 부족 — 보유 {fmtMoney(cashBalance, currency)}
                </Text>
              ) : null}
              {!sameCcy ? null : (
                <Text style={{ color: palette.inkFaint, fontSize: 11 }}>
                  실제 체결가는 체결 시점 실시간 시세로 확정
                </Text>
              )}
            </View>

            <Pressable
              onPress={() => setSelected(null)}
              accessibilityRole="button"
              style={({ pressed }) => ({
                paddingVertical: 10, alignItems: 'center',
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Text style={{ color: palette.inkMuted, fontSize: 12, fontWeight: '700' }}>← 다른 종목 선택</Text>
            </Pressable>
          </ScrollView>
        )}

        {/* 하단 체결 버튼 (선택 후만) */}
        {selected ? (
          <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: palette.border, backgroundColor: palette.surface, gap: 8 }}>
            {tradeFeedback ? (
              <Text
                accessibilityRole="alert"
                style={{ color: palette.down, fontSize: 12, fontWeight: '700', lineHeight: 17, textAlign: 'center' }}
              >
                {tradeFeedback}
              </Text>
            ) : null}
            <Pressable
              onPress={() => void handleConfirm()}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel={buttonLabel}
              accessibilityHint={validationMessage ?? '선택한 종목 주문을 전송합니다'}
              accessibilityState={{ disabled: busy, busy }}
              style={({ pressed }) => ({
                backgroundColor: side === 'BUY'
                  ? (pressed ? palette.up + 'cc' : palette.up)
                  : (pressed ? palette.down + 'cc' : palette.down),
                borderRadius: 12, paddingVertical: 14,
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                opacity: busy || validationMessage ? 0.62 : 1,
              })}
            >
              {side === 'BUY'
                ? <ArrowDownToLine size={16} color="#fff" strokeWidth={2.5} />
                : <ArrowUpFromLine size={16} color="#fff" strokeWidth={2.5} />}
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '900' }}>
                {buttonLabel}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

function Row({ label, value, palette, faint, strong, danger }: { label: string; value: string; palette: any; faint?: boolean; strong?: boolean; danger?: boolean }) {
  const valueColor = danger ? palette.down : faint ? palette.inkMuted : palette.ink
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Text style={{ color: faint ? palette.inkFaint : palette.inkMuted, fontSize: 12, fontWeight: '700' }}>{label}</Text>
      <Text style={{ color: valueColor, fontSize: strong ? 16 : 13, fontWeight: strong ? '900' : '800' }}>{value}</Text>
    </View>
  )
}

/** 시장별 통화 기호로 가격 포맷. KR=원(정수), US=달러(소수 2자리). */
function fmtPrice(value: number, market: 'KR' | 'US'): string {
  if (market === 'US') return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  return `${Math.round(value).toLocaleString('ko-KR')}원`
}

function SideButton({ label, active, onPress, palette }: { label: string; active: boolean; onPress: () => void; palette: any }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({
        flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center',
        backgroundColor: active ? palette.brandAccent : palette.surfaceAlt,
        borderWidth: 1, borderColor: active ? palette.brandAccent : palette.border,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Text style={{ color: active ? palette.bg : palette.inkSub, fontSize: 14, fontWeight: '800' }}>{label}</Text>
    </Pressable>
  )
}
