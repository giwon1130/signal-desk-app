import { useEffect, useMemo, useState } from 'react'
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Briefcase, Cpu, Plus, Radio, X } from 'lucide-react-native'
import { useStyles } from '../styles'
import { marketColor, useTheme } from '../theme'
import type {
  HoldingPosition,
  RecommendationExecutionLog,
  StockSearchResult,
  WatchItem,
} from '../types'
import { formatPrice, formatSignedRate } from '../utils'
import { useLivePrices } from '../hooks/useLivePrices'

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
  const hasPosition = !!context.portfolioPosition

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

              {/* ── 가격 ── */}
              <View style={styles.stockDetailHero}>
                <View style={styles.metricLeft}>
                  <Text style={styles.kpiLabel}>현재가</Text>
                  <Text style={styles.cardNote}>{context.base.stance || '관찰 대상'}</Text>
                </View>
                <View style={styles.summaryValueBox}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.stockDetailPrice}>{formatPrice(livePrice, context.base.market)}</Text>
                    {isLive ? <Radio size={12} color="#10b981" strokeWidth={2.5} /> : null}
                  </View>
                  <Text style={[styles.summaryDelta, { color: marketColor(palette, context.base.market, liveChange) }]}>
                    {formatSignedRate(liveChange)}
                  </Text>
                </View>
              </View>

              {/* ── 상태 카드 ── */}
              <View style={[styles.quickStatsRow, { marginTop: 12 }]}>
                <View style={styles.quickStatCard}>
                  <Text style={styles.kpiLabel}>관심종목</Text>
                  <Text style={[styles.quickStatValue, { color: hasWatch ? '#0d9488' : '#94a3b8' }]}>
                    {hasWatch ? '담김' : '미등록'}
                  </Text>
                  <Text style={styles.metaText}>
                    {hasWatch ? '추적 중' : '아래 버튼으로 한 번에 추가'}
                  </Text>
                </View>
                <View style={styles.quickStatCard}>
                  <Text style={styles.kpiLabel}>실제 보유</Text>
                  <Text style={[styles.quickStatValue, { color: hasPosition ? '#dc2626' : '#94a3b8' }]}>
                    {hasPosition ? '보유' : '미보유'}
                  </Text>
                  <Text style={styles.metaText}>
                    {hasPosition
                      ? `${context.portfolioPosition!.quantity}주 · ${formatSignedRate(context.portfolioPosition!.profitRate)}`
                      : '매수가·수량 입력 시 자동 계산'}
                  </Text>
                </View>
              </View>

              {/* ── 관심종목 토글 ── */}
              <Pressable
                onPress={() => void handleToggle()}
                disabled={toggling}
                style={[
                  styles.quickAddPill,
                  hasWatch && styles.quickAddPillActive,
                  { alignSelf: 'stretch', justifyContent: 'center', paddingVertical: 12, marginTop: 12 },
                ]}
              >
                {hasWatch ? (
                  <>
                    <X size={14} color={palette.teal} strokeWidth={3} />
                    <Text style={[styles.quickAddPillTextActive, { fontSize: 13 }]}>
                      관심종목에서 해제
                    </Text>
                  </>
                ) : (
                  <>
                    <Plus size={14} color="#ffffff" strokeWidth={3} />
                    <Text style={[styles.quickAddPillText, { fontSize: 13 }]}>관심종목에 담기</Text>
                  </>
                )}
              </Pressable>

              {/* ── 보유 등록/수정 ── */}
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
                      onChangeText={setBuyPriceInput}
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
                      onChangeText={setQuantityInput}
                      placeholder="예: 10"
                      placeholderTextColor="#94a3b8"
                      style={styles.searchInput}
                      keyboardType="number-pad"
                    />
                  </View>
                </View>
                <View style={styles.inlineButtonRow}>
                  <Pressable
                    onPress={() => void handleSave()}
                    style={styles.primaryActionButton}
                    disabled={portfolioSaving}
                  >
                    <Text style={styles.primaryActionButtonText}>
                      {portfolioSaving ? '저장 중...' : hasPosition ? '수정 저장' : '보유 등록'}
                    </Text>
                  </Pressable>
                  {hasPosition ? (
                    <Pressable onPress={handleDelete} style={styles.secondaryActionButton}>
                      <Text style={styles.secondaryActionButtonText}>삭제</Text>
                    </Pressable>
                  ) : null}
                </View>
                {hasPosition ? (
                  <Text style={styles.metaText}>
                    현재 평가금액 {formatPrice(context.portfolioPosition!.evaluationAmount, context.base.market)} ·
                    손익 {formatSignedRate(context.portfolioPosition!.profitRate)}
                  </Text>
                ) : null}
              </View>

              {/* ── 최근 AI 로그 ── */}
              {context.latestAiLog ? (
                <View style={styles.cardSection}>
                  <View style={styles.cardTitleRow}>
                    <Cpu size={13} color="#7c3aed" strokeWidth={2.5} />
                    <Text style={styles.cardTitle}>최근 AI 로그</Text>
                  </View>
                  <Text style={styles.logMeta}>
                    {context.latestAiLog.date} · {context.latestAiLog.stage} · {context.latestAiLog.status}
                  </Text>
                  <Text style={styles.cardNote}>{context.latestAiLog.rationale}</Text>
                </View>
              ) : null}

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
