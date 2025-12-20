import React, { useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Select, Row, Col, message } from 'antd';
import { useCreateCostItem, useUpdateCostItem } from '@/queries/cost-item';
import { useCostItemCategories } from '@/queries/cost-item-category';
import type { CostItem } from '@/models/cost-item';
import { DatePicker } from '@/components/common';
import dayjs from 'dayjs';

interface CreateCostItemModalProps {
  visible: boolean;
  onCancel: () => void;
  initialData?: CostItem | null;
  riceCropId: number;
}

const CreateCostItemModal: React.FC<CreateCostItemModalProps> = ({
  visible,
  onCancel,
  initialData,
  riceCropId,
}) => {
  const [form] = Form.useForm();
  const createMutation = useCreateCostItem();
  const updateMutation = useUpdateCostItem();
  
  // Load categories từ database
  const { data: categoriesData, isLoading: loadingCategories } = useCostItemCategories();
  const categories = categoriesData?.data || [];

  const isEdit = !!initialData;

  useEffect(() => {
    if (visible) {
      if (initialData) {
        form.setFieldsValue({
          ...initialData,
          expense_date: dayjs(initialData.expense_date),
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          rice_crop_id: riceCropId,
          expense_date: dayjs(),
        });
      }
    }
  }, [visible, initialData, form, riceCropId]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      const payload = {
        ...values,
        rice_crop_id: riceCropId,
        expense_date: values.expense_date.format('YYYY-MM-DD'),
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

      form.resetFields();
      onCancel();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  // Map categories từ DB sang options
  const categoryOptions = categories.map(cat => ({
    value: cat.id,
    label: `${cat.icon || ''} ${cat.name}`.trim(),
  }));


  return (
    <Modal
      title={isEdit ? 'Sửa chi phí canh tác' : 'Thêm chi phí canh tác'}
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={createMutation.isPending || updateMutation.isPending}
      width={600}
      okText={isEdit ? 'Cập nhật' : 'Thêm'}
      cancelText="Hủy"
    >
      <Form
        form={form}
        layout="vertical"
      >
        <Form.Item
          name="item_name"
          label="Tên chi phí"
          rules={[{ required: true, message: 'Vui lòng nhập tên chi phí' }]}
        >
          <Input placeholder="VD: Mua phân DAP" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="category"
              label="Loại chi phí"
              rules={[{ required: true, message: 'Vui lòng chọn loại' }]}
            >
              <Select
                options={categoryOptions}
                placeholder="Chọn loại chi phí"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="expense_date"
              label="Ngày chi"
              rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="total_cost"
          label="Số tiền"
          rules={[{ required: true, message: 'Vui lòng nhập số tiền' }]}
        >
          <InputNumber
            min={0}
            style={{ width: '100%' }}
            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            placeholder="0"
            addonAfter="₫"
          />
        </Form.Item>

        <Form.Item
          name="notes"
          label="Ghi chú"
        >
          <Input.TextArea rows={3} placeholder="Ghi chú thêm (nếu có)" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateCostItemModal;
