import * as Haptics from 'expo-haptics'
import { Platform } from 'react-native'

type HapticAction = 'save' | 'archive' | 'pin'

export function useHaptics() {
  const trigger = async (action: HapticAction): Promise<void> => {
    if (Platform.OS === 'web') return

    try {
      if (action === 'save') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      } else if (action === 'archive') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      } else {
        await Haptics.selectionAsync()
      }
    } catch {
      // Ignore devices or environments where haptics are unavailable.
    }
  }

  return { trigger }
}
