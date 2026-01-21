import React, { useState } from 'react';
import { Tabs, Table, Button, Tag, Card, Form, Input, Select, Space, Popconfirm, Dropdown } from 'antd';
import { UserOutlined, CheckOutlined, UserAddOutlined, MoreOutlined, CheckCircleOutlined, StopOutlined, DeleteOutlined, KeyOutlined } from '@ant-design/icons';
import { useRolesQuery, usePendingUsersQuery, useAllUsersQuery, useApproveUserMutation, useCreateUserByAdminMutation, CreateUserByAdminDto, useActivateUserMutation, useDeactivateUserMutation, useDeleteUserMutation, useResetPasswordMutation } from '@/queries/user';
import { UserResponse } from '@/models/auth.model';
import { useAppStore } from '@/stores';
import { canManageUser } from '@/utils/permission';
import { RoleCode } from '@/constant/role';
import dayjs from 'dayjs';
import FilterHeader from '@/components/common/filter-header';

const { TabPane } = Tabs;
const { Option } = Select;

const UserManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('1');

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Quản Lý Người Dùng</h1>
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="Tất cả người dùng" key="1">
            <AllUsersTab />
          </TabPane>
          <TabPane tab="Danh sách chờ duyệt" key="2">
            <PendingUsersTab />
          </TabPane>
          <TabPane tab="Tạo nhân viên / Người dùng" key="3">
            <CreateStaffTab />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

const PendingUsersTab: React.FC = () => {
  const { data: users, isLoading } = usePendingUsersQuery();
  const approveMutation = useApproveUserMutation();
  const activateMutation = useActivateUserMutation();
  const deactivateMutation = useDeactivateUserMutation();
  const deleteMutation = useDeleteUserMutation();
  const currentUser = useAppStore((state) => state.userInfo);

  const columns = [
    {
      title: 'Tài khoản',
      dataIndex: 'account',
      key: 'account',
    },
    {
      title: 'Nickname',
      dataIndex: ['user_profile', 'nickname'],
      key: 'nickname',
      render: (text: string, record: UserResponse) => (record as any).user_profile?.nickname || 'N/A',
    },
    {
      title: 'Role',
      dataIndex: ['role', 'name'],
      key: 'role',
      render: (text: string, record: UserResponse) => (
        <Tag color="blue">{record.role?.name || 'N/A'}</Tag>
      ),
    },
    {
      title: 'Ngày đăng ký',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text: string) => text ? dayjs(text).format('DD/MM/YYYY HH:mm') : 'N/A',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (text: string) => {
        const statusColors: { [key: string]: string } = {
          'pending': 'orange',
          'active': 'green',
          'inactive': 'red',
        };
        return <Tag color={statusColors[text?.toLowerCase()] || 'default'}>{text}</Tag>;
      },
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: UserResponse) => {
        const canManage = canManageUser(currentUser, record);
        
        const menuItems = [
            ...((record.status || '').toLowerCase() === 'pending' ? [{
            key: 'approve',
            label: 'Duyệt',
            icon: <CheckOutlined />,
            onClick: () => approveMutation.mutate(record.id || record.user_id),
          }] : []),
          ...(canManage && (record.status || '').toLowerCase() !== 'active' ? [{
            key: 'activate',
            label: 'Kích hoạt',
            icon: <CheckCircleOutlined />,
            onClick: () => activateMutation.mutate(record.id || record.user_id),
          }] : []),
          ...(canManage && (record.status || '').toLowerCase() === 'active' ? [{
            key: 'deactivate',
            label: 'Vô hiệu hóa',
            icon: <StopOutlined />,
            onClick: () => deactivateMutation.mutate(record.id || record.user_id),
          }] : []),
          ...(canManage ? [{
            key: 'delete',
            label: 'Xóa',
            icon: <DeleteOutlined />,
            danger: true,
            onClick: () => {},
          }] : []),
        ];

        return (
          <Space>
            {(record.status || '').toLowerCase() === 'pending' && (
              <Popconfirm
                title="Bạn có chắc chắn muốn duyệt người dùng này?"
                onConfirm={() => approveMutation.mutate(record.id || record.user_id)}
                okText="Duyệt"
                cancelText="Hủy"
              >
                <Button type="primary" icon={<CheckOutlined />} loading={approveMutation.isPending}>
                  Duyệt
                </Button>
              </Popconfirm>
            )}
            
            {menuItems.length > 0 && (
              <Dropdown
                menu={{
                  items: menuItems.map(item => ({
                    ...item,
                    onClick: item.key === 'delete' 
                      ? undefined 
                      : item.onClick,
                  })),
                  onClick: (e) => {
                    if (e.key === 'delete') {
                      // Xử lý xóa với confirmation
                      if (window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
                        deleteMutation.mutate(record.id || record.user_id);
                      }
                    }
                  },
                }}
                trigger={['click']}
              >
                <Button icon={<MoreOutlined />} />
              </Dropdown>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <Table
      dataSource={users}
      columns={columns}
      rowKey={(record) => record.id || record.user_id}
      loading={isLoading}
      pagination={{ pageSize: 10 }}
    />
  );
};

const AllUsersTab: React.FC = () => {
  const [filters, setFilters] = useState<Record<string, any>>({});
  const { data: usersResponse, isLoading } = useAllUsersQuery(filters);
  const { data: roles } = useRolesQuery();
  
  const users = usersResponse?.data?.items || [];
  
  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => {
        const newFilters = { ...prev, [key]: value };
        // Remove empty keys
        if (value === undefined || value === null || value === '') {
            delete newFilters[key];
        }
        return newFilters;
    });
  };

  const activateMutation = useActivateUserMutation();
  const deactivateMutation = useDeactivateUserMutation();
  const deleteMutation = useDeleteUserMutation();
  const resetPasswordMutation = useResetPasswordMutation();
  const currentUser = useAppStore((state) => state.userInfo);

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: 'Tài khoản',
      dataIndex: 'account',
      key: 'account',
    },
    {
      title: (
        <FilterHeader 
            title="Nickname" 
            dataIndex="nickname"
            value={filters.nickname}
            onChange={(val) => handleFilterChange('nickname', val)}
        />
      ),
      dataIndex: ['user_profile', 'nickname'],
      key: 'nickname',
      render: (text: string, record: any) => text || record.nickname || 'N/A',
    },
    {
      title: (
        <FilterHeader 
            title="Role" 
            dataIndex="role_id"
            inputType="select"
            value={filters.role_id}
            onChange={(val) => handleFilterChange('role_id', val)}
            options={roles?.map(role => ({
                label: role.name,
                value: role.id
            })) || []}
        />
      ),
      dataIndex: 'role',
      key: 'role',
      render: (_: any, record: any) => {
        // Map role_id to role name if role object is missing
        let roleCode = record.role?.code;
        let roleName = record.role?.name;

        if (!roleCode && record.role_id) {
          switch (record.role_id) {
            case 1: roleCode = RoleCode.SUPER_ADMIN; roleName = 'Super Admin'; break;
            case 2: roleCode = RoleCode.ADMIN; roleName = 'Admin'; break;
            case 3: roleCode = RoleCode.STAFF; roleName = 'Staff'; break;
            case 4: roleCode = RoleCode.USER; roleName = 'User'; break;
            default: roleCode = 'UNKNOWN'; roleName = 'Unknown';
          }
        }

        const roleColors: { [key: string]: string } = {
          [RoleCode.SUPER_ADMIN]: 'red',
          [RoleCode.ADMIN]: 'orange',
          [RoleCode.STAFF]: 'blue',
          [RoleCode.USER]: 'green',
        };
        return (
          <Tag color={roleColors[roleCode || ''] || 'default'}>
            {roleName || 'N/A'}
          </Tag>
        );
      },
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text: string) => text ? dayjs(text).format('DD/MM/YYYY HH:mm') : 'N/A',
    },
    {
      title: (
        <FilterHeader 
            title="Trạng thái" 
            dataIndex="status"
            inputType="select"
            value={filters.status}
            onChange={(val) => handleFilterChange('status', val)}
            options={[
                { label: 'Hoạt động (Active)', value: 'active' },
                { label: 'Ngưng (Inactive)', value: 'inactive' },
                { label: 'Chờ duyệt (Pending)', value: 'pending' },
            ]}
        />
      ),
      dataIndex: 'status',
      key: 'status',
      render: (text: string) => {
        const statusColors: { [key: string]: string } = {
          'pending': 'orange',
          'active': 'green',
          'inactive': 'red',
        };
        return <Tag color={statusColors[text?.toLowerCase()] || 'default'}>{text}</Tag>;
      },
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: UserResponse) => {
        const canManage = canManageUser(currentUser, record);
        const isActive = record.status?.toUpperCase() === 'ACTIVE';
        
        const menuItems = [
          ...(canManage && !isActive ? [{
            key: 'activate',
            label: 'Kích hoạt',
            icon: <CheckCircleOutlined />,
            onClick: () => activateMutation.mutate(record.id || record.user_id),
          }] : []),
          ...(canManage && isActive ? [{
            key: 'deactivate',
            label: 'Vô hiệu hóa',
            icon: <StopOutlined />,
            danger: true, // Thêm màu đỏ cảnh báo
            onClick: () => deactivateMutation.mutate(record.id || record.user_id),
          }] : []),
          ...(canManage ? [{
            key: 'reset-password',
            label: 'Đặt lại mật khẩu',
            icon: <KeyOutlined />,
            onClick: () => {},
          }] : []),
          ...(canManage ? [{
            key: 'delete',
            label: 'Xóa tài khoản',
            icon: <DeleteOutlined />,
            danger: true,
            onClick: () => {},
          }] : []),
        ];

        if (menuItems.length === 0) {
          return <span className="text-gray-400">Không có quyền</span>;
        }

        return (
          <Dropdown
            menu={{
              items: menuItems.map(item => ({
                ...item,
                onClick: item.key === 'delete' 
                  ? undefined 
                  : item.onClick,
              })),
                onClick: (e) => {
                  if (e.key === 'delete') {
                    if (window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
                      deleteMutation.mutate(record.id || record.user_id);
                    }
                  } else if (e.key === 'reset-password') {
                    const newPassword = window.prompt('Nhập mật khẩu mới cho tài khoản này:', '123456');
                    if (newPassword) {
                      resetPasswordMutation.mutate({ 
                        userId: record.id || record.user_id, 
                        password: newPassword 
                      });
                    }
                  }
                },
              }}
            trigger={['click']}
          >
            <Button icon={<MoreOutlined />}>Hành động</Button>
          </Dropdown>
        );
      },
    },
  ];

  return (
    <Table
      dataSource={users}
      columns={columns}
      rowKey={(record) => record.id || record.user_id}
      loading={isLoading}
      pagination={{ pageSize: 10 }}
    />
  );
};

const CreateStaffTab: React.FC = () => {
  const [form] = Form.useForm();
  const createMutation = useCreateUserByAdminMutation();

  const onFinish = (values: any) => {
    const dto: CreateUserByAdminDto = {
      account: values.account,
      password: values.password,
      nickname: values.nickname,
      role_id: values.role_id,
      email: values.email,
      mobile: values.mobile,
    };
    createMutation.mutate(dto, {
      onSuccess: () => {
        form.resetFields();
      },
    });
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
      >
        <Form.Item
          name="account"
          label="Tài khoản"
          rules={[{ required: true, message: 'Vui lòng nhập tài khoản' }]}
        >
          <Input prefix={<UserOutlined />} placeholder="Nhập tài khoản" />
        </Form.Item>

        <Form.Item
          name="password"
          label="Mật khẩu"
          rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
        >
          <Input.Password placeholder="Nhập mật khẩu" />
        </Form.Item>

        <Form.Item
          name="nickname"
          label="Tên hiển thị (Nickname)"
          rules={[{ required: true, message: 'Vui lòng nhập tên hiển thị' }]}
        >
          <Input placeholder="Nhập tên hiển thị" />
        </Form.Item>

        <Form.Item
          name="role_id"
          label="Vai trò"
          rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}
        >
          <Select placeholder="Chọn vai trò">
            <Option value={2}>ADMIN (Quản trị viên)</Option>
            <Option value={3}>STAFF (Nhân viên)</Option>
            <Option value={4}>USER (Người dùng)</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="email"
          label="Email"
          rules={[{ type: 'email', message: 'Email không hợp lệ' }]}
        >
          <Input placeholder="Nhập email (tùy chọn)" />
        </Form.Item>

        <Form.Item
          name="mobile"
          label="Số điện thoại"
        >
          <Input placeholder="Nhập số điện thoại (tùy chọn)" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" icon={<UserAddOutlined />} loading={createMutation.isPending} block>
            Tạo tài khoản
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default UserManagementPage;
