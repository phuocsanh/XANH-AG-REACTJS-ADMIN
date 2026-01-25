import { Controller, Control, FieldValues, Path } from 'react-hook-form';
import { Form } from 'antd';
import { RangePicker } from '@/components/common';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';

// Interface cho props của FormRangePicker
interface FormRangePickerProps<T extends FieldValues> {
  name: Path<T>; // Tên field trong form
  control: Control<T>; // Control object từ useForm
  label?: string; // Label hiển thị
  placeholder?: [string, string]; // Placeholder text cho start và end
  required?: boolean; // Bắt buộc nhập
  disabled?: boolean; // Vô hiệu hóa input
  format?: string; // Định dạng ngày tháng
  className?: string; // CSS class
  size?: 'large' | 'middle' | 'small'; // Kích thước
  allowClear?: boolean; // Cho phép xóa
  rules?: {
    required?: boolean | string;
    [key: string]: any;
  }; // Validation rules
}

/**
 * Component FormRangePicker - RangePicker tích hợp với React Hook Form
 */
function FormRangePicker<T extends FieldValues>({
  name,
  control,
  label,
  placeholder,
  required = false,
  disabled = false,
  format = 'DD/MM/YYYY',
  className,
  size = 'middle',
  allowClear = true,
  rules = {},
}: FormRangePickerProps<T>) {
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
      required={required || !!rules.required}
      className={className}
      layout="vertical"
    >
      <Controller
        name={name}
        control={control}
        rules={validationRules}
        render={({ field: { onChange, onBlur, value, name: fieldName }, fieldState: { error } }) => (
          <>
            <RangePicker
              format={format}
              placeholder={placeholder}
              disabled={disabled}
              size={size}
              allowClear={allowClear}
              value={
                Array.isArray(value) && value.length === 2 
                  ? [value[0] ? dayjs(value[0]) : null, value[1] ? dayjs(value[1]) : null] as [Dayjs | null, Dayjs | null]
                  : null
              }
              onChange={(dates: any) => {
                // Chuyển đổi thành mảng ISO strings hoặc null
                if (dates && dates.length === 2) {
                  onChange([
                    dates[0] ? dates[0].toISOString() : null,
                    dates[1] ? dates[1].toISOString() : null
                  ]);
                } else {
                  onChange(null);
                }
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

export default FormRangePicker;
export type { FormRangePickerProps };
