import { Alert, Pressable, Text, View } from 'react-native'
import { Search, Sparkles, Star, Trash2 } from 'lucide-react-native'
import { useStyles } from '../../styles'
import { useTheme } from '../../theme'
import type { WatchItem } from '../../types'

type Props = {
  watchlist: WatchItem[]
  favoriteDeletingId: string
  bulkDeleting: boolean
  onOpenDetail: (market: string, ticker: string, name?: string) => void
  onDeleteFavorite: (id: string) => void
  onDeleteAllFavorites: () => void
  onStockSearchChange: (value: string) => void
}

export function WatchlistSection({
  watchlist,
  favoriteDeletingId,
  bulkDeleting,
  onOpenDetail,
  onDeleteFavorite,
  onDeleteAllFavorites,
  onStockSearchChange,
}: Props) {
  const styles = useStyles()
  const { palette } = useTheme()

  return (
    <View style={styles.card}>
      <View style={styles.sectionHeaderRow}>
        <View style={styles.cardTitleRow}>
          <Star size={14} color="#f59e0b" strokeWidth={2.5} fill={watchlist.length ? '#f59e0b' : 'none'} />
          <Text style={styles.cardTitle}>내 관심종목</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={styles.metaText}>{watchlist.length}개</Text>
          {watchlist.length >= 2 ? (
            <Pressable
              onPress={() => {
                if (bulkDeleting) return
                Alert.alert(
                  '관심종목 전체 해제',
                  `${watchlist.length}개 종목을 전부 해제할까요? 되돌릴 수 없습니다.`,
                  [
                    { text: '취소', style: 'cancel' },
                    {
                      text: '전체 해제',
                      style: 'destructive',
                      onPress: () => onDeleteAllFavorites(),
                    },
                  ],
                )
              }}
              hitSlop={6}
              style={({ pressed }) => [
                {
                  flexDirection: 'row', alignItems: 'center', gap: 4,
                  paddingHorizontal: 10, paddingVertical: 6,
                  borderRadius: 999,
                  backgroundColor: pressed ? palette.redSoft : 'transparent',
                  borderWidth: 1, borderColor: palette.red,
                  opacity: bulkDeleting ? 0.5 : 1,
                },
              ]}
            >
              <Trash2 size={11} color={palette.red} strokeWidth={2.5} />
              <Text style={{ color: palette.red, fontSize: 11, fontWeight: '800' }}>
                {bulkDeleting ? '해제 중...' : '전체 해제'}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
      {watchlist.length ? (
        watchlist.map((item) => (
          <View key={`${item.market}-${item.ticker}-${item.id}`} style={styles.favoriteRow}>
            <Pressable
              onPress={() => onOpenDetail(item.market, item.ticker, item.name)}
              style={styles.metricLeft}
            >
              <Text style={styles.metricName}>{item.name}</Text>
              <Text style={styles.metricState}>{item.market} · {item.ticker} · {item.sector}</Text>
              <Text style={styles.cardNote}>{item.stance}</Text>
              {(item.technical || (item.volumeRatio != null && item.volumeRatio >= 2)) ? (
                <View style={styles.alternativeHighlightsRow}>
                  {item.technical?.rsi != null ? (
                    <Text style={styles.alternativeHighlightChip}>RSI {item.technical.rsi.toFixed(0)}</Text>
                  ) : null}
                  {item.technical?.maSignal && item.technical.maSignal !== 'NONE' ? (
                    <Text style={styles.alternativeHighlightChip}>
                      {item.technical.maSignal === 'GOLDEN' ? '골든크로스' : '데드크로스'}
                    </Text>
                  ) : null}
                  {item.technical?.week52State ? (
                    <Text style={styles.alternativeHighlightChip}>{item.technical.week52State}</Text>
                  ) : null}
                  {item.volumeRatio != null && item.volumeRatio >= 2 ? (
                    <Text style={styles.alternativeHighlightChip}>거래량 {item.volumeRatio.toFixed(1)}배</Text>
                  ) : null}
                </View>
              ) : null}
            </Pressable>
            <Pressable
              onPress={() => item.id && onDeleteFavorite(item.id)}
              style={styles.favoriteDeleteButton}
            >
              <Text style={styles.favoriteDeleteText}>
                {favoriteDeletingId === item.id ? '...' : '해제'}
              </Text>
            </Pressable>
          </View>
        ))
      ) : (
        <View style={{ alignItems: 'center', gap: 10, paddingVertical: 24 }}>
          <View style={{
            width: 56, height: 56, borderRadius: 28,
            backgroundColor: palette.orangeSoft,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Sparkles size={26} color={palette.orange} strokeWidth={2.2} />
          </View>
          <Text style={{ color: palette.ink, fontSize: 14, fontWeight: '800' }}>
            아직 관심종목이 없어
          </Text>
          <Text style={{ color: palette.inkMuted, fontSize: 12, textAlign: 'center', lineHeight: 18 }}>
            위에서 종목 검색 후 + 버튼을 한 번 누르면{'\n'}바로 관심종목으로 담겨.
          </Text>
          <Pressable
            onPress={() => onStockSearchChange('')}
            style={({ pressed }) => [
              {
                marginTop: 6, borderRadius: 999,
                backgroundColor: palette.blue,
                paddingHorizontal: 18, paddingVertical: 9,
                flexDirection: 'row', gap: 6, alignItems: 'center',
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Search size={13} color="#ffffff" strokeWidth={2.5} />
            <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '800' }}>종목 탐색하기</Text>
          </Pressable>
        </View>
      )}
    </View>
  )
}
