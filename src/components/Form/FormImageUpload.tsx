import { Controller, Control, FieldValues, Path } from 'react-hook-form';
import { Form } from 'antd';
import ImageUpload from '../ImageUpload/ImageUpload';

// Interface cho props của FormImageUpload
interface FormImageUploadProps<T extends FieldValues> {
  name: Path<T>; // Tên field trong form
  control: Control<T>; // Control object từ useForm
  label?: string; // Label hiển thị
  required?: boolean; // Bắt buộc nhập
  disabled?: boolean; // Vô hiệu hóa input
  maxCount?: number; // Số lượng file tối đa
  multiple?: boolean; // Cho phép chọn nhiều file
  folder?: string; // Thư mục lưu trữ
  className?: string; // CSS class
  rules?: {
    required?: boolean | string;
    validate?: (value: string[] | null) => boolean | string;
    [key: string]: unknown;
  }; // Validation rules
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
  folder = 'temporary',
  className,
  rules = {},
}: FormImageUploadProps<T>) {
  // Tạo validation rules
  const validationRules = {
    ...rules,
    ...(required && {
      required: typeof required === 'string' ? required : `${label || 'Trường này'} là bắt buộc`,
    }),
  };

  return (
    <Form.Item
      label={label}
      required={required}
      className={className}
    >
      <Controller
        name={name}
        control={control}
        rules={validationRules}
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <>
            <ImageUpload
              value={value || []}
              onChange={(urls) => {
                // Gọi onChange của React Hook Form với mảng URLs
                onChange(urls);
              }}
              maxCount={maxCount}
              multiple={multiple}
              folder={folder}
            />
            {error && (
              <div style={{ color: '#ff4d4f', fontSize: '14px', marginTop: '4px' }}>
                {error.message}
              </div>
            )}
          </>
        )}
      />
    </Form.Item>
  );
}

export default FormImageUpload;

// Export types để sử dụng ở nơi khác
export type { FormImageUploadProps };