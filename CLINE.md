# CLINE Rules - XANH-AG-REACTJS-ADMIN (React Admin Panel)

## Project Overview

Admin dashboard cho ứng dụng Xanh AG, sử dụng React + Vite, Ant Design, MUI, và Tailwind CSS.

## Tech Stack

- **Framework:** React 19 + Vite 6
- **Language:** TypeScript
- **Routing:** React Router v6
- **UI Libraries:** Ant Design (antd) 5, MUI 6
- **Data Grid:** MUI X Data Grid
- **State Management:** Zustand v5
- **Data Fetching:** TanStack React Query v5
- **Form Handling:** React Hook Form + Zod validation
- **Charts:** Recharts
- **Icons:** Ant Design Icons, Lucide React, React Icons
- **PWA:** vite-plugin-pwa
- **i18n:** react-i18next
- **Deploy:** Vercel

## Architecture Pattern

### Directory Structure

```
XANH-AG-REACTJS-ADMIN/
├── public/              # Static assets
├── src/
│   ├── assets/         # Images, fonts, etc.
│   ├── components/     # Shared UI components
│   │   ├── common/     # Common components
│   │   ├── form/       # Form components
│   │   ├── ui/         # UI primitives
│   │   ├── sidebar/    # Sidebar components
│   │   ├── header/     # Header components
│   │   └── ...         # Other specific components
│   ├── config/         # App configuration
│   ├── constant/       # Constants (status, colors, roles, etc.)
│   ├── constants/      # More constants (locations, etc.)
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utility functions
│   ├── locales/        # i18n translations
│   ├── models/         # TypeScript interfaces/types
│   ├── pages/          # Route pages (organized by feature)
│   ├── provider/       # React context providers
│   ├── queries/        # React Query hooks
│   ├── services/       # API services
│   ├── stores/         # Zustand stores
│   ├── utils/          # Utility functions
│   ├── App.tsx         # Main App component
│   ├── main.tsx        # Entry point
│   └── index.css       # Global styles
```

### Pages Organization

```
pages/
├── dashboard/          # Dashboard page
├── customers/          # Customer management
├── products/           # Product management
├── inventory/          # Inventory management
├── sales-invoices/     # Sales invoices
├── payments/           # Payment management
├── rice-crops/         # Rice crop management
├── disease-warning/    # Disease warnings
├── reports/            # Reports
├── profit-reports/     # Profit reports
├── ai-demo/            # AI features
└── ...                 # Other feature pages
```

## Naming Conventions

### Files & Directories

- Component files: `kebab-case` (e.g., `product-form.tsx`, `sales-list.tsx`)
- Page folders: `kebab-case` (e.g., `sales-invoices/`, `debt-notes/`)
- Model files: `kebab-case` (e.g., `sales-invoice.model.ts`, `product.model.ts`)
- Query files: `kebab-case.ts` (e.g., `sales-invoice.ts`, `inventory.ts`)
- Hook files: `camelCase.ts` (e.g., `use-form-handler.ts`, `use-debounce-state.ts`)

### Components

- Named exports: `PascalCase` function components
- Default exports: Use for page components

### Variables & Functions

- camelCase for variables and functions
- Use descriptive names

## Code Style

### Page Components

```tsx
import { useNavigate } from "react-router-dom"
import { Button, Table, Space } from "antd"
import type { ColumnsType } from "antd/es/table"
import { PlusOutlined } from "@ant-design/icons"
import { useEntities } from "@/queries/your-entity"

interface YourEntityPageProps {
  // props if any
}

export default function YourEntityPage({}: YourEntityPageProps) {
  const navigate = useNavigate()
  const { data, isLoading } = useEntities()

  const columns: ColumnsType<YourEntity> = [
    {
      title: "Tên",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button onClick={() => navigate(`/your-entity/${record.id}/edit`)}>
            Sửa
          </Button>
          <Button danger onClick={() => handleDelete(record.id)}>
            Xóa
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div className='flex justify-between mb-4'>
        <h1 className='text-2xl font-bold'>Quản lý Entity</h1>
        <Button
          type='primary'
          icon={<PlusOutlined />}
          onClick={() => navigate("/your-entity/create")}
        >
          Thêm mới
        </Button>
      </div>
      <Table columns={columns} dataSource={data} loading={isLoading} />
    </div>
  )
}
```

### Form Page Pattern

```tsx
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button, Form, Input, Select, InputNumber, DatePicker } from "antd"
import { useNavigate } from "react-router-dom"
import { useCreateEntity } from "@/queries/your-entity"
import dayjs from "dayjs"

const formSchema = z.object({
  name: z.string().min(1, "Tên là bắt buộc"),
  category: z.string().optional(),
  price: z.number().positive("Giá phải lớn hơn 0"),
  createdAt: z.date(),
})

type FormValues = z.infer<typeof formSchema>

export default function CreateEntityPage() {
  const navigate = useNavigate()
  const createEntity = useCreateEntity()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      category: undefined,
      price: 0,
      createdAt: new Date(),
    },
  })

  const onSubmit = async (data: FormValues) => {
    try {
      await createEntity.mutateAsync(data)
      navigate("/your-entity")
    } catch (error) {
      // Error handling
    }
  }

  return (
    <div>
      <h1 className='text-2xl font-bold mb-4'>Thêm mới Entity</h1>
      <Form
        form={form.control}
        onFinish={form.handleSubmit(onSubmit)}
        layout='vertical'
      >
        <Form.Item
          name='name'
          label='Tên'
          rules={[{ required: true, message: "Tên là bắt buộc" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item name='price' label='Giá'>
          <InputNumber style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button onClick={() => navigate(-1)}>Hủy</Button>
            <Button
              type='primary'
              htmlType='submit'
              loading={createEntity.isPending}
            >
              Lưu
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  )
}
```

## Queries Pattern (React Query)

### Basic Query Hook

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { axiosInstance } from "@/lib/auth"

const ENTITY_ENDPOINT = "/api/your-entity"

export function useEntities(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ["your-entities", params],
    queryFn: async () => {
      const { data } = await axiosInstance.get(ENTITY_ENDPOINT, { params })
      return data.data as YourEntity[]
    },
  })
}

export function useEntity(id: string) {
  return useQuery({
    queryKey: ["your-entity", id],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`${ENTITY_ENDPOINT}/${id}`)
      return data.data as YourEntity
    },
    enabled: !!id,
  })
}

export function useCreateEntity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateEntityDto) => {
      const response = await axiosInstance.post(ENTITY_ENDPOINT, data)
      return response.data.data as YourEntity
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["your-entities"] })
    },
  })
}

export function useUpdateEntity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateEntityDto }) => {
      const response = await axiosInstance.put(`${ENTITY_ENDPOINT}/${id}`, data)
      return response.data.data as YourEntity
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["your-entities"] })
      queryClient.invalidateQueries({ queryKey: ["your-entity", id] })
    },
  })
}

export function useDeleteEntity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await axiosInstance.delete(`${ENTITY_ENDPOINT}/${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["your-entities"] })
    },
  })
}
```

## Custom Hooks

### Form Handler Hook

```typescript
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import { useCallback } from "react"

interface UseFormHandlerOptions<T> {
  defaultValues: Partial<T>
  resolver: any
  successPath: string
  mutation: any
}

export function useFormHandler<T extends Record<string, any>>({
  defaultValues,
  resolver,
  successPath,
  mutation,
}: UseFormHandlerOptions<T>) {
  const navigate = useNavigate()

  const form = useForm<T>({
    resolver,
    defaultValues,
  })

  const onSubmit = useCallback(
    async (data: T) => {
      try {
        await mutation.mutateAsync(data)
        navigate(successPath)
      } catch (error) {
        console.error("Form submission error:", error)
      }
    },
    [mutation, successPath, navigate],
  )

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    isSubmitting: mutation.isPending,
  }
}
```

## State Management

### Zustand Store

```typescript
import { create } from "zustand"

interface YourStore {
  selectedItems: YourEntity[]
  setSelectedItems: (items: YourEntity[]) => void
  clearSelection: () => void
}

export const useYourStore = create<YourStore>((set) => ({
  selectedItems: [],
  setSelectedItems: (items) => set({ selectedItems: items }),
  clearSelection: () => set({ selectedItems: [] }),
}))
```

## Components Organization

### Form Components (src/components/form/)

```tsx
import { Form, Input, InputProps } from "antd"

interface FormItemProps extends InputProps {
  label: string
  name: string
  required?: boolean
}

export function FormInput({ label, name, required, ...props }: FormItemProps) {
  return (
    <Form.Item
      name={name}
      label={label}
      rules={
        required ? [{ required: true, message: `${label} là bắt buộc` }] : []
      }
    >
      <Input {...props} />
    </Form.Item>
  )
}
```

### Dialog Components

```tsx
import { Modal } from "antd"
import { ExclamationCircleOutlined } from "@ant-design/icons"

interface ConfirmDialogProps {
  open: boolean
  onOk: () => void
  onCancel: () => void
  title: string
  content: string
  okText?: string
  cancelText?: string
}

export function ConfirmDialog({
  open,
  onOk,
  onCancel,
  title,
  content,
  okText = "OK",
  cancelText = "Hủy",
}: ConfirmDialogProps) {
  return (
    <Modal
      title={
        <span>
          <ExclamationCircleOutlined className='mr-2 text-yellow-500' />
          {title}
        </span>
      }
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      okText={okText}
      cancelText={cancelText}
      okButtonProps={{ danger: true }}
    >
      <p>{content}</p>
    </Modal>
  )
}
```

## Models/Types Pattern

```typescript
// models/your-entity.model.ts

export interface YourEntity {
  id: string
  name: string
  description: string
  price: number
  quantity: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateYourEntityDto {
  name: string
  description?: string
  price: number
  quantity: number
  isActive?: boolean
}

export interface UpdateYourEntityDto extends Partial<CreateYourEntityDto> {
  id: string
}

export interface YourEntitySearchParams {
  page?: number
  limit?: number
  keyword?: string
  isActive?: boolean
}

export interface YourEntityResponse {
  data: YourEntity[]
  total: number
  page: number
  limit: number
}
```

## Styling

### Tailwind CSS

- Sử dụng Tailwind CSS cho styling
- Kết hợp với Ant Design components
- Sử dụng className prop cho custom styling

### MUI Theme

- Sử dụng MUI cho Data Grid và một số components đặc biệt
- Theme configuration trong `config/mui-theme-config.ts`

## Ant Design Form Pattern

```tsx
import { Form, Input, Select, DatePicker, InputNumber, Switch } from "antd"
import dayjs from "dayjs"
;<Form layout='vertical' onFinish={onSubmit}>
  <Form.Item
    name='name'
    label='Tên'
    rules={[{ required: true, message: "Tên là bắt buộc" }]}
  >
    <Input placeholder='Nhập tên' />
  </Form.Item>

  <Form.Item name='category' label='Danh mục'>
    <Select
      placeholder='Chọn danh mục'
      options={categories.map((c) => ({ label: c.name, value: c.id }))}
    />
  </Form.Item>

  <Form.Item name='price' label='Giá'>
    <InputNumber
      style={{ width: "100%" }}
      formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
    />
  </Form.Item>

  <Form.Item name='startDate' label='Ngày bắt đầu'>
    <DatePicker style={{ width: "100%" }} />
  </Form.Item>

  <Form.Item name='isActive' label='Hoạt động' valuePropName='checked'>
    <Switch />
  </Form.Item>
</Form>
```

## Data Table Pattern (MUI X Data Grid)

```tsx
import { DataGrid, GridColDef } from "@mui/x-data-grid"
import { viVN } from "@mui/x-data-grid/locales"

interface YourDataTableProps {
  data: YourEntity[]
  loading: boolean
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export function YourDataTable({
  data,
  loading,
  onEdit,
  onDelete,
}: YourDataTableProps) {
  const columns: GridColDef[] = [
    { field: "name", headerName: "Tên", flex: 1 },
    { field: "category", headerName: "Danh mục", flex: 1 },
    {
      field: "actions",
      headerName: "Hành động",
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <div>
          <Button onClick={() => onEdit(params.row.id)}>Sửa</Button>
          <Button color='error' onClick={() => onDelete(params.row.id)}>
            Xóa
          </Button>
        </div>
      ),
    },
  ]

  return (
    <DataGrid
      rows={data}
      columns={columns}
      loading={loading}
      localeText={viVN.components.MuiDataGrid.defaultProps.localeText}
      pageSizeOptions={[10, 25, 50]}
    />
  )
}
```

## Error Handling

### Toast Notifications

```tsx
import { message } from "antd"

// Success
message.success("Thao tác thành công")

// Error
message.error("Đã xảy ra lỗi")

// Warning
message.warning("Cảnh báo")
```

## i18n Pattern

```tsx
import { useTranslation } from "react-i18next"

export function YourComponent() {
  const { t } = useTranslation()

  return (
    <div>
      <h1>{t("common.dashboard")}</h1>
      <p>{t("yourFeature.welcomeMessage")}</p>
    </div>
  )
}
```

## Component Reuse Strategy

### Ưu tiên sử dụng component có sẵn

**LUÔN LUÔN** kiểm tra và sử dụng các component đã viết sẵn theo thứ tự ưu tiên:

1. **Common components** (`src/components/common/`) - **ƯU TIÊN CAO NHẤT** - Các component tái sử dụng của project
2. **Form components** (`src/components/form/`) - **ƯU TIÊN CAO NHẤT** - Form fields đã chuẩn hóa của project
3. **Ant Design components** (`antd/*`) - Thư viện UI, không sửa, chỉ dùng
4. **MUI components** (`@mui/material/*`, `@mui/x-data-grid/*`) - Thư viện UI, không sửa, chỉ dùng

### Khi nào tạo component mới?

Tạo component mới khi:

- Tính năng chưa có trong thư viện hiện tại
- Component sẽ được sử dụng ở **ít nhất 2 nơi khác nhau**
- Logic phức tạp cần đóng gói để tái sử dụng

### Pattern tạo reusable component

```tsx
import { Button, Table, Space, Tag } from "antd"
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons"

interface ReusableDataTableProps {
  data: DataType[]
  loading: boolean
  onEdit: (item: DataType) => void
  onDelete: (id: string) => void
  onAdd?: () => void
  title: string
}

/**
 * Component bảng dữ liệu tái sử dụng
 * @param data - Danh sách dữ liệu
 * @param loading - Trạng thái loading
 * @param onEdit - Callback khi edit
 * @param onDelete - Callback khi delete
 * @param onAdd - Callback khi add new
 * @param title - Tiêu đề bảng
 */
export function ReusableDataTable({
  data,
  loading,
  onEdit,
  onDelete,
  onAdd,
  title,
}: ReusableDataTableProps) {
  return (
    <div>
      <div className='flex justify-between mb-4'>
        <h1 className='text-2xl font-bold'>{title}</h1>
        {onAdd && (
          <Button type='primary' icon={<PlusOutlined />} onClick={onAdd}>
            Thêm mới
          </Button>
        )}
      </div>
      <Table
        dataSource={data}
        loading={loading}
        columns={[
          { title: "Tên", dataIndex: "name" },
          {
            title: "Hành động",
            key: "action",
            render: (_, record) => (
              <Space>
                <Button icon={<EditOutlined />} onClick={() => onEdit(record)}>
                  Sửa
                </Button>
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => onDelete(record.id)}
                >
                  Xóa
                </Button>
              </Space>
            ),
          },
        ]}
      />
    </div>
  )
}
```

### Các component nên tái sử dụng

Thường tạo reusable components cho:

- **Data display**: Tables, lists, cards, grids (MUI X Data Grid, Ant Table)
- **Form inputs**: Custom inputs, selects, date pickers (Ant Form.Item wrapper)
- **Feedback**: Loading states, empty states, error messages, toast notifications
- **Layout**: Page headers, sections, containers, mobile sidebar
- **Navigation**: Breadcrumbs, tabs, pagination
- **Dialogs**: Confirm dialogs, detail modals, form dialogs

---

## Important Notes

1. **Always use TypeScript** - Không dùng JavaScript thuần
2. **Ưu tiên reuse** - Luôn dùng component có sẵn trước khi tạo mới
3. **Tạo reusable component** - Khi dùng ở 2+ nơi khác nhau
4. **Form validation** - Sử dụng Zod + React Hook Form
5. **Data fetching** - Sử dụng TanStack React Query
6. **State management** - Zustand cho global state
7. **UI Components** - Kết hợp Ant Design và MUI
8. **Vietnamese messages** - Tất cả UI text bằng tiếng Việt
9. **Date handling** - Sử dụng `dayjs`
10. **Follow existing patterns** - Tuân thủ pattern có sẵn
11. **Error messages** - Tiếng Việt

## Number Formatting Rules (QUAN TRỌNG)

**Định dạng số theo kiểu Việt Nam:**

- Dấu `.` ngăn cách hàng nghìn (thousands separator)
- Dấu `,` cho phần thập phân (decimal separator)
- Ví dụ: `1000` → `"1.000"`, `1000.5` → `"1.000,50"`

**Cách sử dụng:**

```tsx
// ✅ ĐÚNG - Sử dụng Intl.NumberFormat với locale "vi-VN"
new Intl.NumberFormat("vi-VN", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
}).format(value)

// ❌ SAI - Không dùng toLocaleString() mặc định hoặc format kiểu Mỹ
value.toLocaleString() // Có thể ra "1,000" (kiểu Mỹ)
```

**Áp dụng cho:**

- Tồn kho, tồn thuế, số lượng
- Giá tiền (khi không dùng currency format)
- Mọi số liệu hiển thị trong bảng

## Prohibited Actions

- ❌ Không dùng `any` type
- ❌ Không bypass TypeScript
- ❌ Không hardcode URLs - dùng environment variables
- ❌ Không commit `.env` hoặc secrets
- ❌ Không sửa đổi config files mà không có lý do
- ❌ Không quên validation cho form inputs

## Task Completion Rules

**Khi hoàn thành task, luôn luôn:**

1. **Kiểm tra lỗi TypeScript**: Chạy `npx tsc --noEmit`
2. **Chạy build test**: Chạy `npm run build`
3. **Xác nhận thành công**: Đảm bảo không có lỗi TypeScript mới do thay đổi (lỗi pre-existing không tính)

## 🚫 QUY TẮC PUSH CODE - CỰC KỲ QUAN TRỌNG

**KHÔNG BAO GIỜ tự động push code lên GitHub mà không có sự đồng ý của user!**

```
❌ TUYỆT ĐỐI KHÔNG:
- git push origin dev
- git push origin main
- Tự động commit và push sau khi sửa code

✅ PHẢI LÀM:
- Chỉ sửa code và hiển thị diff cho user xem
- Hỏi user: "Bạn có muốn tôi push code này không?"
- Chờ user approve rồi mới push
- Nếu user yêu cầu, có thể tạo commit nhưng KHÔNG push
```

**Quy trình đúng khi sửa code:**

1. Sửa file cần thiết (using `write_to_file` or `replace_in_file`)
2. Hiển thị diff thay đổi cho user
3. CHỜ user approve hoặc yêu cầu chỉnh sửa thêm
4. NẾU user yêu cầu push → mới thực hiện `git add`, `git commit`, `git push`
