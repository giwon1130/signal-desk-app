import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Check, ImagePlus, LockKeyhole, RotateCcw, Square, SquareCheckBig, X } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import { importPortfolioPositions, searchStocks } from '../api'
import type { StockSearchResult } from '../types'
import { useTheme } from '../theme'
import { extractPortfolioCandidates } from '../utils/portfolioOcr'
import { recognizePortfolioScreenshot } from '../../modules/signal-desk-ocr/src'

type Props = {
  visible: boolean
  onClose: () => void
  onImported: () => Promise<void>
}

type ImportRow = {
  key: string
  stock: StockSearchResult
  buyPrice: string
  quantity: string
  selected: boolean
}

const normalize = (value: string) => value.replace(/[\s().·_-]/g, '').toUpperCase()
const numeric = (value: string) => Number(value.replace(/,/g, ''))

function bestMatch(query: string, stocks: StockSearchResult[]) {
  const normalized = normalize(query)
  return stocks.find((stock) => normalize(stock.ticker) === normalized || normalize(stock.name) === normalized)
    ?? stocks.find((stock) => normalize(stock.name).includes(normalized) || normalized.includes(normalize(stock.name)))
    ?? stocks[0]
}

export function PortfolioImportModal({ visible, onClose, onImported }: Props) {
  const { palette } = useTheme()
  const insets = useSafeAreaInsets()
  const [phase, setPhase] = useState<'intro' | 'scanning' | 'review' | 'saving'>('intro')
  const [rows, setRows] = useState<ImportRow[]>([])
  const [unmatchedCount, setUnmatchedCount] = useState(0)

  useEffect(() => {
    if (visible) {
      setPhase('intro')
      setRows([])
      setUnmatchedCount(0)
    }
  }, [visible])

  const close = () => {
    if (phase === 'scanning' || phase === 'saving') return
    onClose()
  }

  const pickAndScan = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('모바일 앱에서 사용할 수 있어요', '증권앱 캡처 자동등록은 iPhone·Android 앱에서 지원합니다.')
      return
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      Alert.alert('사진 접근이 필요해요', '증권앱 캡처를 선택할 수 있도록 사진 접근을 허용해 주세요.')
      return
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    })
    if (picked.canceled || !picked.assets[0]?.uri) return

    setPhase('scanning')
    try {
      const ocr = await recognizePortfolioScreenshot(picked.assets[0].uri)
      const candidates = extractPortfolioCandidates(ocr)
      const matched: ImportRow[] = []
      let missed = 0

      for (const candidate of candidates.slice(0, 15)) {
        try {
          const results = await searchStocks(candidate.query, 'ALL')
          const stock = bestMatch(candidate.query, results)
          if (!stock) {
            missed += 1
            continue
          }
          const key = `${stock.market}:${stock.ticker}`
          if (matched.some((row) => row.key === key)) continue
          const buyPrice = candidate.buyPrice && candidate.buyPrice > 0 ? String(candidate.buyPrice) : ''
          const quantity = candidate.quantity && candidate.quantity > 0 ? String(candidate.quantity) : ''
          matched.push({
            key,
            stock,
            buyPrice,
            quantity,
            selected: Boolean(buyPrice && quantity),
          })
        } catch {
          missed += 1
        }
      }

      if (!matched.length) {
        setPhase('intro')
        Alert.alert(
          '종목을 찾지 못했어요',
          '종목명·평균단가·보유수량이 함께 보이는 잔고 화면을 캡처해서 다시 시도해 주세요.',
        )
        return
      }
      setRows(matched)
      setUnmatchedCount(missed)
      setPhase('review')
    } catch (error: any) {
      setPhase('intro')
      const unavailable = String(error?.message ?? '').includes('ocr-native-module-unavailable')
      Alert.alert(
        unavailable ? '앱 업데이트가 필요해요' : '캡처를 읽지 못했어요',
        unavailable
          ? '기기 내 자동 인식을 지원하는 최신 앱으로 업데이트해 주세요.'
          : '다른 캡처로 다시 시도해 주세요. 캡처는 서버로 전송되지 않았습니다.',
      )
    }
  }

  const updateRow = (key: string, patch: Partial<ImportRow>) => {
    setRows((current) => current.map((row) => row.key === key ? { ...row, ...patch } : row))
  }

  const selectedRows = rows.filter((row) =>
    row.selected && numeric(row.buyPrice) > 0 && numeric(row.quantity) > 0,
  )

  const save = async () => {
    if (!selectedRows.length) {
      Alert.alert('등록할 종목을 확인해 주세요', '평균단가와 수량을 입력하고 종목을 선택해 주세요.')
      return
    }
    setPhase('saving')
    try {
      await importPortfolioPositions(selectedRows.map((row) => ({
        market: row.stock.market,
        ticker: row.stock.ticker,
        name: row.stock.name,
        buyPrice: numeric(row.buyPrice),
        currentPrice: Math.max(1, row.stock.price || numeric(row.buyPrice)),
        quantity: numeric(row.quantity),
      })))
      await onImported()
      Alert.alert('보유 종목을 등록했어요', `${selectedRows.length}개 종목의 손익 추적을 시작합니다.`)
      onClose()
    } catch (error: any) {
      setPhase('review')
      const raw = String(error?.message ?? '')
      Alert.alert(
        '등록하지 못했어요',
        raw.includes('PLAN_LIMIT') ? '현재 플랜의 보유 종목 한도를 확인해 주세요.' : '잠시 후 다시 시도해 주세요.',
      )
    }
  }

  const inputStyle = {
    flex: 1,
    color: palette.ink,
    backgroundColor: palette.surfaceAlt,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 9,
    fontSize: 13,
    fontWeight: '700' as const,
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={close}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, backgroundColor: palette.bg }}
      >
        <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom }}>
          <View style={{
            flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13,
            borderBottomWidth: 1, borderBottomColor: palette.border,
          }}>
            <Text style={{ flex: 1, color: palette.ink, fontSize: 17, fontWeight: '900' }}>
              캡처로 보유 종목 등록
            </Text>
            <Pressable onPress={close} hitSlop={18} accessibilityRole="button" accessibilityLabel="닫기">
              <X size={21} color={palette.inkMuted} strokeWidth={2.5} />
            </Pressable>
          </View>

          {phase === 'intro' ? (
            <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24, gap: 18 }}>
              <View style={{ alignItems: 'center', gap: 12 }}>
                <View style={{
                  width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: `${palette.brandAccent}18`,
                }}>
                  <ImagePlus size={30} color={palette.brandAccent} strokeWidth={2.2} />
                </View>
                <Text style={{ color: palette.ink, fontSize: 21, fontWeight: '900', textAlign: 'center' }}>
                  잔고 화면 한 장이면 돼요
                </Text>
                <Text style={{ color: palette.inkMuted, fontSize: 13, lineHeight: 20, textAlign: 'center' }}>
                  종목명 · 평균단가 · 보유수량이 보이는{'\n'}증권앱 화면을 캡처해 주세요.
                </Text>
              </View>
              <View style={{
                flexDirection: 'row', gap: 10, padding: 13, borderRadius: 12,
                backgroundColor: `${palette.up}12`, borderWidth: 1, borderColor: `${palette.up}35`,
              }}>
                <LockKeyhole size={17} color={palette.up} strokeWidth={2.5} />
                <Text style={{ flex: 1, color: palette.inkMuted, fontSize: 12, lineHeight: 18 }}>
                  캡처는 기기 안에서만 읽고 서버에 업로드하지 않아요. 확인한 종목 정보만 저장됩니다.
                </Text>
              </View>
              <Pressable
                onPress={pickAndScan}
                accessibilityRole="button"
                style={({ pressed }) => ({
                  alignItems: 'center', paddingVertical: 15, borderRadius: 12,
                  backgroundColor: palette.brandAccent, opacity: pressed ? 0.75 : 1,
                })}
              >
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '900' }}>캡처 선택하기</Text>
              </Pressable>
            </View>
          ) : phase === 'scanning' ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 }}>
              <ActivityIndicator size="large" color={palette.brandAccent} />
              <Text style={{ color: palette.ink, fontSize: 16, fontWeight: '900' }}>기기에서 종목을 찾는 중…</Text>
              <Text style={{ color: palette.inkMuted, fontSize: 12 }}>캡처는 밖으로 전송되지 않아요</Text>
            </View>
          ) : (
            <>
              <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
                <View style={{ gap: 5 }}>
                  <Text style={{ color: palette.ink, fontSize: 16, fontWeight: '900' }}>
                    등록 전 한 번만 확인해 주세요
                  </Text>
                  <Text style={{ color: palette.inkMuted, fontSize: 12, lineHeight: 18 }}>
                    잘못 읽힌 평단·수량은 바로 수정할 수 있어요.
                    {unmatchedCount ? ` 찾지 못한 항목 ${unmatchedCount}개는 제외했습니다.` : ''}
                  </Text>
                </View>

                {rows.map((row) => {
                  const valid = numeric(row.buyPrice) > 0 && numeric(row.quantity) > 0
                  return (
                    <View key={row.key} style={{
                      padding: 13, borderRadius: 13, gap: 11, backgroundColor: palette.surface,
                      borderWidth: 1, borderColor: row.selected ? `${palette.brandAccent}70` : palette.border,
                    }}>
                      <Pressable
                        onPress={() => updateRow(row.key, { selected: !row.selected })}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: row.selected }}
                      >
                        {row.selected
                          ? <SquareCheckBig size={20} color={palette.brandAccent} />
                          : <Square size={20} color={palette.inkFaint} />}
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: palette.ink, fontSize: 14, fontWeight: '900' }}>{row.stock.name}</Text>
                          <Text style={{ color: palette.inkMuted, fontSize: 11 }}>
                            {row.stock.market} · {row.stock.ticker}
                          </Text>
                        </View>
                        {valid ? <Check size={16} color={palette.up} strokeWidth={3} /> : null}
                      </Pressable>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <View style={{ flex: 1, gap: 5 }}>
                          <Text style={{ color: palette.inkMuted, fontSize: 11, fontWeight: '700' }}>평균단가</Text>
                          <TextInput
                            value={row.buyPrice}
                            onChangeText={(buyPrice) => updateRow(row.key, { buyPrice, selected: true })}
                            keyboardType="decimal-pad"
                            placeholder="직접 입력"
                            placeholderTextColor={palette.inkFaint}
                            style={inputStyle}
                          />
                        </View>
                        <View style={{ flex: 0.7, gap: 5 }}>
                          <Text style={{ color: palette.inkMuted, fontSize: 11, fontWeight: '700' }}>보유수량</Text>
                          <TextInput
                            value={row.quantity}
                            onChangeText={(quantity) => updateRow(row.key, { quantity, selected: true })}
                            keyboardType="number-pad"
                            placeholder="직접 입력"
                            placeholderTextColor={palette.inkFaint}
                            style={inputStyle}
                          />
                        </View>
                      </View>
                    </View>
                  )
                })}

                <Pressable
                  onPress={pickAndScan}
                  disabled={phase === 'saving'}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, padding: 12 }}
                >
                  <RotateCcw size={14} color={palette.inkMuted} strokeWidth={2.5} />
                  <Text style={{ color: palette.inkMuted, fontSize: 12, fontWeight: '800' }}>다른 캡처로 다시 읽기</Text>
                </Pressable>
              </ScrollView>
              <View style={{
                paddingHorizontal: 16, paddingTop: 11, paddingBottom: 8,
                borderTopWidth: 1, borderTopColor: palette.border, backgroundColor: palette.bg,
              }}>
                <Pressable
                  onPress={save}
                  disabled={phase === 'saving'}
                  style={({ pressed }) => ({
                    alignItems: 'center', justifyContent: 'center', minHeight: 50, borderRadius: 12,
                    backgroundColor: selectedRows.length ? palette.brandAccent : palette.surfaceAlt,
                    opacity: pressed || phase === 'saving' ? 0.72 : 1,
                  })}
                >
                  {phase === 'saving'
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={{
                      color: selectedRows.length ? '#fff' : palette.inkFaint,
                      fontSize: 15, fontWeight: '900',
                    }}>
                      선택한 {selectedRows.length}개 등록하기
                    </Text>}
                </Pressable>
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}
