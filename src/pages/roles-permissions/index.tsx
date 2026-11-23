import { Card, Tabs, Typography } from 'antd';
import RoleMatrixTab from './components/role-matrix-tab';
import UserOverrideTab from './components/user-override-tab';
import AuditTab from './components/audit-tab';

const { Title } = Typography;

/** Trang tập trung quản lý role matrix, quyền user và audit lịch sử. */
export default function RolesPermissionsPage() {
  return (
    <Card>
      <Title level={3}>Phân quyền hệ thống</Title>
      <Tabs
        items={[
          { key: 'roles', label: 'Phân quyền theo vai trò', children: <RoleMatrixTab /> },
          { key: 'users', label: 'Quyền bổ sung theo người dùng', children: <UserOverrideTab /> },
          { key: 'audit', label: 'Lịch sử thay đổi', children: <AuditTab /> },
        ]}
      />
    </Card>
  );
}
