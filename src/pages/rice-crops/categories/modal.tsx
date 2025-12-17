import React, { useEffect } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import { useCreateCostItemCategory, useUpdateCostItemCategory } from '@/queries/cost-item-category';
import { CostItemCategory } from '@/types/cost-item-category.types';

interface CategoryModalProps {
  visible: boolean;
  onCancel: () => void;
  initialData?: CostItemCategory | null;
}

const CategoryModal: React.FC<CategoryModalProps> = ({
  visible,
  onCancel,
  initialData,
}) => {
  const [form] = Form.useForm();
  const createMutation = useCreateCostItemCategory();
  const updateMutation = useUpdateCostItemCategory();

  useEffect(() => {
    if (visible) {
      if (initialData) {
        form.setFieldsValue(initialData);
      } else {
        form.resetFields();
      }
    }
  }, [visible, initialData, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (initialData) {
        await updateMutation.mutateAsync({ id: initialData.id, data: values });
        message.success('Cập nhật loại canh tác thành công');
      } else {
        await createMutation.mutateAsync(values);
        message.success('Tạo loại canh tác thành công');
      }
      
      onCancel();
    } catch (error) {
      // console.error(error);
      // message.error('Có lỗi xảy ra');
    }
  };

  return (
    <Modal
      title={initialData ? "Cập nhật loại chi phí canh tác" : "Thêm loại chi phí canh tác mới"}
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
          label="Tên loại chi phí"
          rules={[{ required: true, message: 'Vui lòng nhập tên loại' }]}
        >
          <Input placeholder="VD: Bón phân, Xịt thuốc, Làm đất..." />
        </Form.Item>

        <Form.Item
          name="description"
          label="Mô tả"
        >
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CategoryModal;
