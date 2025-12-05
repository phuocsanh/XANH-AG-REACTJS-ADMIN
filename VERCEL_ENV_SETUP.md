# 🚀 Hướng Dẫn Set Environment Variables Trên Vercel

## Bước 1: Deploy Lần Đầu

Trước tiên, deploy project lên Vercel:

```bash
# Chạy script deploy
./deploy.sh

# Hoặc deploy thủ công
vercel --prod
```

Vercel sẽ hỏi một số câu hỏi:
- **Set up and deploy?** → Yes
- **Which scope?** → Chọn account của bạn
- **Link to existing project?** → No (lần đầu)
- **Project name?** → Nhập tên (ví dụ: xanh-ag-admin)
- **Directory?** → ./ (Enter)
- **Override settings?** → No (Enter)

Sau khi deploy xong, bạn sẽ nhận được URL:
```
https://xanh-ag-admin.vercel.app
```

---

## Bước 2: Truy Cập Vercel Dashboard

1. Mở browser và truy cập: **https://vercel.com/dashboard**
2. Đăng nhập (nếu chưa)
3. Bạn sẽ thấy project vừa deploy trong danh sách

---

## Bước 3: Vào Settings

1. Click vào **project name** (ví dụ: xanh-ag-admin)
2. Click tab **Settings** ở menu trên
3. Scroll xuống tìm mục **Environment Variables** ở sidebar bên trái

---

## Bước 4: Add Environment Variable

### Cách 1: Qua Web UI (Dễ nhất)

1. Click **Environment Variables** trong Settings
2. Click nút **Add New**
3. Điền thông tin:
   ```
   Name: VITE_API_URL
   Value: https://xanh-ag-server.onrender.com
   ```
4. Chọn **Environment:**
   - ✅ Check **Production**
   - ⬜ Uncheck Preview (optional)
   - ⬜ Uncheck Development (optional)
5. Click **Save**

### Cách 2: Qua Vercel CLI (Nhanh hơn)

```bash
# Set environment variable
vercel env add VITE_API_URL production

# Khi được hỏi, nhập:
# Value: https://xanh-ag-server.onrender.com

# Xác nhận
# ✓ Added Environment Variable VITE_API_URL to Project xanh-ag-admin
```

---

## Bước 5: Redeploy

Sau khi thêm environment variable, cần redeploy để áp dụng:

```bash
# Redeploy production
vercel --prod
```

Hoặc trên Web UI:
1. Vào tab **Deployments**
2. Click vào deployment mới nhất
3. Click nút **⋯** (3 chấm)
4. Chọn **Redeploy**

---

## Bước 6: Verify

Sau khi redeploy xong:

1. Mở URL production: `https://your-project.vercel.app`
2. Mở DevTools (F12)
3. Console → Kiểm tra API calls
4. Thử đăng nhập để test API connection

---

## 📸 Screenshots Hướng Dẫn

### 1. Vercel Dashboard
![Vercel Dashboard](https://vercel.com/_next/image?url=%2Fstatic%2Fdocs%2Fenv-vars-1.png)

### 2. Environment Variables Page
- Tìm **Settings** → **Environment Variables**
- Click **Add New**

### 3. Add Variable Form
```
┌─────────────────────────────────────┐
│ Name:  VITE_API_URL                 │
├─────────────────────────────────────┤
│ Value: https://xanh-ag-server...    │
├─────────────────────────────────────┤
│ ☑ Production                        │
│ ☐ Preview                           │
│ ☐ Development                       │
└─────────────────────────────────────┘
        [Cancel]  [Save]
```

---

## ✅ Checklist

- [ ] Deploy lần đầu lên Vercel
- [ ] Truy cập Vercel Dashboard
- [ ] Vào Settings → Environment Variables
- [ ] Add `VITE_API_URL` với value `https://xanh-ag-server.onrender.com`
- [ ] Chọn environment: Production
- [ ] Save
- [ ] Redeploy
- [ ] Test URL production

---

## 🔧 Troubleshooting

### Lỗi: "Environment variable not found"

**Nguyên nhân:** Chưa redeploy sau khi thêm env var

**Giải pháp:**
```bash
vercel --prod
```

### Lỗi: "API calls still going to localhost"

**Nguyên nhân:** Browser cache hoặc chưa clear cache

**Giải pháp:**
1. Hard refresh: `Ctrl + Shift + R` (Windows) hoặc `Cmd + Shift + R` (Mac)
2. Hoặc clear browser cache

### Kiểm tra env var đã được set chưa

```bash
# List tất cả env vars
vercel env ls

# Pull env vars về local (optional)
vercel env pull
```

---

## 📝 Lưu Ý Quan Trọng

1. **Prefix `VITE_`**: Vite chỉ expose env vars có prefix `VITE_` ra client
2. **Redeploy bắt buộc**: Phải redeploy sau khi thêm/sửa env vars
3. **Không commit `.env.production`**: Đã thêm vào `.gitignore`
4. **Multiple environments**: Có thể set khác nhau cho Production/Preview/Development

---

## 🎉 Kết Quả

Sau khi hoàn thành, bạn sẽ có:
- ✅ Environment variables được quản lý trên Vercel
- ✅ Không cần commit sensitive data vào Git
- ✅ Dễ dàng thay đổi config mà không cần redeploy code
- ✅ Production app hoạt động với backend tại Render

---

**Chúc bạn setup thành công! 🚀**

Nếu gặp vấn đề, hãy check lại từng bước hoặc xem logs trên Vercel Dashboard.
