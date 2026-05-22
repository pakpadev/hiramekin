import { useState } from 'react'
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { getTheme } from '@/theme'
import { formatDateTime, formatTime, formatToday } from '@/utils/dateTime'

interface KeyboardToolbarProps {
  onInsert: (text: string) => void
  onMic: () => void
  isDark?: boolean
}

export function KeyboardToolbar({
  onInsert,
  onMic,
  isDark = false,
}: KeyboardToolbarProps) {
  const [showTimeMenu, setShowTimeMenu] = useState(false)
  const theme = getTheme(isDark)
  const buttonStyle = [
    styles.button,
    { backgroundColor: theme.border, borderColor: 'transparent' },
  ]
  const activeButtonStyle = [
    styles.button,
    {
      backgroundColor: isDark
        ? 'rgba(0,229,255,0.12)'
        : 'rgba(0,172,193,0.12)',
      borderColor: isDark ? 'rgba(0,229,255,0.3)' : 'rgba(0,172,193,0.3)',
    },
  ]
  const labelStyle = [styles.label, { color: theme.textBody }]
  const activeLabelStyle = [styles.label, { color: theme.accent }]
  const insertDateTime = () => {
    setShowTimeMenu(false)
    onInsert(formatDateTime())
  }
  const insertDate = () => {
    setShowTimeMenu(false)
    onInsert(formatToday())
  }
  const insertTime = () => {
    setShowTimeMenu(false)
    onInsert(formatTime())
  }
  const insertCalculationSample = () => {
    setShowTimeMenu(false)
    onInsert('合計: 100 + 200')
  }
  const insertMeetingTemplate = () => {
    setShowTimeMenu(false)
    onInsert(
      [
        '## 議事録',
        `日時: ${formatDateTime()}`,
        '参加者: ',
        '',
        '### 議題',
        '- ',
        '',
        '### 決定事項',
        '- ',
        '',
        '### アクションアイテム',
        '- [ ] 担当:  期日: ',
      ].join('\n'),
    )
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.background,
          borderTopColor: theme.border,
        },
      ]}
    >
      {showTimeMenu ? (
        <View
          style={[
            styles.timeMenu,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <TouchableOpacity
            accessibilityRole="button"
            style={styles.menuButton}
            onPress={insertDate}
          >
            <Text style={labelStyle}>日付のみ</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            style={styles.menuButton}
            onPress={insertTime}
          >
            <Text style={labelStyle}>時刻のみ</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        <TouchableOpacity
          accessibilityRole="button"
          style={showTimeMenu ? activeButtonStyle : buttonStyle}
          onPress={insertDateTime}
          onLongPress={() => setShowTimeMenu((value) => !value)}
        >
          <Text style={showTimeMenu ? activeLabelStyle : labelStyle}>
            タイム ▾
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          style={buttonStyle}
          onPress={insertCalculationSample}
        >
          <Text style={labelStyle}>= 計算</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          style={buttonStyle}
          onPress={insertMeetingTemplate}
        >
          <Text style={labelStyle}>議事録</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          testID="mic-button"
          style={buttonStyle}
          onPress={() => {
            setShowTimeMenu(false)
            onMic()
          }}
        >
          <Text style={labelStyle}>マイク</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  button: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  label: {
    fontSize: 14,
  },
  menuButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  scrollContent: {
    flexDirection: 'row',
    gap: 4,
    paddingRight: 8,
  },
  timeMenu: {
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    bottom: 44,
    flexDirection: 'row',
    left: 8,
    position: 'absolute',
    zIndex: 20,
  },
})
