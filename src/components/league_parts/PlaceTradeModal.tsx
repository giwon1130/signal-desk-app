/**
 * 리그 안에서 매수/매도. 백엔드가 시세 lock + 검증 + 체결.
 */
import { useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, Modal, Pressable, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowDownToLine, ArrowUpFromLine, Search, X } from 'lucide-react-native'
import { useTheme } from '../../theme'
import { placeTrade } from '../../api/league'
import { searchStocks } from '../../api'
import type { LeaguePosition, StockSearchResult, TradeSide } from '../../types'

type Props = {
  visible: boolean
  leagueId: string
  positions: LeaguePosition[]            // 내 보유 — 매도 시 종목 빠른 선택용
  cashBalance: number
  currency: 'KRW' | 'USD'
  onClose: () => void
  onTraded: () => void
  toast?: { show: (msg: string, type?: 'success' | 'error' | 'info') => void }
}

export function PlaceTradeModal({ visible, leagueId, positions, cashBalance, currency, onClose, onTraded, toast }: Props) {
  const { palette } = useTheme()
  const insets = useSafeAreaInsets()
  const [side, setSide] = useState<TradeSide>('BUY')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<StockSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<{ market: 'KR' | 'US'; ticker: string; name: string; price: number; changeRate: number } | null>(null)
  const [quantity, setQuantity] = useState('1')
  const [busy, setBusy] = useState(false)

  // 모달 재진입 시 reset.
  useEffect(() => {
    if (visible) {
      setSide('BUY'); setQuery(''); setResults([]); setSelected(null); setQuantity('1')
    }
  }, [visible])

  // 검색 (debounce 300ms)
  useEffect(() => {
    if (!query.trim() || side === 'SELL') {
      setResults([])
      return
    }
    let cancelled = false
    setSearching(true)
    const t = setTimeout(async () => {
      try {
        const list = await searchStocks(query.trim(), 'ALL')
        if (!cancelled) setResults(list.slice(0, 20))
      } finally {
        if (!cancelled) setSearching(false)
      }
    }, 300)
    return () => { cancelled = true; clearTimeout(t) }
  }, [query, side])

  // 매도 모드면 results 자리에 보유 종목 노출.
  const sellOptions = positions.filter((p) => p.quantity > 0)

  const handleConfirm = async () => {
    if (!selected || busy) return
    const qty = parseInt(quantity, 10)
    if (!qty || qty <= 0) {
      toast?.show('수량 확인', 'error')
      return
    }
    setBusy(true)
    try {
      await placeTrade(leagueId, {
        market: selected.market, ticker: selected.ticker, side, quantity: qty,
      })
      toast?.show(`${side === 'BUY' ? '매수' : '매도'} 체결 — ${selected.name} ${qty}주`, 'success')
      onTraded()
      onClose()
    } catch (e: any) {
      // 백엔드 에러 메시지 그대로 보여줌 (현금부족/시간 등).
      const raw = e?.message || ''
      const friendly = raw.includes('insufficient cash') ? '현금 부족'
        : raw.includes('insufficient quantity') ? '보유 수량 부족'
        : raw.includes('market is closed') ? '시장 시간 아님'
        : raw.includes('price not available') ? '시세 가져오기 실패'
        : raw.includes('not running') ? '아직 시작 안 됐거나 종료됨'
        : '체결 실패'
      toast?.show(friendly, 'error')
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
          paddingHorizontal: 16, paddingVertical: 12,
          borderBottomWidth: 1, borderBottomColor: palette.border, gap: 10,
        }}>
          <Text style={{ flex: 1, color: palette.ink, fontSize: 17, fontWeight: '900' }}>거래하기</Text>
          <Text style={{ color: palette.inkMuted, fontSize: 11 }}>
            보유 현금 {currency === 'KRW' ? `${cashBalance.toLocaleString('ko-KR')}원` : `$${cashBalance.toLocaleString('en-US')}`}
          </Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <X size={20} color={palette.inkMuted} strokeWidth={2.5} />
          </Pressable>
        </View>

        {/* BUY/SELL 토글 */}
        <View style={{ flexDirection: 'row', padding: 12, gap: 8 }}>
          <SideButton label="매수" side="BUY" active={side === 'BUY'} onPress={() => { setSide('BUY'); setSelected(null) }} palette={palette} />
          <SideButton label="매도" side="SELL" active={side === 'SELL'} onPress={() => { setSide('SELL'); setSelected(null) }} palette={palette} />
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
                  placeholder="종목명 / ticker (예: 삼성, AAPL)"
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
                  query.trim() && !searching ? (
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
                      onPress={() => setSelected({ market: item.market as 'KR' | 'US', ticker: item.ticker, name: item.name, price: item.averageCost, changeRate: 0 })}
                      style={({ pressed }) => ({
                        paddingVertical: 12, paddingHorizontal: 4,
                        borderBottomWidth: 1, borderBottomColor: palette.border,
                        opacity: pressed ? 0.6 : 1,
                      })}
                    >
                      <Text style={{ color: palette.ink, fontSize: 14, fontWeight: '700' }}>{item.name}</Text>
                      <Text style={{ color: palette.inkMuted, fontSize: 11 }}>
                        {item.market} · {item.ticker} · 보유 {item.quantity}주 · 평단 {item.averageCost.toFixed(2)}
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
                  <Text style={{ color: palette.inkFaint, fontSize: 10 }}>{side === 'SELL' ? '평단' : '현재가'}</Text>
                </View>
              ) : null}
            </View>

            <View style={{ gap: 6 }}>
              <Text style={{ color: palette.inkMuted, fontSize: 11, fontWeight: '800', letterSpacing: 1 }}>수량</Text>
              <TextInput
                value={quantity}
                onChangeText={(v) => setQuantity(v.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                maxLength={6}
                style={{
                  backgroundColor: palette.surfaceAlt, color: palette.ink,
                  borderWidth: 1, borderColor: palette.border, borderRadius: 8,
                  paddingHorizontal: 14, paddingVertical: 14,
                  fontSize: 22, fontWeight: '900', textAlign: 'right',
                }}
              />
              {selected.price > 0 && parseInt(quantity, 10) > 0 ? (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: palette.inkMuted, fontSize: 12, fontWeight: '700' }}>예상 {side === 'BUY' ? '매수' : '매도'} 금액</Text>
                  <Text style={{ color: palette.ink, fontSize: 15, fontWeight: '900' }}>
                    {fmtPrice(selected.price * parseInt(quantity, 10), selected.market)}
                  </Text>
                </View>
              ) : null}
              <Text style={{ color: palette.inkFaint, fontSize: 11 }}>
                실제 체결가는 체결 시점 실시간 시세로 확정 — 수수료 0.3% 별도 차감
              </Text>
            </View>

            <Pressable
              onPress={() => setSelected(null)}
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
              disabled={busy}
              style={({ pressed }) => ({
                backgroundColor: side === 'BUY'
                  ? (pressed ? palette.up + 'cc' : palette.up)
                  : (pressed ? palette.down + 'cc' : palette.down),
                borderRadius: 12, paddingVertical: 14,
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                opacity: busy ? 0.5 : 1,
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
    </Modal>
  )
}

/** 시장별 통화 기호로 가격 포맷. KR=원(정수), US=달러(소수 2자리). */
function fmtPrice(value: number, market: 'KR' | 'US'): string {
  if (market === 'US') return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  return `${Math.round(value).toLocaleString('ko-KR')}원`
}

function SideButton({ label, active, onPress, palette }: { label: string; side: TradeSide; active: boolean; onPress: () => void; palette: any }) {
  return (
    <Pressable
      onPress={onPress}
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
