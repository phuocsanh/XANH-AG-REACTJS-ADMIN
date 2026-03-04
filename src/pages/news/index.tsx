import React, { useState } from 'react'
import { Table, Button, Space, Input, Tag, Modal, Card, Typography } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import { useNewsQuery, useDeleteNewsMutation, News, NewsSearchResponse } from '@/queries/news'
import NewsForm from './components/news-form'
import { format } from 'date-fns'
import type { ColumnsType } from 'antd/es/table'

const { Title } = Typography

const NewsPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingNews, setEditingNews] = useState<News | null>(null)
  const [params, setParams] = useState({ page: 1, limit: 10, title: '' })

  const { data: newsResponse, isLoading } = useNewsQuery(params)
  const deleteMutation = useDeleteNewsMutation()

  const responseData = newsResponse as NewsSearchResponse | undefined
  const newsList = responseData?.items || []
  const totalItems = responseData?.total || 0

  const columns: ColumnsType<News> = [
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
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
      render: (category: string) => <Tag color="blue">{category || 'Chưa phân loại'}</Tag>
    },
    {
      title: 'Tác giả',
      dataIndex: 'author',
      key: 'author',
    },
    {
      title: 'Lượt xem',
      dataIndex: 'views',
      key: 'views',
      align: 'center',
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => format(new Date(date), 'dd/MM/yyyy HH:mm')
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_text, record: News) => (
        <Space size="middle">
          <Button 
            icon={<EditOutlined />} 
            onClick={() => {
              setEditingNews(record)
              setIsModalOpen(true)
            }}
          />
          <Button 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => handleDelete(record.id)}
          />
          <Button 
            icon={<EyeOutlined />}
            onClick={() => window.open(`https://xanh-ag-nextjs-client.vercel.app/news/${record.slug}`, '_blank')}
          />
        </Space>
      ),
    },
  ]

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
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
          <Title level={3}>Quản lý tin tức</Title>
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

        <div style={{ marginBottom: '16px' }}>
          <Input.Search 
            placeholder="Tìm kiếm tiêu đề..." 
            onSearch={(value) => setParams({ ...params, title: value, page: 1 })}
            style={{ width: 300 }}
          />
        </div>

        <Table 
          columns={columns} 
          dataSource={newsList} 
          loading={isLoading}
          rowKey="id"
          pagination={{
            current: params.page,
            pageSize: params.limit,
            total: totalItems,
            onChange: (page) => setParams({ ...params, page })
          }}
        />
      </Card>

      <NewsForm 
        visible={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        initialData={editingNews}
      />
    </div>
  )
}

export default NewsPage
