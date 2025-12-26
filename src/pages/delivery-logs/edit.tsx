import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

/**
 * Trang edit - redirect đến create với edit mode
 */
const EditDeliveryLog: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    // Redirect đến trang create với query param để báo edit mode
    navigate(`/delivery-logs/create?id=${id}`, { replace: true });
  }, [id, navigate]);

  return null;
};

export default EditDeliveryLog;
