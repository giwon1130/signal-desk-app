import { useEffect, useMemo, useState } from 'react'
import { Alert, Pressable, Share, Text, View } from 'react-native'
import { Cable, RefreshCw, Share2, ShieldCheck, Unplug } from 'lucide-react-native'
import {
  createTraderConnection,
  disconnectTrader,
  getTraderConnection,
} from '../../api/traderBridge'
import type { TraderConnectionStatus } from '../../types/trader'
import type { Palette } from '../../theme'

type Props = {
  active: boolean
  palette: Palette
}

export function TraderConnectionSection({ active, palette }: Props) {
  const [status, setStatus] = useState<TraderConnectionStatus>({ connected: false })
  const [connectionKey, setConnectionKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const pendingCount = useMemo(
    () => status.snapshot?.orders.filter((order) => order.status === 'PENDING_APPROVAL').length ?? 0,
    [status.snapshot?.orders],
  )

  const refresh = async () => {
    if (loading) return
    setLoading(true)
    setError('')
    try { setStatus(await getTraderConnection()) }
    catch (e) { setError(e instanceof Error ? e.message : '연결 상태를 확인하지 못했어요.') }
    finally { setLoading(false) }
  }

  useEffect(() => {
    if (!active) {
      // 연결 키는 생성 직후 열린 설정 화면에서만 보여준다.
      setConnectionKey(null)
      return
    }
    void refresh()
    // 모달을 다시 열 때만 새로 조회한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  const create = async () => {
    if (loading) return
    setLoading(true)
    setError('')
    try {
      const created = await createTraderConnection()
      setStatus(created.status)
      setConnectionKey(created.connectionKey)
    } catch (e) {
      setError(e instanceof Error ? e.message : '연결 키를 만들지 못했어요.')
    } finally {
      setLoading(false)
    }
  }

  const shareKey = async () => {
    if (!connectionKey) return
    try {
      await Share.share({
        title: 'Signal Desk trader 연결 키',
        message: [
          'Signal Desk 개인 trader 연결 키',
          connectionKey,
          '',
          '이 키는 토스 계정 비밀번호가 아니며, Signal Desk에 읽기 전용 상태를 보내는 용도로만 사용합니다.',
        ].join('\n'),
      })
    } catch {
      setError('연결 키를 공유하지 못했어요. 키를 길게 눌러 직접 복사해 주세요.')
    }
  }

  const confirmDisconnect = () => {
    Alert.alert(
      '개인 trader 연결을 끊을까요?',
      '저장된 연결 키와 마지막 동기화 상태가 삭제돼요. 실제 trader 프로그램이나 토스 계정에는 영향을 주지 않아요.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '연결 끊기', style: 'destructive', onPress: () => {
            setLoading(true)
            void disconnectTrader()
              .then(() => { setStatus({ connected: false }); setConnectionKey(null); setError('') })
              .catch((e) => setError(e instanceof Error ? e.message : '연결을 끊지 못했어요.'))
              .finally(() => setLoading(false))
          },
        },
      ],
    )
  }

  return (
    <View style={{
      backgroundColor: palette.surface, borderRadius: 12,
      borderWidth: 1, borderColor: palette.border, padding: 14, gap: 10,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
        <View style={{
          width: 34, height: 34, borderRadius: 10,
          backgroundColor: palette.blueSoft, alignItems: 'center', justifyContent: 'center',
        }}>
          <Cable size={17} color={palette.blue} strokeWidth={2.5} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: palette.ink, fontSize: 13.5, fontWeight: '900' }}>개인 자동매매 연동</Text>
          <Text style={{ color: palette.inkMuted, fontSize: 10.5, marginTop: 2 }}>상태 확인만 가능 · 앱에서 주문 실행 불가</Text>
        </View>
        {status.connected ? (
          <View style={{ backgroundColor: palette.upSoft, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 }}>
            <Text style={{ color: palette.up, fontSize: 9.5, fontWeight: '900' }}>연결됨</Text>
          </View>
        ) : null}
      </View>

      {!status.connected ? (
        <>
          <Text style={{ color: palette.inkMuted, fontSize: 11, lineHeight: 16 }}>
            토스 자격증명은 개인 trader에만 두고, Signal Desk에는 보유·승인·체결 상태만 가져와요.
          </Text>
          <Pressable
            onPress={() => void create()}
            disabled={loading}
            style={({ pressed }) => ({
              backgroundColor: palette.blue, borderRadius: 9, paddingVertical: 10,
              alignItems: 'center', opacity: loading ? 0.5 : pressed ? 0.75 : 1,
            })}
          >
            <Text style={{ color: '#fff', fontSize: 12.5, fontWeight: '900' }}>{loading ? '만드는 중…' : '읽기 전용 연결 키 만들기'}</Text>
          </Pressable>
        </>
      ) : (
        <>
          <View style={{ backgroundColor: palette.surfaceAlt, borderRadius: 9, padding: 10, gap: 5 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <ShieldCheck size={12} color={palette.blue} strokeWidth={2.6} />
              <Text style={{ color: palette.inkSub, fontSize: 10.5, fontWeight: '800' }}>
                키 끝자리 ···{status.secretHint ?? '확인 중'}
              </Text>
            </View>
            {status.snapshot ? (
              <>
                <Text style={{ color: palette.ink, fontSize: 11.5, fontWeight: '900' }}>
                  {modeLabel(status.snapshot.mode)} · 보유 {status.snapshot.holdings.length}종목 · 승인 대기 {pendingCount}건
                </Text>
                <Text style={{ color: status.snapshot.killSwitchEnabled ? palette.down : palette.inkMuted, fontSize: 10.5 }}>
                  킬 스위치 {status.snapshot.killSwitchEnabled ? `켜짐${status.snapshot.killSwitchReason ? ` · ${status.snapshot.killSwitchReason}` : ''}` : '꺼짐'}
                </Text>
                <Text style={{ color: palette.inkFaint, fontSize: 9.5 }}>최근 동기화 {formatDate(status.lastSeenAt ?? status.snapshot.asOf)}</Text>
              </>
            ) : (
              <Text style={{ color: palette.inkMuted, fontSize: 10.5, lineHeight: 15 }}>
                연결 키를 개인 trader에 입력하면 첫 상태가 여기 표시돼요.
              </Text>
            )}
          </View>

          {connectionKey ? (
            <View style={{ backgroundColor: palette.orangeSoft, borderRadius: 9, padding: 10, gap: 7 }}>
              <Text style={{ color: palette.ink, fontSize: 10.5, fontWeight: '900' }}>지금 한 번만 표시되는 연결 키</Text>
              <Text selectable style={{ color: palette.inkSub, fontSize: 10, lineHeight: 15, fontFamily: 'monospace' }}>{connectionKey}</Text>
              <Text style={{ color: palette.inkMuted, fontSize: 9.5, lineHeight: 14 }}>
                개인 trader의 .env에서 SIGNAL_DESK_BRIDGE_KEY 값으로 넣어 주세요.
              </Text>
              <Pressable
                onPress={() => void shareKey()}
                style={({ pressed }) => ({
                  alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4,
                  backgroundColor: palette.surface, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 6,
                  opacity: pressed ? 0.65 : 1,
                })}
              >
                <Share2 size={11} color={palette.blue} strokeWidth={2.5} />
                <Text style={{ color: palette.blue, fontSize: 10, fontWeight: '900' }}>키 옮기기</Text>
              </Pressable>
            </View>
          ) : null}

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable
              onPress={() => void refresh()}
              disabled={loading}
              style={({ pressed }) => ({
                flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
                borderWidth: 1, borderColor: palette.border, borderRadius: 8, paddingVertical: 8,
                opacity: loading ? 0.5 : pressed ? 0.65 : 1,
              })}
            >
              <RefreshCw size={12} color={palette.inkSub} strokeWidth={2.5} />
              <Text style={{ color: palette.inkSub, fontSize: 10.5, fontWeight: '800' }}>상태 새로고침</Text>
            </Pressable>
            <Pressable
              onPress={confirmDisconnect}
              disabled={loading}
              style={({ pressed }) => ({
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
                borderWidth: 1, borderColor: palette.down, borderRadius: 8,
                paddingHorizontal: 10, paddingVertical: 8, opacity: loading ? 0.5 : pressed ? 0.65 : 1,
              })}
            >
              <Unplug size={12} color={palette.down} strokeWidth={2.5} />
              <Text style={{ color: palette.down, fontSize: 10.5, fontWeight: '800' }}>연결 끊기</Text>
            </Pressable>
          </View>
        </>
      )}

      {error ? <Text style={{ color: palette.down, fontSize: 10.5, lineHeight: 15 }}>{error}</Text> : null}
    </View>
  )
}

function modeLabel(mode: 'DRY_RUN' | 'READ_ONLY' | 'LIVE') {
  if (mode === 'LIVE') return '실거래'
  if (mode === 'READ_ONLY') return '읽기 전용'
  return '모의 실행'
}

function formatDate(value?: string | null) {
  if (!value) return '아직 없음'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '확인 필요'
  return date.toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
}
