import { useCallback } from 'react'
import { Alert, Platform } from 'react-native'
import {
  calcNotifyAt,
  cancelNotification,
  requestPermission,
  scheduleNotification,
  type DateComponents,
  type NotifyTiming,
} from '@/services/notifications'

export function useNotifications() {
  const schedule = useCallback(
    async (
      memoId: string,
      content: string,
      date: DateComponents,
      timing: NotifyTiming,
    ): Promise<number | null> => {
      if (Platform.OS === 'web') return null

      const granted = await requestPermission()

      if (!granted) {
        Alert.alert(
          '通知が許可されていません',
          '設定アプリから通知を許可してください',
        )
        return null
      }

      const notifyAt = calcNotifyAt(date, timing)
      await scheduleNotification(memoId, content, notifyAt)

      return notifyAt
    },
    [],
  )

  const cancel = useCallback(async (memoId: string): Promise<void> => {
    await cancelNotification(memoId)
  }, [])

  return { schedule, cancel }
}
