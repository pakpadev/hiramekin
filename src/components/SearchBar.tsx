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
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <View style={styles.container}>
      <TextInput
        style={[styles.input, webInputStyle]}
        value={value}
        onChangeText={onChange}
        placeholder="検索"
        placeholderTextColor="#999"
        returnKeyType="search"
      />
      {value.length > 0 ? (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="検索をクリア"
          testID="clear-button"
          onPress={() => onChange('')}
        >
          <Text style={styles.clear}>×</Text>
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
