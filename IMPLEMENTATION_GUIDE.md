# 📋 Triển Khai Frontend cho Các Module Quản Lý Bán Hàng

## 🎯 Tổng Quan

Dựa trên các module backend đã được triển khai, tôi đã tạo cấu trúc frontend cho các module sau:

### ✅ Đã Triển Khai (Models & Services)

1. **Season (Mùa vụ)** - `/seasons`
2. **Customer (Khách hàng)** - `/customers`
3. **Sales Invoice (Hóa đơn bán hàng)** - `/sales/invoices`
4. **Payment (Thanh toán)** - `/payments`
5. **Debt Note (Công nợ)** - `/debt-notes`
6. **Payment Allocation (Phân bổ thanh toán)** - Tích hợp trong Payment

### 📁 Cấu Trúc Đã Tạo

```
src/
├── models/
│   ├── season.ts ✅
│   ├── customer.ts ✅
│   ├── sales-invoice.ts ✅
│   ├── payment.ts ✅
│   └── debt-note.ts ✅
│
├── services/
│   ├── season.ts ⚠️ (Cần cập nhật API methods)
│   ├── customer.ts ⚠️ (Cần cập nhật API methods)
│   ├── sales-invoice.ts ⚠️ (Cần cập nhật API methods)
│   ├── payment.ts ⚠️ (Cần cập nhật API methods)
│   └── debt-note.ts ⚠️ (Cần cập nhật API methods)
│
└── pages/
    ├── seasons/
    │   ├── index.tsx ✅ (Đã tạo UI hoàn chỉnh)
    │   └── form-config.ts ✅
    │
    └── customers/
        ├── index.tsx ✅ (Đã tạo UI hoàn chỉnh với tabs)
        └── form-config.ts ✅
```

---

## 🔧 Các Vấn Đề Cần Khắc Phục

### 1. **Cập Nhật API Services**

Tất cả các service files cần được cập nhật để sử dụng đúng API methods:

- Thay `api.post()` → `api.postRaw()`
- Thay `api.put()` → `api.putRaw()`
- Thay `api.patch()` → `api.patchRaw()`
- Giữ nguyên `api.get()` và `api.delete()`

**Ví dụ cần sửa:**

```typescript
// ❌ SAI
create: async (data: CreateSeasonDto): Promise<Season> => {
  const response = await api.post('/seasons', data);
  return response.data;
}

// ✅ ĐÚNG
create: async (data: CreateSeasonDto): Promise<Season> => {
  const response = await api.postRaw('/seasons', data);
  return response; // Không cần .data vì interceptor đã xử lý
}
```

### 2. **Cập Nhật DataTable Import**

Trong các page components, cần sửa import:

```typescript
// ❌ SAI
import { DataTable } from '@/components/data-table';

// ✅ ĐÚNG
import { DataTable } from '@/components/common/data-table';
```

### 3. **Thêm Routes vào App.tsx**

Cần thêm routes cho các module mới:

```typescript
// Trong App.tsx, thêm vào phần Routes:

<Route
  path='/seasons'
  element={
    <ProtectedRoute>
      <Seasons />
    </ProtectedRoute>
  }
/>

<Route
  path='/customers'
  element={
    <ProtectedRoute>
      <Customers />
    </ProtectedRoute>
  }
/>

// Tương tự cho các module khác...
```

---

## 📝 Các Module Cần Triển Khai Tiếp

### 1. **Sales Invoice (Hóa đơn bán hàng)** - Ưu tiên CAO

**Chức năng:**
- Tạo hóa đơn mới với nhiều sản phẩm
- Chọn khách hàng (hoặc khách vãng lai)
- Chọn mùa vụ
- Thanh toán một phần (partial payment)
- Hiển thị số tiền còn nợ
- Thêm cảnh báo (warning field)

**UI Components cần tạo:**
- `pages/sales/index.tsx` - Danh sách hóa đơn
- `pages/sales/create.tsx` - Tạo hóa đơn mới
- `pages/sales/detail.tsx` - Chi tiết hóa đơn
- `pages/sales/form-config.ts` - Validation schema

**Workflow:**
1. Chọn khách hàng (autocomplete từ API `/customers?search=`)
2. Chọn mùa vụ (dropdown từ API `/seasons/active`)
3. Thêm sản phẩm (autocomplete từ API `/products?search=`)
4. Nhập số lượng, giá, giảm giá
5. Tính tổng tiền tự động
6. Nhập số tiền thanh toán trước
7. Hiển thị số tiền còn nợ
8. Submit

### 2. **Payment (Thanh toán)** - Ưu tiên CAO

**Chức năng:**
- Thu tiền từ khách hàng
- Phân bổ tiền vào các hóa đơn/phiếu nợ
- Chốt sổ với tạo phiếu nợ mới (settle-with-debt-note)

**UI Components cần tạo:**
- `pages/payments/index.tsx` - Danh sách phiếu thu
- `pages/payments/create.tsx` - Tạo phiếu thu mới
- `pages/payments/settle.tsx` - Chốt sổ công nợ
- `pages/payments/form-config.ts`

**Workflow Chốt Sổ:**
1. Chọn khách hàng
2. Hiển thị danh sách hóa đơn chưa thanh toán
3. Hiển thị danh sách phiếu nợ cũ
4. Nhập số tiền khách trả
5. Chọn các khoản muốn gạch nợ
6. Nếu thiếu tiền → Popup hỏi có tạo phiếu nợ mới không
7. Chọn mùa vụ cho phiếu nợ mới
8. Submit

### 3. **Debt Note (Công nợ)** - Ưu tiên TRUNG BÌNH

**Chức năng:**
- Xem danh sách công nợ
- Lọc theo khách hàng, mùa vụ, trạng thái
- Trả nợ (pay debt)
- Hiển thị màu sắc theo trạng thái

**UI Components cần tạo:**
- `pages/debt-notes/index.tsx` - Danh sách công nợ
- `pages/debt-notes/pay-dialog.tsx` - Dialog trả nợ
- `pages/debt-notes/form-config.ts`

**Màu sắc trạng thái:**
- 🔴 Overdue (Quá hạn)
- 🟢 Paid (Đã trả)
- 🟡 Active (Đang nợ)

### 4. **Sales Return (Trả hàng)** - Ưu tiên THẤP

**Chức năng:**
- Tạo phiếu trả hàng từ hóa đơn
- Nhập lại kho
- Hoàn tiền hoặc trừ công nợ

---

## 🎨 UI/UX Recommendations

### 1. **Dashboard Cards**

Thêm các thẻ thống kê vào Dashboard:

```typescript
- Tổng doanh thu tháng này
- Tổng công nợ hiện tại
- Số hóa đơn chưa thanh toán
- Top 5 khách hàng VIP
```

### 2. **Màu sắc & Icons**

- **Season**: 🌾 Màu xanh lá
- **Customer**: 👥 Màu xanh dương
- **Sales**: 🛒 Màu cam
- **Payment**: 💰 Màu xanh lá cây
- **Debt**: 📜 Màu đỏ

### 3. **Responsive Design**

Tất cả các trang đã được thiết kế responsive với:
- Grid layout cho desktop
- Stack layout cho mobile
- Dialogs fullscreen trên mobile

---

## 🔗 API Endpoints Tham Khảo

### Season
- `GET /seasons` - Danh sách mùa vụ
- `GET /seasons/active` - Mùa vụ đang hoạt động
- `POST /seasons` - Tạo mùa vụ mới
- `PATCH /seasons/:id` - Cập nhật mùa vụ
- `DELETE /seasons/:id` - Xóa mùa vụ

### Customer
- `GET /customers?search=` - Tìm kiếm khách hàng
- `GET /customers/:id` - Chi tiết khách hàng
- `GET /customers/:id/invoices` - Lịch sử mua hàng
- `GET /customers/:id/debts` - Công nợ
- `POST /customers` - Tạo khách hàng mới
- `PATCH /customers/:id` - Cập nhật khách hàng
- `DELETE /customers/:id` - Xóa khách hàng

### Sales Invoice
- `GET /sales/invoices` - Danh sách hóa đơn
- `POST /sales/invoice` - Tạo hóa đơn mới
- `PATCH /sales/invoice/:id/add-payment` - Trả nợ dần

### Payment
- `POST /payments` - Tạo phiếu thu đơn giản
- `POST /payments/settle-with-debt-note` - Chốt sổ với phiếu nợ
- `GET /payments/:id/allocations` - Chi tiết phân bổ

### Debt Note
- `GET /debt-notes?customer_id=&season_id=&status=` - Danh sách công nợ
- `POST /debt-notes/:id/pay` - Trả nợ

---

## 🚀 Bước Tiếp Theo

### Ngay Lập Tức:

1. ✅ Sửa tất cả service files để sử dụng `postRaw`, `putRaw`, `patchRaw`
2. ✅ Sửa import DataTable trong các page components
3. ✅ Thêm routes vào App.tsx
4. ✅ Thêm menu items vào Sidebar

### Tuần Này:

1. 🔨 Triển khai Sales Invoice (trang quan trọng nhất)
2. 🔨 Triển khai Payment & Settle
3. 🔨 Triển khai Debt Note

### Tuần Sau:

1. 📊 Thêm Dashboard statistics
2. 📱 Kiểm tra responsive trên mobile
3. 🧪 Testing & Bug fixes
4. 📝 Viết documentation

---

## 💡 Lưu Ý Quan Trọng

1. **Validation**: Tất cả forms đã có validation với Zod schema
2. **Error Handling**: Sử dụng toast notifications cho success/error
3. **Loading States**: Tất cả API calls đã có loading indicators
4. **Pagination**: Tất cả danh sách đều có pagination
5. **Search**: Customer và Product đều có autocomplete search

---

## 📞 Hỗ Trợ

Nếu cần hỗ trợ thêm về:
- Cách tích hợp API cụ thể
- Thiết kế UI/UX cho module nào
- Debug lỗi
- Tối ưu performance

Hãy cho tôi biết module nào bạn muốn ưu tiên triển khai trước!
