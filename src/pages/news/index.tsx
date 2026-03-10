/**
 * Trang quản lý tin tức
 * Hiển thị danh sách bài viết, cho phép thêm/sửa/xóa và xem bài viết trên client
 */
import React, { useState } from 'react'
import { Table, Button, Space, Input, Tag, Modal, Card, Typography, Tooltip } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import { useNewsQuery, useDeleteNewsMutation, News, NewsSearchResponse } from '@/queries/news'
import NewsForm from './components/news-form'
import { format } from 'date-fns'
import type { ColumnsType } from 'antd/es/table'

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
  const newsList = responseData?.items || []
  const totalItems = responseData?.total || 0

  // Định nghĩa các cột của bảng
  const columns: ColumnsType<News> = [
    {
      title: 'STT',
      key: 'stt',
      width: 55,
      align: 'center',
      render: (_: unknown, __: News, index: number) => {
        const stt = (params.page - 1) * params.limit + index + 1
        return <span className="font-medium text-gray-600">{stt}</span>
      }
    },
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      width: 240,
      ellipsis: true,
      render: (text: string, record: News) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontWeight: 'bold' }}>{text}</span>
          <small style={{ color: '#888' }}>{record.slug}</small>
        </Space>
      )
    },
    {
      title: 'Danh mục',
      dataIndex: 'category',
      key: 'category',
      width: 130,
      render: (category: string) => <Tag color="blue">{category || 'Chưa phân loại'}</Tag>
    },
    {
      title: 'Tác giả',
      dataIndex: 'author',
      key: 'author',
      width: 120,
      ellipsis: true,
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
    {
      title: 'Thao tác',
      key: 'action',
      fixed: 'right' as const,
      width: 110,
      render: (_: unknown, record: News) => (
        <Space size="small">
          {/* Nút chỉnh sửa */}
          <Tooltip title="Chỉnh sửa">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setEditingNews(record)
                setIsModalOpen(true)
              }}
            />
          </Tooltip>

          {/* Nút xóa */}
          <Tooltip title="Xóa">
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id)}
            />
          </Tooltip>

          {/* Nút xem trên website */}
          <Tooltip title="Xem trên website">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => window.open(`https://xanh-ag-nextjs-client.vercel.app/news/${record.slug}`, '_blank')}
            />
          </Tooltip>
        </Space>
      ),
    },
  ]

  /** Xử lý xóa bài viết */
  const handleDelete = (id: number) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa bài viết này?',
      okText: 'Xóa',
      cancelText: 'Hủy',
      onOk: () => deleteMutation.mutate(id)
    })
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

        {/* Bảng danh sách tin tức - scroll={{ x: 'max-content' }} để scroll ngang trên mobile */}
        <Table
          columns={columns}
          dataSource={newsList}
          loading={isLoading}
          rowKey="id"
          size="small"
          scroll={{ x: 'max-content' }}
          pagination={{
            current: params.page,
            pageSize: params.limit,
            total: totalItems,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} bài viết`,
            onChange: (page, pageSize) => setParams({ ...params, page, limit: pageSize })
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
