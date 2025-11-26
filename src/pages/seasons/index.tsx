import React from "react"
import { Routes, Route } from "react-router-dom"
import SeasonsList from "./seasons-list"

/**
 * Component chính quản lý routing cho module Seasons
 * Bao gồm trang danh sách mùa vụ
 */
const Seasons: React.FC = () => {
  return (
    <Routes>
      {/* Trang danh sách mùa vụ */}
      <Route index element={<SeasonsList />} />
    </Routes>
  )
}

export default Seasons
