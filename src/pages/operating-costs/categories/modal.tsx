import React, { useEffect } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import { useCreateOperatingCostCategory, useUpdateOperatingCostCategory } from '@/queries/operating-cost-category';
import { OperatingCostCategory } from '@/types/operating-cost-category.types';

interface CategoryModalProps {
  visible: boolean;
  onCancel: () => void;
  initialData?: OperatingCostCategory | null;
}

const CategoryModal: React.FC<CategoryModalProps> = ({
  visible,
  onCancel,
  initialData,
}) => {
  const [form] = Form.useForm();
  const createMutation = useCreateOperatingCostCategory();
  const updateMutation = useUpdateOperatingCostCategory();

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
        message.success('Cập nhật loại chi phí thành công');
      } else {
        await createMutation.mutateAsync(values);
        message.success('Tạo loại chi phí thành công');
      }
      
      onCancel();
    } catch (error) {
      // console.error(error);
      // message.error('Có lỗi xảy ra');
    }
  };

  return (
    <Modal
      title={initialData ? "Cập nhật loại chi phí" : "Thêm loại chi phí mới"}
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
          <Input placeholder="VD: Phân bón, Lương nhân viên..." />
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
