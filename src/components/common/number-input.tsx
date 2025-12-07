import React from "react"
import { Input } from "antd"
import { NumericFormat } from "react-number-format"

// Props đơn giản cho NumberInput
interface NumberInputProps {
  value?: number | null
  onChange?: (value: number | null) => void
  placeholder?: string
  disabled?: boolean
  min?: number
  max?: number
  size?: "large" | "middle" | "small"
  style?: React.CSSProperties
  className?: string
  status?: "error" | "warning"
  addonAfter?: React.ReactNode
  addonBefore?: React.ReactNode
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  (props, ref) => {
    const { value, onChange, min, max, ...rest } = props

    return (
      <NumericFormat
        value={value}
        onValueChange={(values) => {
          onChange?.(values.floatValue ?? null)
        }}
        customInput={Input}
        thousandSeparator='.'
        decimalSeparator=','
        disabled={props.disabled}
        size={props.size}
        placeholder={props.placeholder}
        getInputRef={ref}
        isAllowed={(values) => {
          if (!values.value) return true
          const numericValue = parseFloat(values.value)
          if (min !== undefined && numericValue < min) return false
          if (max !== undefined && numericValue > max) return false
          return true
        }}
        {...rest}
      />
    )
  }
)

NumberInput.displayName = "NumberInput"

export default NumberInput
export type { NumberInputProps }
