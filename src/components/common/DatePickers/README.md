# DatePicker Components

Các component DatePicker được tạo dựa trên Ant Design DatePicker với tích hợp React Hook Form và các tính năng bổ sung.

## Components

### 1. FormDatePicker

Component DatePicker tích hợp với React Hook Form sử dụng Controller.

#### Cách sử dụng:

```tsx
import { useForm } from 'react-hook-form';
import { FormDatePicker } from '@/components/common/DatePickers';

interface FormData {
  birthDate: string;
  startDate: string;
}

function MyForm() {
  const { control, handleSubmit } = useForm<FormData>();

  const onSubmit = (data: FormData) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* DatePicker cơ bản */}
      <FormDatePicker
        name="birthDate"
        control={control}
        label="Ngày sinh"
        placeholder="Chọn ngày sinh"
        required
      />

      {/* DatePicker với thời gian */}
      <FormDatePicker
        name="startDate"
        control={control}
        label="Ngày bắt đầu"
        placeholder="Chọn ngày và giờ"
        showTime
        format="DD/MM/YYYY HH:mm:ss"
        rules={{
          required: "Vui lòng chọn ngày bắt đầu",
          validate: (value) => {
            if (new Date(value) < new Date()) {
              return "Ngày bắt đầu phải sau ngày hiện tại";
            }
            return true;
          }
        }}
      />

      <button type="submit">Gửi</button>
    </form>
  );
}
```

#### Props:

| Prop | Type | Mặc định | Mô tả |
|------|------|----------|-------|
| `name` | `Path<T>` | - | Tên field trong form (bắt buộc) |
| `control` | `Control<T>` | - | Control object từ useForm (bắt buộc) |
| `label` | `string` | - | Label hiển thị |
| `placeholder` | `string` | - | Placeholder text |
| `required` | `boolean` | `false` | Bắt buộc nhập |
| `disabled` | `boolean` | `false` | Vô hiệu hóa input |
| `format` | `string` | `'DD/MM/YYYY'` | Định dạng ngày tháng |
| `showTime` | `boolean` | `false` | Hiển thị thời gian |
| `picker` | `'date' \| 'week' \| 'month' \| 'quarter' \| 'year'` | `'date'` | Loại picker |
| `disabledDate` | `(current: DayjsType) => boolean` | - | Hàm disable ngày |
| `className` | `string` | - | CSS class |
| `size` | `'large' \| 'middle' \| 'small'` | `'middle'` | Kích thước |
| `allowClear` | `boolean` | `true` | Cho phép xóa |
| `rules` | `object` | `{}` | Validation rules |

### 2. CustomDatePicker

Component DatePicker thông thường không sử dụng React Hook Form.

#### Cách sử dụng:

```tsx
import { useState } from 'react';
import { CustomDatePicker } from '@/components/common/DatePickers';

function MyComponent() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [error, setError] = useState<string>('');

  const handleDateChange = (value: string | null) => {
    setSelectedDate(value);
    if (!value) {
      setError('Vui lòng chọn ngày');
    } else {
      setError('');
    }
  };

  return (
    <div>
      {/* DatePicker cơ bản */}
      <CustomDatePicker
        label="Ngày sinh"
        placeholder="Chọn ngày sinh"
        value={selectedDate}
        onChange={handleDateChange}
        error={error}
        required
      />

      {/* DatePicker với giới hạn ngày */}
      <CustomDatePicker
        label="Ngày hẹn"
        placeholder="Chọn ngày hẹn"
        value={selectedDate}
        onChange={setSelectedDate}
        disabledDate={(current) => {
          // Không cho chọn ngày trong quá khứ
          return current && current.isBefore(dayjs(), 'day');
        }}
      />

      {/* Month Picker */}
      <CustomDatePicker
        label="Tháng"
        placeholder="Chọn tháng"
        picker="month"
        format="MM/YYYY"
        value={selectedDate}
        onChange={setSelectedDate}
      />
    </div>
  );
}
```

#### Props:

| Prop | Type | Mặc định | Mô tả |
|------|------|----------|-------|
| `label` | `string` | - | Label hiển thị |
| `placeholder` | `string` | - | Placeholder text |
| `value` | `string \| null` | - | Giá trị hiện tại (ISO string) |
| `onChange` | `(value: string \| null) => void` | - | Callback khi thay đổi giá trị |
| `onBlur` | `() => void` | - | Callback khi blur |
| `required` | `boolean` | `false` | Bắt buộc nhập |
| `disabled` | `boolean` | `false` | Vô hiệu hóa input |
| `format` | `string` | `'DD/MM/YYYY'` | Định dạng ngày tháng |
| `showTime` | `boolean` | `false` | Hiển thị thời gian |
| `picker` | `'date' \| 'week' \| 'month' \| 'quarter' \| 'year'` | `'date'` | Loại picker |
| `disabledDate` | `(current: DayjsType) => boolean` | - | Hàm disable ngày |
| `className` | `string` | - | CSS class |
| `size` | `'large' \| 'middle' \| 'small'` | `'middle'` | Kích thước |
| `allowClear` | `boolean` | `true` | Cho phép xóa |
| `error` | `string` | - | Thông báo lỗi |
| `status` | `'error' \| 'warning'` | - | Trạng thái |

## Lưu ý

1. **Định dạng dữ liệu**: Cả hai component đều sử dụng ISO string để lưu trữ và truyền dữ liệu ngày tháng.

2. **Dayjs**: Dự án sử dụng dayjs để xử lý ngày tháng. Đảm bảo đã cài đặt và cấu hình dayjs đúng cách.

3. **Validation**: FormDatePicker hỗ trợ validation thông qua React Hook Form rules, trong khi CustomDatePicker cần xử lý validation thủ công.

4. **Styling**: Cả hai component đều kế thừa styling từ Ant Design và có thể tùy chỉnh thông qua className và CSS.

## Ví dụ nâng cao

### Range DatePicker với validation

```tsx
// Sử dụng hai FormDatePicker để tạo range picker
<FormDatePicker
  name="startDate"
  control={control}
  label="Từ ngày"
  rules={{
    required: "Vui lòng chọn ngày bắt đầu"
  }}
/>

<FormDatePicker
  name="endDate"
  control={control}
  label="Đến ngày"
  rules={{
    required: "Vui lòng chọn ngày kết thúc",
    validate: (value) => {
      const startDate = getValues('startDate');
      if (startDate && new Date(value) <= new Date(startDate)) {
        return "Ngày kết thúc phải sau ngày bắt đầu";
      }
      return true;
    }
  }}
/>
```

### Disable ngày cuối tuần

```tsx
<CustomDatePicker
  label="Ngày làm việc"
  disabledDate={(current) => {
    // Disable thứ 7 và chủ nhật
    return current && (current.day() === 0 || current.day() === 6);
  }}
/>
```