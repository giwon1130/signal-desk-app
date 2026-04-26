import { Pressable, Text, TextInput, View } from 'react-native'
import { Briefcase } from 'lucide-react-native'
import { useStyles } from '../../styles'
import type { HoldingPosition, StockSearchResult } from '../../types'
import { formatPrice, formatSignedRate } from '../../utils'

type Props = {
  base: StockSearchResult
  position?: HoldingPosition
  buyPriceInput: string
  quantityInput: string
  onChangeBuyPrice: (v: string) => void
  onChangeQuantity: (v: string) => void
  saving: boolean
  onSave: () => void
  onDelete: () => void
}

export function PortfolioForm({
  base,
  position,
  buyPriceInput,
  quantityInput,
  onChangeBuyPrice,
  onChangeQuantity,
  saving,
  onSave,
  onDelete,
}: Props) {
  const styles = useStyles()
  const hasPosition = !!position
  return (
    <View style={styles.cardSection}>
      <View style={styles.cardTitleRow}>
        <Briefcase size={13} color="#3b82f6" strokeWidth={2.5} />
        <Text style={styles.cardTitle}>
          {hasPosition ? '실제 보유 종목 수정' : '실제 보유 종목으로 등록'}
        </Text>
      </View>
      <Text style={styles.metaText}>
        매수가와 수량만 입력하면 손익률·평가금액 자동 계산
      </Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Text style={styles.kpiLabel}>매수가</Text>
          <TextInput
            value={buyPriceInput}
            onChangeText={onChangeBuyPrice}
            placeholder="예: 84200"
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
            keyboardType="number-pad"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.kpiLabel}>수량</Text>
          <TextInput
            value={quantityInput}
            onChangeText={onChangeQuantity}
            placeholder="예: 10"
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
            keyboardType="number-pad"
          />
        </View>
      </View>
      <View style={styles.inlineButtonRow}>
        <Pressable
          onPress={onSave}
          style={styles.primaryActionButton}
          disabled={saving}
        >
          <Text style={styles.primaryActionButtonText}>
            {saving ? '저장 중...' : hasPosition ? '수정 저장' : '보유 등록'}
          </Text>
        </Pressable>
        {hasPosition ? (
          <Pressable onPress={onDelete} style={styles.secondaryActionButton}>
            <Text style={styles.secondaryActionButtonText}>삭제</Text>
          </Pressable>
        ) : null}
      </View>
      {hasPosition ? (
        <Text style={styles.metaText}>
          현재 평가금액 {formatPrice(position!.evaluationAmount, base.market)} ·
          손익 {formatSignedRate(position!.profitRate)}
        </Text>
      ) : null}
    </View>
  )
}
