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
  Table,
  Tabs,
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

interface AccumulationItem {
  id: number;
  season_name: string;
  amount: number;
  closed_at: string;
  reward_given: boolean;
  reward_count: number;
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
          manual_remaining_amount: values.manual_remaining_amount,
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

  // Set giá trị mặc định cho số dư chuyển sang từ preview
  useEffect(() => {
    if (open && previewData?.summary) {
      form.setFieldsValue({
        manual_remaining_amount: previewData.summary.remaining_amount,
      });
    }
  }, [open, previewData, form]);

  const summary = previewData?.summary;
  const customer = previewData?.customer;
  const currentSeason = previewData?.current_season;
  const isSettled = currentSeason?.status === 'settled';

  // Định nghĩa cột cho bảng lịch sử tích lũy
  const accumulationColumns = [
    { title: 'Vụ mùa', dataIndex: 'season_name', key: 'season_name' },
    { 
      title: 'Doanh số vụ', 
      dataIndex: 'amount', 
      key: 'amount',
      render: (val: number) => formatCurrency(val)
    },
    { 
      title: 'Ngày chốt', 
      dataIndex: 'closed_at', 
      key: 'closed_at',
      render: (val: string) => val ? new Date(val).toLocaleDateString('vi-VN') : '-'
    },
    {
      title: 'Quà tặng',
      key: 'reward',
      render: (record: AccumulationItem) => record.reward_given ? <Tag color="gold">Đã nhận ({record.reward_count})</Tag> : <Tag>Chưa đạt mốc</Tag>
    }
  ];

  // Định nghĩa cột cho bảng lịch sử quà tặng
  const rewardColumns = [
    { 
      title: 'Ngày nhận', 
      dataIndex: 'reward_date', 
      key: 'reward_date',
      render: (val: string) => new Date(val).toLocaleDateString('vi-VN')
    },
    { title: 'Mô tả quà', dataIndex: 'gift_description', key: 'gift_description' },
    { 
      title: 'Giá trị', 
      dataIndex: 'gift_value', 
      key: 'gift_value',
      render: (val: number) => val > 0 ? formatCurrency(val) : '-'
    },
    { 
      title: 'Mốc tích lũy', 
      dataIndex: 'accumulated_amount', 
      key: 'accumulated_amount',
      render: (val: number) => formatCurrency(val)
    },
  ];

  return (
    <Modal
      title={isSettled ? "Chi tiết tích lũy & Quà tặng" : "Chốt sổ Công nợ cuối vụ"}
      open={open}
      onCancel={onClose}
      onOk={isSettled ? onClose : handleSubmit}
      okText={isSettled ? "Đóng" : "Xác nhận chốt sổ"}
      cancelButtonProps={{ style: { display: isSettled ? 'none' : 'inline-block' } }}
      width={800}
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
                {formatCurrency(currentSeason?.paid_amount || 0)}
              </strong>
            </Descriptions.Item>
            <Descriptions.Item label="Còn nợ thực tế">
              <strong style={{ color: '#ff4d4f' }}>
                {formatCurrency(currentSeason?.remaining_amount || 0)}
              </strong>
            </Descriptions.Item>
          </Descriptions>

          {/* Tabs Lịch sử */}
          <Tabs defaultActiveKey="1" items={[
            {
              key: '1',
              label: 'Vụ mùa hiện tại',
              children: (
                <Descriptions bordered size="small" column={1}>
                  <Descriptions.Item label="Công nợ vụ này">
                    <strong style={{ color: '#1890ff' }}>{formatCurrency(currentSeason?.debt_amount || 0)}</strong>
                  </Descriptions.Item>
                  <Descriptions.Item label="Khách đã trả">{formatCurrency(currentSeason?.paid_amount || 0)}</Descriptions.Item>
                  <Descriptions.Item label="Còn nợ thực tế">{formatCurrency(currentSeason?.remaining_amount || 0)}</Descriptions.Item>
                  <Descriptions.Item label="Đã tích lũy cũ">{formatCurrency(summary?.previous_pending || 0)}</Descriptions.Item>
                  <Descriptions.Item label="Tổng tích lũy hiện tại">
                    <strong style={{ fontSize: 16, color: '#1890ff' }}>{formatCurrency((summary?.previous_pending || 0) + (currentSeason?.debt_amount || 0))}</strong>
                  </Descriptions.Item>
                </Descriptions>
              )
            },
            {
              key: '2',
              label: `Lịch sử các vụ (${previewData?.accumulation_history?.length || 0})`,
              children: (
                <Table 
                  dataSource={previewData?.accumulation_history} 
                  columns={accumulationColumns} 
                  pagination={{ pageSize: 5 }} 
                  size="small" 
                  rowKey="id"
                />
              )
            },
            {
              key: '3',
              label: `Lịch sử quà tặng (${previewData?.previous_rewards?.length || 0})`,
              children: (
                <Table 
                  dataSource={previewData?.previous_rewards} 
                  columns={rewardColumns} 
                  pagination={{ pageSize: 5 }} 
                  size="small" 
                  rowKey="id"
                />
              )
            }
          ]} />

          {/* Kết quả Alert */}
          {!isSettled && (
            summary?.will_receive_reward ? (
              <Alert
                message={summary?.reward_count && summary.reward_count > 1 ? `🎉🎉 ĐẠT ${summary.reward_count} MỐC TẶNG QUÀ!` : '🎉 ĐẠT MỐC TẶNG QUÀ!'}
                description={
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <strong>Số lần tặng quà:</strong> <Tag color="success">{summary?.reward_count} lần</Tag>
                    </div>
                    <div>
                      <strong>Số dư chuyển sang (Gợi ý):</strong> <span style={{ color: '#faad14' }}>{formatCurrency(summary?.remaining_amount || 0)}</span>
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
                description={`Còn thiếu ${formatCurrency(summary?.shortage_to_next || 0)} nữa để đạt mốc ${formatCurrency(summary?.reward_threshold || 60000000)}`}
                type="warning"
                showIcon
              />
            )
          )}

          {/* Form tặng quà (Chỉ hiện khi chưa chốt) */}
          {!isSettled ? (
            <>
              <Divider orientation="left">🎁 Thông tin chốt sổ & Quà tặng</Divider>
              <Form form={form} layout="vertical">
                <Form.Item label="Số dư tích lũy chuyển sang vụ sau" name="manual_remaining_amount">
                  <NumberInput placeholder="Nhập số tiền chuyển sang" addonAfter="VND" />
                </Form.Item>
                <Form.Item 
                  label="Mô tả quà tặng" 
                  name="gift_description" 
                  rules={[
                    { 
                      required: summary?.will_receive_reward, 
                      message: 'Vui lòng nhập mô tả quà tặng' 
                    },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        const giftValue = getFieldValue('gift_value');
                        if (giftValue > 0 && !value) {
                          return Promise.reject(new Error('Vui lòng nhập mô tả cho quà tặng này'));
                        }
                        return Promise.resolve();
                      },
                    }),
                  ]}
                  dependencies={['gift_value']}
                >
                  <Input placeholder="VD: 1 bao phân DAP 50kg" />
                </Form.Item>
                <Form.Item label="Giá trị quà tặng" name="gift_value">
                  <NumberInput placeholder="Nhập giá trị quà tặng" addonAfter="VND" />
                </Form.Item>
                <Form.Item label="Ghi chú" name="notes">
                  <TextArea rows={2} placeholder="Ghi chú thêm (nếu có)" />
                </Form.Item>
              </Form>
            </>
          ) : (
            currentSeason?.status === 'settled' && (
              <Alert 
                message="Phiếu này đã được chốt sổ" 
                description="Bạn có thể xem lại lịch sử quà tặng và tích lũy ở các tab phía trên."
                type="info"
                showIcon
              />
            )
          )}
        </Space>
      )}
    </Modal>
  );
};

export default CloseSeasonModal;
