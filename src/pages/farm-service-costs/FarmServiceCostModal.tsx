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
  useCreateFarmGiftCostMutation,
  useUpdateFarmGiftCostMutation,
} from '@/queries/farm-service-cost';
import type { FarmServiceCost } from '@/models/farm-service-cost';

interface FarmServiceCostModalProps {
  open: boolean;
  onCancel: () => void;
  editingCost: any;
  mode: 'service' | 'gift';
}

interface FarmServiceCostFormValues {
  season_id: number;
  customer_id: number;
  rice_crop_id?: number | null;
  name: string;
  amount: number;
  date: string; // Dùng chung cho cả expense_date và gift_date trong form
  notes?: string;
}

export const FarmServiceCostModal: React.FC<FarmServiceCostModalProps> = ({
  open,
  onCancel,
  editingCost,
  mode
}) => {
  const { data: seasons } = useSeasonsQuery();
  const { data: customers } = useCustomersQuery();
  
  const createServiceMutation = useCreateFarmServiceCostMutation();
  const updateServiceMutation = useUpdateFarmServiceCostMutation();

  const createGiftMutation = useCreateFarmGiftCostMutation();
  const updateGiftMutation = useUpdateFarmGiftCostMutation();
  // Quà tặng tự động từ hóa đơn/debt note không cho sửa ngày qua modal này (hoặc tạm thời chưa cần updateGiftMutation)

  const { control, handleSubmit, reset, watch } = useForm<FarmServiceCostFormValues>({
    defaultValues: {
      season_id: undefined,
      customer_id: undefined,
      rice_crop_id: undefined,
      name: '',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
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
        date: (editingCost.expense_date || editingCost.gift_date || '').split('T')[0],
        notes: editingCost.notes || '',
      });
    } else if (open) {
      reset({
        season_id: undefined,
        customer_id: undefined,
        rice_crop_id: undefined,
        name: '',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        notes: '',
      });
    }
  }, [open, editingCost, reset]);

  const onSubmit = async (data: FarmServiceCostFormValues) => {
    try {
      if (mode === 'service') {
        const payload = {
          name: data.name,
          amount: data.amount,
          season_id: data.season_id,
          customer_id: data.customer_id,
          rice_crop_id: data.rice_crop_id || undefined,
          expense_date: new Date(data.date).toISOString(),
          notes: data.notes,
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
          name: data.name,
          amount: data.amount,
          season_id: data.season_id,
          customer_id: data.customer_id,
          rice_crop_id: data.rice_crop_id || undefined,
          gift_date: new Date(data.date).toISOString(),
          notes: data.notes,
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

  const isPending = createServiceMutation.isPending || updateServiceMutation.isPending || 
                    createGiftMutation.isPending || updateGiftMutation.isPending;

  return (
    <Modal
      title={editingCost ? `Chỉnh sửa ${mode === 'service' ? 'chi phí' : 'quà tặng'}` : `Thêm ${mode === 'service' ? 'chi phí' : 'quà tặng'} mới`}
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit(onSubmit)}
      confirmLoading={isPending}
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
          label={mode === 'service' ? "Tên chi phí" : "Tên quà tặng"}
          required
          placeholder={mode === 'service' ? "VD: Tiền kỹ sư thăm ruộng..." : "VD: Quà tặng tri ân..."}
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
            name="date"
            control={control}
            label={mode === 'service' ? "Ngày chi" : "Ngày tặng"}
            required
          />
        </div>

        <FormField
          name="notes"
          control={control}
          label="Ghi chú"
          type="textarea"
          placeholder="Ghi chú thêm..."
          rows={3}
        />
      </form>
    </Modal>
  );
};
