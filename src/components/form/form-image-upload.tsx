import React from "react"
import { Controller, Control, FieldValues, Path } from "react-hook-form"
import { Form } from "antd"
import ImageUpload from "../image-upload/image-upload"
import { UPLOAD_TYPES, UploadType } from "@/services/upload.service"

// Interface cho props của FormImageUpload
interface FormImageUploadProps<T extends FieldValues> {
  name: Path<T> // Tên field trong form
  control: Control<T> // Control object từ useForm
  label?: string // Label hiển thị
  required?: boolean // Bắt buộc nhập
  disabled?: boolean // Vô hiệu hóa input
  maxCount?: number // Số lượng file tối đa
  multiple?: boolean // Cho phép chọn nhiều file
  className?: string // CSS class
  uploadType?: UploadType // Loại upload
  returnFullObjects?: boolean // Trả về object đầy đủ thay vì chỉ URL
  rules?: {
    required?: boolean | string
    validate?: (value: any[] | null) => boolean | string
    [key: string]: unknown
  } // Validation rules
}

/**
 * Component FormImageUpload - ImageUpload tích hợp với React Hook Form
 * Sử dụng Controller để kết nối ImageUpload với React Hook Form
 *
 * @param props - Props của component
 * @returns JSX Element
 */
function FormImageUpload<T extends FieldValues>({
  name,
  control,
  label,
  required = false,
  disabled: _disabled = false,
  maxCount = 5,
  multiple = true,
  className,
  uploadType = UPLOAD_TYPES.COMMON,
  returnFullObjects = false,
  rules = {},
}: FormImageUploadProps<T>) {
  // Tạo validation rules
  const validationRules = {
    ...rules,
    ...(required && {
      required:
        typeof required === "string"
          ? required
          : `${label || "Trường này"} là bắt buộc`,
    }),
  }

  return (
    <Form.Item
      label={label}
      required={required || !!rules.required}
      className={className}
      layout='vertical'
    >
      <Controller
        name={name}
        control={control}
        rules={validationRules}
        render={({ field: { onChange, value }, fieldState: { error } }) => {
          // Normalize value to string[] for ImageUpload component
          // Handle both string[] and UploadFile[] from form
          const normalizedValue = React.useMemo(() => {
            if (!value) return [];
            if (Array.isArray(value)) {
              return value.map((item: any) => {
                // If item is already a string, return it
                if (typeof item === 'string') return item;
                // If item is an UploadFile object/response object
                // If returnFullObjects is true, we want to keep the object
                // But ImageUpload expects 'value' to be used for initial display.
                // ImageUpload updated logic handles objects with 'url' property.
                if (typeof item === 'object') return item;
                return '';
              }).filter(Boolean);
            }
            return [];
          }, [value]);

          return (
            <>
              <ImageUpload
                value={normalizedValue}
                onChange={(urls) => {
                  // Gọi onChange của React Hook Form với mảng URLs
                  onChange(urls)
                }}
                maxCount={maxCount}
                multiple={multiple}
                uploadType={uploadType}
                returnFullObjects={returnFullObjects}
              />
              {error && (
                <div
                  style={{ color: "#ff4d4f", fontSize: "14px", marginTop: "4px" }}
                >
                  {error.message}
                </div>
              )}
            </>
          )
        }}
      />
    </Form.Item>
  )
}

export default FormImageUpload

// Export types để sử dụng ở nơi khác
export type { FormImageUploadProps }