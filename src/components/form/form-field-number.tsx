import { Form, Input } from "antd"
import { Controller, Control, FieldPath, FieldValues } from "react-hook-form"
// Import thư viện react-number-format
import { NumericFormat } from "react-number-format"

interface FormFieldNumberProps<T extends FieldValues> {
  name: FieldPath<T>
  control: Control<T>
  label: string
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
  size?: "large" | "middle" | "small"
  // Các thuộc tính đặc biệt cho number field
  min?: number
  max?: number
  // Thuộc tính cho số thập phân
  decimalScale?: number
  fixedDecimalScale?: boolean
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
  size = "middle",
  min,
  max,
  decimalScale = 0, // Mặc định là 0 (số nguyên)
  fixedDecimalScale = false,
}: FormFieldNumberProps<T>) {
  // Tạo validation rules cho React Hook Form
  const validationRules = {
    ...(required && {
      required:
        typeof required === "string"
          ? required
          : `Vui lòng nhập ${label.toLowerCase()}`,
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
    <Controller
      name={name}
      control={control}
      rules={validationRules}
      render={({ field, fieldState: { error } }) => (
        <Form.Item
          label={label}
          className={className}
          validateStatus={error ? "error" : ""}
          help={error?.message}
          required={required}
          layout='vertical'
        >
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
            value={
              field.value !== undefined && field.value !== null
                ? field.value
                : ""
            }
            onValueChange={(values) => {
              // Tự động chuyển đổi kiểu dữ liệu dựa trên tên trường và schema
              // Nếu trường được định nghĩa trong schema là number thì trả về number
              // Nếu không thì trả về string

              // Danh sách các trường cần trả về kiểu number (dựa trên schema)
              const numberFields = ["quantity", "symbolId"]

              // Kiểm tra xem trường hiện tại có trong danh sách numberFields không
              // Hoặc nếu tên trường chứa các từ khóa thường dùng cho số (attributes.*)
              const isNumberField =
                numberFields.includes(name) || name.startsWith("attributes.")

              // Chuyển đổi giá trị dựa trên loại trường
              const value = isNumberField ? Number(values.value) : values.value
              field.onChange(value)
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
          />
        </Form.Item>
      )}
    />
  )
}

export default FormFieldNumber
export type { FormFieldNumberProps }
