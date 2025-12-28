/**
 * Modal Chốt sổ Công nợ cuối vụ
 * Hiển thị thông tin tích lũy và xử lý tặng quà
 */
import React, { useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Descriptions,
  Tag,
  Space,
  Spin,
  Alert,
  Divider,
} from 'antd';
import { GiftOutlined } from '@ant-design/icons';
import NumberInput from '@/components/common/number-input';
import { useRewardPreviewQuery, useCloseSeasonDebtNoteMutation } from '@/queries/debt-note';

const { TextArea } = Input;

interface CloseSeasonModalProps {
  open: boolean;
  debtNoteId: number | null;
  onClose: () => void;
}

/**
 * Component Modal chốt sổ công nợ
 */
const CloseSeasonModal: React.FC<CloseSeasonModalProps> = ({
  open,
  debtNoteId,
  onClose,
}) => {
  const [form] = Form.useForm();
  
  // Query để lấy thông tin preview
  const { data: previewData, isLoading } = useRewardPreviewQuery(debtNoteId || 0);
  
  // Mutation để chốt sổ
  const closeSeasonMutation = useCloseSeasonDebtNoteMutation();

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!debtNoteId) return;

    try {
      const values = await form.validateFields();
      
      await closeSeasonMutation.mutateAsync({
        id: debtNoteId,
        data: {
          gift_description: values.gift_description,
          gift_value: values.gift_value,
          notes: values.notes,
        },
      });

      form.resetFields();
      onClose();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  // Reset form khi đóng modal
  useEffect(() => {
    if (!open) {
      form.resetFields();
    }
  }, [open, form]);

  const summary = previewData?.summary;
  const customer = previewData?.customer;
  const currentSeason = previewData?.current_season;

  return (
    <Modal
      title="Chốt sổ Công nợ cuối vụ"
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      okText="Xác nhận chốt sổ"
      cancelText="Hủy"
      width={700}
      confirmLoading={closeSeasonMutation.isPending}
    >
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <Spin size="large" tip="Đang tải thông tin tích lũy..." />
        </div>
      ) : (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* Thông tin cơ bản */}
          <Descriptions bordered size="small" column={1}>
            <Descriptions.Item label="Khách hàng">
              <strong>{customer?.name}</strong>
            </Descriptions.Item>
            <Descriptions.Item label="Số điện thoại">
              {customer?.phone || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Mùa vụ hiện tại">
              {currentSeason?.name || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Công nợ vụ này">
              <strong style={{ color: '#1890ff' }}>
                {formatCurrency(currentSeason?.debt_amount || 0)}
              </strong>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                (Tổng giá trị mua hàng trong vụ)
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Khách đã trả">
              <strong style={{ color: '#52c41a' }}>
                {formatCurrency((currentSeason as any)?.paid_amount || 0)}
              </strong>
            </Descriptions.Item>
            <Descriptions.Item label="Còn nợ thực tế">
              <strong style={{ color: '#ff4d4f' }}>
                {formatCurrency((currentSeason as any)?.remaining_amount || 0)}
              </strong>
            </Descriptions.Item>
          </Descriptions>

          <Divider orientation="left">📊 Thông tin tích lũy</Divider>

          {/* Thông tin tích lũy */}
          <Descriptions bordered size="small" column={1}>
            <Descriptions.Item label="Đã tích lũy trước đó">
              {formatCurrency(summary?.previous_pending || 0)}
            </Descriptions.Item>
            <Descriptions.Item label="Công nợ vụ này">
              {formatCurrency(summary?.current_debt || 0)}
            </Descriptions.Item>
            <Descriptions.Item label="Tổng tích lũy">
              <strong style={{ fontSize: 16, color: '#1890ff' }}>
                {formatCurrency(summary?.total_after_close || 0)}
              </strong>
            </Descriptions.Item>
            <Descriptions.Item label="Mốc tặng quà">
              {formatCurrency(summary?.reward_threshold || 60000000)}
            </Descriptions.Item>
          </Descriptions>

          {/* Kết quả */}
          {summary?.will_receive_reward ? (
            <Alert
              message={
                summary.reward_count > 1
                  ? `🎉🎉 ĐẠT ${summary.reward_count} MỐC TẶNG QUÀ!`
                  : '🎉 ĐẠT MỐC TẶNG QUÀ!'
              }
              description={
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <strong>Số lần tặng quà:</strong>{' '}
                    <Tag color="success" style={{ fontSize: 14 }}>
                      {summary.reward_count} lần
                      {summary.reward_count > 1 && ' (gấp đôi!)'}
                    </Tag>
                  </div>
                  <div>
                    <strong>Số dư chuyển sang:</strong>{' '}
                    <span style={{ color: '#faad14' }}>
                      {formatCurrency(summary.remaining_amount)}
                    </span>
                  </div>
                  <div>
                    <strong>Còn thiếu để đạt mốc tiếp:</strong>{' '}
                    {formatCurrency(summary.shortage_to_next)}
                  </div>
                </Space>
              }
              type="success"
              showIcon
              icon={<GiftOutlined />}
            />
          ) : (
            <Alert
              message="Chưa đủ mốc tặng quà"
              description={
                <Space direction="vertical">
                  <div>
                    <strong>Số dư chuyển sang:</strong>{' '}
                    {formatCurrency(summary?.remaining_amount || 0)}
                  </div>
                  <div>
                    <strong>Còn thiếu:</strong>{' '}
                    <span style={{ color: '#ff4d4f' }}>
                      {formatCurrency(summary?.shortage_to_next || 0)}
                    </span>{' '}
                    nữa để đạt mốc tặng quà
                  </div>
                </Space>
              }
              type="warning"
              showIcon
            />
          )}

          {/* Form quà tặng - Luôn hiển thị để cho phép tặng quà ngoại lệ */}
          <Divider orientation="left">🎁 Thông tin quà tặng</Divider>
          <Form form={form} layout="vertical">
            {summary?.will_receive_reward && (
              <Alert 
                  message="Khách hàng đủ điều kiện nhận quà theo chính sách tích lũy" 
                  type="info" 
                  showIcon 
                  style={{ marginBottom: 16 }} 
              />
            )}
            <Form.Item
              label="Mô tả quà tặng"
              name="gift_description"
              rules={[
                { required: summary?.will_receive_reward, message: 'Vui lòng nhập mô tả quà tặng' },
              ]}
            >
              <Input placeholder="VD: 1 bao phân DAP 50kg" />
            </Form.Item>

            <Form.Item label="Giá trị quà tặng" name="gift_value">
              <NumberInput
                placeholder="Nhập giá trị quà tặng"
                addonAfter="VND"
              />
            </Form.Item>

            <Form.Item label="Ghi chú" name="notes">
              <TextArea rows={2} placeholder="Ghi chú thêm (nếu có)" />
            </Form.Item>
          </Form>
        </Space>
      )}
    </Modal>
  );
};

export default CloseSeasonModal;
