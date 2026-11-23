import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Checkbox, Empty, Modal, Select, Space, Spin, Tag, Typography, message } from 'antd';
import { Permission } from '@/models/auth.model';
import {
  usePermissionCatalog,
  useResetUserPermissions,
  useRolePermissionUserSearch,
  useUpdateUserPermissions,
  useUserPermissionDetails,
} from '@/queries/role-permission';

const { Text } = Typography;

/** Tab cấp thêm permission cho từng user mà không thay role của họ. */
export default function UserOverrideTab() {
  const [keyword, setKeyword] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<number>();
  const [directCodes, setDirectCodes] = useState<string[]>([]);
  const searchQuery = useRolePermissionUserSearch(keyword);
  const catalogQuery = usePermissionCatalog();
  const detailsQuery = useUserPermissionDetails(selectedUserId);
  const updateUser = useUpdateUserPermissions();
  const resetUser = useResetUserPermissions();

  const groupedPermissions = useMemo(() => {
    return (catalogQuery.data ?? []).reduce<Record<string, Permission[]>>((groups, permission) => {
      const group = permission.group || 'Khác';
      groups[group] = [...(groups[group] ?? []), permission];
      return groups;
    }, {});
  }, [catalogQuery.data]);
  const inherited = new Set(detailsQuery.data?.inheritedPermissionCodes ?? []);

  useEffect(() => {
    setDirectCodes(detailsQuery.data?.directPermissionCodes ?? []);
  }, [selectedUserId, detailsQuery.data?.directPermissionCodes.join('|')]);

  const save = async () => {
    if (!selectedUserId) return;
    await updateUser.mutateAsync({ userId: selectedUserId, permissionCodes: directCodes });
    message.success('Đã lưu quyền cấp riêng.');
  };

  const confirmReset = () => {
    if (!selectedUserId) return;
    Modal.confirm({
      title: 'Đặt lại quyền theo role?',
      content: 'Toàn bộ permission cấp riêng cho user này sẽ bị gỡ.',
      okText: 'Đặt lại',
      okButtonProps: { danger: true },
      cancelText: 'Hủy',
      onOk: async () => {
        await resetUser.mutateAsync(selectedUserId);
        setDirectCodes([]);
        message.success('Đã đặt lại quyền theo role.');
      },
    });
  };

  const selected = detailsQuery.data;
  return (
    <Space direction="vertical" size="middle" className="w-full">
      <Card title="Chọn người dùng">
        <Select
          showSearch
          allowClear
          filterOption={false}
          className="w-full"
          placeholder="Tìm theo tên, tài khoản hoặc số điện thoại (nhập ít nhất 2 ký tự)"
          value={selectedUserId}
          searchValue={keyword}
          loading={searchQuery.isFetching}
          onSearch={setKeyword}
          onChange={(id) => setSelectedUserId(id)}
          options={(searchQuery.data ?? []).map((user) => ({
            value: user.id,
            label: `${user.user_profile?.nickname || user.account} · ${user.role?.name || 'Chưa có role'}`,
          }))}
          notFoundContent={keyword.trim().length < 2 ? 'Nhập ít nhất 2 ký tự để tìm.' : 'Không tìm thấy người dùng.'}
        />
      </Card>

      {detailsQuery.isLoading && <Spin />}
      {detailsQuery.isError && <Alert type="error" showIcon message="Không tải được quyền của người dùng." />}
      {selected && (
        <Card
          title={<Space>{selected.user.name || selected.user.account}<Tag>{selected.role?.name || 'Chưa có role'}</Tag></Space>}
          extra={(
            <Space>
              <Button danger onClick={confirmReset} loading={resetUser.isPending}>Đặt lại theo role</Button>
              <Button type="primary" onClick={save} loading={updateUser.isPending}>Lưu quyền bổ sung</Button>
            </Space>
          )}
        >
          <Alert className="mb-4" type="info" showIcon message="Quyền kế thừa từ role luôn bật và không thể tắt tại đây." />
          <Space direction="vertical" size="middle" className="w-full">
            {Object.entries(groupedPermissions).map(([group, permissions]) => (
              <Card size="small" title={group} key={group}>
                <Space direction="vertical" className="w-full">
                  {permissions.map((permission) => {
                    const isInherited = inherited.has(permission.code);
                    const isDirect = directCodes.includes(permission.code);
                    return (
                      <div key={permission.code} className="flex items-start justify-between gap-3 border-b pb-2 last:border-0">
                        <div>
                          <Text strong>{permission.name || permission.code}</Text>
                          <div className="text-xs text-gray-500">{permission.code}</div>
                          {permission.description && <div className="text-xs text-gray-500">{permission.description}</div>}
                        </div>
                        {isInherited ? (
                          <Tag color="green">Kế thừa từ role</Tag>
                        ) : (
                          <Checkbox
                            checked={isDirect}
                            onChange={(event) => setDirectCodes((current) => event.target.checked
                              ? [...new Set([...current, permission.code])]
                              : current.filter((code) => code !== permission.code))}
                          >Cấp riêng</Checkbox>
                        )}
                      </div>
                    );
                  })}
                </Space>
              </Card>
            ))}
            {!Object.keys(groupedPermissions).length && <Empty description="Chưa có permission trong danh mục." />}
          </Space>
        </Card>
      )}
    </Space>
  );
}
