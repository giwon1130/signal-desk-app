import { useEffect, useMemo, useState } from 'react'
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native'
import { X } from 'lucide-react-native'
import { useStyles } from '../styles'
import { useTheme } from '../theme'
import type {
  HoldingPosition,
  RecommendationExecutionLog,
  StockSearchResult,
  WatchItem,
} from '../types'
import { useLivePrices } from '../hooks/useLivePrices'
import { PriceHero } from './stock_detail/PriceHero'
import { AiContextRow } from './stock_detail/AiContextRow'
import { WatchToggle } from './stock_detail/WatchToggle'
import { PortfolioForm } from './stock_detail/PortfolioForm'
import { QuickStats } from './stock_detail/QuickStats'

export type StockDetailContext = {
  /** 표준 스냅샷 — 검색 결과/관심종목/보유 어디서든 만들어 넘길 수 있음 */
  base: StockSearchResult
  watchItem?: WatchItem
  portfolioPosition?: HoldingPosition
  latestAiLog?: RecommendationExecutionLog
}

type Props = {
  visible: boolean
  onClose: () => void
  context: StockDetailContext | null
  onToggleWatch: (stock: StockSearchResult) => Promise<void> | void
  onSavePortfolio: (payload: {
    id?: string
    market: string
    ticker: string
    name: string
    buyPrice: number
    currentPrice: number
    quantity: number
  }) => Promise<void>
  onDeletePortfolio: (id: string) => void
}

export function StockDetailModal({
  visible,
  onClose,
  context,
  onToggleWatch,
  onSavePortfolio,
  onDeletePortfolio,
}: Props) {
  const styles = useStyles()
  const { palette } = useTheme()

  const [buyPriceInput, setBuyPriceInput]   = useState('')
  const [quantityInput, setQuantityInput]   = useState('')
  const [portfolioSaving, setPortfolioSaving] = useState(false)
  const [toggling, setToggling]             = useState(false)

  const baseKey = context ? `${context.base.market}:${context.base.ticker}` : ''
  const positionId = context?.portfolioPosition?.id ?? ''

  // 모달 컨텍스트가 바뀌면 폼 hydrate
  useEffect(() => {
    const pos = context?.portfolioPosition
    setBuyPriceInput(pos ? String(pos.buyPrice) : '')
    setQuantityInput(pos ? String(pos.quantity) : '')
  }, [baseKey, positionId])

  // 라이브 시세 (KR만)
  const liveTickers = useMemo(() => {
    if (!context || context.base.market !== 'KR') return []
    return [context.base.ticker]
  }, [context])
  const livePrices = useLivePrices(liveTickers)

  if (!context) {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <Pressable style={styles.signalModalBackdrop} onPress={onClose} />
      </Modal>
    )
  }

  const lp = context.base.market === 'KR' ? livePrices[context.base.ticker] : undefined
  const livePrice = lp?.price ?? context.base.price
  const liveChange = lp?.changeRate ?? context.base.changeRate
  const isLive = !!lp

  const hasWatch = !!context.watchItem

  const handleSave = async () => {
    if (!context) return
    const buy = Number(buyPriceInput.replace(/[^0-9]/g, ''))
    const qty = Number(quantityInput.replace(/[^0-9]/g, ''))
    if (!buy || !qty) return
    setPortfolioSaving(true)
    try {
      await onSavePortfolio({
        id: context.portfolioPosition?.id,
        market: context.base.market,
        ticker: context.base.ticker,
        name: context.base.name,
        buyPrice: buy,
        currentPrice: Math.round(livePrice || context.base.price),
        quantity: qty,
      })
    } catch {
      // 저장 실패는 토스트로 이미 노출됨 — 모달은 그대로 유지
    } finally {
      setPortfolioSaving(false)
    }
  }

  const handleToggle = async () => {
    if (toggling) return
    setToggling(true)
    try {
      await onToggleWatch(context.base)
    } finally {
      setToggling(false)
    }
  }

  const handleDelete = () => {
    if (!context.portfolioPosition?.id) return
    onDeletePortfolio(context.portfolioPosition.id)
    onClose()
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.signalModalBackdrop} onPress={onClose}>
          {/* 카드 자체는 탭 전파 차단 */}
          <Pressable style={styles.signalModalCard} onPress={() => {}}>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {/* ── 헤더 ── */}
              <View style={styles.signalModalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.signalModalTitle}>{context.base.name}</Text>
                  <Text style={styles.signalModalSubtitle}>
                    {context.base.market} · {context.base.ticker} · {context.base.sector}
                  </Text>
                </View>
                <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="닫기">
                  <X size={20} color={palette.inkMuted} strokeWidth={2.5} />
                </Pressable>
              </View>

              <PriceHero
                base={context.base}
                livePrice={livePrice}
                liveChange={liveChange}
                isLive={isLive}
              />

              <QuickStats hasWatch={hasWatch} position={context.portfolioPosition} />

              <WatchToggle
                hasWatch={hasWatch}
                toggling={toggling}
                onToggle={() => void handleToggle()}
              />

              <PortfolioForm
                base={context.base}
                position={context.portfolioPosition}
                buyPriceInput={buyPriceInput}
                quantityInput={quantityInput}
                onChangeBuyPrice={setBuyPriceInput}
                onChangeQuantity={setQuantityInput}
                saving={portfolioSaving}
                onSave={() => void handleSave()}
                onDelete={handleDelete}
              />

              <AiContextRow latestAiLog={context.latestAiLog} />

              <Text style={styles.signalModalDisclaimer}>
                현재가는 KR 시장 기준 라이브 시세이며, 휴장 시에는 마지막 종가가 표시돼.
              </Text>
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  )
}
