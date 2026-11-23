import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Checkbox, Empty, Modal, Space, Spin, Tag, Typography, message } from 'antd';
import { ManagedRole, Permission } from '@/models/auth.model';
import { useManagedRoles, usePermissionCatalog, useUpdateRolePermissions } from '@/queries/role-permission';

const { Text } = Typography;

/** Tab chỉnh ma trận permission của các role cố định. */
export default function RoleMatrixTab() {
  const rolesQuery = useManagedRoles();
  const catalogQuery = usePermissionCatalog();
  const updateRole = useUpdateRolePermissions();
  const [selectedRoleId, setSelectedRoleId] = useState<number>();
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);

  const editableRoles = (rolesQuery.data ?? []).filter((role) => !role.isReadOnly);
  const selectedRole = rolesQuery.data?.find((role) => role.id === selectedRoleId);
  const groupedPermissions = useMemo(() => {
    return (catalogQuery.data ?? []).reduce<Record<string, Permission[]>>((groups, permission) => {
      const group = permission.group || 'Khác';
      groups[group] = [...(groups[group] ?? []), permission];
      return groups;
    }, {});
  }, [catalogQuery.data]);

  useEffect(() => {
    if (!selectedRoleId && editableRoles.length) setSelectedRoleId(editableRoles[0].id);
  }, [editableRoles, selectedRoleId]);

  useEffect(() => {
    setSelectedCodes(selectedRole?.permissionCodes ?? []);
  }, [selectedRoleId, selectedRole?.permissionCodes.join('|')]);

  const save = () => {
    if (!selectedRole) return;
    Modal.confirm({
      title: 'Lưu ma trận quyền?',
      content: `Thay đổi sẽ áp dụng cho mọi người dùng thuộc role ${selectedRole.code}.`,
      okText: 'Lưu thay đổi',
      cancelText: 'Hủy',
      onOk: async () => {
        await updateRole.mutateAsync({ roleId: selectedRole.id, permissionCodes: selectedCodes });
        message.success('Đã cập nhật quyền cho role.');
      },
    });
  };

  if (rolesQuery.isLoading || catalogQuery.isLoading) return <Spin />;
  if (rolesQuery.isError || catalogQuery.isError) {
    return <Alert type="error" showIcon message="Không tải được danh mục quyền." />;
  }

  const readOnlyRole = rolesQuery.data?.find((role: ManagedRole) => role.isReadOnly);
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
      <Card title="Vai trò">
        <Space direction="vertical" className="w-full">
          {editableRoles.map((role) => (
            <Button
              key={role.id}
              block
              type={selectedRoleId === role.id ? 'primary' : 'default'}
              onClick={() => setSelectedRoleId(role.id)}
            >
              <span className="flex w-full justify-between">
                {role.name}<Tag>{role.permissionCodes.length}</Tag>
              </span>
            </Button>
          ))}
          {readOnlyRole && (
            <div className="rounded border p-3">
              <Text strong>{readOnlyRole.name}</Text>
              <div><Tag color="blue">Toàn quyền hệ thống · {readOnlyRole.permissionCodes.length} quyền · chỉ đọc</Tag></div>
            </div>
          )}
        </Space>
      </Card>

      <Card
        title={selectedRole ? `Quyền của ${selectedRole.name}` : 'Danh mục quyền'}
        extra={selectedRole && <Button type="primary" loading={updateRole.isPending} onClick={save}>Lưu thay đổi</Button>}
      >
        {selectedRole ? (
          <Space direction="vertical" size="middle" className="w-full">
            {Object.entries(groupedPermissions).map(([group, permissions]) => {
              const groupCodes = permissions.map((permission) => permission.code);
              const allSelected = groupCodes.every((code) => selectedCodes.includes(code));
              return (
                <Card
                  size="small"
                  key={group}
                  title={<Space>{group}<Tag>{permissions.filter((p) => selectedCodes.includes(p.code)).length}/{permissions.length}</Tag></Space>}
                  extra={(
                    <Button size="small" onClick={() => setSelectedCodes((current) => allSelected
                      ? current.filter((code) => !groupCodes.includes(code))
                      : [...new Set([...current, ...groupCodes])])}>
                      {allSelected ? 'Bỏ chọn nhóm' : 'Chọn cả nhóm'}
                    </Button>
                  )}
                >
                  <Checkbox.Group value={selectedCodes} onChange={(codes) => setSelectedCodes(codes as string[])}>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {permissions.map((permission) => (
                        <Checkbox key={permission.code} value={permission.code}>
                          <span className="font-medium">{permission.name || permission.code}</span>
                          <div className="text-xs text-gray-500">{permission.code}</div>
                          {permission.description && <div className="text-xs text-gray-500">{permission.description}</div>}
                        </Checkbox>
                      ))}
                    </div>
                  </Checkbox.Group>
                </Card>
              );
            })}
            {!Object.keys(groupedPermissions).length && <Empty description="Chưa có permission trong danh mục." />}
          </Space>
        ) : <Empty description="Chọn role để xem ma trận quyền." />}
      </Card>
    </div>
  );
}
