import { useCallback, useEffect, useRef, useState } from 'react'
import { Platform } from 'react-native'
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition'

type OnResult = (text: string) => void

type WebSpeechRecognition = {
  continuous: boolean
  interimResults: boolean
  lang: string
  onend: (() => void) | null
  onerror: (() => void) | null
  onresult:
    | ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void)
    | null
  start: () => void
  stop: () => void
}

type WebSpeechRecognitionConstructor = new () => WebSpeechRecognition

type SpeechRecognitionWindow = Window &
  typeof globalThis & {
    SpeechRecognition?: WebSpeechRecognitionConstructor
    webkitSpeechRecognition?: WebSpeechRecognitionConstructor
  }

export function useVoice(onResult: OnResult) {
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<WebSpeechRecognition | null>(null)

  useEffect(() => {
    if (Platform.OS === 'web') return undefined

    const startListener = ExpoSpeechRecognitionModule.addListener('start', () => {
      setIsListening(true)
    })
    const endListener = ExpoSpeechRecognitionModule.addListener('end', () => {
      setIsListening(false)
    })
    const errorListener = ExpoSpeechRecognitionModule.addListener('error', () => {
      setIsListening(false)
    })
    const resultListener = ExpoSpeechRecognitionModule.addListener(
      'result',
      (event) => {
        const transcript = event.results[0]?.transcript

        if (transcript) onResult(transcript)
        if (event.isFinal) setIsListening(false)
      },
    )

    return () => {
      startListener.remove()
      endListener.remove()
      errorListener.remove()
      resultListener.remove()
    }
  }, [onResult])

  const startListening = useCallback(async (): Promise<void> => {
    if (Platform.OS === 'web') {
      const SpeechRecognition =
        (window as SpeechRecognitionWindow).SpeechRecognition ??
        (window as SpeechRecognitionWindow).webkitSpeechRecognition

      if (!SpeechRecognition) return

      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'ja-JP'
      recognition.onresult = (event) => {
        const transcript = event.results[0]?.[0]?.transcript

        if (transcript) onResult(transcript)
      }
      recognition.onerror = () => setIsListening(false)
      recognition.onend = () => setIsListening(false)
      recognitionRef.current = recognition

      setIsListening(true)
      recognition.start()
      return
    }

    const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync()

    if (!permission.granted) {
      setIsListening(false)
      return
    }

    setIsListening(true)
    ExpoSpeechRecognitionModule.start({
      continuous: false,
      interimResults: false,
      lang: 'ja-JP',
    })
  }, [onResult])

  const stopListening = useCallback((): void => {
    if (Platform.OS === 'web') {
      recognitionRef.current?.stop()
      recognitionRef.current = null
      setIsListening(false)
      return
    }

    ExpoSpeechRecognitionModule.stop()
    setIsListening(false)
  }, [])

  return { isListening, startListening, stopListening }
}
