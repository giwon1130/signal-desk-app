import { useState } from 'react'
import { Pressable, Switch, Text, TextInput, View } from 'react-native'
import { Bell } from 'lucide-react-native'
import { useStyles } from '../../styles'
import { useTheme } from '../../theme'
import type { WatchItem } from '../../types'
import { formatPrice } from '../../utils'

type Props = {
  watchItem: WatchItem
  onSave: (alertBelow: number | null, alertAbove: number | null, volumeAlert: boolean) => void
  saving: boolean
}

export function WatchAlertForm({ watchItem, onSave, saving }: Props) {
  const styles = useStyles()
  const { palette } = useTheme()

  const [alertBelowInput, setAlertBelowInput] = useState(
    watchItem.alertBelow ? String(watchItem.alertBelow) : '',
  )
  const [alertAboveInput, setAlertAboveInput] = useState(
    watchItem.alertAbove ? String(watchItem.alertAbove) : '',
  )
  const [volumeAlert, setVolumeAlert] = useState(watchItem.volumeAlert ?? false)

  const handleSave = () => {
    const below = alertBelowInput ? Number(alertBelowInput.replace(/[^0-9]/g, '')) || null : null
    const above = alertAboveInput ? Number(alertAboveInput.replace(/[^0-9]/g, '')) || null : null
    onSave(below, above, volumeAlert)
  }

  const hasAnyAlert = !!watchItem.alertBelow || !!watchItem.alertAbove || !!watchItem.volumeAlert

  return (
    <View style={{ marginTop: 16, gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Bell size={13} color={palette.blue} strokeWidth={2.5} />
        <Text style={{ color: palette.inkMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 }}>
          가격 · 거래량 알림
        </Text>
        {hasAnyAlert && (
          <View style={{ marginLeft: 4, backgroundColor: palette.blue, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 }}>
            <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800' }}>ON</Text>
          </View>
        )}
      </View>

      <View style={{ backgroundColor: palette.surfaceAlt, borderRadius: 12, padding: 14, gap: 12, borderWidth: 1, borderColor: palette.border }}>
        {/* 하한 알림 */}
        <View style={{ gap: 4 }}>
          <Text style={{ color: palette.inkSub, fontSize: 11, fontWeight: '700' }}>
            하한 알림 — 이 가격 이하로 떨어지면 알림
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TextInput
              value={alertBelowInput}
              onChangeText={setAlertBelowInput}
              placeholder={watchItem.price ? formatPrice(watchItem.price, watchItem.market) : '매수 희망가'}
              placeholderTextColor={palette.inkMuted}
              keyboardType="numeric"
              style={[styles.formInput, { flex: 1 }]}
            />
            {watchItem.alertBelow ? (
              <Text style={{ color: palette.down, fontSize: 11, fontWeight: '700' }}>
                현재 {formatPrice(watchItem.alertBelow, watchItem.market)}
              </Text>
            ) : null}
          </View>
        </View>

        {/* 상한 알림 */}
        <View style={{ gap: 4 }}>
          <Text style={{ color: palette.inkSub, fontSize: 11, fontWeight: '700' }}>
            상한 알림 — 이 가격 이상으로 오르면 알림
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TextInput
              value={alertAboveInput}
              onChangeText={setAlertAboveInput}
              placeholder={watchItem.price ? formatPrice(watchItem.price, watchItem.market) : '목표 매도가'}
              placeholderTextColor={palette.inkMuted}
              keyboardType="numeric"
              style={[styles.formInput, { flex: 1 }]}
            />
            {watchItem.alertAbove ? (
              <Text style={{ color: palette.up, fontSize: 11, fontWeight: '700' }}>
                현재 {formatPrice(watchItem.alertAbove, watchItem.market)}
              </Text>
            ) : null}
          </View>
        </View>

        {/* 거래량 급증 알림 - KR 전용 */}
        {watchItem.market === 'KR' && (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ color: palette.inkSub, fontSize: 11, fontWeight: '700' }}>거래량 급증 알림</Text>
              <Text style={{ color: palette.inkMuted, fontSize: 10 }}>평균 대비 3배 이상 터지면 알림</Text>
            </View>
            <Switch
              value={volumeAlert}
              onValueChange={setVolumeAlert}
              trackColor={{ false: palette.border, true: palette.blue }}
              thumbColor="#ffffff"
            />
          </View>
        )}

        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={({ pressed }) => ({
            backgroundColor: palette.blue,
            borderRadius: 10,
            paddingVertical: 10,
            alignItems: 'center',
            opacity: pressed || saving ? 0.7 : 1,
          })}
        >
          <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>
            {saving ? '저장 중...' : '알림 설정 저장'}
          </Text>
        </Pressable>
      </View>
    </View>
  )
}
