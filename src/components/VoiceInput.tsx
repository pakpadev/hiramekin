import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

interface VoiceInputProps {
  visible: boolean
  onCancel: () => void
}

export function VoiceInput({ visible, onCancel }: VoiceInputProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.panel}>
          <Text style={styles.title}>聞いています...</Text>
          <TouchableOpacity
            accessibilityRole="button"
            style={styles.cancelButton}
            onPress={onCancel}
          >
            <Text style={styles.cancelLabel}>キャンセル</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  cancelButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  cancelLabel: {
    fontSize: 15,
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 80,
  },
  panel: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 32,
    width: 280,
  },
  title: {
    fontSize: 18,
    marginBottom: 24,
  },
})
