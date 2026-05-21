import { Platform } from 'react-native'

export function generateId(): string {
  const randomUUID = globalThis.crypto?.randomUUID

  if (Platform.OS === 'web' && randomUUID) {
    return randomUUID.call(globalThis.crypto)
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
