import React from "react"
import { Form, Input, Select } from "antd"

interface FieldProps {
  label?: string
  type?: "text" | "email" | "password" | "select" | "textarea"
  placeholder?: string
  required?: boolean
  value?: string | number
  onChange?: (value: string | number) => void
  onBlur?: () => void
  options?: { label: string; value: string | number }[]
  disabled?: boolean
  className?: string
  rows?: number // Cho textarea
  prefix?: React.ReactNode
  suffix?: React.ReactNode
  size?: "large" | "middle" | "small"
  allowClear?: boolean
  status?: "error" | "warning"
  help?: string // Thông báo lỗi hoặc hướng dẫn
}

/**
 * Component Field - Phiên bản đơn giản của FormField không cần React Hook Form
 * Có thể sử dụng như các component Ant Design thông thường
 * Hỗ trợ nhiều loại input: text, email, password, select, textarea
 */
function Field({
  label,
  type = "text",
  placeholder,
  required = false,
  value,
  onChange,
  onBlur,
  options = [],
  disabled = false,
  className,
  rows = 4,
  prefix,
  suffix,
  size = "middle",
  allowClear = true,
  status,
  help,
}: FieldProps) {
  // Xử lý change cho Input và TextArea
  const handleInputChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onChange?.(e.target.value)
    },
    [onChange]
  )

  // Xử lý change cho Select
  const handleSelectChange = React.useCallback(
    (value: string | number) => {
      onChange?.(value)
    },
    [onChange]
  )

  // Render input component dựa trên type
  const renderInput = () => {
    const commonInputProps = {
      value,
      onChange: handleInputChange,
      onBlur,
      placeholder,
      disabled,
      size,
      status,
    }

    switch (type) {
      case "password":
        return (
          <Input.Password
            {...commonInputProps}
            prefix={prefix}
            suffix={suffix}
            allowClear={allowClear}
          />
        )

      case "select":
        return (
          <Select
            value={value}
            onChange={handleSelectChange}
            onBlur={onBlur}
            placeholder={placeholder}
            disabled={disabled}
            size={size}
            status={status}
            options={options}
            allowClear={allowClear}
          />
        )

      case "textarea":
        return <Input.TextArea {...commonInputProps} rows={rows} />

      default:
        return (
          <Input
            {...commonInputProps}
            type={type}
            prefix={prefix}
            suffix={suffix}
            allowClear={allowClear}
          />
        )
    }
  }

  // Nếu có label, wrap trong Form.Item
  if (label) {
    return (
      <Form.Item
        label={label}
        className={className}
        validateStatus={status}
        help={help}
        required={required}
      >
        {renderInput()}
      </Form.Item>
    )
  }

  // Nếu không có label, trả về input trực tiếp
  return renderInput()
}

export default Field
export type { FieldProps }
