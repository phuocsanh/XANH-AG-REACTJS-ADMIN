import React from 'react'
import { Button, Tooltip } from 'antd'
import { AudioOutlined, LoadingOutlined } from '@ant-design/icons'

/**
 * Component nút microphone để tìm kiếm bằng giọng nói
 * Hiển thị các trạng thái: idle, listening, processing
 */

interface VoiceSearchButtonProps {
  isListening: boolean // Đang ghi âm
  isSupported: boolean // Trình duyệt có hỗ trợ không
  error: string | null // Lỗi nếu có
  interimTranscript?: string // Văn bản tạm thời (đang nói)
  onStart: () => void // Callback khi bắt đầu ghi âm
  onStop: () => void // Callback khi dừng ghi âm
  disabled?: boolean // Disable button
}

const VoiceSearchButton: React.FC<VoiceSearchButtonProps> = ({
  isListening,
  isSupported,
  error,
  interimTranscript,
  onStart,
  onStop,
  disabled = false,
}) => {
  // Xác định tooltip text
  const getTooltipText = () => {
    if (!isSupported) {
      return 'Trình duyệt không hỗ trợ tìm kiếm bằng giọng nói. Vui lòng sử dụng Chrome hoặc Edge.'
    }
    if (error) {
      return error
    }
    if (isListening) {
      return interimTranscript 
        ? `Đang nghe: "${interimTranscript}"...` 
        : '🔴 ĐANG GHI ÂM... Click để dừng'
    }
    return 'Tìm kiếm bằng giọng nói - Click để bắt đầu'
  }

  // Xử lý click
  const handleClick = () => {
    if (!isSupported || disabled) return
    
    if (isListening) {
      onStop()
    } else {
      onStart()
    }
  }

  // Icon hiển thị
  const icon = isListening ? <AudioOutlined /> : <AudioOutlined />

  return (
    <Tooltip title={getTooltipText()} placement="topRight">
      <Button
        type={isListening ? "primary" : "text"}
        danger={isListening}
        icon={icon}
        onClick={handleClick}
        disabled={!isSupported || disabled}
        className={`
          transition-all duration-300
          ${isListening 
            ? 'animate-pulse shadow-lg' 
            : 'hover:text-emerald-600'
          }
          ${!isSupported || disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${error ? 'text-red-400' : ''}
        `}
        style={{
          fontSize: isListening ? '20px' : '18px',
          padding: '4px 8px',
          ...(isListening && {
            animation: 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          })
        }}
      />
    </Tooltip>
  )
}

export default VoiceSearchButton
