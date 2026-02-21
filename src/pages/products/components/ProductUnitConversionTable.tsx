import React, { useEffect } from "react"
import { Typography, Space } from "antd"
import { Control, useFieldArray, useWatch } from "react-hook-form"
import { FormComboBox, FormFieldNumber } from "@/components/form"
import { useUnitsQuery } from "@/queries/unit"
import { ProductFormValues } from "./form-config"

interface ProductUnitConversionTableProps {
  control: Control<ProductFormValues>
}

const ProductUnitConversionTable: React.FC<ProductUnitConversionTableProps> = ({ control }) => {
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "unit_conversions" as const,
  })

  const { data: unitsData } = useUnitsQuery()
  const units = unitsData?.data?.items || []

  const mainUnitId = useWatch({
    control,
    name: "unit_id",
  })

  const watchedConversions = useWatch({
    control,
    name: "unit_conversions",
  })

  const getUnitName = (id: number) => {
    return units.find((u: any) => u.id === id)?.name || "..."
  }

  // Luôn đảm bảo có 2 phần tử: 0 là base unit, 1 là conversion unit
  useEffect(() => {
    if (mainUnitId && units.length > 0) {
      // Đảm bảo phần tử 0 luôn là đơn vị cơ sở
      if (fields.length === 0) {
        append({
          unit_id: mainUnitId,
          conversion_factor: 1,
          is_base_unit: true,
          is_purchase_unit: true,
          is_sales_unit: true,
          notes: "Gốc",
        })
      } else {
        // Cập nhật lại đơn vị cơ sở nếu mainUnitId thay đổi
        update(0, {
          ...fields[0],
          unit_id: mainUnitId,
          conversion_factor: 1,
          is_base_unit: true,
        })
      }
    }
  }, [mainUnitId, units.length])

  // Lấy ra conversion unit (phần tử thứ 2 trong mảng)
  const hasConversion = fields.length > 1;

  const handleToggleConversion = (checked: boolean) => {
    if (checked && fields.length === 1) {
      append({
        unit_id: undefined as any,
        conversion_factor: 1,
        is_base_unit: false,
        is_purchase_unit: true,
        is_sales_unit: true,
      })
    } else if (!checked && fields.length > 1) {
      remove(1)
    }
  }

  return (
    <div className="bg-blue-50/30 p-4 rounded-lg border border-blue-100 mb-6 mt-4">
      <div className="flex items-center gap-4 mb-2">
        <Typography.Text strong className="text-blue-800">
          Quy cách đóng gói:
        </Typography.Text>
        <Typography.Link 
          onClick={() => handleToggleConversion(!hasConversion)}
          className="text-xs"
        >
          {hasConversion ? "[ Bỏ quy đổi ]" : "[ Thêm đơn vị quy đổi (Bao, Thùng...) ]"}
        </Typography.Link>
      </div>

      {hasConversion ? (
        <div className="flex flex-wrap items-center gap-4">
          <div style={{ width: 180 }}>
            <FormComboBox
              name={`unit_conversions.1.unit_id`}
              control={control}
              placeholder="Chọn đơn vị"
              options={units.map((u: any) => ({ label: u.name, value: u.id }))}
              className="mb-0"
            />
          </div>
          <Typography.Text className="pt-1">quy đổi bằng</Typography.Text>
          <div style={{ width: 120 }}>
            <FormFieldNumber
              name={`unit_conversions.1.conversion_factor`}
              control={control}
              placeholder="Số lượng"
              className="mb-0"
              min={0.000001}
            />
          </div>
          <Typography.Text strong className="pt-1 text-gray-700">
            {mainUnitId ? getUnitName(mainUnitId) : '...'}
          </Typography.Text>
          
          <div className="text-xs text-gray-400 italic w-full">
            * Ví dụ: Nếu đây là sản phẩm bán theo Bao 50Kg, hãy chọn đơn vị là <strong>Bao</strong> và nhập số <strong>50</strong>.
          </div>
        </div>
      ) : (
        <Typography.Text type="secondary" className="text-xs italic">
          Sản phẩm này hiện chỉ quản lý theo đơn vị gốc là <strong>{mainUnitId ? getUnitName(mainUnitId) : '...'}</strong>.
        </Typography.Text>
      )}
    </div>
  )
}

export default ProductUnitConversionTable
