/**
 * AITab 공통 카드 셸 — Playbook / Scorecard 두 서브탭이 공유.
 */
import React from 'react'
import { Text, View } from 'react-native'
import type { Palette } from '../../theme'

export function Card({
  palette, title, icon, meta, children,
}: { palette: Palette; title: string; icon?: React.ReactNode; meta?: React.ReactNode; children: React.ReactNode }) {
  return (
    <View style={{
      backgroundColor: palette.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: palette.border,
      padding: 14,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        {icon}
        <Text style={{ flex: 1, color: palette.ink, fontSize: 13, fontWeight: '800' }} numberOfLines={1}>{title}</Text>
        {meta ? (
          typeof meta === 'string'
            ? <Text style={{ color: palette.inkMuted, fontSize: 11, fontWeight: '600' }}>{meta}</Text>
            : meta
        ) : null}
      </View>
      {children}
    </View>
  )
}
