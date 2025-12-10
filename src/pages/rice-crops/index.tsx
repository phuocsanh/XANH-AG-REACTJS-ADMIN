import React from 'react';
import { Routes, Route } from 'react-router-dom';
import RiceCropsList from './rice-crops-list';
import RiceCropDetail from './rice-crop-detail';

/**
 * Component chính quản lý routing cho module Rice Crops
 */
const RiceCrops: React.FC = () => {
  return (
    <Routes>
      {/* Trang  Danh sách ruộng lúa */}
      <Route index element={<RiceCropsList />} />
      <Route path=":id" element={<RiceCropDetail />} />
    </Routes>
  );
};

export default RiceCrops;
