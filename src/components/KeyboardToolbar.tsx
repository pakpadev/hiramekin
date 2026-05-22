import { useState } from 'react'
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
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
  const buttonStyle = [
    styles.button,
    { backgroundColor: isDark ? '#303030' : '#e0e0e0' },
  ]
  const labelStyle = [styles.label, { color: isDark ? '#f2f2f2' : '#111' }]
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
          backgroundColor: isDark ? '#181818' : '#f5f5f5',
          borderTopColor: isDark ? '#303030' : '#ccc',
        },
      ]}
    >
      {showTimeMenu ? (
        <View
          style={[
            styles.timeMenu,
            {
              backgroundColor: isDark ? '#242424' : '#fff',
              borderColor: isDark ? '#3a3a3a' : '#d0d0d0',
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
          style={buttonStyle}
          onPress={insertDateTime}
          onLongPress={() => setShowTimeMenu((value) => !value)}
        >
          <Text style={labelStyle}>タイム ▾</Text>
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
