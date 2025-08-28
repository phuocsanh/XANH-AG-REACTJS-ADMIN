import { DatePicker, Form } from 'antd';
import dayjs from 'dayjs';

// Type cho dayjs object
type DayjsType = ReturnType<typeof dayjs>;

// Interface cho props của CustomDatePicker
interface CustomDatePickerProps {
  label?: string; // Label hiển thị
  placeholder?: string; // Placeholder text
  value?: string | null; // Giá trị hiện tại (ISO string)
  onChange?: (value: string | null) => void; // Callback khi thay đổi giá trị
  onBlur?: () => void; // Callback khi blur
  required?: boolean; // Bắt buộc nhập
  disabled?: boolean; // Vô hiệu hóa input
  format?: string; // Định dạng ngày tháng
  showTime?: boolean; // Hiển thị thời gian
  picker?: 'date' | 'week' | 'month' | 'quarter' | 'year'; // Loại picker
  disabledDate?: (current: DayjsType) => boolean; // Hàm disable ngày
  className?: string; // CSS class
  size?: 'large' | 'middle' | 'small'; // Kích thước
  allowClear?: boolean; // Cho phép xóa
  error?: string; // Thông báo lỗi
  status?: 'error' | 'warning'; // Trạng thái
}

/**
 * Component CustomDatePicker - DatePicker thông thường không sử dụng React Hook Form
 * Wrapper cho DatePicker của Ant Design với các tính năng bổ sung
 * 
 * @param props - Props của component
 * @returns JSX Element
 */
function CustomDatePicker({
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  required = false,
  disabled = false,
  format = 'DD/MM/YYYY',
  showTime = false,
  picker = 'date',
  disabledDate,
  className,
  size = 'middle',
  allowClear = true,
  error,
  status,
}: CustomDatePickerProps) {
  // Xử lý sự kiện thay đổi giá trị
  const handleChange = (date: DayjsType | null) => {
    if (onChange) {
      // Chuyển đổi dayjs object thành ISO string hoặc null
      onChange(date ? date.toISOString() : null);
    }
  };

  // Chuyển đổi string value thành dayjs object
  const dayjsValue = value ? dayjs(value) : null;

  return (
    <Form.Item
      label={label}
      required={required}
      className={className}
      validateStatus={error ? 'error' : status}
      help={error}
    >
      <DatePicker
        {...(showTime && { showTime: true })}
        picker={picker}
        format={format}
        placeholder={placeholder}
        disabled={disabled}
        size={size}
        allowClear={allowClear}
        disabledDate={disabledDate}
        value={dayjsValue}
        onChange={handleChange}
        onBlur={onBlur}
        status={error ? 'error' : status}
        style={{ width: '100%' }}
      />
    </Form.Item>
  );
}

export default CustomDatePicker;

// Export types để sử dụng ở nơi khác
export type { CustomDatePickerProps };