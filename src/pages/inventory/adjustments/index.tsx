// Router cho Phiếu Điều Chỉnh Kho

import { Routes, Route } from 'react-router-dom'
import AdjustmentsList from './adjustments-list'
import AdjustmentCreate from './adjustment-create'
import AdjustmentDetail from './adjustment-detail'

const AdjustmentsPage = () => {
  return (
    <Routes>
      <Route index element={<AdjustmentsList />} />
      <Route path="create" element={<AdjustmentCreate />} />
      <Route path=":id/edit" element={<AdjustmentCreate />} />
      <Route path=":id" element={<AdjustmentDetail />} />
    </Routes>
  )
}

export default AdjustmentsPage
