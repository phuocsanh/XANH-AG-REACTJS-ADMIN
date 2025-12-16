import React, { useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Select, DatePicker, Button, message } from 'antd';
import { CreateOperatingCostDto, OperatingCost } from '@/types/operating-cost.types';
import { useCreateOperatingCost, useUpdateOperatingCost } from '@/queries/operating-cost';
import { useSeasonsQuery } from '@/queries/season';
import { useRiceCrops } from '@/queries/rice-crop';
import { useOperatingCostCategories } from '@/queries/operating-cost-category';
import dayjs from 'dayjs';

interface CreateOperatingCostModalProps {
  visible: boolean;
  onCancel: () => void;
  initialData?: OperatingCost | null;
  defaultValues?: Partial<CreateOperatingCostDto>;
}

const CreateOperatingCostModal: React.FC<CreateOperatingCostModalProps> = ({
  visible,
  onCancel,
  initialData,
  defaultValues,
}) => {
  const [form] = Form.useForm();
  const createMutation = useCreateOperatingCost();
  const updateMutation = useUpdateOperatingCost();

  // Load Seasons, Rice Crops, and Categories for selection
  const { data: seasons } = useSeasonsQuery({ limit: 100 });
  const { data: categories } = useOperatingCostCategories({ limit: 100 });
  
  // Debug: Log categories structure
  console.log('Categories data:', categories);
  
  // Watch season_id to filter rice crops
  const selectedSeasonId = Form.useWatch('season_id', form);
  
  const { data: riceCrops, isFetching: isFetchingRiceCrops } = useRiceCrops(
      { limit: 100, season_id: selectedSeasonId }, 
      { enabled: !!selectedSeasonId }
  );

  useEffect(() => {
    if (visible && initialData) {
      form.setFieldsValue({
        ...initialData,
        expense_date: initialData.expense_date ? dayjs(initialData.expense_date) : dayjs(),
      });
    } else if (visible) {
      form.resetFields();
      form.setFieldsValue({
          expense_date: dayjs(),
          ...defaultValues,
      });
    }
  }, [visible, initialData, form, defaultValues]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      const payload: CreateOperatingCostDto = {
        ...values,
        expense_date: values.expense_date.toISOString(),
      };

      if (initialData) {
        await updateMutation.mutateAsync({ id: initialData.id, data: payload });
        message.success('Cập nhật chi phí thành công');
      } else {
        await createMutation.mutateAsync(payload);
        message.success('Tạo chi phí thành công');
      }
      
      onCancel();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Modal
      title={initialData ? "Cập nhật chi phí vận hành" : "Thêm chi phí vận hành mới"}
      open={visible}
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
          {initialData ? "Lưu thay đổi" : "Tạo mới"}
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label="Tên chi phí"
          rules={[{ required: true, message: 'Vui lòng nhập tên chi phí' }]}
        >
          <Input placeholder="VD: Mua phân bón đợt 1" />
        </Form.Item>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="value"
            label="Số tiền"
            rules={[{ required: true, message: 'Vui lòng nhập số tiền' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value?.replace(/\$\s?|(,*)/g, '') as unknown as number}
              placeholder="0"
            />
          </Form.Item>

          <Form.Item
            name="category_id"
            label="Loại chi phí"
            rules={[{ required: true, message: 'Vui lòng chọn loại' }]}
          >
            <Select placeholder="Chọn loại chi phí">
              {Array.isArray(categories?.data) && categories.data.map((c: any) => (
                <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <Form.Item
                name="season_id"
                label="Thuộc Mùa vụ (Tùy chọn)"
                tooltip="Chọn nếu chi phí này tính cho cả mùa"
            >
                <Select allowClear placeholder="Chọn mùa vụ" showSearch filterOption={(input, option: any) =>
                  option?.children?.toLowerCase().includes(input.toLowerCase())
                }>
                    {seasons?.data?.items?.map((s: any) => (
                        <Select.Option key={s.id} value={s.id}>{s.name} ({s.year})</Select.Option>
                    ))}
                </Select>
            </Form.Item>

            <Form.Item
                name="rice_crop_id"
                label="Thuộc ruộng lúa (Tùy chọn)"
                tooltip="Chọn nếu chi phí này chỉ dành riêng cho 1 ruộng cụ thể"
            >
                <Select 
                    allowClear 
                    placeholder={selectedSeasonId ? "Chọn Ruộng lúa" : "Vui lòng chọn mùa vụ trước"} 
                    showSearch 
                    filterOption={(input, option: any) =>
                        option?.children?.toLowerCase().includes(input.toLowerCase())
                    }
                    disabled={!selectedSeasonId}
                    loading={isFetchingRiceCrops}
                >
                    {riceCrops?.data?.map((r: any) => (
                        <Select.Option key={r.id} value={r.id}>{r.field_name} - {r.customer?.name}</Select.Option>
                    ))}
                </Select>
            </Form.Item>
        </div>

        <Form.Item
          name="expense_date"
          label="Ngày chi"
          rules={[{ required: true, message: 'Vui lòng chọn ngày chi' }]}
        >
          <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
        </Form.Item>

        <Form.Item name="description" label="Mô tả / Ghi chú">
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateOperatingCostModal;
