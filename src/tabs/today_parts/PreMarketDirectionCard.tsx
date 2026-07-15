/**
 * 🌙 야간 방향성 — 한국장 시작 전, 간밤 MSCI 한국 + 해외상장 삼성·SK하이닉스 ADR + 반도체 + S&P선물 등락으로 오늘 출발 방향 미리보기.
 * PRO 전용: 서버가 FREE 에겐 locked=true(값 비공개)로 내려줌 → 여기선 티저+잠금으로 업그레이드 유도.
 *
 * 웹·네이티브 공용 (RN 프리미티브만 사용, blur 의존성 없음).
 */
import { Pressable, Text, View } from 'react-native'
import { Moon, Lock, TrendingUp, TrendingDown, Minus } from 'lucide-react-native'
import { useTheme } from '../../theme'
import type { PreMarketDirection, DirectionQuote, PreMarketForecastStats } from '../../types/market'

type Props = {
  data?: PreMarketDirection | null
  stats?: PreMarketForecastStats | null
  onUpgrade?: () => void
}

const signed = (rate: number) => `${rate >= 0 ? '+' : '-'}${Math.abs(rate).toFixed(2)}%`
const confidenceLabel: Record<string, string> = {
  HIGH: '높음', MEDIUM: '보통', LOW: '낮음', INSUFFICIENT: '자료 부족',
}

export function PreMarketDirectionCard({ data, stats, onUpgrade }: Props) {
  const { palette } = useTheme()
  if (!data) return null

  const purple = palette.purple ?? '#7c3aed'

  const Header = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: palette.orangeSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5,
      }}>
        <Moon size={13} color={purple} strokeWidth={2.6} />
        <Text style={{ color: purple, fontSize: 12, fontWeight: '900' }}>야간 방향성</Text>
      </View>
      <View style={{ backgroundColor: purple, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 }}>
        <Text style={{ color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 }}>PRO</Text>
      </View>
      <View style={{ flex: 1 }} />
      {!data.locked && data.sessionActive ? (
        <Text style={{ color: palette.inkFaint, fontSize: 10.5 }}>● 야간 세션</Text>
      ) : null}
    </View>
  )

  const cardStyle = {
    backgroundColor: palette.surface, borderRadius: 18, borderWidth: 1, borderColor: palette.border,
    padding: 16, gap: 12,
  } as const
  // 초기 몇 건의 결과는 우연 변동이 커서, 최소 5건이 쌓인 뒤에만 수치로 보여준다.
  const hasForecastStats = (stats?.evaluatedCount ?? 0) >= 5 && stats?.accuracyPct != null
  const forecastStatsBlock = hasForecastStats ? (
    <View style={{ backgroundColor: palette.surfaceAlt, borderRadius: 10, padding: 11, gap: 3 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <Text style={{ color: palette.inkSub, fontSize: 12, fontWeight: '800' }}>야간 방향성 검증</Text>
        <Text style={{ color: purple, fontSize: 13, fontWeight: '900' }}>{stats!.accuracyPct}% 적중</Text>
      </View>
      <Text style={{ color: palette.inkMuted, fontSize: 10.5, lineHeight: 15 }}>
        최근 {stats!.evaluatedCount}건 중 {stats!.correctCount}건 · 방향을 제시한 날만 집계
        {stats!.lastCorrect != null ? ` · 최근 결과 ${stats!.lastCorrect ? '적중' : '불일치'}` : ''}
      </Text>
    </View>
  ) : null

  // ── 잠금(FREE): 라벨 티저 + 마스킹된 값 + 업그레이드 CTA ──
  if (data.locked) {
    return (
      <View style={cardStyle}>
        {Header}
        <Text style={{ color: palette.inkSub, fontSize: 13, lineHeight: 19 }}>
          장 시작 전, 간밤 미국장(MSCI 한국·반도체)·해외상장 삼성·SK하이닉스 ADR 등락으로 오늘 한국장 출발 방향을 미리 봐요.
        </Text>
        <View style={{ gap: 8 }}>
          {['MSCI 한국(간밤)', '삼성전자(런던)', 'SK하이닉스(나스닥 ADR)', '마이크론(SK하이닉스 가늠)'].map((label) => (
            <View key={label} style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              backgroundColor: palette.surfaceAlt, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
            }}>
              <Text style={{ color: palette.inkSub, fontSize: 13, fontWeight: '700' }}>{label}</Text>
              <Text style={{ color: palette.inkFaint, fontSize: 13, fontWeight: '800', letterSpacing: 1 }}>＋•.••%</Text>
            </View>
          ))}
        </View>
        <Pressable
          onPress={onUpgrade}
          style={({ pressed }) => ({
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
            backgroundColor: purple, borderRadius: 12, paddingVertical: 12, opacity: pressed ? 0.7 : 1,
          })}
        >
          <Lock size={14} color="#fff" strokeWidth={2.6} />
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>PRO로 야간 방향성 보기</Text>
        </Pressable>
      </View>
    )
  }

  // ── 데이터 없음(수집 실패): 카드 숨김 ──
  const quotes: DirectionQuote[] = [
    ...(data.kospiFutures ? [data.kospiFutures] : []),
    ...(data.overseas ?? []),
  ]
  if (quotes.length === 0) {
    if (!forecastStatsBlock) return null
    return (
      <View style={cardStyle}>
        {Header}
        {forecastStatsBlock}
        <Text style={{ color: palette.inkFaint, fontSize: 10.5, lineHeight: 15 }}>
          장전 신호는 한국장 시작 전에만 제공해요. 성과는 실제 KOSPI 시초가 기준으로 기록됩니다.
        </Text>
      </View>
    )
  }

  const biasColor = data.bias === 'RISING' ? palette.up : data.bias === 'FALLING' ? palette.down : palette.blue
  const biasBg = data.bias === 'RISING' ? palette.upSoft : data.bias === 'FALLING' ? palette.downSoft : palette.orangeSoft
  const BiasIcon = data.bias === 'RISING' ? TrendingUp : data.bias === 'FALLING' ? TrendingDown : Minus

  return (
    <View style={cardStyle}>
      {Header}

      {/* 방향 한 줄 */}
      {data.biasLabel ? (
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 8,
          backgroundColor: biasBg, borderRadius: 12, padding: 12, borderLeftWidth: 3, borderLeftColor: biasColor,
        }}>
          <BiasIcon size={18} color={biasColor} strokeWidth={2.6} />
          <Text style={{ color: palette.ink, fontSize: 15, fontWeight: '900', flex: 1 }}>{data.biasLabel}</Text>
        </View>
      ) : null}

      {(data.confidence || data.asOf) ? (
        <Text style={{ color: palette.inkFaint, fontSize: 11, lineHeight: 16 }}>
          {data.score != null ? `가중 신호 ${signed(data.score)} · ` : ''}
          {data.confidence ? `신뢰도 ${confidenceLabel[data.confidence] ?? data.confidence}` : ''}
          {data.coverage != null ? ` · 핵심 지표 ${data.coverage}% 반영` : ''}
          {data.asOf ? ` · ${new Date(data.asOf).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 기준` : ''}
        </Text>
      ) : null}

      {forecastStatsBlock}

      {/* 지표별 등락 */}
      <View style={{ gap: 8 }}>
        {quotes.map((q) => {
          const c = q.changeRate >= 0 ? palette.up : palette.down
          return (
            <View key={q.label} style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              backgroundColor: palette.surfaceAlt, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
            }}>
              <Text style={{ color: palette.ink, fontSize: 13, fontWeight: '700' }}>{q.label}</Text>
              <Text style={{ color: c, fontSize: 14, fontWeight: '900' }}>{signed(q.changeRate)}</Text>
            </View>
          )
        })}
      </View>

      <Text style={{ color: palette.inkFaint, fontSize: 10.5, lineHeight: 15 }}>
        간밤 미국장·해외상장 시세 기준 참고 지표예요. 실제 시초가와 다를 수 있어요.
      </Text>
    </View>
  )
}
