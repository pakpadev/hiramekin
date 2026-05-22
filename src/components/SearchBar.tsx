import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

interface SearchBarProps {
  value: string
  onChange: (text: string) => void
  isDark?: boolean
}

export function SearchBar({ value, onChange, isDark = false }: SearchBarProps) {
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? '#242424' : '#f0f0f0' },
      ]}
    >
      <TextInput
        style={[styles.input, { color: isDark ? '#f7f7f7' : '#111' }, webInputStyle]}
        value={value}
        onChangeText={onChange}
        placeholder="検索"
        placeholderTextColor={isDark ? '#777' : '#999'}
        returnKeyType="search"
      />
      {value.length > 0 ? (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="検索をクリア"
          testID="clear-button"
          onPress={() => onChange('')}
        >
          <Text style={[styles.clear, { color: isDark ? '#aaa' : '#888' }]}>
            ×
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
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
