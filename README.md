# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Kiến trúc dự án

Dự án đang chuyển đổi sang kiến trúc mới theo phong cách mobile để tăng tính tái sử dụng và dễ bảo trì.

### Cấu trúc mới

```
src/
├── models/          # Model định nghĩa interface/type
├── queries/         # Query hooks sử dụng React Query
├── components/      # Component UI
├── pages/           # Page components
├── utils/           # Utilities
└── services/        # Sẽ bị xóa dần dần
```

### Hướng dẫn

Xem chi tiết tại:

- [Hướng dẫn kiến trúc](ARCHITECTURE_GUIDELINES.md)
- [Kế hoạch chuyển đổi](MIGRATION_PLAN.md)
