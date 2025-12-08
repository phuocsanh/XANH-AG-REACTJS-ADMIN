import React from "react"
import { Routes, Route } from "react-router-dom"
import AreasList from "./areas-list"

/**
 * Component chính quản lý routing cho module Diện Tích Mỗi Công Đất
 * Bao gồm trang danh sách diện tích mỗi công đất
 */
const Areas: React.FC = () => {
  return (
    <Routes>
      {/* Trang danh sách vùng/lô đất */}
      <Route index element={<AreasList />} />
    </Routes>
  )
}

export default Areas
