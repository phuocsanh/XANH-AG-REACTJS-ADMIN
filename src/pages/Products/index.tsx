import React from 'react'
import { Routes, Route } from 'react-router-dom'
import ProductsList from './productsList'
import ProductCreate from './productCreate'
import ProductEdit from './productEdit'

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
      <Route path="new" element={<ProductCreate />} />
      
      {/* Trang chỉnh sửa sản phẩm */}
      <Route path="edit/:id" element={<ProductEdit />} />
    </Routes>
  )
}

export default Products