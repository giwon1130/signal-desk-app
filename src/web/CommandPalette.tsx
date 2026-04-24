import React, { useEffect, useMemo, useRef, useState } from 'react'
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Platform } from 'react-native'
import { useTheme, type Palette } from '../theme'
import type { TabKey, WatchItem } from '../types'

type Props = {
  watchlist: WatchItem[]
  onNavigateTab: (tab: TabKey) => void
  onOpenDetail: (market: string, ticker: string, name?: string) => void
  onOpenReminder: () => void
}

type Entry =
  | { kind: 'tab'; id: string; label: string; hint: string; tab: TabKey }
  | { kind: 'stock'; id: string; label: string; hint: string; market: string; ticker: string; name: string }
  | { kind: 'action'; id: string; label: string; hint: string; run: () => void }

const TAB_ENTRIES: Array<{ tab: TabKey; label: string; hint: string }> = [
  { tab: 'today', label: '오늘', hint: '홈 대시보드' },
  { tab: 'market', label: '시장', hint: '지수 · 섹터' },
  { tab: 'stocks', label: '종목', hint: '검색 · 관심' },
  { tab: 'ai', label: 'AI', hint: 'AI 추천 · 로그' },
]

export function CommandPalette({ watchlist, onNavigateTab, onOpenDetail, onOpenReminder }: Props) {
  const { palette } = useTheme()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [idx, setIdx] = useState(0)
  const inputRef = useRef<TextInput>(null)

  useEffect(() => {
    if (Platform.OS !== 'web') return
    const onKey = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey
      if (isMod && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault()
        setOpen((o) => !o)
        setQ('')
        setIdx(0)
      } else if (e.key === 'Escape' && open) {
        e.preventDefault()
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30)
  }, [open])

  const entries = useMemo<Entry[]>(() => {
    const tabs: Entry[] = TAB_ENTRIES.map((t) => ({
      kind: 'tab' as const, id: `tab:${t.tab}`, label: t.label, hint: t.hint, tab: t.tab,
    }))
    const stocks: Entry[] = watchlist.slice(0, 80).map((w) => ({
      kind: 'stock' as const,
      id: `stock:${w.market}:${w.ticker}`,
      label: w.name || w.ticker,
      hint: `${w.market} · ${w.ticker}`,
      market: w.market,
      ticker: w.ticker,
      name: w.name || w.ticker,
    }))
    const actions: Entry[] = [
      { kind: 'action', id: 'action:reminder', label: '리마인더 설정', hint: '알림 시간 변경', run: onOpenReminder },
    ]
    const all = [...tabs, ...stocks, ...actions]
    const ql = q.trim().toLowerCase()
    if (!ql) return all
    return all.filter((e) => e.label.toLowerCase().includes(ql) || e.hint.toLowerCase().includes(ql))
  }, [q, watchlist, onOpenReminder])

  useEffect(() => { if (idx >= entries.length) setIdx(0) }, [entries.length, idx])

  if (!open) return null

  const runEntry = (e: Entry) => {
    setOpen(false)
    if (e.kind === 'tab') onNavigateTab(e.tab)
    else if (e.kind === 'stock') onOpenDetail(e.market, e.ticker, e.name)
    else if (e.kind === 'action') e.run()
  }

  const onKeyDown = (e: any) => {
    const key = e.nativeEvent?.key ?? e.key
    if (key === 'ArrowDown') { e.preventDefault?.(); setIdx((i) => Math.min(i + 1, entries.length - 1)) }
    else if (key === 'ArrowUp') { e.preventDefault?.(); setIdx((i) => Math.max(i - 1, 0)) }
    else if (key === 'Enter') { e.preventDefault?.(); const hit = entries[idx]; if (hit) runEntry(hit) }
    else if (key === 'Escape') { e.preventDefault?.(); setOpen(false) }
  }

  return (
    <View style={styles.backdrop} pointerEvents="auto">
      <Pressable style={styles.backdropHit} onPress={() => setOpen(false)} />
      <View style={[styles.panel, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <View style={[styles.inputWrap, { borderColor: palette.border }]}>
          <Text style={[styles.prompt, { color: palette.inkMuted }]}>›</Text>
          <TextInput
            ref={inputRef}
            value={q}
            onChangeText={(v) => { setQ(v); setIdx(0) }}
            onKeyPress={onKeyDown}
            placeholder="탭 이동 · 관심종목 검색 · 액션"
            placeholderTextColor={palette.inkMuted}
            style={[styles.input, { color: palette.ink }]}
            autoFocus
          />
          <Text style={[styles.esc, { color: palette.inkMuted, borderColor: palette.border }]}>ESC</Text>
        </View>
        <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
          {entries.length === 0 ? (
            <Text style={[styles.empty, { color: palette.inkMuted }]}>일치하는 결과 없음</Text>
          ) : entries.map((e, i) => (
            <Pressable
              key={e.id}
              onPress={() => runEntry(e)}
              onHoverIn={() => setIdx(i)}
              style={[styles.row, i === idx && { backgroundColor: palette.surfaceAlt }]}
            >
              <Text style={[styles.rowKind, { color: tagColor(e.kind, palette) }]}>
                {e.kind === 'tab' ? '탭' : e.kind === 'stock' ? '종목' : '액션'}
              </Text>
              <Text style={[styles.rowLabel, { color: palette.ink }]} numberOfLines={1}>{e.label}</Text>
              <Text style={[styles.rowHint, { color: palette.inkMuted }]} numberOfLines={1}>{e.hint}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <View style={[styles.footer, { borderColor: palette.border }]}>
          <Text style={[styles.footerText, { color: palette.inkMuted }]}>↑↓ 이동 · Enter 선택 · Esc 닫기</Text>
          <Text style={[styles.footerText, { color: palette.inkMuted }]}>⌘K 토글</Text>
        </View>
      </View>
    </View>
  )
}

function tagColor(kind: Entry['kind'], p: Palette) {
  if (kind === 'tab') return p.brand
  if (kind === 'stock') return p.up
  return p.inkSub
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    paddingTop: 96,
    zIndex: 9999,
  },
  backdropHit: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  panel: {
    width: 620, maxWidth: '92%', maxHeight: 520,
    borderRadius: 14, borderWidth: 1, overflow: 'hidden',
  },
  inputWrap: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, gap: 10 },
  prompt: { fontSize: 18, fontWeight: '600' },
  input: { flex: 1, fontSize: 15, outlineStyle: 'none' as any, paddingVertical: 4 },
  esc: { fontSize: 10, fontWeight: '600', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  list: { maxHeight: 400 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10 },
  rowKind: { fontSize: 10, fontWeight: '700', width: 32 },
  rowLabel: { flex: 1, fontSize: 14, fontWeight: '600' },
  rowHint: { fontSize: 12 },
  empty: { padding: 22, textAlign: 'center', fontSize: 13 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 8, borderTopWidth: 1 },
  footerText: { fontSize: 11 },
})
