import { useEffect, useRef, type ReactNode } from 'react'
import { Animated, Easing, StyleSheet, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { getTheme } from '@/theme'

interface ShimmerBorderProps {
  children: ReactNode
  isDark?: boolean
  index?: number
  borderRadius?: number
  backgroundColor?: string
}

const SHIMMER_WIDTH = 600
const DURATION = 2400
const DELAY_STEP = 600

export function ShimmerBorder({
  children,
  isDark = false,
  index = 0,
  borderRadius = 10,
  backgroundColor,
}: ShimmerBorderProps) {
  const theme = getTheme(isDark)
  const surfaceColor = backgroundColor ?? theme.surface
  const translateX = useRef(new Animated.Value(-SHIMMER_WIDTH)).current

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay((index % 4) * DELAY_STEP),
        Animated.timing(translateX, {
          toValue: SHIMMER_WIDTH,
          duration: DURATION,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: -SHIMMER_WIDTH,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    )

    animation.start()
    return () => animation.stop()
  }, [index, translateX])

  return (
    <View
      style={[
        styles.outer,
        {
          borderRadius,
          backgroundColor: surfaceColor,
          padding: 1.5,
        },
      ]}
    >
      <Animated.View
        style={[StyleSheet.absoluteFillObject, { transform: [{ translateX }] }]}
      >
        <LinearGradient
          colors={theme.shimmerColors}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ width: SHIMMER_WIDTH * 2, height: '100%' }}
        />
      </Animated.View>
      <View
        style={{
          borderRadius: borderRadius - 1.5,
          backgroundColor: surfaceColor,
          overflow: 'hidden',
        }}
      >
        {children}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  outer: {
    overflow: 'hidden',
  },
})
