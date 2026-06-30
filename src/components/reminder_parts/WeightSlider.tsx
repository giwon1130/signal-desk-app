import { useState } from 'react'
import { Text, View } from 'react-native'
import { useTheme } from '../../theme'

/**
 * 순수 RN 슬라이더 — responder 시스템(터치 위치)으로 구현. 네이티브 의존성 없음(웹·네이티브 공용, OTA 가능).
 * value 0..max, step 0.1. 가운데(1.0)에 기본 눈금. 드래그 중 onChange, 손 뗄 때 onCommit(저장).
 */
type Props = {
  label: string
  value: number
  max?: number
  disabled?: boolean
  onChange: (v: number) => void
  onCommit?: (v: number) => void
}

export function WeightSlider({ label, value, max = 2, disabled, onChange, onCommit }: Props) {
  const { palette } = useTheme()
  const [w, setW] = useState(0)
  const purple = palette.purple ?? '#7c3aed'

  const valueFromX = (x: number): number => {
    if (w <= 0) return value
    const ratio = Math.max(0, Math.min(1, x / w))
    return Math.round(ratio * max * 10) / 10 // step 0.1
  }

  const pct = Math.max(0, Math.min(1, value / max)) * 100
  const centerPct = (1 / max) * 100

  return (
    <View style={{ marginBottom: 14, opacity: disabled ? 0.5 : 1 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
        <Text style={{ color: palette.inkSub, fontSize: 12.5, fontWeight: '700' }}>{label}</Text>
        <Text style={{ color: value === 1 ? palette.inkMuted : purple, fontSize: 12, fontWeight: '800', fontVariant: ['tabular-nums'] }}>
          {value.toFixed(1)}×
        </Text>
      </View>
      <View
        onLayout={(e) => setW(e.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => !disabled}
        onMoveShouldSetResponder={() => !disabled}
        onResponderGrant={(e) => onChange(valueFromX(e.nativeEvent.locationX))}
        onResponderMove={(e) => onChange(valueFromX(e.nativeEvent.locationX))}
        onResponderRelease={(e) => onCommit?.(valueFromX(e.nativeEvent.locationX))}
        style={{ height: 28, justifyContent: 'center' }}
      >
        <View style={{ height: 6, borderRadius: 3, backgroundColor: palette.surfaceAlt }}>
          {/* 기본(1.0) 눈금 */}
          <View style={{ position: 'absolute', left: `${centerPct}%`, top: -3, width: 1.5, height: 12, backgroundColor: palette.border }} />
          {/* 채움 */}
          <View style={{ height: 6, borderRadius: 3, backgroundColor: purple, width: `${pct}%` }} />
        </View>
        {/* thumb */}
        <View style={{
          position: 'absolute', left: `${pct}%`, marginLeft: -9,
          width: 18, height: 18, borderRadius: 9, backgroundColor: '#fff', borderWidth: 2, borderColor: purple,
        }} />
      </View>
    </View>
  )
}
