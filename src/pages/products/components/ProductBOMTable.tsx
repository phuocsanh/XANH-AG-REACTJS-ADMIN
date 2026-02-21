import React, { useState, useEffect } from "react"
import { Button, Typography, Card, Radio } from "antd"
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons"
import { useFieldArray, Control, Controller, useWatch } from "react-hook-form"
import { FormComboBox } from "../../../components/form"
import NumberInput from "@/components/common/number-input"
import { useProductSearch, useProductQuery } from "../../../queries/product"

const { Text } = Typography

interface ProductBOMTableProps {
  control: Control<any>
}

// Component xử lý từng dòng nguyên liệu
const BOMItem: React.FC<{
  index: number
  control: Control<any>
  productOptions: any[]
  onSearch: (val: string) => void
  loading: boolean
  remove: (index: number) => void
  isMobile: boolean
}> = ({ index, control, productOptions, onSearch, loading, remove, isMobile }) => {
  const componentProductId = useWatch({
    control,
    name: `components.${index}.componentProductId`,
  })

  const { data: productDetail } = useProductQuery(componentProductId) as any

  const [inputUnit, setInputUnit] = useState<'base' | 'conv'>('base')
  const conversion = productDetail?.unit_conversions?.[1];
  const hasConv = !!conversion;

  // Giao diện cho Mobile
  if (isMobile) {
    return (
      <div className="p-3 mb-4 bg-white border border-gray-200 rounded-lg shadow-sm relative">
        <div className="absolute top-2 right-2">
            <Button 
                type="text" 
                danger 
                icon={<DeleteOutlined />} 
                onClick={() => remove(index)} 
            />
        </div>
        
        <div className="mb-3">
            <Text strong className="block mb-1 text-gray-600">Nguyên liệu {index + 1}:</Text>
            <FormComboBox
                name={`components.${index}.componentProductId`}
                control={control}
                options={productOptions}
                onSearch={onSearch}
                loading={loading}
                placeholder="Chọn nguyên liệu"
                className="mb-0 w-full"
            />
        </div>

        <div className="flex flex-col gap-2">
            <Text strong className="text-gray-600">Số lượng & Đơn vị:</Text>
            <div className="flex items-center gap-2">
                <Controller
                    name={`components.${index}.quantity`}
                    control={control}
                    render={({ field }) => (
                        <NumberInput
                            placeholder="0.00"
                            className="w-full"
                            style={{ height: '32px' }}
                            value={inputUnit === 'conv' && hasConv ? Number((field.value / conversion.conversion_factor).toFixed(6)) : field.value}
                            onChange={(val) => {
                                const num = Number(val);
                                field.onChange(inputUnit === 'conv' && hasConv ? num * conversion.conversion_factor : num);
                            }}
                        />
                    )}
                />
                {hasConv && (
                    <Radio.Group 
                        size="middle" 
                        value={inputUnit} 
                        onChange={e => setInputUnit(e.target.value)}
                        buttonStyle="solid"
                        className="flex-shrink-0"
                    >
                        <Radio.Button value="base">{productDetail?.unit?.name || 'Gốc'}</Radio.Button>
                        <Radio.Button value="conv">{conversion.unit?.name || 'Quy đổi'}</Radio.Button>
                    </Radio.Group>
                )}
            </div>
            {!hasConv && <Text type="secondary" className="text-xs italic pl-1">Đơn vị mặc định: {productDetail?.unit?.name || '...'}</Text>}
        </div>
      </div>
    )
  }

  // Giao diện cho Desktop (Bảng)
  return (
    <tr className="ant-table-row">
      <td className="ant-table-cell" style={{ width: '40%' }}>
        <FormComboBox
          name={`components.${index}.componentProductId`}
          control={control}
          options={productOptions}
          onSearch={onSearch}
          loading={loading}
          placeholder="Chọn nguyên liệu"
          className="mb-0"
        />
      </td>
      <td className="ant-table-cell" style={{ width: '35%' }}>
          <div className="flex flex-col gap-2">
            <Controller
                name={`components.${index}.quantity`}
                control={control}
                render={({ field }) => (
                    <NumberInput
                        placeholder="Số lượng"
                        style={{ width: '100%', height: '32px' }}
                        value={inputUnit === 'conv' && hasConv ? Number((field.value / conversion.conversion_factor).toFixed(6)) : field.value}
                        onChange={(val) => {
                            const num = Number(val);
                            field.onChange(inputUnit === 'conv' && hasConv ? num * conversion.conversion_factor : num);
                        }}
                    />
                )}
            />
            {hasConv && (
                <Radio.Group 
                    size="small" 
                    value={inputUnit} 
                    onChange={e => setInputUnit(e.target.value)}
                    className="mt-1"
                >
                    <Radio.Button value="base" style={{ fontSize: '11px' }}>
                        {productDetail?.unit?.name || 'Gốc'}
                    </Radio.Button>
                    <Radio.Button value="conv" style={{ fontSize: '11px' }}>
                        {conversion.unit?.name || 'Quy đổi'}
                    </Radio.Button>
                </Radio.Group>
            )}
          </div>
      </td>
      <td className="ant-table-cell" style={{ width: '15%' }}>
           <Text type="secondary" style={{ fontSize: '12px' }}>
                {inputUnit === 'conv' && hasConv ? 'Tính theo đơn vị phụ' : 'Tính theo đơn vị gốc'}
           </Text>
      </td>
      <td className="ant-table-cell" style={{ width: '10%', textAlign: 'center' }}>
        <Button 
          type="text" 
          danger 
          icon={<DeleteOutlined />} 
          onClick={() => remove(index)} 
        />
      </td>
    </tr>
  )
}

const ProductBOMTable: React.FC<ProductBOMTableProps> = ({ control }) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "components",
  })

  const [searchTerm, setSearchTerm] = useState("")
  const { data: productsData, isLoading: isLoadingProducts } = useProductSearch(searchTerm, 20)

  // Phát hiện Mobile
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  return (
    <Card 
      title={
        <div className="flex items-center gap-2 py-1">
          <span className="font-semibold text-blue-700">Công thức phối trộn (BOM)</span>
        </div>
      }
      size="small"
      className="mt-6 border-blue-200 shadow-sm overflow-hidden"
      headStyle={{ backgroundColor: '#f0f7ff', borderBottom: '1px solid #bae7ff' }}
      extra={
        <Button 
          type="primary" 
          size="small" 
          icon={<PlusOutlined />} 
          onClick={() => append({ componentProductId: undefined, quantity: 1 })}
          ghost
        >
          {isMobile ? "Thêm" : "Thêm nguyên liệu"}
        </Button>
      }
    >
      {!isMobile ? (
        // VIEW CHO DESKTOP
        <div className="ant-table ant-table-middle">
          <div className="ant-table-container">
              <div className="ant-table-content">
                  <table style={{ tableLayout: 'fixed', width: '100%' }}>
                      <thead className="ant-table-thead">
                          <tr>
                              <th className="ant-table-cell">Nguyên liệu</th>
                              <th className="ant-table-cell">Số lượng & Đơn vị nhập</th>
                              <th className="ant-table-cell">Ghi chú</th>
                              <th className="ant-table-cell" style={{ textAlign: 'center' }}>Thao tác</th>
                          </tr>
                      </thead>
                      <tbody className="ant-table-tbody">
                          {fields.map((field, index) => (
                              <BOMItem 
                                  key={field.id}
                                  index={index}
                                  control={control}
                                  productOptions={productOptions}
                                  onSearch={setSearchTerm}
                                  loading={isLoadingProducts}
                                  remove={remove}
                                  isMobile={false}
                              />
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
        </div>
      ) : (
        // VIEW CHO MOBILE (DẠNG CARD)
        <div className="pt-2">
            {fields.map((field, index) => (
                <BOMItem 
                    key={field.id}
                    index={index}
                    control={control}
                    productOptions={productOptions}
                    onSearch={setSearchTerm}
                    loading={isLoadingProducts}
                    remove={remove}
                    isMobile={true}
                />
            ))}
        </div>
      )}
      
      {fields.length === 0 && (
        <div className="py-10 text-center text-gray-400 border-t border-gray-100 bg-gray-50/50">
            <PlusOutlined style={{ fontSize: 32, marginBottom: 12, opacity: 0.5 }} />
            <div className="text-sm">Chưa có thành phần nào được khai báo cho sản phẩm này</div>
        </div>
      )}
    </Card>
  )
}

export default ProductBOMTable
