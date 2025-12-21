import React, { useEffect } from 'react';
import { Modal, message } from 'antd';
import { useForm } from 'react-hook-form';
import { useCreateCostItem, useUpdateCostItem } from '@/queries/cost-item';
import type { CostItem } from '@/models/cost-item';
import FormField from '@/components/form/form-field';
import FormFieldNumber from '@/components/form/form-field-number';
import FormDatePicker from '@/components/form/form-date-picker';
import dayjs from 'dayjs';

interface CreateCostItemModalProps {
  visible: boolean;
  onCancel: () => void;
  initialData?: CostItem | null;
  riceCropId: number;
}

interface CostItemFormValues {
  item_name: string;
  expense_date: string;
  total_cost: number;
  notes?: string;
}

const CreateCostItemModal: React.FC<CreateCostItemModalProps> = ({
  visible,
  onCancel,
  initialData,
  riceCropId,
}) => {
  const createMutation = useCreateCostItem();
  const updateMutation = useUpdateCostItem();
  const isEdit = !!initialData;

  const { control, handleSubmit, reset } = useForm<CostItemFormValues>({
    defaultValues: {
      item_name: '',
      expense_date: dayjs().toISOString(),
      total_cost: 0,
      notes: '',
    },
  });

  useEffect(() => {
    if (visible) {
      if (initialData) {
        reset({
          item_name: initialData.item_name,
          expense_date: initialData.expense_date,
          total_cost: Number(initialData.total_cost),
          notes: initialData.notes || '',
        });
      } else {
        reset({
          item_name: '',
          expense_date: dayjs().toISOString(),
          total_cost: 0,
          notes: '',
        });
      }
    }
  }, [visible, initialData, reset]);

  const onSubmit = async (data: CostItemFormValues) => {
    try {
      const payload: any = {
        ...data,
        rice_crop_id: riceCropId,
        expense_date: dayjs(data.expense_date).format('YYYY-MM-DD'),
      };

      if (isEdit && initialData) {
        await updateMutation.mutateAsync({
          id: initialData.id,
          dto: payload,
        });
        message.success('Đã cập nhật chi phí');
      } else {
        await createMutation.mutateAsync(payload);
        message.success('Đã thêm chi phí canh tác');
      }

      onCancel();
    } catch (error) {
      console.error('Submit failed:', error);
      message.error('Có lỗi xảy ra');
    }
  };

  return (
    <Modal
      title={isEdit ? 'Sửa chi phí canh tác' : 'Thêm chi phí canh tác'}
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit(onSubmit)}
      confirmLoading={createMutation.isPending || updateMutation.isPending}
      width={600}
      okText={isEdit ? 'Cập nhật' : 'Thêm'}
      cancelText="Hủy"
    >
      <form className="mt-4 flex flex-col gap-4">
        <FormField
          name="item_name"
          control={control}
          label="Tên chi phí"
          required
          placeholder="VD: Mua phân DAP"
        />

        <FormDatePicker
          name="expense_date"
          control={control}
          label="Ngày chi"
          required
          placeholder="Chọn ngày chi"
          className="w-full"
        />

        <FormFieldNumber
          name="total_cost"
          control={control}
          label="Số tiền"
          required
          suffix="đ"
          placeholder="Nhập số tiền"
          className="w-full"
        />

        <FormField
          name="notes"
          control={control}
          label="Ghi chú"
          type="textarea"
          rows={3}
          placeholder="Ghi chú thêm (nếu có)"
        />
      </form>
    </Modal>
  );
};

export default CreateCostItemModal;
