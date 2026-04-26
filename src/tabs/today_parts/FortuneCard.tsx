import { Text, View } from 'react-native'
import { AlertTriangle, Moon } from 'lucide-react-native'
import { CollapsibleCard } from '../../components/CollapsibleCard'
import { useStyles } from '../../styles'
import { useTheme } from '../../theme'
import type { DailyFortune } from '../../types'
import { fortuneToneColor } from './helpers'

function FortuneSubScore({ label, value, color }: { label: string; value: number; color: string }) {
  const styles = useStyles()
  const bar = Math.max(4, Math.min(100, value))
  return (
    <View style={styles.fortuneSubScoreCell}>
      <Text style={styles.fortuneSubScoreLabel}>{label}</Text>
      <Text style={[styles.fortuneSubScoreValue, { color }]}>{value}</Text>
      <View style={styles.fortuneSubScoreBar}>
        <View style={[styles.fortuneSubScoreBarFill, { width: `${bar}%`, backgroundColor: color }]} />
      </View>
    </View>
  )
}

export function FortuneCard({ fortune }: { fortune: DailyFortune }) {
  const styles = useStyles()
  const { palette } = useTheme()
  const accent = fortuneToneColor(fortune.overallTone)

  return (
    <CollapsibleCard
      title={
        <View style={styles.cardTitleRow}>
          <Moon size={13} color={accent} strokeWidth={2.5} />
          <Text style={[styles.cardEyebrow, { color: accent }]}>오늘의 투자 운세</Text>
        </View>
      }
      preview={
        <>
          <Text style={[styles.fortuneLabel, { color: accent }]}>{fortune.overallLabel}</Text>
          <Text style={[styles.fortuneScoreValue, { color: accent, fontSize: 14 }]}>{fortune.overallScore}</Text>
        </>
      }
    >
      <View style={styles.fortuneTopRow}>
        <View style={[styles.fortuneScoreCircle, { borderColor: accent }]}>
          <Text style={[styles.fortuneScoreValue, { color: accent }]}>{fortune.overallScore}</Text>
          <Text style={[styles.fortuneScoreUnit, { color: accent }]}>/ 100</Text>
        </View>
        <View style={styles.fortuneTopText}>
          <Text style={[styles.fortuneLabel, { color: accent }]}>{fortune.overallLabel}</Text>
          <Text style={styles.fortuneHeadline}>{fortune.headline}</Text>
        </View>
      </View>

      <Text style={styles.fortuneMessage}>{fortune.message}</Text>

      <View style={styles.fortuneSubScoreRow}>
        <FortuneSubScore label="재물운" value={fortune.wealthScore} color={accent} />
        <FortuneSubScore label="매매운" value={fortune.tradeScore} color={accent} />
        <FortuneSubScore label="인내운" value={fortune.patienceScore} color={accent} />
      </View>

      <View style={styles.fortuneMetaGrid}>
        <View style={styles.fortuneMetaRow}>
          <Text style={styles.fortuneMetaKey}>행운의 시간</Text>
          <Text style={styles.fortuneMetaVal}>{fortune.luckyHour}</Text>
        </View>
        <View style={styles.fortuneMetaRow}>
          <Text style={styles.fortuneMetaKey}>행운의 색</Text>
          <Text style={styles.fortuneMetaVal}>{fortune.luckyColor}</Text>
        </View>
        <View style={styles.fortuneMetaRow}>
          <Text style={styles.fortuneMetaKey}>행운의 수</Text>
          <Text style={styles.fortuneMetaVal}>{fortune.luckyNumber}</Text>
        </View>
        <View style={styles.fortuneMetaRow}>
          <Text style={styles.fortuneMetaKey}>어울리는 테마</Text>
          <Text style={styles.fortuneMetaVal}>{fortune.luckyTheme}</Text>
        </View>
      </View>

      <View style={styles.fortuneCaution}>
        <AlertTriangle size={13} color={palette.scheme === 'dark' ? '#fcd34d' : '#c2410c'} strokeWidth={2.5} />
        <Text style={styles.fortuneCautionText}>{fortune.caution}</Text>
      </View>

      <Text style={styles.fortuneMantra}>“{fortune.mantra}”</Text>
      <Text style={styles.fortuneDisclaimer}>{fortune.disclaimer}</Text>
    </CollapsibleCard>
  )
}
