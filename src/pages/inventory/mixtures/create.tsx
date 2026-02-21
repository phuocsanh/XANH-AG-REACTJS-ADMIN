import React, { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import {
  Card,
  Button,
  Form,
  Table,
  Typography,
  Row,
  Col,
  Space,
  Divider,
} from "antd"
import { toast } from "react-toastify"
import {
  ArrowLeftOutlined,
  SaveOutlined,
} from "@ant-design/icons"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import { FormComboBox, FormFieldNumber, FormField } from "@/components/form"
import { useProductSearch, useProductQuery } from "@/queries/product"
import { useCreateProductMixtureMutation } from "@/queries/product-mixture"
import { LoadingSpinner } from "@/components/common"

const { Title, Text } = Typography

const mixtureSchema = z.object({
  productId: z.number({ required_error: "Vui lòng chọn sản phẩm thành phẩm" }),
  quantity: z.number().min(0.01, "Số lượng phải lớn hơn 0"),
  notes: z.string().optional(),
})

type MixtureFormData = z.infer<typeof mixtureSchema>

const InventoryMixtureCreate: React.FC = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState("")
  
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<MixtureFormData>({
    resolver: zodResolver(mixtureSchema),
    defaultValues: {
      quantity: 1,
    },
  })

  const selectedProductId = watch("productId")
  const productionQuantity = watch("quantity") || 0

  // Tìm kiếm sản phẩm thành phẩm
  const { data: productsData, isLoading: isLoadingProducts } = useProductSearch(searchTerm, 20)
  
  const productOptions = useMemo(() => {
    if (!productsData?.pages) return []
    return productsData.pages.flatMap(page => 
      page.data.map((p: any) => ({
        value: p.id,
        label: p.name,
        code: p.code,
        unit: p.unit?.name
      }))
    )
  }, [productsData])

  // Lấy chi tiết sản phẩm thành phẩm để lấy công thức (BOM)
  const { data: productDetail, isLoading: isLoadingDetail } = useProductQuery(selectedProductId)

  const mutation = useCreateProductMixtureMutation()

  const onSubmit = async (data: MixtureFormData) => {
    try {
      await mutation.mutateAsync(data)
      toast.success("Thực hiện phối trộn thành công!")
      navigate("/inventory/mixtures")
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Có lỗi xảy ra khi phối trộn.")
    }
  }

  const ingredientColumns = [
    {
      title: 'Nguyên liệu',
      dataIndex: ['componentProduct', 'name'],
      key: 'name',
      render: (name: string, record: any) => (
        <div>
          <div className="font-medium">{name}</div>
          <div className="text-xs text-gray-400">{record.componentProduct?.code}</div>
        </div>
      )
    },
    {
      title: 'Định mức (1 đơn vị)',
      dataIndex: 'quantity',
      key: 'norm',
      align: 'right' as const,
      render: (qty: number, record: any) => `${qty} ${record.unit?.name || record.componentProduct?.unit?.name}`,
    },
    {
      title: 'Tổng nhu cầu',
      key: 'total_need',
      align: 'right' as const,
      render: (_: any, record: any) => {
        const total = record.quantity * productionQuantity
        return (
          <span className="font-bold text-blue-600">
            {total.toLocaleString()} {record.unit?.name || record.componentProduct?.unit?.name}
          </span>
        )
      }
    },
    {
      title: 'Tồn kho hiện tại',
      dataIndex: ['componentProduct', 'quantity'],
      key: 'stock',
      align: 'right' as const,
      render: (qty: number, record: any) => (
        <span style={{ color: qty < (record.quantity * productionQuantity) ? 'red' : 'inherit' }}>
          {qty?.toLocaleString()} {record.componentProduct?.unit?.name}
        </span>
      )
    }
  ]

  return (
    <div className="p-2 md:p-6">
      <Space className="mb-4">
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate("/inventory/mixtures")}
        >
          Quay lại
        </Button>
      </Space>

      <Title level={4}>Tạo Lệnh Phối trộn sản phẩm</Title>
      <Text type="secondary">Phối trộn nguyên liệu để tạo ra sản phẩm thành phẩm. Hệ thống sẽ tự động trừ kho nguyên liệu.</Text>

      <Form layout="vertical" onFinish={handleSubmit(onSubmit)} className="mt-6">
        <Row gutter={24}>
          <Col xs={24} lg={10}>
            <Card title="Thông tin chung" className="h-full">
              <FormComboBox
                name="productId"
                label="Sản phẩm thành phẩm (D)"
                control={control}
                options={productOptions}
                onSearch={setSearchTerm}
                loading={isLoadingProducts}
                placeholder="Chọn sản phẩm muốn tạo ra"
                required
              />

              <FormFieldNumber
                name="quantity"
                label={`Số lượng sản xuất (${productDetail?.unit?.name || '...' })`}
                control={control}
                placeholder="Nhập số lượng thành phẩm"
                required
              />

              <FormField
                name="notes"
                label="Ghi chú"
                control={control}
                placeholder="Mô tả đợt phối trộn này"
              />
            </Card>
          </Col>

          <Col xs={24} lg={14}>
            <Card title="Công thức phối trộn (BOM)" className="h-full">
              {!selectedProductId ? (
                <Alert message="Vui lòng chọn sản phẩm thành phẩm để xem công thức." type="info" />
              ) : isLoadingDetail ? (
                <LoadingSpinner />
              ) : !productDetail?.components || productDetail.components.length === 0 ? (
                <Alert 
                  message="Sản phẩm này chưa được khai báo công thức phối trộn." 
                  description="Vui lòng cập nhật thông tin sản phẩm này để thêm các thành phần nguyên liệu."
                  type="warning" 
                  showIcon
                />
              ) : (
                <>
                  <Table
                    columns={ingredientColumns}
                    dataSource={productDetail.components}
                    rowKey="id"
                    pagination={false}
                    size="middle"
                  />
                  <Divider />
                  <div className="flex justify-end">
                    <Button
                      type="primary"
                      size="large"
                      icon={<SaveOutlined />}
                      htmlType="submit"
                      loading={isSubmitting}
                      disabled={!productDetail?.components?.length}
                    >
                      Xác nhận phối trộn & Cập nhật kho
                    </Button>
                  </div>
                </>
              )}
            </Card>
          </Col>
        </Row>
      </Form>
    </div>
  )
}

const Alert: React.FC<{ message: string, description?: string, type: "info" | "warning", showIcon?: boolean }> = ({ message, description, type, showIcon }) => (
  <div className={`p-4 rounded-md border ${type === 'info' ? 'bg-blue-50 border-blue-200' : 'bg-yellow-50 border-yellow-200'}`}>
    <div className={`font-medium ${type === 'info' ? 'text-blue-800' : 'text-yellow-800'}`}>{message}</div>
    {description && <div className={`text-sm ${type === 'info' ? 'text-blue-600' : 'text-yellow-600'}`}>{description}</div>}
  </div>
)

export default InventoryMixtureCreate
