# DatePicker Component - Hướng dẫn sử dụng

## 📍 Vị trí
`/src/components/common/DatePicker.tsx`

## 🎯 Mục đích
Component DatePicker wrapper của Ant Design với locale tiếng Việt mặc định, giúp:
- Tự động hiển thị tiếng Việt (tháng, thứ, nút)
- Format ngày mặc định: DD/MM/YYYY
- Placeholder tiếng Việt
- Dùng chung trong toàn bộ app

## 📦 Import

```tsx
// Cách 1: Import từ common components
import { DatePicker } from '@/components/common';

// Cách 2: Import trực tiếp
import DatePicker from '@/components/common/DatePicker';
```

## 💡 Sử dụng

### Cơ bản:
```tsx
<DatePicker />
```

### Trong Form:
```tsx
<Form.Item
  name="purchase_date"
  label="Ngày mua"
  rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}
>
  <DatePicker style={{ width: '100%' }} />
</Form.Item>
```

### Custom placeholder:
```tsx
<DatePicker placeholder="Chọn ngày sinh" />
```

### Custom format:
```tsx
<DatePicker format="YYYY-MM-DD" />
```

### Disabled dates:
```tsx
<DatePicker 
  disabledDate={(current) => {
    // Không cho chọn ngày trong quá khứ
    return current && current < dayjs().startOf('day');
  }}
/>
```

### Range Picker (nếu cần):
```tsx
// Tạo thêm component RangePicker tương tự
import { DatePicker } from 'antd';
const { RangePicker } = DatePicker;
```

## 🎨 Features mặc định

1. **Locale tiếng Việt**:
   - Tháng: "Tháng 1", "Tháng 2"...
   - Thứ: "CN", "T2", "T3"...
   - Nút: "Hôm nay", "Xóa"

2. **Format mặc định**: `DD/MM/YYYY`

3. **Placeholder mặc định**: "Chọn ngày"

## 🔧 Props

Component hỗ trợ tất cả props của Ant Design DatePicker:

```tsx
interface DatePickerProps {
  value?: Dayjs;
  defaultValue?: Dayjs;
  format?: string;
  placeholder?: string;
  disabled?: boolean;
  disabledDate?: (current: Dayjs) => boolean;
  onChange?: (date: Dayjs | null, dateString: string) => void;
  style?: React.CSSProperties;
  // ... và nhiều props khác
}
```

## ✅ Ưu điểm

1. **Nhất quán**: Tất cả DatePicker trong app đều tiếng Việt
2. **Đơn giản**: Không cần import locale mỗi lần dùng
3. **Dễ maintain**: Thay đổi 1 chỗ, áp dụng toàn app
4. **Type-safe**: Giữ nguyên types của Ant Design

## 🚫 Không nên

```tsx
// ❌ Không import từ antd nữa
import { DatePicker } from 'antd';

// ✅ Dùng component custom
import { DatePicker } from '@/components/common';
```

## 📝 Ví dụ thực tế

### Form tạo hóa đơn:
```tsx
<Form.Item
  name="invoice_date"
  label="Ngày hóa đơn"
  rules={[{ required: true }]}
>
  <DatePicker style={{ width: '100%' }} />
</Form.Item>
```

### Filter theo ngày:
```tsx
<DatePicker 
  placeholder="Từ ngày"
  onChange={(date) => setStartDate(date)}
/>
<DatePicker 
  placeholder="Đến ngày"
  onChange={(date) => setEndDate(date)}
/>
```

### Disabled future dates:
```tsx
<DatePicker 
  disabledDate={(current) => current && current > dayjs().endOf('day')}
  placeholder="Chọn ngày trong quá khứ"
/>
```

## 🔄 Migration từ code cũ

**Trước:**
```tsx
import { DatePicker } from 'antd';
import locale from 'antd/es/date-picker/locale/vi_VN';
import 'dayjs/locale/vi';

<DatePicker 
  locale={locale}
  format="DD/MM/YYYY"
  placeholder="Chọn ngày"
/>
```

**Sau:**
```tsx
import { DatePicker } from '@/components/common';

<DatePicker />
```

## 🎉 Kết quả

- ✅ Code ngắn gọn hơn
- ✅ Không cần import locale
- ✅ Tự động tiếng Việt
- ✅ Dễ bảo trì
