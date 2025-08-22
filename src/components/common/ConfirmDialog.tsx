/* eslint-disable react-refresh/only-export-components */
import React from 'react';
import { Modal, Button, ButtonProps } from 'antd';
import { ExclamationCircleOutlined, QuestionCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  content?: string | React.ReactNode;
  type?: 'warning' | 'info' | 'confirm' | 'error';
  okText?: string;
  cancelText?: string;
  onOk?: () => void | Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  okButtonProps?: ButtonProps;
  cancelButtonProps?: ButtonProps;
  width?: number;
}

/**
 * Component ConfirmDialog tái sử dụng
 * Hỗ trợ nhiều loại dialog: warning, info, confirm, error
 * Có thể tùy chỉnh nội dung, nút bấm và xử lý async
 */
const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  content,
  type = 'confirm',
  okText = 'Xác nhận',
  cancelText = 'Hủy',
  onOk,
  onCancel,
  loading = false,
  okButtonProps = {},
  cancelButtonProps = {},
  width = 416,
}) => {
  // Lấy icon dựa trên type
  const getIcon = () => {
    switch (type) {
      case 'warning':
        return <ExclamationCircleOutlined style={{ color: '#faad14' }} />;
      case 'error':
        return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'info':
        return <InfoCircleOutlined style={{ color: '#1890ff' }} />;
      default:
        return <QuestionCircleOutlined style={{ color: '#1890ff' }} />;
    }
  };

  // Lấy màu nút OK dựa trên type
  const getOkButtonType = (): 'primary' | 'default' | 'dashed' | 'link' | 'text' => {
    switch (type) {
      case 'warning':
      case 'error':
        return 'primary';
      default:
        return 'primary';
    }
  };

  // Lấy màu danger cho nút OK nếu là warning hoặc error
  const getOkButtonDanger = () => {
    return type === 'warning' || type === 'error';
  };

  // Xử lý click OK
  const handleOk = async () => {
    if (onOk) {
      try {
        await onOk();
      } catch (error) {
        console.error('Error in confirm dialog:', error);
      }
    }
  };

  return (
    <Modal
      open={open}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {getIcon()}
          <span>{title || 'Xác nhận'}</span>
        </div>
      }
      width={width}
      onCancel={onCancel}
      footer={[
        <Button
          key="cancel"
          onClick={onCancel}
          disabled={loading}
          {...cancelButtonProps}
        >
          {cancelText}
        </Button>,
        <Button
          key="ok"
          type={getOkButtonType()}
          danger={getOkButtonDanger()}
          loading={loading}
          onClick={handleOk}
          {...okButtonProps}
        >
          {okText}
        </Button>,
      ]}
      maskClosable={!loading}
      closable={!loading}
    >
      <div style={{ marginTop: '16px' }}>
        {content || 'Bạn có chắc chắn muốn thực hiện hành động này?'}
      </div>
    </Modal>
  );
};

// Hook để sử dụng confirm dialog dễ dàng hơn
export const useConfirmDialog = () => {
  const [dialogState, setDialogState] = React.useState<{
    open: boolean;
    title?: string;
    content?: string | React.ReactNode;
    type?: 'warning' | 'info' | 'confirm' | 'error';
    onOk?: () => void | Promise<void>;
  }>({
    open: false,
  });

  const [loading, setLoading] = React.useState(false);

  const showConfirm = (options: {
    title?: string;
    content?: string | React.ReactNode;
    type?: 'warning' | 'info' | 'confirm' | 'error';
    onOk?: () => void | Promise<void>;
  }) => {
    setDialogState({
      open: true,
      ...options,
    });
  };

  const handleOk = async () => {
    if (dialogState.onOk) {
      setLoading(true);
      try {
        await dialogState.onOk();
        setDialogState({ open: false });
      } catch (error) {
        console.error('Error in confirm dialog:', error);
      } finally {
        setLoading(false);
      }
    } else {
      setDialogState({ open: false });
    }
  };

  const handleCancel = () => {
    setDialogState({ open: false });
  };

  const ConfirmDialogComponent = () => (
    <ConfirmDialog
      open={dialogState.open}
      title={dialogState.title}
      content={dialogState.content}
      type={dialogState.type}
      onOk={handleOk}
      onCancel={handleCancel}
      loading={loading}
    />
  );

  return {
    showConfirm,
    ConfirmDialog: ConfirmDialogComponent,
  };
};

export default ConfirmDialog;