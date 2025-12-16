# 🚨 Vấn đề: Hóa đơn đã trả hàng toàn bộ vẫn hiển thị khi tạo phiếu trả mới

## 📋 Mô tả vấn đề

### Kịch bản lỗi:

1. **Hóa đơn:** HD20251211160153462 có 1 sản phẩm (số lượng: 10)
2. **Đã trả hàng:** Tạo phiếu trả với số lượng 10 (trả toàn bộ)
3. **Vấn đề:** Khi vào trang "Tạo phiếu trả hàng" → Tìm kiếm hóa đơn → Hóa đơn này **VẪN HIỂN THỊ**
4. **Hậu quả:** Có thể tạo phiếu trả thứ 2 cho cùng sản phẩm đã trả → **Trả trùng!**

### Ảnh hưởng:

❌ **Nghiêm trọng:**
- Trả hàng 2 lần cho cùng 1 sản phẩm
- Tồn kho tăng sai (tăng 2 lần)
- Công nợ/hoàn tiền sai (trừ/hoàn 2 lần)
- Dữ liệu tài chính không chính xác

---

## 🎯 Yêu cầu

### Mục tiêu:
**Chỉ hiển thị hóa đơn/sản phẩm còn có thể trả hàng**

### Logic đúng:
```
Số lượng có thể trả = Số lượng gốc - Số lượng đã trả

Nếu số lượng có thể trả = 0 → Ẩn sản phẩm
Nếu tất cả sản phẩm đều đã trả hết → Ẩn hóa đơn
```

---

## 💡 Giải pháp đề xuất

### **Option 1: Thêm field `returned_quantity` vào response** ⭐ KHUYẾN NGHỊ

#### Backend cần làm:

**File:** `src-server/modules/sales/sales.service.ts`

**Method:** `findOne(id: number)` - Dùng để lấy chi tiết hóa đơn khi user chọn

```typescript
async findOne(id: number): Promise<SalesInvoice> {
  // 1. Lấy hóa đơn với items
  const invoice = await this.salesInvoiceRepository.findOne({
    where: { id },
    relations: ['items', 'items.product', 'customer', 'season', 'rice_crop'],
  });

  if (!invoice) {
    throw new NotFoundException('Không tìm thấy hóa đơn');
  }

  // 2. ✅ THÊM MỚI: Tính số lượng đã trả cho mỗi item
  if (invoice.items && invoice.items.length > 0) {
    for (const item of invoice.items) {
      // Query tổng số lượng đã trả của sản phẩm này trong hóa đơn
      const returnedData = await this.dataSource
        .createQueryBuilder()
        .select('COALESCE(SUM(return_item.quantity), 0)', 'total_returned')
        .from('sales_return_items', 'return_item')
        .innerJoin('sales_returns', 'sales_return', 'sales_return.id = return_item.sales_return_id')
        .where('sales_return.invoice_id = :invoiceId', { invoiceId: id })
        .andWhere('sales_return.status = :status', { status: 'completed' })
        .andWhere('return_item.product_id = :productId', { productId: item.product_id })
        .getRawOne();

      // Gán vào item
      const returnedQty = parseFloat(returnedData?.total_returned || '0');
      (item as any).returned_quantity = returnedQty;
      (item as any).returnable_quantity = item.quantity - returnedQty;
    }
  }

  return invoice;
}
```

#### Frontend sẽ làm:

```typescript
// Lọc chỉ hiển thị sản phẩm còn có thể trả
const availableItems = selectedInvoice.items?.filter(
  item => item.returnable_quantity > 0
) || [];

// Hiển thị cảnh báo nếu không còn sản phẩm nào
if (availableItems.length === 0) {
  toast.error('Hóa đơn này đã trả hết sản phẩm!');
}
```

---

### **Option 2: Thêm endpoint riêng để search hóa đơn có thể trả** 

Tạo endpoint mới chỉ trả về hóa đơn còn sản phẩm chưa trả hết.

#### Backend cần làm:

**File:** `src-server/modules/sales/sales.controller.ts`

```typescript
@Get('invoices/returnable')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('SALES_VIEW')
async getReturnableInvoices(@Query() query: any) {
  return this.salesService.searchReturnableInvoices(query);
}
```

**File:** `src-server/modules/sales/sales.service.ts`

```typescript
async searchReturnableInvoices(searchDto: any) {
  const queryBuilder = this.salesInvoiceRepository
    .createQueryBuilder('invoice')
    .leftJoinAndSelect('invoice.items', 'items')
    .leftJoinAndSelect('invoice.customer', 'customer')
    .leftJoinAndSelect('invoice.season', 'season')
    .leftJoin(
      (subQuery) => {
        return subQuery
          .select('sales_return.invoice_id', 'invoice_id')
          .addSelect('return_item.product_id', 'product_id')
          .addSelect('SUM(return_item.quantity)', 'total_returned')
          .from('sales_returns', 'sales_return')
          .innerJoin('sales_return.items', 'return_item')
          .where('sales_return.status = :status', { status: 'completed' })
          .groupBy('sales_return.invoice_id, return_item.product_id');
      },
      'returned',
      'returned.invoice_id = invoice.id AND returned.product_id = items.product_id'
    )
    .where('invoice.status != :cancelled', { cancelled: 'cancelled' })
    .andWhere(
      '(returned.total_returned IS NULL OR items.quantity > COALESCE(returned.total_returned, 0))'
    );

  // Thêm filters từ searchDto (code, customer_name, etc.)
  if (searchDto.code) {
    queryBuilder.andWhere('invoice.code LIKE :code', { code: `%${searchDto.code}%` });
  }
  if (searchDto.customer_name) {
    queryBuilder.andWhere('customer.name LIKE :name', { name: `%${searchDto.customer_name}%` });
  }

  return queryBuilder.getMany();
}
```

#### Frontend sẽ làm:

```typescript
// Thay đổi API call khi search hóa đơn
const { data } = await api.get('/sales/invoices/returnable', {
  params: { keyword: searchText }
});
```

---

### **Option 3: Cache `returned_quantity` vào database** (Tối ưu nhất nhưng phức tạp)

Thêm cột `returned_quantity` trực tiếp vào bảng `sales_invoice_items`.

#### Backend cần làm:

**Migration:**
```sql
ALTER TABLE sales_invoice_items 
ADD COLUMN returned_quantity DECIMAL(10,2) DEFAULT 0 NOT NULL;

CREATE INDEX idx_sales_invoice_items_returnable 
ON sales_invoice_items(id) 
WHERE quantity > returned_quantity;
```

**Cập nhật khi tạo phiếu trả:**
```typescript
// File: src-server/modules/sales-return/sales-return.service.ts
// Trong method create(), sau khi save sales return

for (const returnItem of savedReturn.items) {
  // Tìm invoice item tương ứng
  const invoiceItem = invoice.items.find(
    item => item.product_id === returnItem.product_id
  );
  
  if (invoiceItem) {
    // Tăng returned_quantity
    await this.salesInvoiceItemRepository.increment(
      { id: invoiceItem.id },
      'returned_quantity',
      returnItem.quantity
    );
  }
}
```

**Rollback khi hủy phiếu trả:**
```typescript
async cancel(id: number) {
  const salesReturn = await this.findOne(id);
  
  // Giảm returned_quantity
  for (const returnItem of salesReturn.items) {
    const invoiceItem = await this.salesInvoiceItemRepository.findOne({
      where: { 
        invoice_id: salesReturn.invoice_id,
        product_id: returnItem.product_id 
      }
    });
    
    if (invoiceItem) {
      await this.salesInvoiceItemRepository.decrement(
        { id: invoiceItem.id },
        'returned_quantity',
        returnItem.quantity
      );
    }
  }
  
  // Update status
  salesReturn.status = SalesReturnStatus.CANCELLED;
  await this.salesReturnRepository.save(salesReturn);
}
```

---

## 📊 So sánh các Option

| Tiêu chí | Option 1 | Option 2 | Option 3 |
|----------|----------|----------|----------|
| **Độ phức tạp** | Thấp | Trung bình | Cao |
| **Performance** | Chậm (tính mỗi lần) | Nhanh | Rất nhanh |
| **Cần migration** | ❌ Không | ❌ Không | ✅ Có |
| **Rủi ro** | Thấp | Thấp | Cao (cần rollback) |
| **Thời gian làm** | 30 phút | 1 giờ | 2-3 giờ |
| **Khuyến nghị** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |

---

## ✅ Khuyến nghị

### **Dùng Option 1** vì:
1. ✅ Đơn giản, dễ implement
2. ✅ Không cần migration database
3. ✅ Không ảnh hưởng performance (chỉ tính khi user chọn 1 hóa đơn cụ thể)
4. ✅ Dễ test và debug
5. ✅ Rủi ro thấp

### Nếu sau này có vấn đề performance:
→ Chuyển sang Option 3 (cache vào database)

---

## 🧪 Test Cases

### Test 1: Hóa đơn chưa trả hàng
- Hóa đơn có 3 sản phẩm (A: 10, B: 20, C: 5)
- Chưa trả hàng gì
- **Kết quả:** Hiển thị cả 3 sản phẩm

### Test 2: Hóa đơn trả một phần
- Hóa đơn có 3 sản phẩm (A: 10, B: 20, C: 5)
- Đã trả: A: 5, B: 20
- **Kết quả:** Chỉ hiển thị A (còn 5) và C (còn 5), ẩn B

### Test 3: Hóa đơn đã trả toàn bộ
- Hóa đơn có 1 sản phẩm (A: 10)
- Đã trả: A: 10
- **Kết quả:** Không hiển thị sản phẩm nào, show alert "Đã trả hết"

### Test 4: Hóa đơn có nhiều phiếu trả
- Hóa đơn có 1 sản phẩm (A: 100)
- Phiếu trả 1: A: 30
- Phiếu trả 2: A: 40
- **Kết quả:** Hiển thị A với số lượng có thể trả: 30

---

## 📝 Checklist Implementation

### Backend (Option 1):
- [ ] Sửa method `findOne()` trong `SalesService`
- [ ] Thêm logic tính `returned_quantity` và `returnable_quantity`
- [ ] Test với hóa đơn chưa trả
- [ ] Test với hóa đơn đã trả một phần
- [ ] Test với hóa đơn đã trả toàn bộ

### Frontend:
- [ ] Cập nhật interface `SalesInvoiceItem` thêm 2 field mới
- [ ] Lọc `availableItems` chỉ hiển thị `returnable_quantity > 0`
- [ ] Hiển thị cảnh báo nếu không còn sản phẩm nào
- [ ] Giới hạn max quantity khi nhập = `returnable_quantity`
- [ ] Test UI với các trường hợp khác nhau

---

## 📞 Liên hệ

Nếu có thắc mắc, vui lòng liên hệ Frontend team.

**File tạo bởi:** Frontend Team  
**Ngày:** 2025-12-16  
**Priority:** 🔴 HIGH - Ảnh hưởng trực tiếp đến tính chính xác của dữ liệu tài chính
