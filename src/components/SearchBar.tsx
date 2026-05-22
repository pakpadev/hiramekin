import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { getTheme } from '@/theme'

interface SearchBarProps {
  value: string
  onChange: (text: string) => void
  isDark?: boolean
}

export function SearchBar({ value, onChange, isDark = false }: SearchBarProps) {
  const theme = getTheme(isDark)

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <TextInput
        style={[styles.input, { color: theme.textPrimary }, webInputStyle]}
        value={value}
        onChangeText={onChange}
        placeholder="検索"
        placeholderTextColor={theme.textMuted}
        returnKeyType="search"
      />
      {value.length > 0 ? (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="検索をクリア"
          testID="clear-button"
          onPress={() => onChange('')}
        >
          <Text style={[styles.clear, { color: theme.textMuted }]}>×</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    marginHorizontal: 12,
    marginVertical: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  clear: {
    color: '#888',
    fontSize: 16,
    paddingHorizontal: 4,
  },
  input: {
    flex: 1,
    fontSize: 15,
  },
})

const webInputStyle = Platform.select({
  web: {
    outlineColor: 'transparent',
    outlineStyle: 'solid' as const,
    outlineWidth: 0,
  },
})
