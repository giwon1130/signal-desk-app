import { Pressable, Text, View } from 'react-native'
import { ArrowDown, ArrowUp, Minus, Plus, Radio, Star, X } from 'lucide-react-native'
import { marketColor, type Palette } from '../../theme'
import { formatPrice, formatSignedPrice, formatSignedRate } from '../../utils'
import { StanceTag } from '../shared'
import { HeaderCell, type SortKey, type SortDir } from './HeaderCell'
import type { Mode } from './Toolbar'

export type Row = {
  id?: string
  market: string
  ticker: string
  name: string
  sector: string
  stance: string
  price: number
  changeRate: number
  isInWatch: boolean
  watchId?: string
  holding?: {
    buyPrice: number
    quantity: number
    profitRate: number
    profitAmount: number
    evaluationAmount: number
  }
}

type Props = {
  mode: Mode
  rows: Row[]
  sortKey: SortKey
  sortDir: SortDir
  onSort: (key: SortKey) => void
  onOpenDetail: (m: string, t: string, n?: string) => void
  onToggleWatch: (row: Row) => Promise<void>
  togglingKey: string
  favoriteDeletingId: string
  livePrices: Record<string, { price: number; changeRate: number } | undefined>
  stockSearch: string
  stockSearchLoading: boolean
  palette: Palette
}

export function DataTable({
  mode, rows, sortKey, sortDir, onSort, onOpenDetail, onToggleWatch,
  togglingKey, favoriteDeletingId, livePrices, stockSearch, stockSearchLoading, palette,
}: Props) {
  return (
    <View style={{
      backgroundColor: palette.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: palette.border,
      overflow: 'hidden',
    }}>
      {/* 헤더 */}
      <View style={[
        { flexDirection: 'row', paddingVertical: 9, paddingHorizontal: 12, gap: 8,
          borderBottomWidth: 1, borderBottomColor: palette.border,
          backgroundColor: palette.surfaceAlt },
      ]}>
        <HeaderCell width={34} label="" palette={palette} />
        <HeaderCell flex={2.4} label="종목명" sortable sortKey="name" currentKey={sortKey} currentDir={sortDir} onPress={onSort} palette={palette} />
        <HeaderCell width={70}  label="티커" palette={palette} />
        <HeaderCell width={60}  label="시장" sortable sortKey="market" currentKey={sortKey} currentDir={sortDir} onPress={onSort} palette={palette} />
        {mode === 'holdings' ? (
          <HeaderCell flex={1.4}  label="매수가 × 수량" align="right" palette={palette} />
        ) : (
          <HeaderCell flex={1.4}  label="섹터" sortable sortKey="sector" currentKey={sortKey} currentDir={sortDir} onPress={onSort} palette={palette} />
        )}
        <HeaderCell width={110} label="현재가" align="right" sortable sortKey="price" currentKey={sortKey} currentDir={sortDir} onPress={onSort} palette={palette} />
        {mode === 'holdings' ? (
          <>
            <HeaderCell width={90}  label="수익률" align="right" sortable sortKey="profitRate" currentKey={sortKey} currentDir={sortDir} onPress={onSort} palette={palette} />
            <HeaderCell width={120} label="평가금액" align="right" sortable sortKey="evaluation" currentKey={sortKey} currentDir={sortDir} onPress={onSort} palette={palette} />
          </>
        ) : (
          <>
            <HeaderCell width={90}  label="등락률" align="right" sortable sortKey="changeRate" currentKey={sortKey} currentDir={sortDir} onPress={onSort} palette={palette} />
            <HeaderCell width={48}  label="" palette={palette} />
          </>
        )}
      </View>

      {/* 바디 */}
      {rows.length === 0 ? (
        <View style={{ paddingVertical: 40, alignItems: 'center', gap: 4 }}>
          <Text style={{ color: palette.inkMuted, fontSize: 13, fontWeight: '700' }}>
            {mode === 'watch'    ? '아직 관심종목이 없어' :
             mode === 'holdings' ? '아직 보유 중인 종목이 없어' :
             stockSearchLoading  ? '검색 중…' : '검색 결과 없음'}
          </Text>
          {mode === 'watch' ? (
            <Text style={{ color: palette.inkFaint, fontSize: 11 }}>
              탐색 탭에서 ☆ 눌러 담아봐
            </Text>
          ) : mode === 'holdings' ? (
            <Text style={{ color: palette.inkFaint, fontSize: 11 }}>
              종목 상세에서 매수가 · 수량 입력해 등록
            </Text>
          ) : !stockSearchLoading && stockSearch ? (
            <Text style={{ color: palette.inkFaint, fontSize: 11 }}>
              다른 키워드로 시도해봐
            </Text>
          ) : !stockSearchLoading ? (
            <Text style={{ color: palette.inkFaint, fontSize: 11 }}>
              상단 검색창에 종목명 · 티커 입력
            </Text>
          ) : null}
        </View>
      ) : (
        rows.map((row, i) => {
          const isLive = row.market === 'KR' && !!livePrices[row.ticker]
          const color = marketColor(palette, row.market, row.changeRate)
          const toggling = togglingKey === `${row.market}:${row.ticker}` || favoriteDeletingId === row.watchId
          return (
            <Pressable
              key={`${row.market}-${row.ticker}-${i}`}
              onPress={() => onOpenDetail(row.market, row.ticker, row.name)}
              style={(state) => {
                const hovered = (state as { hovered?: boolean }).hovered
                return [{
                  flexDirection: 'row', alignItems: 'center',
                  paddingVertical: 9, paddingHorizontal: 12, gap: 8,
                  borderBottomWidth: 1, borderBottomColor: palette.border,
                  backgroundColor: hovered ? palette.surfaceAlt : 'transparent',
                }]
              }}
            >
              {/* ☆ 토글 */}
              <Pressable
                onPress={(e) => { (e as unknown as { stopPropagation: () => void }).stopPropagation?.(); void onToggleWatch(row) }}
                hitSlop={6}
                style={{ width: 34, alignItems: 'center' }}
                disabled={toggling}
              >
                <Star
                  size={14}
                  color={row.isInWatch ? '#f59e0b' : palette.inkFaint}
                  strokeWidth={2.5}
                  fill={row.isInWatch ? '#f59e0b' : 'none'}
                />
              </Pressable>

              {/* 종목명 + stance */}
              <View style={{ flex: 2.4, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text
                  numberOfLines={1}
                  style={{ color: palette.ink, fontSize: 13, fontWeight: '800', flexShrink: 1 }}
                >
                  {row.name}
                </Text>
                {isLive ? (
                  <Radio size={9} color="#10b981" strokeWidth={3} />
                ) : row.market === 'US' ? (
                  <Text style={{ color: palette.inkFaint, fontSize: 9, fontWeight: '700', letterSpacing: 0.3 }}>지연</Text>
                ) : null}
                {row.stance ? <StanceTag stance={row.stance} palette={palette} size="xs" /> : null}
              </View>

              {/* 티커 */}
              <Text
                style={{
                  width: 70,
                  color: palette.inkMuted,
                  fontSize: 12,
                  fontWeight: '600',
                  fontVariant: ['tabular-nums'],
                }}
              >
                {row.ticker}
              </Text>

              {/* 시장 */}
              <View style={{ width: 60 }}>
                <View style={{
                  alignSelf: 'flex-start',
                  paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
                  backgroundColor: row.market === 'KR' ? palette.blueSoft : palette.greenSoft,
                }}>
                  <Text style={{
                    color: row.market === 'KR' ? palette.blue : palette.green,
                    fontSize: 10, fontWeight: '800', letterSpacing: 0.5,
                  }}>
                    {row.market}
                  </Text>
                </View>
              </View>

              {/* 섹터 OR 매수가×수량 */}
              {mode === 'holdings' && row.holding ? (
                <View style={{ flex: 1.4, minWidth: 0, alignItems: 'flex-end' }}>
                  <Text style={{ color: palette.ink, fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] }}>
                    {formatPrice(row.holding.buyPrice, row.market)}
                  </Text>
                  <Text style={{ color: palette.inkMuted, fontSize: 10, fontWeight: '600', fontVariant: ['tabular-nums'] }}>
                    × {row.holding.quantity}주
                  </Text>
                </View>
              ) : (
                <Text
                  numberOfLines={1}
                  style={{
                    flex: 1.4, minWidth: 0,
                    color: palette.inkMuted, fontSize: 11, fontWeight: '600',
                  }}
                >
                  {row.sector || '—'}
                </Text>
              )}

              {/* 현재가 */}
              <Text
                style={{
                  width: 110,
                  textAlign: 'right',
                  color: palette.ink, fontSize: 13, fontWeight: '800',
                  fontVariant: ['tabular-nums'],
                }}
              >
                {formatPrice(row.price, row.market)}
              </Text>

              {/* 등락률 OR 수익률 */}
              {mode === 'holdings' && row.holding ? (
                <View style={{ width: 90, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 3 }}>
                  {(() => {
                    const pColor = marketColor(palette, row.market, row.holding.profitRate)
                    return (
                      <>
                        {row.holding.profitRate > 0 ? <ArrowUp size={10} color={pColor} strokeWidth={3} />
                          : row.holding.profitRate < 0 ? <ArrowDown size={10} color={pColor} strokeWidth={3} />
                          : <Minus size={10} color={pColor} strokeWidth={3} />}
                        <Text style={{ color: pColor, fontSize: 12, fontWeight: '800', fontVariant: ['tabular-nums'] }}>
                          {formatSignedRate(row.holding.profitRate)}
                        </Text>
                      </>
                    )
                  })()}
                </View>
              ) : (
                <View style={{ width: 90, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 3 }}>
                  {row.changeRate > 0 ? <ArrowUp size={10} color={color} strokeWidth={3} />
                    : row.changeRate < 0 ? <ArrowDown size={10} color={color} strokeWidth={3} />
                    : <Minus size={10} color={color} strokeWidth={3} />}
                  <Text style={{ color, fontSize: 12, fontWeight: '800', fontVariant: ['tabular-nums'] }}>
                    {formatSignedRate(row.changeRate)}
                  </Text>
                </View>
              )}

              {/* 평가금액 OR 관심 토글 액션 */}
              {mode === 'holdings' && row.holding ? (
                <View style={{ width: 120, alignItems: 'flex-end' }}>
                  <Text style={{ color: palette.ink, fontSize: 13, fontWeight: '800', fontVariant: ['tabular-nums'] }}>
                    {formatPrice(row.holding.evaluationAmount, row.market)}
                  </Text>
                  <Text style={{
                    color: marketColor(palette, row.market, row.holding.profitAmount),
                    fontSize: 11, fontWeight: '700', fontVariant: ['tabular-nums'],
                  }}>
                    {formatSignedPrice(row.holding.profitAmount, row.market)}
                  </Text>
                </View>
              ) : (
                <View style={{ width: 48, alignItems: 'flex-end' }}>
                  <Pressable
                    onPress={(e) => { (e as unknown as { stopPropagation: () => void }).stopPropagation?.(); void onToggleWatch(row) }}
                    disabled={toggling}
                    style={(state) => {
                      const hovered = (state as { hovered?: boolean }).hovered
                      return [{
                        flexDirection: 'row', alignItems: 'center', gap: 3,
                        paddingHorizontal: 8, paddingVertical: 4,
                        borderRadius: 6,
                        backgroundColor: row.isInWatch
                          ? (hovered ? palette.redSoft : palette.surfaceAlt)
                          : (hovered ? palette.blueSoft : palette.blue),
                        opacity: toggling ? 0.5 : 1,
                      }]
                    }}
                  >
                    {row.isInWatch ? (
                      <>
                        <X size={9} color={palette.red} strokeWidth={3} />
                        <Text style={{ color: palette.red, fontSize: 10, fontWeight: '800' }}>해제</Text>
                      </>
                    ) : (
                      <>
                        <Plus size={9} color="#ffffff" strokeWidth={3} />
                        <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: '800' }}>담기</Text>
                      </>
                    )}
                  </Pressable>
                </View>
              )}
            </Pressable>
          )
        })
      )}
    </View>
  )
}
