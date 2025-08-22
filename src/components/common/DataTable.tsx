import React from 'react';
import { Table, TableProps, Button, Space, Tooltip } from 'antd';
import type { ColumnType } from 'antd/es/table';
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import LoadingSpinner from './LoadingSpinner';

interface ActionButton<T = Record<string, unknown>> {
  key: string;
  icon?: React.ReactNode;
  tooltip?: string;
  onClick: (record: T) => void;
  type?: 'primary' | 'default' | 'dashed' | 'link' | 'text';
  danger?: boolean;
  disabled?: (record: T) => boolean;
}

interface DataTableProps<T = Record<string, unknown>> extends Omit<TableProps<T>, 'columns'> {
  columns: ColumnType<T>[];
  data: T[];
  loading?: boolean;
  showActions?: boolean;
  actionButtons?: ActionButton[];
  onEdit?: (record: T) => void;
  onDelete?: (record: T) => void;
  onView?: (record: T) => void;
  actionColumnWidth?: number;
  actionColumnTitle?: string;
  emptyText?: string;
}

/**
 * Component DataTable tái sử dụng
 * Tích hợp sẵn các action buttons (Edit, Delete, View)
 * Hỗ trợ custom action buttons và loading state
 * Responsive và có thể tùy chỉnh hoàn toàn
 */
const DataTable = <T extends Record<string, unknown>>({
  columns,
  data,
  loading = false,
  showActions = true,
  actionButtons = [],
  onEdit,
  onDelete,
  onView,
  actionColumnWidth = 120,
  actionColumnTitle = 'Thao tác',
  emptyText = 'Không có dữ liệu',
  ...tableProps
}: DataTableProps<T>) => {
  // Tạo default action buttons
  const defaultActionButtons: ActionButton<T>[] = [];

  if (onView) {
    defaultActionButtons.push({
      key: 'view',
      icon: <EyeOutlined />,
      tooltip: 'Xem chi tiết',
      onClick: onView,
      type: 'link',
    });
  }

  if (onEdit) {
    defaultActionButtons.push({
      key: 'edit',
      icon: <EditOutlined />,
      tooltip: 'Chỉnh sửa',
      onClick: onEdit,
      type: 'link',
    });
  }

  if (onDelete) {
    defaultActionButtons.push({
      key: 'delete',
      icon: <DeleteOutlined />,
      tooltip: 'Xóa',
      onClick: onDelete,
      type: 'link',
      danger: true,
    });
  }

  // Kết hợp default và custom action buttons
  const allActionButtons = [...defaultActionButtons, ...actionButtons];

  // Tạo action column
  const actionColumn = {
    title: actionColumnTitle,
    key: 'actions',
    width: actionColumnWidth,
    fixed: 'right' as const,
    render: (_: unknown, record: T) => (
      <Space size="small">
        {allActionButtons.map((button) => {
          const isDisabled = button.disabled ? button.disabled(record) : false;
          
          const buttonElement = (
            <Button
              key={button.key}
              type={button.type || 'link'}
              icon={button.icon}
              size="small"
              danger={button.danger}
              disabled={isDisabled}
              onClick={() => !isDisabled && button.onClick(record)}
            />
          );

          return button.tooltip ? (
            <Tooltip key={button.key} title={button.tooltip}>
              {buttonElement}
            </Tooltip>
          ) : (
            buttonElement
          );
        })}
      </Space>
    ),
  };

  // Kết hợp columns với action column
  const finalColumns = showActions && allActionButtons.length > 0 
    ? [...columns, actionColumn] 
    : columns;

  return (
    <div className="data-table-wrapper">
      {loading ? (
        <LoadingSpinner tip="Đang tải dữ liệu...">
          <Table
            columns={finalColumns}
            dataSource={[]}
            pagination={false}
            locale={{ emptyText }}
            {...tableProps}
          />
        </LoadingSpinner>
      ) : (
        <Table
          columns={finalColumns}
          dataSource={data}
          locale={{ emptyText }}
          scroll={{ x: 'max-content' }}
          {...tableProps}
        />
      )}
    </div>
  );
};

export default DataTable;
export type { ActionButton, DataTableProps };