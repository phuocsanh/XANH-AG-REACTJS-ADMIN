import React from "react"
import { Routes, Route } from "react-router-dom"
import CustomersList from "./customers-list"

/**
 * Component chính quản lý routing cho module Customers
 * Bao gồm trang danh sách khách hàng
 */
const Customers: React.FC = () => {
  return (
    <Routes>
      {/* Trang danh sách khách hàng */}
      <Route index element={<CustomersList />} />
    </Routes>
  )
}

export default Customers
