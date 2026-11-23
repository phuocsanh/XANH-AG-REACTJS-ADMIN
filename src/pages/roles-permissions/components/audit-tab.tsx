import { useState } from 'react';
import { Card, Empty, InputNumber, Pagination, Select, Space, Spin, Tag, Typography } from 'antd';
import { RolePermissionAuditEntry } from '@/models/auth.model';
import { usePermissionAudit } from '@/queries/role-permission';

const ROLE_CODES = ['ADMIN', 'MANAGER', 'STAFF', 'USER', 'FARMER', 'CUSTOMER'];
const { Text } = Typography;

/** Trang xem audit bất biến của các lần thay đổi permission. */
export default function AuditTab() {
  const [targetType, setTargetType] = useState<string>();
  const [roleCode, setRoleCode] = useState<string>();
  const [userId, setUserId] = useState<number>();
  const [page, setPage] = useState(1);
  const query = usePermissionAudit({ targetType, roleCode, userId, page, limit: 20 });

  const entries = query.data?.data ?? [];
  const renderCodes = (codes: string[], color: string) => codes.length
    ? codes.map((code) => <Tag color={color} key={code}>{code}</Tag>)
    : <Text type="secondary">Không có quyền</Text>;

  return (
    <Space direction="vertical" className="w-full" size="middle">
      <Card>
        <Space wrap>
          <Select
            allowClear
            placeholder="Tất cả đối tượng"
            className="w-56"
            value={targetType}
            onChange={(value) => { setTargetType(value); setPage(1); }}
            options={[{ value: 'role', label: 'Theo role' }, { value: 'user', label: 'Theo user' }]}
          />
          {targetType === 'role' && (
            <Select
              allowClear
              placeholder="Chọn role"
              className="w-56"
              value={roleCode}
              onChange={(value) => { setRoleCode(value); setPage(1); }}
              options={ROLE_CODES.map((code) => ({ value: code, label: code }))}
            />
          )}
          {targetType === 'user' && (
            <InputNumber
              min={1}
              placeholder="ID người dùng"
              value={userId}
              onChange={(value) => { setUserId(value ?? undefined); setPage(1); }}
            />
          )}
        </Space>
      </Card>
      {query.isLoading && <Spin />}
      {query.isError && <Card>Lỗi tải lịch sử thay đổi quyền.</Card>}
      {!query.isLoading && entries.length === 0 && <Empty description="Chưa có thay đổi quyền nào." />}
      {entries.map((entry: RolePermissionAuditEntry) => (
        <Card key={entry.id} size="small">
          <Space direction="vertical" className="w-full">
            <Space wrap>
              <Tag color={entry.action === 'ROLE_PERMISSIONS_UPDATED' ? 'blue' : 'purple'}>
                {entry.action === 'ROLE_PERMISSIONS_UPDATED' ? 'Thay đổi quyền role' : 'Thay đổi quyền user'}
              </Tag>
              <Text strong>{entry.target_role_code || entry.target_snapshot.name || entry.target_snapshot.account || `User #${entry.target_user_id}`}</Text>
              <Text type="secondary">Thực hiện bởi {entry.actor_snapshot.name || entry.actor_snapshot.account} · {new Date(entry.created_at).toLocaleString('vi-VN')}</Text>
            </Space>
            <div><Text type="secondary">Trước: </Text>{renderCodes(entry.before_permission_codes, 'red')}</div>
            <div><Text type="secondary">Sau: </Text>{renderCodes(entry.after_permission_codes, 'green')}</div>
          </Space>
        </Card>
      ))}
      {query.data && query.data.total > query.data.limit && (
        <Pagination current={page} pageSize={20} total={query.data.total} onChange={setPage} showSizeChanger={false} />
      )}
    </Space>
  );
}
