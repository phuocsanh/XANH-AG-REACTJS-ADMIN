import React from "react"
import { Routes, Route } from "react-router-dom"
import DebtNotesList from "./debt-notes-list"

/**
 * Component chính quản lý routing cho module Debt Notes
 * Bao gồm trang danh sách phiếu nợ
 */
const DebtNotes: React.FC = () => {
  return (
    <Routes>
      {/* Trang danh sách phiếu nợ */}
      <Route index element={<DebtNotesList />} />
    </Routes>
  )
}

export default DebtNotes
