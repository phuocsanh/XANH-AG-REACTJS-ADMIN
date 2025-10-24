import React from "react"
import { Form, Input, Select, InputNumber } from "antd"
import {
  Controller,
  Control,
  FieldPath,
  FieldValues,
  ControllerRenderProps,
  FieldError,
} from "react-hook-form"

interface FormFieldProps<T extends FieldValues> {
  name: FieldPath<T>
  control: Control<T>
  label: string
  type?: "text" | "email" | "password" | "number" | "select" | "textarea"
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
  options?: { label: string; value: string | number }[]
  disabled?: boolean
  className?: string
  rows?: number // Cho textarea
  prefix?: React.ReactNode
  suffix?: React.ReactNode
  size?: "large" | "middle" | "small"
  allowClear?: boolean
}

/**
 * Component FormField tái sử dụng cho các form sử dụng React Hook Form
 * Hỗ trợ nhiều loại input khác nhau: text, email, password, number, select, textarea
 * Tích hợp sẵn validation rules và styling nhất quán với React Hook Form Controller
 */
function FormField<T extends FieldValues>({
  name,
  control,
  label,
  type = "text",
  placeholder,
  required = false,
  rules = {},
  options = [],
  disabled = false,
  className,
  rows = 4,
  prefix,
  suffix,
  size = "middle",
  allowClear = true,
}: FormFieldProps<T>) {
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

  // Thêm validation cho email
  if (type === "email") {
    validationRules.pattern = {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: "Email không hợp lệ",
    }
  }

  // Render input component dựa trên type
  const renderInput = (
    field: ControllerRenderProps<T, FieldPath<T>>,
    error: FieldError | undefined
  ) => {
    const commonProps = {
      ...field,
      placeholder,
      disabled,
      size,
      status: error ? ("error" as const) : undefined,
    }

    switch (type) {
      case "password":
        return (
          <Input.Password
            {...commonProps}
            prefix={prefix}
            suffix={suffix}
            allowClear={allowClear}
          />
        )

      case "number":
        return (
          <InputNumber
            {...commonProps}
            min={rules.min}
            max={rules.max}
            style={{ width: "100%" }}
          />
        )

      case "select":
        return (
          <Select {...commonProps} options={options} allowClear={allowClear} />
        )

      case "textarea":
        return <Input.TextArea {...commonProps} rows={rows} />

      default:
        return (
          <Input
            {...commonProps}
            type={type}
            prefix={prefix}
            suffix={suffix}
            allowClear={allowClear}
          />
        )
    }
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
          {renderInput(field, error)}
        </Form.Item>
      )}
    />
  )
}

export default FormField
export type { FormFieldProps }
