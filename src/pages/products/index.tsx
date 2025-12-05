import React from "react"
import { Routes, Route } from "react-router-dom"
import ProductsList from "./products-list"
import ProductFormPage from "./product-form-page"

/**
 * Component chính quản lý routing cho module Products
 * Bao gồm các trang: danh sách, tạo mới, chỉnh sửa sản phẩm
 */
const Products: React.FC = () => {
  return (
    <Routes>
      {/* Trang danh sách sản phẩm */}
      <Route index element={<ProductsList />} />

      {/* Trang tạo sản phẩm mới */}
      <Route path='new' element={<ProductFormPage />} />

      {/* Trang chỉnh sửa sản phẩm */}
      <Route path='edit/:id' element={<ProductFormPage />} />
    </Routes>
  )
}

export default Products
