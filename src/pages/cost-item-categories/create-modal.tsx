import React, { useEffect } from 'react';
import { Modal, Form, Input, Switch, Row, Col, message } from 'antd';
import {
  useCreateCostItemCategory,
  useUpdateCostItemCategory,
} from '@/queries/cost-item-category';
import type { CostItemCategory } from '@/models/cost-item-category';

interface CreateCostItemCategoryModalProps {
  visible: boolean;
  onCancel: () => void;
  initialData?: CostItemCategory | null;
}

const CreateCostItemCategoryModal: React.FC<CreateCostItemCategoryModalProps> = ({
  visible,
  onCancel,
  initialData,
}) => {
  const [form] = Form.useForm();
  const createMutation = useCreateCostItemCategory();
  const updateMutation = useUpdateCostItemCategory();

  const isEdit = !!initialData;

  useEffect(() => {
    if (visible) {
      if (initialData) {
        form.setFieldsValue(initialData);
      } else {
        form.resetFields();
        form.setFieldsValue({
          is_active: true, // Mặc định hoạt động
        });
      }
    }
  }, [visible, initialData, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (isEdit && initialData) {
        await updateMutation.mutateAsync({
          id: initialData.id,
          data: values,
        });
        message.success('Đã cập nhật loại chi phí');
      } else {
        await createMutation.mutateAsync(values);
        message.success('Đã thêm loại chi phí');
      }

      form.resetFields();
      onCancel();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  return (
    <Modal
      title={isEdit ? 'Sửa loại chi phí' : 'Thêm loại chi phí'}
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
          name="name"
          label="Tên loại chi phí"
          rules={[{ required: true, message: 'Vui lòng nhập tên' }]}
        >
          <Input placeholder="VD: Giống lúa" />
        </Form.Item>


        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="is_active"
              label="Trạng thái"
              valuePropName="checked"
            >
              <Switch checkedChildren="Hoạt động" unCheckedChildren="Tạm ngưng" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="description"
          label="Mô tả"
        >
          <Input.TextArea rows={3} placeholder="Mô tả về loại chi phí này" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateCostItemCategoryModal;
