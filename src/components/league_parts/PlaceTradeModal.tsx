/**
 * 리그 안에서 매수/매도. 백엔드가 시세 lock + 검증 + 체결.
 * FE 는 체결 전 미리보기(수수료 포함)·현금부족·수량초과·30% 비중 경고로 헛주문을 막는다.
 */
import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowDownToLine, ArrowUpFromLine, Search, X } from 'lucide-react-native'
import { useTheme } from '../../theme'
import { placeTrade } from '../../api/league'
import { searchStocks } from '../../api'
import type { LeaguePosition, MarketScope, StockSearchResult, TradeSide } from '../../types'
import { LEAGUE_FEE, MAX_POSITION_PCT, fmtMoney, tradeErrorMessage } from './leagueShared'

type Props = {
  visible: boolean
  leagueId: string
  positions: LeaguePosition[]            // 내 보유 — 매도 시 종목 빠른 선택용 + 30% 비중 계산
  cashBalance: number                    // league 통화
  currency: 'KRW' | 'USD'
  marketScope: MarketScope
  totalAssets: number                    // league 통화 — 30% 비중 기준
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
  visible, leagueId, positions, cashBalance, currency, marketScope, totalAssets, onClose, onTraded, toast,
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

  // 모달 재진입 시 reset.
  useEffect(() => {
    if (visible) {
      setSide('BUY'); setQuery(''); setResults([]); setSelected(null); setQuantity('1'); setSearchError(false)
    }
  }, [visible])

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

  // 검증
  const overQty = side === 'SELL' && selected?.heldQty != null && qty > selected.heldQty
  const insufficientCash = side === 'BUY' && sameCcy && qty > 0 && buyCost > cashBalance
  // 30% 비중 경고 (BUY · 동일통화 · totalAssets 유효) — 매수 후 해당 종목 평가비중.
  const over30 = useMemo(() => {
    if (side !== 'BUY' || !sameCcy || !selected || qty <= 0 || totalAssets <= 0) return false
    const held = positions.find((p) => p.market === selected.market && p.ticker === selected.ticker)
    const heldValue = held && held.currentPrice != null ? held.currentPrice * held.quantity : 0
    return (heldValue + notional) / totalAssets > MAX_POSITION_PCT
  }, [side, sameCcy, selected, qty, totalAssets, positions, notional])

  const blocked = busy || qty <= 0 || overQty || insufficientCash

  const handleConfirm = async () => {
    if (!selected || blocked) return
    setBusy(true)
    try {
      await placeTrade(leagueId, {
        market: selected.market, ticker: selected.ticker, name: selected.name, side, quantity: qty,
      })
      toast?.show(`${side === 'BUY' ? '매수' : '매도'} 체결 — ${selected.name} ${qty}주`, 'success')
      onTraded()
      onClose()
    } catch (e: any) {
      toast?.show(tradeErrorMessage(e?.message || ''), 'error')
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
                      검색 실패 — 다시 시도해줘
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
                  매도할 보유 종목이 없어요
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
                        {item.market} · {item.ticker} · 보유 {item.quantity}주 · 평단 {item.averageCost.toFixed(2)}
                        {item.currentPrice != null ? ` · 현재 ${item.currentPrice.toFixed(2)}` : ''}
                      </Text>
                    </Pressable>
                  )}
                />
              )}
            </View>
          )
        ) : (
          // 선택 후 수량 입력 + 체결
          <View style={{ padding: 16, gap: 14 }}>
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
                  보유 수량({selected.heldQty}주)보다 많이 팔 수 없어요
                </Text>
              ) : null}
              {insufficientCash ? (
                <Text style={{ color: palette.down, fontSize: 12, fontWeight: '700' }}>
                  현금 부족 — 보유 {fmtMoney(cashBalance, currency)}
                </Text>
              ) : null}
              {over30 && !insufficientCash ? (
                <Text style={{ color: palette.orange, fontSize: 12, fontWeight: '700' }}>
                  ⚠️ 한 종목 비중 30% 초과 — 분산 권장
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
          </View>
        )}

        {/* 하단 체결 버튼 (선택 후만) */}
        {selected ? (
          <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: palette.border, backgroundColor: palette.surface }}>
            <Pressable
              onPress={() => void handleConfirm()}
              disabled={blocked}
              accessibilityRole="button"
              style={({ pressed }) => ({
                backgroundColor: side === 'BUY'
                  ? (pressed ? palette.up + 'cc' : palette.up)
                  : (pressed ? palette.down + 'cc' : palette.down),
                borderRadius: 12, paddingVertical: 14,
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                opacity: blocked ? 0.5 : 1,
              })}
            >
              {side === 'BUY'
                ? <ArrowDownToLine size={16} color="#fff" strokeWidth={2.5} />
                : <ArrowUpFromLine size={16} color="#fff" strokeWidth={2.5} />}
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '900' }}>
                {busy ? '체결 중…' : side === 'BUY' ? '매수 체결' : '매도 체결'}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

function Row({ label, value, palette, faint, strong }: { label: string; value: string; palette: any; faint?: boolean; strong?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Text style={{ color: faint ? palette.inkFaint : palette.inkMuted, fontSize: 12, fontWeight: '700' }}>{label}</Text>
      <Text style={{ color: faint ? palette.inkMuted : palette.ink, fontSize: strong ? 16 : 13, fontWeight: strong ? '900' : '800' }}>{value}</Text>
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
