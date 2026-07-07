import React from "react"
import { Routes, Route } from "react-router-dom"
import LoansList from "./loans-list"

const Loans: React.FC = () => {
  return (
    <Routes>
      <Route index element={<LoansList />} />
    </Routes>
  )
}

export default Loans
