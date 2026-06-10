import { useMemo, useState } from 'react'
import { Linking, Pressable, Text, View } from 'react-native'
import { FileText } from 'lucide-react-native'
import type { DisclosureImportance, DisclosureItem } from '../../types'
import { useStyles } from '../../styles'
import { useTheme } from '../../theme'

type Props = {
  disclosures: DisclosureItem[]
  onOpenDetail: (market: string, ticker: string, name?: string) => void
}

/** importance 없으면(구버전 API) MEDIUM 취급. */
function levelOf(item: DisclosureItem): DisclosureImportance {
  return item.importance ?? 'MEDIUM'
}

/** 보유/관심 KR 종목의 최근 DART 공시. 종목명 탭 → 상세, 제목 탭 → DART 원문.
 *  기본은 주가영향(HIGH·MEDIUM) 공시만 표시, "전체"로 루틴(LOW)까지 펼침. */
export function DisclosureCard({ disclosures, onOpenDetail }: Props) {
  const styles = useStyles()
  const { palette } = useTheme()
  const [showAll, setShowAll] = useState(false)

  const lowCount = useMemo(() => disclosures.filter((d) => levelOf(d) === 'LOW').length, [disclosures])
  const visible = useMemo(
    () => (showAll ? disclosures : disclosures.filter((d) => levelOf(d) !== 'LOW')),
    [disclosures, showAll],
  )

  if (disclosures.length === 0) return null

  const display = visible.slice(0, 8)

  return (
    <View style={styles.card}>
      <View style={styles.cardTitleRow}>
        <FileText size={14} color={palette.blue} strokeWidth={2.5} />
        <Text style={styles.cardTitle}>보유 종목 공시</Text>
        {lowCount > 0 && (
          <Pressable
            onPress={() => setShowAll((v) => !v)}
            hitSlop={8}
            style={{ marginLeft: 'auto', paddingHorizontal: 8, paddingVertical: 2 }}
          >
            <Text style={{ color: palette.blue, fontSize: 11, fontWeight: '800' }}>
              {showAll ? '중요만' : `전체 ${disclosures.length}`}
            </Text>
          </Pressable>
        )}
        <Text style={[styles.metaText, lowCount > 0 ? undefined : { marginLeft: 'auto' }]}>
          {visible.length}건
        </Text>
      </View>
      <View style={{ gap: 0, marginTop: 8 }}>
        {display.length === 0 ? (
          <Text style={[styles.metaText, { paddingVertical: 10 }]}>주가영향 공시 없음</Text>
        ) : (
          display.map((item) => {
            const level = levelOf(item)
            const isLow = level === 'LOW'
            return (
              <View
                key={item.rceptNo}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  paddingVertical: 8,
                  borderTopWidth: 1,
                  borderTopColor: palette.border,
                  opacity: isLow ? 0.55 : 1,
                }}
              >
                <View style={{ width: 44, alignItems: 'center' }}>
                  <Text style={{ color: palette.inkFaint, fontSize: 10, fontWeight: '800' }}>
                    {formatDate(item.rceptDt)}
                  </Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    {level === 'HIGH' && (
                      <View
                        style={{
                          backgroundColor: palette.redSoft,
                          paddingHorizontal: 5,
                          paddingVertical: 1,
                          borderRadius: 4,
                        }}
                      >
                        <Text style={{ color: palette.red, fontSize: 9, fontWeight: '900' }}>주가영향</Text>
                      </View>
                    )}
                    <Pressable
                      style={{ flexShrink: 1 }}
                      onPress={() => onOpenDetail('KR', item.stockCode, item.corpName)}
                    >
                      <Text
                        style={{ color: palette.ink, fontSize: 13, fontWeight: '800' }}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {item.corpName}
                      </Text>
                    </Pressable>
                  </View>
                  <Pressable
                    onPress={() => {
                      void Linking.openURL(`https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${item.rceptNo}`)
                    }}
                  >
                    <Text
                      style={{ color: palette.inkMuted, fontSize: 11 }}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {item.reportNm}
                    </Text>
                  </Pressable>
                </View>
              </View>
            )
          })
        )}
      </View>
    </View>
  )
}

function formatDate(yyyymmdd: string): string {
  // "20260520" → "5/20"
  if (yyyymmdd.length !== 8) return yyyymmdd
  return `${parseInt(yyyymmdd.slice(4, 6), 10)}/${parseInt(yyyymmdd.slice(6, 8), 10)}`
}
