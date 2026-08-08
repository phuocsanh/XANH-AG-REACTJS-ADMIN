import { Routes, Route } from "react-router-dom"
import InventoryBorrowsList from "./inventory-borrows-list"
import InventoryBorrowCreate from "./inventory-borrow-create"

const InventoryBorrowsPage = () => {
  return (
    <Routes>
      <Route index element={<InventoryBorrowsList />} />
      <Route path="create" element={<InventoryBorrowCreate />} />
    </Routes>
  )
}

export default InventoryBorrowsPage
