import { Pressable, Text, View } from 'react-native'
import { ArrowDownAZ, ArrowDownWideNarrow, Clock, ListFilter, TrendingUp } from 'lucide-react-native'
import { useStyles } from '../../styles'
import { useTheme } from '../../theme'

export type WorkspaceSortKey = 'profit' | 'change' | 'name' | 'added'
export type WorkspaceMarketFilter = 'ALL' | 'KR' | 'US'

type Props = {
  sortKey: WorkspaceSortKey
  marketFilter: WorkspaceMarketFilter
  onSortChange: (k: WorkspaceSortKey) => void
  onMarketFilterChange: (f: WorkspaceMarketFilter) => void
}

const SORT_OPTIONS: Array<{ key: WorkspaceSortKey; label: string; Icon: typeof ArrowDownAZ }> = [
  { key: 'profit', label: '손익순',  Icon: ArrowDownWideNarrow },
  { key: 'change', label: '등락률',  Icon: TrendingUp },
  { key: 'name',   label: '이름순',  Icon: ArrowDownAZ },
  { key: 'added',  label: '등록순',  Icon: Clock },
]

const MARKET_OPTIONS: Array<{ key: WorkspaceMarketFilter; label: string }> = [
  { key: 'ALL', label: '전체' },
  { key: 'KR',  label: '🇰🇷 한국' },
  { key: 'US',  label: '🇺🇸 미국' },
]

/**
 * 보유/관심 공통 정렬·필터 바 (Spec 결정 6). 두 섹션이 같은 정렬·필터 공유.
 * 종목 탐색(StockSearchSection)은 자체 검색이라 별개.
 *
 * - 'profit' (손익순) 은 PortfolioSection 에 의미. WatchlistSection 은 자동으로 'added' fallback.
 */
export function WorkspaceFilterBar({ sortKey, marketFilter, onSortChange, onMarketFilterChange }: Props) {
  const styles = useStyles()
  const { palette } = useTheme()
  return (
    <View style={[styles.card, { gap: 8, paddingVertical: 10 }]}>
      {/* 헤더 라벨 — 어떤 영역의 필터인지 명확화 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
        <ListFilter size={11} color={palette.inkMuted} strokeWidth={2.5} />
        <Text style={{ color: palette.inkMuted, fontSize: 10, fontWeight: '800', letterSpacing: 0.8 }}>
          보유 · 관심 정렬·필터
        </Text>
      </View>
      {/* 정렬 segmented */}
      <View style={{ flexDirection: 'row', gap: 4 }}>
        {SORT_OPTIONS.map((o) => {
          const on = sortKey === o.key
          return (
            <Pressable
              key={o.key}
              onPress={() => onSortChange(o.key)}
              style={{
                flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                gap: 4, paddingVertical: 7, borderRadius: 6,
                backgroundColor: on ? palette.brandAccent : palette.surfaceAlt,
                borderWidth: 1, borderColor: on ? palette.brandAccent : palette.border,
              }}
            >
              <o.Icon size={11} color={on ? palette.bg : palette.inkMuted} strokeWidth={2.5} />
              <Text style={{ color: on ? palette.bg : palette.inkSub, fontSize: 11, fontWeight: '800' }}>
                {o.label}
              </Text>
            </Pressable>
          )
        })}
      </View>
      {/* 시장 필터 칩 */}
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {MARKET_OPTIONS.map((o) => {
          const on = marketFilter === o.key
          return (
            <Pressable
              key={o.key}
              onPress={() => onMarketFilterChange(o.key)}
              style={[styles.filterChip, on && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, on && styles.filterTextActive]}>{o.label}</Text>
            </Pressable>
          )
        })}
      </View>
      {/* 'profit' 정렬 + 관심엔 의미 없음 안내 (작게) */}
      {sortKey === 'profit' ? (
        <Text style={{ color: palette.inkFaint, fontSize: 10, fontStyle: 'italic' }}>
          ⓘ 관심 종목은 손익 데이터가 없어 등록순으로 표시
        </Text>
      ) : null}
    </View>
  )
}
