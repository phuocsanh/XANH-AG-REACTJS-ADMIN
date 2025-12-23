/**
 * Modal form để thêm/sửa chi phí dịch vụ/quà tặng (standalone - không gắn với ruộng lúa cụ thể)
 */

import React, { useEffect } from 'react';
import { Modal } from 'antd';
import { useForm } from 'react-hook-form';
import { FormField, FormFieldNumber, FormComboBox, FormDatePicker } from '@/components/form';
import { useSeasonsQuery } from '@/queries/season';
import { useCustomersQuery } from '@/queries/customer';
import { useRiceCrops } from '@/queries/rice-crop';
import {
  useCreateFarmServiceCostMutation,
  useUpdateFarmServiceCostMutation,
} from '@/queries/farm-service-cost';
import type { FarmServiceCost } from '@/models/farm-service-cost';

interface FarmServiceCostModalProps {
  open: boolean;
  onCancel: () => void;
  editingCost: FarmServiceCost | null;
}

interface FarmServiceCostFormValues {
  season_id: number;
  customer_id: number;
  rice_crop_id?: number | null;
  name: string;
  amount: number;
  expense_date: string;
  notes?: string;
}

export const FarmServiceCostModal: React.FC<FarmServiceCostModalProps> = ({
  open,
  onCancel,
  editingCost,
}) => {
  const { data: seasons } = useSeasonsQuery();
  const { data: customers } = useCustomersQuery();
  
  const createMutation = useCreateFarmServiceCostMutation();
  const updateMutation = useUpdateFarmServiceCostMutation();

  const { control, handleSubmit, reset, watch } = useForm<FarmServiceCostFormValues>({
    defaultValues: {
      season_id: undefined,
      customer_id: undefined,
      rice_crop_id: undefined,
      name: '',
      amount: 0,
      expense_date: new Date().toISOString().split('T')[0],
      notes: '',
    },
  });

  const selectedSeasonId = watch('season_id');
  const { data: riceCrops } = useRiceCrops({ season_id: selectedSeasonId });

  // Reset form khi modal mở/đóng hoặc editingCost thay đổi
  useEffect(() => {
    if (open && editingCost) {
      reset({
        season_id: editingCost.season_id,
        customer_id: editingCost.customer_id,
        rice_crop_id: editingCost.rice_crop_id,
        name: editingCost.name,
        amount: editingCost.amount,
        expense_date: editingCost.expense_date.split('T')[0],
        notes: editingCost.notes || '',
      });
    } else if (open) {
      reset({
        season_id: undefined,
        customer_id: undefined,
        rice_crop_id: undefined,
        name: '',
        amount: 0,
        expense_date: new Date().toISOString().split('T')[0],
        notes: '',
      });
    }
  }, [open, editingCost, reset]);

  const onSubmit = async (data: FarmServiceCostFormValues) => {
    try {
      const payload = {
        name: data.name,
        amount: data.amount,
        season_id: data.season_id,
        customer_id: data.customer_id,
        rice_crop_id: data.rice_crop_id || undefined,
        expense_date: new Date(data.expense_date).toISOString(),
        notes: data.notes,
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
      console.error('Form submission error:', error);
    }
  };

  // Tạo options cho seasons
  const seasonOptions = seasons?.data?.items?.map((s: any) => ({
    value: s.id,
    label: `${s.name} (${s.year})`,
  })) || [];

  // Tạo options cho customers
  const customerOptions = customers?.data?.items?.map((c: any) => ({
    value: c.id,
    label: c.name,
  })) || [];

  // Tạo options cho rice crops
  const riceCropOptions = riceCrops?.data?.map((r: any) => ({
    value: r.id,
    label: `${r.field_name} - ${r.customer?.name}`,
  })) || [];

  return (
    <Modal
      title={editingCost ? 'Chỉnh sửa chi phí dịch vụ' : 'Thêm chi phí dịch vụ/quà tặng mới'}
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit(onSubmit)}
      confirmLoading={createMutation.isPending || updateMutation.isPending}
      width={700}
      okText={editingCost ? 'Lưu thay đổi' : 'Tạo mới'}
      cancelText="Hủy"
    >
      <form className="mt-4">
        <div className="grid grid-cols-2 gap-x-4">
          <FormComboBox
            name="season_id"
            control={control}
            label="Mùa vụ"
            options={seasonOptions}
            required
            placeholder="Chọn mùa vụ"
          />

          <FormComboBox
            name="customer_id"
            control={control}
            label="Khách hàng"
            options={customerOptions}
            required
            placeholder="Chọn khách hàng"
            showSearch
          />
        </div>

        <FormComboBox
          name="rice_crop_id"
          control={control}
          label="Ruộng lúa (Tùy chọn)"
          options={riceCropOptions}
          placeholder="Chọn ruộng lúa (nếu có)"
          allowClear
          disabled={!selectedSeasonId}
        />

        <FormField
          name="name"
          control={control}
          label="Tên chi phí/Quà tặng"
          required
          placeholder="VD: Tiền kỹ sư thăm ruộng, Quà tặng phân bón..."
        />

        <div className="grid grid-cols-2 gap-x-4">
          <FormFieldNumber
            name="amount"
            control={control}
            label="Số tiền"
            required
            decimalScale={0}
            suffix=" đ"
          />

          <FormDatePicker
            name="expense_date"
            control={control}
            label="Ngày phát sinh"
            required
          />
        </div>

        <FormField
          name="notes"
          control={control}
          label="Ghi chú"
          type="textarea"
          placeholder="Ghi chú thêm về chi phí này..."
          rows={3}
        />
      </form>
    </Modal>
  );
};
