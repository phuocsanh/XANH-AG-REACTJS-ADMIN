# 🚀 Hướng Dẫn Deploy Production

## Tổng Quan

Dự án đã được cấu hình sẵn để deploy lên **Vercel** với backend tại `https://xanh-ag-server.onrender.com`

---

## ⚙️ Cấu Hình Đã Setup

### 1. Environment Variables
- ✅ `.env.production` - Production API URL
- ✅ `.env.example` - Template cho developers
- ✅ `src/config/api.config.ts` - Centralized API configuration

### 2. Vercel Configuration
- ✅ `vercel.json` - Vercel settings (SPA routing, caching, env vars)
- ✅ `.vercelignore` - Exclude unnecessary files

### 3. Code Updates
- ✅ `src/queries/auth.ts` - Sử dụng `API_ENDPOINTS` thay vì hardcoded URLs
- ✅ `src/utils/api.ts` - Đã có sẵn dynamic API URL configuration

---

## 🎯 Cách Deploy

### Option 1: Sử dụng Script Tự Động (Khuyến nghị)

```bash
# Chạy script deploy
./deploy.sh
```

Script sẽ tự động:
1. Kiểm tra và cài Vercel CLI nếu chưa có
2. Login Vercel
3. Build test
4. Deploy production

### Option 2: Deploy Thủ Công

```bash
# 1. Cài Vercel CLI (nếu chưa có)
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel --prod
```

### Option 3: Deploy Qua GitHub (Continuous Deployment)

1. Push code lên GitHub repository
2. Truy cập https://vercel.com
3. Import repository
4. Vercel tự động deploy mỗi khi push code

---

## 🔧 Environment Variables Trên Vercel

Sau khi deploy, cần set environment variables trên Vercel dashboard:

1. Truy cập project trên Vercel
2. Settings → Environment Variables
3. Thêm:
   ```
   VITE_API_URL=https://xanh-ag-server.onrender.com
   ```
4. Redeploy để áp dụng

**Lưu ý:** Vercel đã tự động set `VITE_API_URL` từ `vercel.json`, nhưng bạn có thể override nếu cần.

---

## ✅ Checklist Trước Khi Deploy

- [ ] Đã test build local: `npm run build`
- [ ] Đã test preview: `npm run preview`
- [ ] Backend đang chạy tại: https://xanh-ag-server.onrender.com
- [ ] Đã kiểm tra CORS settings trên backend
- [ ] Đã commit tất cả changes

---

## 🧪 Test Build Local

```bash
# Build production
npm run build

# Preview build
npm run preview

# Mở browser và test
# http://localhost:4173
```

---

## 🌐 Sau Khi Deploy

### 1. Kiểm Tra URL

Vercel sẽ cung cấp URL dạng:
```
https://your-project-name.vercel.app
```

### 2. Test Các Chức Năng

- [ ] Đăng nhập
- [ ] Đổi mật khẩu
- [ ] CRUD operations
- [ ] API calls đến backend

### 3. Custom Domain (Optional)

Nếu muốn dùng tên miền riêng:

1. Vào Settings → Domains
2. Add domain: `yourdomain.com`
3. Cấu hình DNS theo hướng dẫn Vercel

---

## 🐛 Troubleshooting

### Lỗi: "Cannot connect to API"

**Nguyên nhân:** Backend chưa cấu hình CORS cho frontend domain

**Giải pháp:** Thêm Vercel domain vào CORS whitelist trên backend:

```typescript
// Backend: src-server/main.ts
app.enableCors({
  origin: [
    'http://localhost:5173',
    'https://your-project.vercel.app', // Thêm dòng này
  ],
  credentials: true,
});
```

### Lỗi: "404 Not Found" khi refresh page

**Nguyên nhân:** SPA routing chưa được cấu hình

**Giải pháp:** Đã được fix trong `vercel.json` với rewrites

### Lỗi: Environment variables không hoạt động

**Giải pháp:**
1. Kiểm tra `vercel.json` có đúng env vars
2. Hoặc set trực tiếp trên Vercel dashboard
3. Redeploy sau khi thay đổi env vars

---

## 📊 Monitoring

### Vercel Analytics

Vercel tự động cung cấp:
- Page views
- Performance metrics
- Error tracking

Truy cập: Project → Analytics

### Backend Monitoring

Kiểm tra backend logs trên Render:
- https://dashboard.render.com
- Chọn service → Logs

---

## 🔄 Continuous Deployment

### Setup Auto Deploy từ GitHub

1. Connect GitHub repository với Vercel
2. Mỗi khi push code lên `main` branch → Auto deploy
3. Pull requests → Preview deployment

### Branch Deployment

- `main` branch → Production
- Feature branches → Preview URLs

---

## 📝 Lưu Ý Quan Trọng

1. **Backend URL:** Đảm bảo backend luôn online tại `https://xanh-ag-server.onrender.com`
2. **CORS:** Backend phải allow requests từ Vercel domain
3. **Environment Variables:** Luôn dùng `VITE_` prefix cho Vite
4. **Build Time:** Vercel có giới hạn 45 phút cho free tier
5. **Bandwidth:** Unlimited cho free tier

---

## 🎉 Kết Quả

Sau khi deploy thành công, bạn sẽ có:

- ✅ Frontend production tại Vercel
- ✅ Backend production tại Render
- ✅ SSL/HTTPS tự động
- ✅ CDN toàn cầu
- ✅ Auto deployment từ Git
- ✅ Preview deployments cho PRs

---

## 📞 Hỗ Trợ

Nếu gặp vấn đề:

1. Kiểm tra Vercel logs: Project → Deployments → View logs
2. Kiểm tra backend logs trên Render
3. Test API endpoint trực tiếp: `curl https://xanh-ag-server.onrender.com/health`

---

**Chúc bạn deploy thành công! 🚀**
