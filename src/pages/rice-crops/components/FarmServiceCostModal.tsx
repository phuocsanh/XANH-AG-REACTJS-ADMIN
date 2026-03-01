/**
 * Modal form để thêm/sửa chi phí dịch vụ/quà tặng cho ruộng lúa
 */

import React, { useEffect } from 'react';
import { Modal, Form, Input, InputNumber, DatePicker, Button } from 'antd';
import dayjs from 'dayjs';
import { useRiceCrop } from '@/queries/rice-crop';
import {
  useCreateFarmServiceCostMutation,
  useUpdateFarmServiceCostMutation,
  useCreateFarmGiftCostMutation,
  useUpdateFarmGiftCostMutation,
} from '@/queries/farm-service-cost';

interface FarmServiceCostModalProps {
  open: boolean;
  onCancel: () => void;
  riceCropId: number;
  editingCost: any;
  mode?: 'service' | 'gift';
}

export const FarmServiceCostModal: React.FC<FarmServiceCostModalProps> = ({
  open,
  onCancel,
  riceCropId,
  editingCost,
  mode = 'service',
}) => {
  const [form] = Form.useForm();
  const { data: riceCrop } = useRiceCrop(riceCropId);
  
  const createServiceMutation = useCreateFarmServiceCostMutation();
  const updateServiceMutation = useUpdateFarmServiceCostMutation();
  const createGiftMutation = useCreateFarmGiftCostMutation();
  const updateGiftMutation = useUpdateFarmGiftCostMutation();

  useEffect(() => {
    if (open && editingCost) {
      form.setFieldsValue({
        name: editingCost.name,
        amount: editingCost.amount,
        date: dayjs(editingCost.expense_date || editingCost.gift_date),
        notes: editingCost.notes,
      });
    } else if (open) {
      form.resetFields();
      form.setFieldsValue({
        date: dayjs(),
      });
    }
  }, [open, editingCost, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (!riceCrop) {
        return;
      }

      if (mode === 'service') {
        const payload = {
          name: values.name,
          amount: values.amount,
          season_id: riceCrop.season_id,
          customer_id: riceCrop.customer_id,
          rice_crop_id: riceCropId,
          expense_date: values.date.toISOString(),
          notes: values.notes,
          source: 'manual',
        };

        if (editingCost) {
          await updateServiceMutation.mutateAsync({
            id: editingCost.id,
            data: payload,
          });
        } else {
          await createServiceMutation.mutateAsync(payload);
        }
      } else {
        // Mode Gift
        const payload = {
          name: values.name,
          amount: values.amount,
          season_id: riceCrop.season_id,
          customer_id: riceCrop.customer_id,
          rice_crop_id: riceCropId,
          gift_date: values.date.toISOString(),
          notes: values.notes,
          source: 'manually_awarded',
        };

        if (editingCost) {
          await updateGiftMutation.mutateAsync({
            id: editingCost.id,
            data: payload,
          });
        } else {
          await createGiftMutation.mutateAsync(payload);
        }
      }

      onCancel();
    } catch (error) {
      console.error('Form validation error:', error);
    }
  };

  const isPending = createServiceMutation.isPending || updateServiceMutation.isPending || 
                    createGiftMutation.isPending || updateGiftMutation.isPending;

  return (
    <Modal
      title={editingCost ? `Chỉnh sửa ${mode === 'service' ? 'chi phí' : 'quà tặng'}` : `Thêm ${mode === 'service' ? 'chi phí' : 'quà tặng'} mới`}
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Hủy
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={isPending}
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
          label={mode === 'service' ? "Tên chi phí" : "Tên quà tặng"}
          rules={[{ required: true, message: `Vui lòng nhập tên ${mode === 'service' ? 'chi phí' : 'quà tặng'}` }]}
        >
          <Input placeholder={mode === 'service' ? "VD: Tiền kỹ sư thăm ruộng..." : "VD: Quà tặng tri ân..."} />
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
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
            parser={(value) => value?.replace(/\$\s?|(\.*)/g, '') as unknown as number}
            placeholder="0"
            addonAfter="đ"
          />
        </Form.Item>

        <Form.Item
          name="date"
          label={mode === 'service' ? "Ngày phát sinh" : "Ngày tặng"}
          rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}
        >
          <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
        </Form.Item>

        <Form.Item name="notes" label="Ghi chú">
          <Input.TextArea rows={3} placeholder="Ghi chú thêm..." />
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
