import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

export interface DateComponents {
  year: number
  month: number
  day: number
}

export type NotifyTiming = 'sameDay' | 'oneDayBefore' | 'oneWeekBefore'

const DATE_PATTERN = /(\d{4})\/(\d{2})\/(\d{2})/
const JST_OFFSET_HOURS = 9
const DAY_MS = 24 * 60 * 60 * 1000

export function detectDate(content: string): DateComponents | null {
  const match = content.match(DATE_PATTERN)
  if (!match) return null

  const date = {
    year: Number.parseInt(match[1], 10),
    month: Number.parseInt(match[2], 10),
    day: Number.parseInt(match[3], 10),
  }

  return isValidDate(date) ? date : null
}

export function calcNotifyAt(
  date: DateComponents,
  timing: NotifyTiming,
): number {
  const base = Date.UTC(
    date.year,
    date.month - 1,
    date.day,
    8 - JST_OFFSET_HOURS,
    0,
    0,
    0,
  )

  if (timing === 'oneDayBefore') return base - DAY_MS
  if (timing === 'oneWeekBefore') return base - 7 * DAY_MS

  return base
}

export async function requestPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false

  const permission = await Notifications.requestPermissionsAsync()

  return permission.granted || permission.status === 'granted'
}

export async function scheduleNotification(
  memoId: string,
  content: string,
  notifyAt: number,
): Promise<string | null> {
  if (Platform.OS === 'web') return null

  await Notifications.cancelScheduledNotificationAsync(memoId)

  return Notifications.scheduleNotificationAsync({
    identifier: memoId,
    content: {
      body: createNotificationBody(content),
      data: { memoId },
      title: '閃筋リマインダー',
    },
    trigger: {
      date: new Date(notifyAt),
      type: Notifications.SchedulableTriggerInputTypes.DATE,
    },
  })
}

export async function cancelNotification(memoId: string): Promise<void> {
  if (Platform.OS === 'web') return

  await Notifications.cancelScheduledNotificationAsync(memoId)
}

function createNotificationBody(content: string): string {
  const firstLine = content.split('\n')[0]?.trim()

  return firstLine ? firstLine.slice(0, 80) : 'メモの予定時刻です'
}

function isValidDate(date: DateComponents): boolean {
  const parsedDate = new Date(
    Date.UTC(date.year, date.month - 1, date.day, 0, 0, 0, 0),
  )

  return (
    parsedDate.getUTCFullYear() === date.year &&
    parsedDate.getUTCMonth() === date.month - 1 &&
    parsedDate.getUTCDate() === date.day
  )
}
