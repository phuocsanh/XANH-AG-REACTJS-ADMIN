import { Controller, Control, FieldValues, Path } from 'react-hook-form';
import { DatePicker, Form } from 'antd';
import dayjs from 'dayjs';

// Type cho dayjs object
type DayjsType = ReturnType<typeof dayjs>;

// Interface cho props của FormDatePicker
interface FormDatePickerProps<T extends FieldValues> {
  name: Path<T>; // Tên field trong form
  control: Control<T>; // Control object từ useForm
  label?: string; // Label hiển thị
  placeholder?: string; // Placeholder text
  required?: boolean; // Bắt buộc nhập
  disabled?: boolean; // Vô hiệu hóa input
  format?: string; // Định dạng ngày tháng
  showTime?: boolean; // Hiển thị thời gian
  picker?: 'date' | 'week' | 'month' | 'quarter' | 'year'; // Loại picker
  disabledDate?: (current: DayjsType) => boolean; // Hàm disable ngày
  className?: string; // CSS class
  size?: 'large' | 'middle' | 'small'; // Kích thước
  allowClear?: boolean; // Cho phép xóa
  rules?: {
    required?: boolean | string;
    validate?: (value: string | null) => boolean | string;
    [key: string]: unknown;
  }; // Validation rules
}

/**
 * Component FormDatePicker - DatePicker tích hợp với React Hook Form
 * Sử dụng Controller để kết nối DatePicker của Ant Design với React Hook Form
 * 
 * @param props - Props của component
 * @returns JSX Element
 */
function FormDatePicker<T extends FieldValues>({
  name,
  control,
  label,
  placeholder,
  required = false,
  disabled = false,
  format = 'DD/MM/YYYY',
  showTime = false,
  picker = 'date',
  disabledDate,
  className,
  size = 'middle',
  allowClear = true,
  rules = {},
}: FormDatePickerProps<T>) {
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
        render={({ field: { onChange, onBlur, value, name: fieldName }, fieldState: { error } }) => (
          <>
            <DatePicker
              {...(showTime && { showTime: true })}
              picker={picker}
              format={format}
              placeholder={placeholder}
              disabled={disabled}
              size={size}
              allowClear={allowClear}
              disabledDate={disabledDate}
              value={value ? dayjs(value) : null}
              onChange={(date) => {
                // Chuyển đổi dayjs object thành ISO string hoặc null
                onChange(date ? date.toISOString() : null);
              }}
              onBlur={onBlur}
              name={fieldName}
              status={error ? 'error' : undefined}
              style={{ width: '100%' }}
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

export default FormDatePicker;

// Export types để sử dụng ở nơi khác
export type { FormDatePickerProps };