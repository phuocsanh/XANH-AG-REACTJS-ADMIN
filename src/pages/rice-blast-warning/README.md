# 🌾 Rice Blast Warning - Frontend Implementation

## 📋 Tổng Quan

Chức năng **Cảnh Báo Bệnh Đạo Ôn Lúa** đã được triển khai đầy đủ trên frontend với các tính năng:

- ✅ Hiển thị cảnh báo bệnh đạo ôn theo thời gian thực
- ✅ Quản lý vị trí ruộng lúa
- ✅ Xem dữ liệu chi tiết 7 ngày
- ✅ Chạy phân tích thủ công
- ✅ Tự động làm mới dữ liệu mỗi 5 phút

## 📁 Cấu Trúc File

```
src/
├── models/
│   └── rice-blast.ts              # TypeScript interfaces
├── queries/
│   └── rice-blast.ts              # React Query hooks
├── components/
│   └── rice-blast/
│       ├── warning-card.tsx       # Component hiển thị cảnh báo
│       ├── daily-data-table.tsx   # Bảng dữ liệu 7 ngày
│       ├── location-form.tsx      # Form cập nhật vị trí
│       └── index.ts               # Export components
└── pages/
    └── rice-blast-warning/
        └── index.tsx              # Main page
```

## 🚀 Cách Sử Dụng

### 1. Truy Cập Trang

Vào menu sidebar → **Cảnh báo Đạo Ôn** hoặc truy cập URL:
```
http://localhost:3000/rice-blast-warning
```

### 2. Cập Nhật Vị Trí Ruộng Lúa

1. Điền thông tin vào form bên trái:
   - **Tên vị trí**: VD: "Ruộng nhà ông Tư - Tân Lập, Vũ Thư"
   - **Vĩ độ (Latitude)**: -90 đến 90
   - **Kinh độ (Longitude)**: -180 đến 180

2. Click **"Lưu vị trí"**

3. Hệ thống sẽ tự động:
   - Lưu vị trí mới
   - Chạy phân tích bệnh đạo ôn
   - Hiển thị kết quả (mất 5-10 giây)

### 3. Xem Cảnh Báo

Cảnh báo hiển thị với:
- **Mức độ nguy cơ**: RẤT CAO / CAO / TRUNG BÌNH / THẤP / AN TOÀN
- **Xác suất nhiễm bệnh**: 0-100%
- **Ngày cao điểm**: Nếu có
- **Tin nhắn chi tiết**: Khuyến cáo và hướng dẫn

### 4. Xem Dữ Liệu Chi Tiết

Bảng dữ liệu 7 ngày hiển thị:
- Nhiệt độ (min, max, trung bình)
- Độ ẩm
- **Số giờ lá ướt** (chỉ số quan trọng nhất)
- Lượng mưa
- Sương mù
- Điểm nguy cơ (0-135)
- Mức độ nguy cơ

### 5. Chạy Phân Tích Thủ Công

Click nút **"Phân tích ngay"** để:
- Lấy dữ liệu thời tiết mới nhất
- Tính toán lại nguy cơ
- Cập nhật cảnh báo

## 🎨 Màu Sắc Mức Độ Nguy Cơ

| Mức Độ | Màu | Ý Nghĩa |
|--------|-----|---------|
| RẤT CAO | 🔴 Đỏ | Nguy cơ cực kỳ cao, cần phun thuốc ngay |
| CAO | 🟠 Cam | Nguy cơ cao, cần theo dõi sát |
| TRUNG BÌNH | 🟡 Vàng | Nguy cơ trung bình, cần cảnh giác |
| THẤP | 🟢 Xanh lá | Nguy cơ thấp, an toàn |
| AN TOÀN | 🔵 Xanh dương | Hoàn toàn an toàn |

## 🔄 Tự Động Làm Mới

- **Backend**: Tự động phân tích mỗi ngày lúc 6:00 sáng
- **Frontend**: Tự động làm mới dữ liệu mỗi 5 phút
- **Thủ công**: Click nút "Làm mới" hoặc "Phân tích ngay"

## 📊 API Endpoints

Tất cả API đều sử dụng base URL: `http://localhost:3003`

| Method | Endpoint | Mô Tả |
|--------|----------|-------|
| GET | `/api/location` | Lấy vị trí hiện tại |
| POST | `/api/location` | Cập nhật vị trí |
| GET | `/api/warning` | Lấy cảnh báo mới nhất |
| POST | `/api/run-now` | Chạy phân tích ngay |

## 🛠️ Troubleshooting

### Lỗi: "Không thể kết nối đến server"

**Nguyên nhân**: Backend chưa chạy

**Giải pháp**:
```bash
cd src-server
npm run dev
```

### Lỗi: "Chưa có dữ liệu cảnh báo"

**Nguyên nhân**: Chưa cập nhật vị trí hoặc chưa chạy phân tích

**Giải pháp**:
1. Cập nhật vị trí ruộng lúa
2. Hoặc click "Phân tích ngay"

### Phân tích chậm (> 10 giây)

**Nguyên nhân**: API Open-Meteo có thể chậm

**Giải pháp**: Đợi thêm vài giây, hoặc thử lại sau

## 📝 Ghi Chú Quan Trọng

1. **Số giờ lá ướt (LWD Hours)**: 
   - Chỉ số quan trọng nhất
   - ≥ 14 giờ = Nguy hiểm cao (hiển thị màu đỏ)

2. **Điểm nguy cơ (Risk Score)**:
   - Tối đa: 135 điểm
   - ≥ 100 = Cực kỳ nguy hiểm (hiển thị màu đỏ)

3. **Tin nhắn cảnh báo**:
   - Có emoji và format đặc biệt
   - Sử dụng `white-space: pre-wrap` để giữ nguyên format

## 🔗 Tài Liệu Liên Quan

- [Backend Integration Guide](../../FRONTEND_INTEGRATION_GUIDE.md)
- [Backend README](../../src-server/README.md)
- [Rice Blast Summary](../../src-server/RICE_BLAST_SUMMARY.md)

---

**Chúc bạn sử dụng thành công! 🌾**
