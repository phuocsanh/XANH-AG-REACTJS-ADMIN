import React from "react"
import { Routes, Route } from "react-router-dom"
import PaymentsList from "./payments-list"

/**
 * Component chính quản lý routing cho module Payments
 * Bao gồm trang danh sách thanh toán
 */
const Payments: React.FC = () => {
  return (
    <Routes>
      {/* Trang danh sách thanh toán */}
      <Route index element={<PaymentsList />} />
    </Routes>
  )
}

export default Payments
