import { Form, Input } from "antd"
import { Controller, Control, FieldPath, FieldValues } from "react-hook-form"
// Import thư viện react-number-format
import { NumericFormat } from "react-number-format"

interface FormFieldNumberProps<T extends FieldValues> {
  name: FieldPath<T>
  control: Control<T>
  label?: React.ReactNode
  placeholder?: string
  required?: boolean
  rules?: {
    required?: boolean | string
    min?: number
    max?: number
    minLength?: number
    maxLength?: number
    pattern?: RegExp
    validate?: (value: unknown) => boolean | string
  }
  disabled?: boolean
  className?: string
  prefix?: string
  suffix?: string
  addonAfter?: React.ReactNode
  addonBefore?: React.ReactNode
  size?: "large" | "middle" | "small"
  // Các thuộc tính đặc biệt cho number field
  min?: number
  max?: number
  // Thuộc tính cho số thập phân
  decimalScale?: number
  fixedDecimalScale?: boolean
  allowClear?: boolean
  outputType?: 'number' | 'string'
}

/**
 * Component FormFieldNumber chuyên xử lý các trường nhập số
 * Sử dụng NumericFormat để định dạng số với dấu phân cách hàng nghìn
 * Hỗ trợ nhập số không giới hạn độ dài
 */
function FormFieldNumber<T extends FieldValues>({
  name,
  control,
  label,
  placeholder,
  required = false,
  rules = {},
  disabled = false,
  className,
  prefix,
  suffix,
  addonAfter,
  addonBefore,
  size = "middle",
  min,
  max,
  decimalScale = 0, // Mặc định là 0 (số nguyên)
  fixedDecimalScale = false,
  allowClear = true,
  outputType = 'number', // Mặc định trả về number
}: FormFieldNumberProps<T>) {
  // Tạo validation rules cho React Hook Form
  const validationRules = {
    ...(required && {
      required:
        typeof required === "string"
          ? required
          : `Vui lòng nhập ${typeof label === 'string' ? label.toLowerCase() : "giá trị"}`,
    }),
    ...(rules.min && {
      min: { value: rules.min, message: `Giá trị tối thiểu là ${rules.min}` },
    }),
    ...(rules.max && {
      max: { value: rules.max, message: `Giá trị tối đa là ${rules.max}` },
    }),
    ...(rules.minLength && {
      minLength: {
        value: rules.minLength,
        message: `Độ dài tối thiểu là ${rules.minLength} ký tự`,
      },
    }),
    ...(rules.maxLength && {
      maxLength: {
        value: rules.maxLength,
        message: `Độ dài tối đa là ${rules.maxLength} ký tự`,
      },
    }),
    ...(rules.pattern && {
      pattern: { value: rules.pattern, message: "Định dạng không hợp lệ" },
    }),
    ...(rules.validate && { validate: rules.validate }),
  }

  return (
    <Form.Item
      label={label}
      className={className}
      required={required}
      layout='vertical'
    >
      <Controller
        name={name}
        control={control}
        rules={validationRules}
        render={({ field, fieldState: { error } }) => (
          <>
            <NumericFormat
              placeholder={placeholder}
              disabled={disabled}
              size={size}
              status={error ? ("error" as const) : undefined}
              thousandSeparator='.'
              decimalSeparator=','
              decimalScale={decimalScale}
              fixedDecimalScale={fixedDecimalScale}
              allowNegative={false}
              customInput={Input}
              allowClear={allowClear}
              style={{ width: "100%" }}
              value={
                field.value !== undefined && field.value !== null
                  ? field.value
                  : ""
              }
              onValueChange={(values) => {
                // Trả về giá trị theo outputType
                if (outputType === 'string') {
                   // Trả về chuỗi raw (không format) nếu có giá trị, ngược lại trả về rỗng hoặc undefined
                   field.onChange(values.value || "")
                } else {
                   // Mặc định trả về number (floatValue)
                   field.onChange(values.floatValue)
                }
              }}
              // Cho phép nhập bất kỳ giá trị nào không giới hạn độ dài
              isAllowed={(values) => {
                // Cho phép giá trị rỗng
                if (!values.value) return true
  
                // Kiểm tra giá trị min/max nếu được cung cấp
                const numericValue = parseFloat(values.value)
                if (min !== undefined && numericValue < min) return false
                if (max !== undefined && numericValue > max) return false
  
                return true
              }}
              prefix={prefix}
              suffix={suffix}
              addonAfter={addonAfter}
              addonBefore={addonBefore}
            />
            {error && (
              <div
                style={{ color: "#ff4d4f", fontSize: "14px", marginTop: "4px" }}
              >
                {error.message}
              </div>
            )}
          </>
        )}
      />
    </Form.Item>
  )
}

export default FormFieldNumber
export type { FormFieldNumberProps }
