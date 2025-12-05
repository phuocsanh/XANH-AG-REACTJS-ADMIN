// Router cho Phiếu Trả Hàng

import { Routes, Route } from 'react-router-dom'
import ReturnsList from './returns-list'
import ReturnCreate from './return-create'
import ReturnDetail from './return-detail'

const ReturnsPage = () => {
  return (
    <Routes>
      <Route index element={<ReturnsList />} />
      <Route path="create" element={<ReturnCreate />} />
      <Route path=":id" element={<ReturnDetail />} />
    </Routes>
  )
}

export default ReturnsPage
