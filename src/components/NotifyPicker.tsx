import type { NotifyTiming } from '@/services/notifications'
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

interface NotifyPickerProps {
  visible: boolean
  hasExisting: boolean
  onSelect: (timing: NotifyTiming | null) => void
  onDismiss: () => void
}

const OPTIONS: Array<{ label: string; value: NotifyTiming }> = [
  { label: '当日 朝8時', value: 'sameDay' },
  { label: '1日前 朝8時', value: 'oneDayBefore' },
  { label: '1週間前 朝8時', value: 'oneWeekBefore' },
]

export function NotifyPicker({
  visible,
  hasExisting,
  onSelect,
  onDismiss,
}: NotifyPickerProps) {
  return (
    <Modal animationType="slide" transparent visible={visible}>
      <Pressable style={styles.overlay} onPress={onDismiss}>
        <Pressable style={styles.sheet}>
          <Text style={styles.title}>通知タイミング</Text>
          {OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={styles.option}
              onPress={() => onSelect(option.value)}
            >
              <Text style={styles.optionLabel}>{option.label}</Text>
            </TouchableOpacity>
          ))}
          {hasExisting ? (
            <TouchableOpacity
              style={[styles.option, styles.cancelOption]}
              onPress={() => onSelect(null)}
            >
              <Text style={styles.cancelLabel}>通知をキャンセル</Text>
            </TouchableOpacity>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  cancelLabel: {
    color: '#FF3B30',
    fontSize: 17,
    textAlign: 'center',
  },
  cancelOption: {
    marginTop: 8,
  },
  option: {
    borderTopColor: '#eee',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  optionLabel: {
    fontSize: 17,
    textAlign: 'center',
  },
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    paddingBottom: 32,
    paddingTop: 16,
  },
  title: {
    color: '#888',
    fontSize: 15,
    marginBottom: 8,
    textAlign: 'center',
  },
})
