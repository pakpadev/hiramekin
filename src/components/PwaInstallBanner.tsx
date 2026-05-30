import { useEffect, useRef, useState } from 'react'
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { getTheme } from '@/theme'
import { isTauri } from '@/utils/tauri'

interface PwaInstallBannerProps {
  isDark?: boolean
}

export function PwaInstallBanner({ isDark = false }: PwaInstallBannerProps) {
  const theme = getTheme(isDark)
  const [visible, setVisible] = useState(false)
  const promptRef = useRef<any>(null)

  useEffect(() => {
    if (Platform.OS !== 'web' || isTauri()) return

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { updateViaCache: 'none' })
        .then((registration) => registration.update())
        .catch(() => {})
    }

    const handler = (e: Event) => {
      e.preventDefault()
      promptRef.current = e
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!visible) return null

  async function handleInstall() {
    if (!promptRef.current) return
    promptRef.current.prompt()
    const { outcome } = await promptRef.current.userChoice
    if (outcome === 'accepted') setVisible(false)
    promptRef.current = null
  }

  return (
    <View style={[styles.banner, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Text style={[styles.label, { color: theme.textBody }]}>
        ホーム画面に追加できます
      </Text>
      <TouchableOpacity
        onPress={handleInstall}
        style={[styles.btn, { backgroundColor: theme.accent }]}
        accessibilityRole="button"
        accessibilityLabel="アプリをインストール"
      >
        <Text style={styles.btnText}>インストール</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => setVisible(false)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityLabel="閉じる"
      >
        <Text style={[styles.dismiss, { color: theme.textMuted }]}>✕</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  btn: {
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  btnText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '700',
  },
  dismiss: {
    fontSize: 16,
  },
  label: {
    flex: 1,
    fontSize: 13,
  },
})
