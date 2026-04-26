import { Pressable, Text, TextInput, View } from 'react-native'
import { Briefcase, Search, Star, Trash2, X } from 'lucide-react-native'
import type { StockMarketFilter } from '../../types'
import type { Palette } from '../../theme'

export type Mode = 'search' | 'watch' | 'holdings'

type Props = {
  mode: Mode
  onModeChange: (m: Mode) => void
  watchlistCount: number
  positionsCount: number
  stockSearch: string
  stockMarketFilter: StockMarketFilter
  stockSearchLoading: boolean
  stockResultsCount: number
  onStockSearchChange: (s: string) => void
  onStockMarketFilterChange: (f: StockMarketFilter) => void
  onConfirmBulkDelete: () => void
  bulkDeleting: boolean
  palette: Palette
}

export function Toolbar({
  mode, onModeChange, watchlistCount, positionsCount,
  stockSearch, stockMarketFilter, stockSearchLoading, stockResultsCount,
  onStockSearchChange, onStockMarketFilterChange,
  onConfirmBulkDelete, bulkDeleting, palette,
}: Props) {
  return (
    <View style={{
      backgroundColor: palette.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: palette.border,
      padding: 12,
      gap: 10,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {/* 모드 탭 */}
        <View style={{ flexDirection: 'row', gap: 4, padding: 3, borderRadius: 8, backgroundColor: palette.surfaceAlt }}>
          {(['search', 'watch', 'holdings'] as const).map((m) => {
            const active = mode === m
            const Icon = m === 'watch' ? Star : m === 'holdings' ? Briefcase : Search
            const iconColor = active
              ? (m === 'watch' ? '#f59e0b' : m === 'holdings' ? palette.blue : palette.blue)
              : palette.inkSub
            const label =
              m === 'search'   ? '종목 탐색' :
              m === 'watch'    ? `관심종목 (${watchlistCount})` :
                                 `보유 (${positionsCount})`
            return (
              <Pressable
                key={m}
                onPress={() => onModeChange(m)}
                style={(state) => {
                  const hovered = (state as { hovered?: boolean }).hovered
                  return [{
                    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6,
                    backgroundColor: active ? palette.surface : (hovered ? palette.border : 'transparent'),
                    borderWidth: active ? 1 : 0, borderColor: palette.border,
                    flexDirection: 'row', alignItems: 'center', gap: 5,
                  }]
                }}
              >
                <Icon size={11} color={iconColor} strokeWidth={2.5}
                  {...(m === 'watch' ? { fill: active ? '#f59e0b' : 'none' } : {})} />
                <Text style={{
                  color: active ? palette.ink : palette.inkSub,
                  fontSize: 12, fontWeight: '800',
                }}>
                  {label}
                </Text>
              </Pressable>
            )
          })}
        </View>

        {/* 검색 */}
        {mode === 'search' ? (
          <View style={{ flex: 1, minWidth: 280, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{
              flex: 1,
              flexDirection: 'row', alignItems: 'center', gap: 8,
              paddingHorizontal: 12, paddingVertical: 8,
              borderRadius: 8, borderWidth: 1, borderColor: palette.border,
              backgroundColor: palette.bg,
            }}>
              <Search size={14} color={palette.inkMuted} strokeWidth={2.5} />
              <TextInput
                value={stockSearch}
                onChangeText={onStockSearchChange}
                placeholder="종목명 · 티커 · 섹터 검색"
                placeholderTextColor={palette.inkFaint}
                style={{
                  flex: 1,
                  color: palette.ink,
                  fontSize: 13,
                  fontWeight: '600',
                  outlineStyle: 'none',
                } as object}
                autoCapitalize="characters"
                autoCorrect={false}
              />
              {stockSearch ? (
                <Pressable onPress={() => onStockSearchChange('')} hitSlop={8}>
                  <X size={13} color={palette.inkMuted} strokeWidth={2.5} />
                </Pressable>
              ) : null}
            </View>

            {/* 마켓 필터 */}
            <View style={{ flexDirection: 'row', gap: 2, padding: 3, borderRadius: 8, backgroundColor: palette.surfaceAlt }}>
              {(['ALL', 'KR', 'US'] as const).map((f) => {
                const active = stockMarketFilter === f
                return (
                  <Pressable
                    key={f}
                    onPress={() => onStockMarketFilterChange(f)}
                    style={{
                      paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6,
                      backgroundColor: active ? palette.surface : 'transparent',
                      borderWidth: active ? 1 : 0, borderColor: palette.border,
                    }}
                  >
                    <Text style={{
                      color: active ? palette.ink : palette.inkMuted,
                      fontSize: 11, fontWeight: '800',
                    }}>
                      {f === 'ALL' ? '전체' : f === 'KR' ? '🇰🇷 한국' : '🇺🇸 미국'}
                    </Text>
                  </Pressable>
                )
              })}
            </View>

            <Text style={{ color: palette.inkMuted, fontSize: 11, fontWeight: '600', marginLeft: 4 }}>
              {stockSearchLoading ? '검색 중…' : `${stockResultsCount}건`}
            </Text>
          </View>
        ) : (
          <>
            <View style={{ flex: 1 }} />
            {watchlistCount >= 2 ? (
              <Pressable
                onPress={onConfirmBulkDelete}
                disabled={bulkDeleting}
                style={(state) => {
                  const hovered = (state as { hovered?: boolean }).hovered
                  return [{
                    flexDirection: 'row', alignItems: 'center', gap: 5,
                    paddingHorizontal: 12, paddingVertical: 7,
                    borderRadius: 7,
                    borderWidth: 1, borderColor: palette.red,
                    backgroundColor: hovered ? palette.redSoft : 'transparent',
                    opacity: bulkDeleting ? 0.5 : 1,
                  }]
                }}
              >
                <Trash2 size={12} color={palette.red} strokeWidth={2.5} />
                <Text style={{ color: palette.red, fontSize: 11, fontWeight: '800' }}>
                  {bulkDeleting ? '해제 중…' : '전체 해제'}
                </Text>
              </Pressable>
            ) : null}
          </>
        )}
      </View>
    </View>
  )
}
