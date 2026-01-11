import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Custom hook để xử lý tìm kiếm bằng giọng nói
 * Sử dụng Web Speech API (SpeechRecognition)
 * Hỗ trợ tiếng Việt
 */

// Type definition cho Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

// Kiểm tra browser có hỗ trợ Speech Recognition không
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

interface UseVoiceSearchOptions {
  lang?: string // Ngôn ngữ (mặc định: 'vi-VN')
  continuous?: boolean // Ghi âm liên tục hay không
  interimResults?: boolean // Hiển thị kết quả tạm thời
  maxAlternatives?: number // Số lượng kết quả thay thế
  onTranscript?: (text: string) => void // Callback khi có kết quả
  onError?: (error: string) => void // Callback khi có lỗi
}

interface UseVoiceSearchReturn {
  isListening: boolean // Đang ghi âm
  transcript: string // Văn bản nhận được
  interimTranscript: string // Văn bản tạm thời (đang nói)
  error: string | null // Lỗi nếu có
  isSupported: boolean // Trình duyệt có hỗ trợ không
  startListening: () => void // Bắt đầu ghi âm
  stopListening: () => void // Dừng ghi âm
  resetTranscript: () => void // Reset văn bản
}

export const useVoiceSearch = (options: UseVoiceSearchOptions = {}): UseVoiceSearchReturn => {
  const {
    lang = 'vi-VN',
    continuous = false,
    interimResults = true,
    maxAlternatives = 1,
    onTranscript,
    onError,
  } = options

  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<any>(null)
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Dùng ref để lưu callbacks, tránh re-render
  const onTranscriptRef = useRef(onTranscript)
  const onErrorRef = useRef(onError)
  
  // Update refs khi callbacks thay đổi
  useEffect(() => {
    onTranscriptRef.current = onTranscript
    onErrorRef.current = onError
  }, [onTranscript, onError])

  // Kiểm tra browser support
  const isSupported = typeof SpeechRecognition !== 'undefined'

  // Khởi tạo SpeechRecognition
  useEffect(() => {
    if (!isSupported) {
      const errorMsg = 'Trình duyệt không hỗ trợ tìm kiếm bằng giọng nói. Vui lòng sử dụng Chrome hoặc Edge.'
      setError(errorMsg)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = lang
    recognition.continuous = continuous
    recognition.interimResults = interimResults
    recognition.maxAlternatives = maxAlternatives
    
    // Flag để track xem đã nói lần đầu chưa
    let hasSpokenOnce = false
    
    // Helper function để reset timeout (inline)
    const resetSilenceTimeout = () => {
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current)
      }
      
      // Chỉ set timeout nếu đã nói lần đầu
      if (hasSpokenOnce) {
        silenceTimeoutRef.current = setTimeout(() => {
          if (recognitionRef.current) {
            recognitionRef.current.stop()
          }
        }, 1000)
      }
    }

    // Xử lý kết quả
    recognition.onresult = (event: any) => {
      // Đánh dấu đã nói lần đầu
      if (!hasSpokenOnce) {
        hasSpokenOnce = true
      }
      
      // Reset timeout mỗi khi có giọng nói
      resetSilenceTimeout()
      
      let finalTranscript = ''
      let interimText = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPart = event.results[i][0].transcript
        
        if (event.results[i].isFinal) {
          finalTranscript += transcriptPart
        } else {
          interimText += transcriptPart
        }
      }

      if (finalTranscript) {
        setTranscript(finalTranscript)
        setInterimTranscript('')
        if (onTranscriptRef.current) {
          onTranscriptRef.current(finalTranscript)
        }
      } else {
        setInterimTranscript(interimText)
      }
    }

    // Xử lý lỗi
    recognition.onerror = (event: any) => {
      // Clear timeout khi có lỗi
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current)
      }
      
      // Nếu lỗi "no-speech", không hiển thị lỗi
      if (event.error === 'no-speech') {
        return
      }
      
      let errorMessage = 'Đã xảy ra lỗi khi ghi âm'
      
      switch (event.error) {
        case 'audio-capture':
          errorMessage = 'Không tìm thấy microphone. Vui lòng kiểm tra thiết bị.'
          break
        case 'not-allowed':
          errorMessage = 'Quyền truy cập microphone bị từ chối. Vui lòng cho phép trong cài đặt trình duyệt.'
          break
        case 'network':
          errorMessage = 'Lỗi mạng. Vui lòng kiểm tra kết nối internet.'
          break
        case 'aborted':
          errorMessage = ''
          break
        default:
          errorMessage = `Lỗi: ${event.error}`
      }

      if (errorMessage) {
        setError(errorMessage)
        if (onErrorRef.current) {
          onErrorRef.current(errorMessage)
        }
      }
      setIsListening(false)
    }

    // Xử lý khi kết thúc
    recognition.onend = () => {
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current)
      }
      
      setIsListening(false)
      setInterimTranscript('')
    }

    // Xử lý khi bắt đầu
    recognition.onstart = () => {
      setIsListening(true)
      setError(null)
    }

    recognitionRef.current = recognition

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current)
      }
    }
  }, [isSupported, lang, continuous, interimResults, maxAlternatives])

  // Bắt đầu ghi âm
  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('Trình duyệt không hỗ trợ tìm kiếm bằng giọng nói.')
      return
    }

    if (recognitionRef.current && !isListening) {
      try {
        setError(null)
        setTranscript('')
        setInterimTranscript('')
        recognitionRef.current.start()
      } catch (err) {
        console.error('Error starting recognition:', err)
        setError('Không thể bắt đầu ghi âm. Vui lòng thử lại.')
      }
    }
  }, [isSupported, isListening])

  // Dừng ghi âm
  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
  }, [isListening])

  // Reset transcript
  const resetTranscript = useCallback(() => {
    setTranscript('')
    setInterimTranscript('')
    setError(null)
  }, [])

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  }
}
