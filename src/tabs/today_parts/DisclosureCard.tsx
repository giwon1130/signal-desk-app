import { Linking, Pressable, Text, View } from 'react-native'
import { FileText } from 'lucide-react-native'
import type { DisclosureItem } from '../../types'
import { useStyles } from '../../styles'
import { useTheme } from '../../theme'

type Props = {
  disclosures: DisclosureItem[]
  onOpenDetail: (market: string, ticker: string, name?: string) => void
}

/** 보유/관심 KR 종목의 최근 DART 공시. 종목명 탭 → 상세, 제목 탭 → DART 원문. */
export function DisclosureCard({ disclosures, onOpenDetail }: Props) {
  const styles = useStyles()
  const { palette } = useTheme()

  if (disclosures.length === 0) return null

  const display = disclosures.slice(0, 8)

  return (
    <View style={styles.card}>
      <View style={styles.cardTitleRow}>
        <FileText size={14} color={palette.blue} strokeWidth={2.5} />
        <Text style={styles.cardTitle}>보유 종목 공시</Text>
        <Text style={[styles.metaText, { marginLeft: 'auto' }]}>{disclosures.length}건</Text>
      </View>
      <View style={{ gap: 0, marginTop: 8 }}>
        {display.map((item) => (
          <View
            key={item.rceptNo}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              paddingVertical: 8,
              borderTopWidth: 1,
              borderTopColor: palette.border,
            }}
          >
            <View style={{ width: 44, alignItems: 'center' }}>
              <Text style={{ color: palette.inkFaint, fontSize: 10, fontWeight: '800' }}>
                {formatDate(item.rceptDt)}
              </Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Pressable onPress={() => onOpenDetail('KR', item.stockCode, item.corpName)}>
                <Text
                  style={{ color: palette.ink, fontSize: 13, fontWeight: '800' }}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {item.corpName}
                </Text>
              </Pressable>
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
        ))}
      </View>
    </View>
  )
}

function formatDate(yyyymmdd: string): string {
  // "20260520" → "5/20"
  if (yyyymmdd.length !== 8) return yyyymmdd
  return `${parseInt(yyyymmdd.slice(4, 6), 10)}/${parseInt(yyyymmdd.slice(6, 8), 10)}`
}
