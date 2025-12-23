/**
 * Modal form để thêm/sửa chi phí dịch vụ/quà tặng
 */

import React, { useEffect } from 'react';
import { Modal, Form, Input, InputNumber, DatePicker, Button } from 'antd';
import dayjs from 'dayjs';
import { useRiceCrop } from '@/queries/rice-crop';
import {
  useCreateFarmServiceCostMutation,
  useUpdateFarmServiceCostMutation,
} from '@/queries/farm-service-cost';
import type { FarmServiceCost } from '@/models/farm-service-cost';

interface FarmServiceCostModalProps {
  open: boolean;
  onCancel: () => void;
  riceCropId: number;
  editingCost: FarmServiceCost | null;
}

export const FarmServiceCostModal: React.FC<FarmServiceCostModalProps> = ({
  open,
  onCancel,
  riceCropId,
  editingCost,
}) => {
  const [form] = Form.useForm();
  const { data: riceCrop } = useRiceCrop(riceCropId);
  
  const createMutation = useCreateFarmServiceCostMutation();
  const updateMutation = useUpdateFarmServiceCostMutation();

  useEffect(() => {
    if (open && editingCost) {
      form.setFieldsValue({
        name: editingCost.name,
        amount: editingCost.amount,
        expense_date: dayjs(editingCost.expense_date),
        notes: editingCost.notes,
      });
    } else if (open) {
      form.resetFields();
      form.setFieldsValue({
        expense_date: dayjs(),
      });
    }
  }, [open, editingCost, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (!riceCrop) {
        return;
      }

      const payload = {
        name: values.name,
        amount: values.amount,
        season_id: riceCrop.season_id,
        customer_id: riceCrop.customer_id,
        rice_crop_id: riceCropId,
        expense_date: values.expense_date.toISOString(),
        notes: values.notes,
        source: 'manual',
      };

      if (editingCost) {
        await updateMutation.mutateAsync({
          id: editingCost.id,
          data: payload,
        });
      } else {
        await createMutation.mutateAsync(payload);
      }

      onCancel();
    } catch (error) {
      console.error('Form validation error:', error);
    }
  };

  return (
    <Modal
      title={editingCost ? 'Chỉnh sửa chi phí dịch vụ' : 'Thêm chi phí dịch vụ/quà tặng mới'}
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Hủy
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={createMutation.isPending || updateMutation.isPending}
          onClick={handleSubmit}
        >
          {editingCost ? 'Lưu thay đổi' : 'Tạo mới'}
        </Button>,
      ]}
      width={600}
    >
      <Form form={form} layout="vertical" className="mt-4">
        <Form.Item
          name="name"
          label="Tên chi phí/Quà tặng"
          rules={[{ required: true, message: 'Vui lòng nhập tên chi phí' }]}
        >
          <Input placeholder="VD: Tiền kỹ sư thăm ruộng, Quà tặng phân bón..." />
        </Form.Item>

        <Form.Item
          name="amount"
          label="Số tiền"
          rules={[
            { required: true, message: 'Vui lòng nhập số tiền' },
            { type: 'number', min: 0, message: 'Số tiền phải lớn hơn 0' },
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value) => value?.replace(/\$\s?|(,*)/g, '') as unknown as number}
            placeholder="0"
            addonAfter="đ"
          />
        </Form.Item>

        <Form.Item
          name="expense_date"
          label="Ngày phát sinh"
          rules={[{ required: true, message: 'Vui lòng chọn ngày phát sinh' }]}
        >
          <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
        </Form.Item>

        <Form.Item name="notes" label="Ghi chú">
          <Input.TextArea rows={3} placeholder="Ghi chú thêm về chi phí này..." />
        </Form.Item>

        {riceCrop && (
          <div className="bg-gray-50 p-3 rounded mb-4">
            <div className="text-sm text-gray-600">
              <div><strong>Ruộng lúa:</strong> {riceCrop.field_name}</div>
              <div><strong>Khách hàng:</strong> {riceCrop.customer?.name}</div>
              <div><strong>Mùa vụ:</strong> {riceCrop.season?.name} ({riceCrop.season?.year})</div>
            </div>
          </div>
        )}
      </Form>
    </Modal>
  );
};
