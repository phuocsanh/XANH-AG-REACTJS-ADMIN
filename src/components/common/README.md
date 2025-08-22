# Common Components Library

Thư viện các component tái sử dụng cho dự án GN Farm Admin.

## Danh sách Components

### 1. FormField
Component form field đa năng hỗ trợ nhiều loại input.

```tsx
import { FormField } from '@/components/common';

// Text input
<FormField
  name="productName"
  label="Tên sản phẩm"
  type="text"
  placeholder="Nhập tên sản phẩm"
  required
/>

// Select dropdown
<FormField
  name="category"
  label="Danh mục"
  type="select"
  options={[
    { label: 'Rau củ', value: 'vegetables' },
    { label: 'Trái cây', value: 'fruits' }
  ]}
  required
/>
```

### 2. RichTextEditor
Trình soạn thảo văn bản phong phú với toolbar.

```tsx
import { RichTextEditor } from '@/components/common';

const [content, setContent] = useState('');

<RichTextEditor
  content={content}
  onChange={setContent}
  placeholder="Nhập mô tả sản phẩm..."
  minHeight={300}
/>
```

### 3. LoadingSpinner
Component loading với nhiều tùy chọn hiển thị.

```tsx
import { LoadingSpinner } from '@/components/common';

// Loading overlay
<LoadingSpinner overlay tip="Đang tải..." />

// Loading wrapper
<LoadingSpinner spinning={loading}>
  <div>Nội dung cần loading</div>
</LoadingSpinner>
```

### 4. ConfirmDialog
Dialog xác nhận với hook hỗ trợ.

```tsx
import { useConfirmDialog } from '@/components/common';

const { showConfirm } = useConfirmDialog();

const handleDelete = () => {
  showConfirm({
    title: 'Xác nhận xóa',
    content: 'Bạn có chắc chắn muốn xóa sản phẩm này?',
    type: 'warning',
    onOk: async () => {
      await deleteProduct(id);
    }
  });
};
```

### 5. DataTable
Bảng dữ liệu với action buttons tích hợp.

```tsx
import { DataTable } from '@/components/common';

const columns = [
  {
    title: 'Tên sản phẩm',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: 'Giá',
    dataIndex: 'price',
    key: 'price',
  },
];

<DataTable
  columns={columns}
  data={products}
  loading={loading}
  onEdit={(record) => handleEdit(record)}
  onDelete={(record) => handleDelete(record)}
  onView={(record) => handleView(record)}
  pagination={{
    current: page,
    pageSize: 10,
    total: totalProducts,
    onChange: setPage,
  }}
/>
```

### 6. SearchFilter
Component tìm kiếm và lọc dữ liệu.

```tsx
import { SearchFilter } from '@/components/common';

const filterFields = [
  {
    key: 'category',
    label: 'Danh mục',
    type: 'select' as const,
    options: categories.map(cat => ({ label: cat.name, value: cat.id }))
  },
  {
    key: 'dateRange',
    label: 'Thời gian',
    type: 'dateRange' as const
  }
];

<SearchFilter
  searchPlaceholder="Tìm kiếm sản phẩm..."
  filterFields={filterFields}
  onSearch={(value) => setSearchTerm(value)}
  onFilter={(filters) => setFilters(filters)}
  onReset={() => resetFilters()}
/>
```

### 7. StatusBadge
Hiển thị trạng thái với Badge hoặc Tag.

```tsx
import { StatusBadge } from '@/components/common';

// Sử dụng trạng thái có sẵn
<StatusBadge status="active" />
<StatusBadge status="pending" type="badge" />

// Custom trạng thái
<StatusBadge
  status="custom"
  text="Trạng thái tùy chỉnh"
  customConfig={{
    custom: {
      color: '#722ed1',
      text: 'Tùy chỉnh',
      badgeStatus: 'processing'
    }
  }}
/>
```

### 8. FormComboBox
Component ComboBox tích hợp với React Hook Form, hỗ trợ single select, multi-select và tải dữ liệu từ API.

```tsx
import { FormComboBox } from '@/components/common';
import { useForm } from 'react-hook-form';

interface FormData {
  category: string;
  tags: string[];
  status: number;
}

// Static options
const options = [
  { value: '1', label: 'Danh mục 1' },
  { value: '2', label: 'Danh mục 2' },
  { value: '3', label: 'Danh mục 3' }
];

// API function for async data
const apiFunction = async ({ page, limit, search }) => {
  const response = await fetch(`/api/categories?page=${page}&limit=${limit}&search=${search}`);
  const data = await response.json();
  
  return {
    data: data.items,
    total: data.total,
    hasMore: data.hasMore,
    nextPage: data.nextPage,
  };
};

function MyForm() {
  const { control, handleSubmit } = useForm<FormData>();

  return (
    <form onSubmit={handleSubmit(console.log)}>
      {/* Single select with static options */}
      <FormComboBox
        name="category"
        control={control}
        options={options}
        label="Danh mục"
        placeholder="Chọn danh mục"
        required
      />

      {/* Multi-select */}
      <FormComboBox
        name="tags"
        control={control}
        options={options}
        label="Tags"
        placeholder="Chọn nhiều tags"
        mode="multiple"
        maxTagCount={3}
      />

      {/* Async data from API */}
      <FormComboBox
        name="asyncCategory"
        control={control}
        apiFunction={apiFunction}
        label="Danh mục từ API"
        placeholder="Tìm kiếm và chọn..."
        showSearch
        pageSize={20}
        searchDebounceMs={300}
        enableLoadMore
      />

      {/* Với custom field mapping */}
      <FormComboBox
        name="status"
        control={control}
        options={[
          { id: 1, name: 'Hoạt động', disabled: false },
          { id: 2, name: 'Tạm dừng', disabled: false }
        ]}
        valueField="id"
        labelField="name"
        label="Trạng thái"
      />

      {/* Với validation tùy chỉnh */}
      <FormComboBox
        name="category"
        control={control}
        options={options}
        label="Danh mục"
        rules={{
          required: 'Vui lòng chọn danh mục',
          validate: (value) => 
            value !== '3' || 'Không thể chọn danh mục này'
        }}
      />

      {/* Với callback khi thay đổi */}
      <FormComboBox
        name="category"
        control={control}
        options={options}
        label="Danh mục"
        onSelectionChange={(value, option) => {
          console.log('Selected:', value, option);
        }}
      />
    </form>
  );
}
```

## Hướng dẫn sử dụng

### Import Components

```tsx
// Import từng component
import { FormField, DataTable, StatusBadge } from '@/components/common';

// Hoặc import tất cả
import * as CommonComponents from '@/components/common';
```

### Styling

Tất cả components đều sử dụng Ant Design theme và có thể tùy chỉnh thông qua:
- Props `className` và `style`
- CSS variables của Ant Design
- Custom CSS classes

### TypeScript Support

Tất cả components đều có TypeScript types đầy đủ:

```tsx
import type { DataTableProps, ActionButton } from '@/components/common';

const customActionButtons: ActionButton[] = [
  {
    key: 'custom',
    icon: <CustomIcon />,
    tooltip: 'Custom action',
    onClick: (record) => handleCustomAction(record)
  }
];
```

## Best Practices

1. **Tái sử dụng**: Ưu tiên sử dụng common components thay vì tạo mới
2. **Customization**: Sử dụng props để tùy chỉnh thay vì fork component
3. **Performance**: Sử dụng React.memo cho các component có props phức tạp
4. **Accessibility**: Tất cả components đều hỗ trợ accessibility của Ant Design
5. **Testing**: Viết unit tests cho logic custom trong components

## Đóng góp

Khi thêm component mới:
1. Tạo file component trong thư mục này
2. Export component và types trong `index.ts`
3. Cập nhật README với hướng dẫn sử dụng
4. Viết unit tests nếu cần thiết