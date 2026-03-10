/**
 * Trang quản lý tin tức
 * Hiển thị danh sách bài viết, cho phép thêm/sửa/xóa và xem bài viết trên client
 * Sử dụng DataTable để hỗ trợ scroll ngang trên mobile và ghim cột thao tác trên desktop
 */
import React, { useState } from 'react'
import { Button, Input, Tag, Modal, Card, Typography, Space } from 'antd'
import { PlusOutlined, EyeOutlined, PushpinOutlined } from '@ant-design/icons'
import { useNewsQuery, useDeleteNewsMutation, News, NewsSearchResponse } from '@/queries/news'
import NewsForm from './components/news-form'
import { format } from 'date-fns'
import type { ColumnType } from 'antd/es/table'
import DataTable from '@/components/common/data-table'

const { Title } = Typography

/**
 * Component trang quản lý tin tức
 */
const NewsPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingNews, setEditingNews] = useState<News | null>(null)
  const [params, setParams] = useState({ page: 1, limit: 10, title: '' })

  const { data: newsResponse, isLoading } = useNewsQuery(params)
  const deleteMutation = useDeleteNewsMutation()

  const responseData = newsResponse as NewsSearchResponse | undefined
  const newsList = (responseData?.items || []) as unknown as Record<string, unknown>[]
  const totalItems = responseData?.total || 0

  // Định nghĩa các cột của bảng tin tức
  const columns: ColumnType<Record<string, unknown>>[] = [
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      width: 240,
      render: (text: string, record: any) => (
        <Space direction="vertical" size={0}>
          <Space>
            {record.is_pinned && <PushpinOutlined style={{ color: '#fa8c16' }} />}
            <span style={{ fontWeight: 'bold' }}>{text}</span>
          </Space>
          <small style={{ color: '#888' }}>{record.slug as string}</small>
        </Space>
      )
    },
    {
      title: 'Danh mục',
      dataIndex: 'category',
      key: 'category',
      width: 130,
      render: (category: string) => (
        <Tag color="blue">{category || 'Chưa phân loại'}</Tag>
      )
    },
    {
      title: 'Tác giả',
      dataIndex: 'author',
      key: 'author',
      width: 130,
    },
    {
      title: 'Lượt xem',
      dataIndex: 'views',
      key: 'views',
      width: 90,
      align: 'center',
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 140,
      render: (date: string) => format(new Date(date), 'dd/MM/yyyy HH:mm')
    },
  ]

  /** Xử lý xóa bài viết, nhận record từ DataTable */
  const handleDelete = (record: Record<string, unknown>) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa bài viết này?',
      okText: 'Xóa',
      cancelText: 'Hủy',
      onOk: () => deleteMutation.mutate(record.id as number)
    })
  }

  /** Xử lý mở form chỉnh sửa */
  const handleEdit = (record: Record<string, unknown>) => {
    setEditingNews(record as unknown as News)
    setIsModalOpen(true)
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        {/* Tiêu đề và nút Thêm bài viết */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: 12 }}>
          <Title level={3} style={{ margin: 0 }}>Quản lý tin tức</Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingNews(null)
              setIsModalOpen(true)
            }}
          >
            Thêm bài viết
          </Button>
        </div>

        {/* Ô tìm kiếm */}
        <div style={{ marginBottom: '16px' }}>
          <Input.Search
            placeholder="Tìm kiếm tiêu đề..."
            onSearch={(value) => setParams({ ...params, title: value, page: 1 })}
            style={{ width: 300, maxWidth: '100%' }}
          />
        </div>

        {/* DataTable - tự xử lý scroll ngang và fixed cột thao tác theo responsive */}
        <DataTable
          columns={columns}
          data={newsList}
          loading={isLoading}
          rowKey="id"
          showSTT={true}
          onEdit={handleEdit}
          onDelete={handleDelete}
          // Nút xem bài viết trên website
          actionButtons={[
            {
              key: 'view-web',
              icon: <EyeOutlined />,
              tooltip: 'Xem trên website',
              onClick: (record) =>
                window.open(
                  `https://xanh-ag-nextjs-client.vercel.app/news/${record.slug as string}`,
                  '_blank'
                ),
            }
          ]}
          paginationConfig={{
            current: params.page,
            pageSize: params.limit,
            total: totalItems,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} bài viết`,
          }}
          onChange={(pagination) => {
            setParams(prev => ({
              ...prev,
              page: pagination.current || 1,
              limit: pagination.pageSize || 10,
            }))
          }}
        />
      </Card>

      {/* Form thêm/sửa bài viết */}
      <NewsForm
        visible={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        initialData={editingNews}
      />
    </div>
  )
}

export default NewsPage
