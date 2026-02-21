
import React, { useState } from "react"
import { Table, Button, Space, Typography, Card } from "antd"
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons"
import { useFieldArray, Control, Controller } from "react-hook-form"
import { FormComboBox, FormFieldNumber } from "../../../components/form"
import { useProductSearch } from "../../../queries/product"

const { Text } = Typography

interface ProductBOMTableProps {
  control: Control<any>
}

const ProductBOMTable: React.FC<ProductBOMTableProps> = ({ control }) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "components",
  })

  const [searchTerm, setSearchTerm] = useState("")
  const { data: productsData, isLoading: isLoadingProducts } = useProductSearch(searchTerm, 20)

  const productOptions = React.useMemo(() => {
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

  const columns = [
    {
      title: 'Nguyên liệu',
      dataIndex: 'componentProductId',
      key: 'componentProductId',
      width: '40%',
      render: (_: any, record: any, index: number) => (
        <FormComboBox
          name={`components.${index}.componentProductId`}
          control={control}
          options={productOptions}
          onSearch={setSearchTerm}
          loading={isLoadingProducts}
          placeholder="Chọn nguyên liệu"
          className="mb-0"
        />
      ),
    },
    {
      title: 'Số lượng (định mức cho 1 đơn vị)',
      dataIndex: 'quantity',
      key: 'quantity',
      width: '25%',
      render: (_: any, record: any, index: number) => (
        <FormFieldNumber
          name={`components.${index}.quantity`}
          control={control}
          placeholder="Số lượng"
          className="mb-0"
        />
      ),
    },
    {
        title: 'ĐVT',
        key: 'unit',
        render: (_: any, record: any, index: number) => {
            return (
                <Controller
                    name={`components.${index}.componentProductId`}
                    control={control}
                    render={({ field }) => {
                        const selectedProduct = productOptions.find(opt => opt.value === field.value);
                        return <Text>{selectedProduct?.unit || '...'}</Text>
                    }}
                />
            )
        }
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: '10%',
      render: (_: any, __: any, index: number) => (
        <Button 
          type="text" 
          danger 
          icon={<DeleteOutlined />} 
          onClick={() => remove(index)} 
        />
      ),
    },
  ]

  return (
    <Card 
      title={
        <Space>
          <PlusOutlined className="text-blue-600" />
          <span className="font-semibold">Công thức phối trộn (BOM)</span>
        </Space>
      }
      size="small"
      className="mt-6 border-blue-200 shadow-sm"
      headStyle={{ backgroundColor: '#f0f7ff', borderBottom: '1px solid #bae7ff' }}
      extra={
        <Button 
          type="primary" 
          size="small" 
          icon={<PlusOutlined />} 
          onClick={() => append({ componentProductId: undefined, quantity: 1 })}
          ghost
        >
          Thêm nguyên liệu
        </Button>
      }
    >
      <div className="overflow-x-auto">
        <Table
          dataSource={fields}
          columns={columns}
          pagination={false}
          rowKey="id"
          size="middle"
          locale={{ emptyText: (
            <div className="py-8 text-gray-400">
              <PlusOutlined style={{ fontSize: 24, marginBottom: 8 }} />
              <div>Chưa có thành phần nào được khai báo cho sản phẩm này</div>
            </div>
          ) }}
        />
      </div>
    </Card>
  )
}

export default ProductBOMTable
