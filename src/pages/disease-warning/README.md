# 🌾 Hệ Thống Cảnh Báo Bệnh/Sâu Hại Lúa - Frontend

## 📋 Tổng Quan

Hệ thống cảnh báo bệnh/sâu hại lúa đã được cập nhật với **7 module** (2 bệnh cũ + 5 module mới):

### Bệnh (Diseases)
1. **🦠 Bệnh Đạo Ôn** (Rice Blast) - Module cũ
2. **🍃 Bệnh Cháy Bìa Lá** (Bacterial Blight) - Module cũ
3. **🍂 Bệnh Khô Vằn** (Sheath Blight) - **MỚI**
4. **🌾 Bệnh Lem Lép Hạt** (Grain Discoloration) - **MỚI**

### Sâu Hại (Pests)
5. **🐛 Sâu Đục Thân** (Stem Borer) - **MỚI** (tách từ module cũ)
6. **🦟 Muỗi Hành** (Gall Midge) - **MỚI** (tách từ module cũ)
7. **🦗 Rầy Nâu** (Brown Plant Hopper) - **MỚI**

## 📁 Cấu Trúc File

```
src/
├── queries/                          # React Query hooks
│   ├── rice-blast.ts                # Bệnh Đạo Ôn
│   ├── bacterial-blight.ts          # Bệnh Cháy Bìa Lá
│   ├── stem-borer.ts                # Sâu Đục Thân (MỚI)
│   ├── gall-midge.ts                # Muỗi Hành (MỚI)
│   ├── brown-plant-hopper.ts        # Rầy Nâu (MỚI)
│   ├── sheath-blight.ts             # Bệnh Khô Vằn (MỚI)
│   └── grain-discoloration.ts       # Bệnh Lem Lép Hạt (MỚI)
│
├── components/disease-warning/       # Components
│   ├── warning-card.tsx             # Card cho bệnh đạo ôn & cháy bìa lá
│   ├── disease-warning-card.tsx     # Card tổng quát cho 5 module mới (MỚI)
│   ├── daily-data-table.tsx         # Bảng dữ liệu chi tiết
│   ├── location-form.tsx            # Form cập nhật vị trí
│   └── index.ts                     # Export tất cả components
│
└── pages/disease-warning/            # Trang chính
    └── index.tsx                    # Trang hiển thị 7 tabs
```

## 🚀 Cách Sử Dụng

### 1. Truy Cập Trang

Vào menu sidebar → **Cảnh Báo Bệnh/Sâu Hại** hoặc truy cập URL:
```
http://localhost:3000/disease-warning
```

### 2. Cập Nhật Vị Trí Ruộng Lúa

1. Điền thông tin vào form bên trái:
   - **Tên vị trí**: VD: "Ruộng nhà ông Tư - Tân Lập, Vũ Thư"
   - **Vĩ độ (Latitude)**: -90 đến 90
   - **Kinh độ (Longitude)**: -180 đến 180

2. Click **"Lưu vị trí"**

3. Hệ thống sẽ tự động:
   - Lưu vị trí mới
   - Chạy phân tích cho tất cả 7 module
   - Hiển thị kết quả (mất 5-10 giây)

### 3. Xem Cảnh Báo

Chuyển đổi giữa các tab để xem cảnh báo của từng loại bệnh/sâu hại:

#### Tab Bệnh Đạo Ôn & Bệnh Cháy Bìa Lá
Hiển thị:
- **Mức độ nguy cơ**: RẤT CAO / CAO / TRUNG BÌNH / THẤP / AN TOÀN
- **Xác suất nhiễm bệnh**: 0-100%
- **Ngày cao điểm**: Nếu có
- **Tin nhắn chi tiết**: Khuyến cáo và hướng dẫn
- **Bảng dữ liệu 7 ngày**: Chi tiết thời tiết và điểm nguy cơ

#### Tab 5 Module Mới
Hiển thị:
- **Mức độ nguy cơ**: CAO / TRUNG BÌNH / THẤP / AN TOÀN / ĐANG CHỜ CẬP NHẬT
- **Tin nhắn chi tiết**: Khuyến cáo và hướng dẫn
- **Thời gian cập nhật**: Lần cập nhật cuối cùng

### 4. Chạy Phân Tích

#### Phân Tích Từng Module
Click nút **"Phân tích [Tên Module]"** trên mỗi tab để chạy phân tích riêng cho module đó.

#### Phân Tích Tất Cả
Click nút **"Phân tích tất cả"** ở header để chạy phân tích cho cả 7 module cùng lúc.

## 🎨 Màu Sắc Theo Mức Độ Nguy Cơ

| Mức Độ | Màu | Mã Màu | Icon | Ý Nghĩa |
|--------|-----|--------|------|---------|
| RẤT CAO | 🔴 Đỏ | `#ff4d4f` | 🚨 | Nguy cơ cực kỳ cao, cần xử lý ngay |
| CAO | 🟠 Cam | `#fa8c16` | ⚠️ | Nguy cơ cao, cần theo dõi sát |
| TRUNG BÌNH | 🟡 Vàng | `#faad14` | ⚠️ | Nguy cơ trung bình, cần cảnh giác |
| THẤP | 🟢 Xanh lá | `#52c41a` | ✅ | Nguy cơ thấp, an toàn |
| AN TOÀN | 🔵 Xanh dương | `#1890ff` | ✅ | Hoàn toàn an toàn |
| ĐANG CHỜ CẬP NHẬT | ⚪ Xám | `#d9d9d9` | ⏳ | Chưa có dữ liệu |

## 🔄 Tự Động Làm Mới

- **Backend**: Tự động phân tích mỗi ngày lúc 6:00 sáng
- **Frontend**: Tự động làm mới dữ liệu mỗi 5 phút
- **Thủ công**: Click nút "Làm mới" hoặc "Phân tích ngay"

## 📊 API Endpoints

Tất cả các module đều có 2 endpoints:

| Module | Endpoint Lấy Dữ Liệu | Endpoint Chạy Phân Tích |
|--------|----------------------|-------------------------|
| Bệnh Đạo Ôn | `/ai-rice-blast/warning` | `/ai-rice-blast/run-now` |
| Bệnh Cháy Bìa Lá | `/ai-bacterial-blight/warning` | `/ai-bacterial-blight/run-now` |
| Sâu Đục Thân | `/ai-stem-borer/warning` | `/ai-stem-borer/run-now` |
| Muỗi Hành | `/ai-gall-midge/warning` | `/ai-gall-midge/run-now` |
| Rầy Nâu | `/ai-brown-plant-hopper/warning` | `/ai-brown-plant-hopper/run-now` |
| Bệnh Khô Vằn | `/ai-sheath-blight/warning` | `/ai-sheath-blight/run-now` |
| Bệnh Lem Lép Hạt | `/ai-grain-discoloration/warning` | `/ai-grain-discoloration/run-now` |

**Vị trí:**
- GET `/location` - Lấy vị trí hiện tại
- POST `/location` - Cập nhật vị trí

## 💻 Sử Dụng React Query Hooks

### Ví dụ: Sâu Đục Thân

```typescript
import {
  useStemBorerWarningQuery,
  useRunStemBorerAnalysisMutation
} from '@/queries/stem-borer';

// Trong component
const { data, isLoading, refetch } = useStemBorerWarningQuery();
const runAnalysis = useRunStemBorerAnalysisMutation();

// Chạy phân tích
runAnalysis.mutate();
```

### Tất cả hooks có sẵn:

```typescript
// Bệnh Đạo Ôn
import { useWarningQuery, useRunAnalysisMutation } from '@/queries/rice-blast';

// Bệnh Cháy Bìa Lá
import { 
  useBacterialBlightWarningQuery, 
  useRunBacterialBlightAnalysisMutation 
} from '@/queries/bacterial-blight';

// Sâu Đục Thân
import { 
  useStemBorerWarningQuery, 
  useRunStemBorerAnalysisMutation 
} from '@/queries/stem-borer';

// Muỗi Hành
import { 
  useGallMidgeWarningQuery, 
  useRunGallMidgeAnalysisMutation 
} from '@/queries/gall-midge';

// Rầy Nâu
import { 
  useBrownPlantHopperWarningQuery, 
  useRunBrownPlantHopperAnalysisMutation 
} from '@/queries/brown-plant-hopper';

// Bệnh Khô Vằn
import { 
  useSheathBlightWarningQuery, 
  useRunSheathBlightAnalysisMutation 
} from '@/queries/sheath-blight';

// Bệnh Lem Lép Hạt
import { 
  useGrainDiscolorationWarningQuery, 
  useRunGrainDiscolorationAnalysisMutation 
} from '@/queries/grain-discoloration';
```

## 🧩 Components

### DiseaseWarningCard (Component mới - Tổng quát)

Component tái sử dụng cho 5 module mới:

```typescript
import { DiseaseWarningCard } from '@/components/disease-warning';

<DiseaseWarningCard 
  warning={stemBorerWarning} 
  loading={isLoading}
  title="SÂU ĐỤC THÂN"
  borderColor="#fa8c16"
/>
```

### WarningCard (Component cũ)

Dành riêng cho Bệnh Đạo Ôn và Bệnh Cháy Bìa Lá (có thêm trường `probability` và `peak_days`):

```typescript
import { WarningCard } from '@/components/disease-warning';

<WarningCard warning={riceBlastWarning} loading={isLoading} />
```

## 🛠️ Troubleshooting

### Lỗi: "Không thể kết nối đến server"

**Nguyên nhân**: Backend chưa chạy

**Giải pháp**:
```bash
cd /Users/phuocsanh/My-Document/My-Tech/Xanh-AG-Source/XANH-AG-REACTJS-ADMIN
npm run docker:dev
```

### Lỗi: "Chưa có dữ liệu cảnh báo"

**Nguyên nhân**: Chưa cập nhật vị trí hoặc chưa chạy phân tích

**Giải pháp**:
1. Cập nhật vị trí ruộng lúa
2. Hoặc click "Phân tích ngay"

### Phân tích chậm (> 10 giây)

**Nguyên nhân**: API Open-Meteo có thể chậm

**Giải pháp**: Đợi thêm vài giây, hoặc thử lại sau

## 📝 Cấu Trúc Dữ Liệu Response

Tất cả các API đều trả về cấu trúc tương tự:

```typescript
{
  id: number
  generated_at: string
  risk_level: string  // "AN TOÀN" | "TRUNG BÌNH" | "CAO" | "ĐANG CHỜ CẬP NHẬT"
  message: string     // Thông điệp cảnh báo chi tiết
  daily_data: [       // Dữ liệu 7 ngày
    {
      date: string
      dayOfWeek: string
      riskLevel: string
      riskScore: number
      tempAvg: number
      humidityAvg: number
      // Các trường đặc thù của từng module...
    }
  ]
  updated_at: string
}
```

### Các trường đặc thù trong `daily_data`:

- **Sâu Đục Thân**: `sunHours` (số giờ nắng - quan trọng cho bướm vũ hóa)
- **Muỗi Hành**: `cloudAvg` (độ che phủ mây % - quan trọng cho muỗi hành)
- **Rầy Nâu**: `windSpeedAvg` (tốc độ gió km/h), `rainTotal` (lượng mưa mm)
- **Bệnh Khô Vằn**: `tempAvg` (nhiệt độ 28-32°C), `humidityAvg` (độ ẩm)
- **Bệnh Lem Lép Hạt**: `rainTotal` (lượng mưa - quan trọng nhất), `windSpeedAvg` (tốc độ gió)

## 🔄 Thay Đổi So Với Phiên Bản Cũ

### ✅ Đã Thêm Mới
- 5 query hooks mới (stem-borer, gall-midge, brown-plant-hopper, sheath-blight, grain-discoloration)
- Component `DiseaseWarningCard` tổng quát
- 5 tabs mới trong trang disease-warning

### ❌ Đã Xóa
- File `queries/pest-warning.ts` (module cũ đã tách thành 3 module riêng)
- Component `pest-warning-card.tsx` (thay bằng `DiseaseWarningCard`)
- Tab "Cảnh Báo Sâu Hại" cũ (thay bằng 3 tabs riêng: Sâu Đục Thân, Muỗi Hành, Rầy Nâu)

## 📚 Lưu Ý Khi Phát Triển

1. **Không tạo mock data**: Luôn lấy dữ liệu từ API backend
2. **Comment bằng tiếng Việt**: Tất cả comment phải bằng tiếng Việt
3. **Kiểm tra TypeScript**: Luôn chạy kiểm tra lỗi trước khi commit
4. **Bám sát cấu trúc**: Không tạo file/folder mới khi không cần thiết
5. **Xóa code không dùng**: Code/file nào không dùng nữa phải xóa đi

## 🔗 Tài Liệu Liên Quan

- [Frontend New Modules Guide](../../FRONTEND_NEW_MODULES_GUIDE.md)
- [Backend README](../../src-server/README.md)

---

**Chúc bạn sử dụng thành công! 🌾**
