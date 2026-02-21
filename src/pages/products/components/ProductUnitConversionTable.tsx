import React, { useEffect, useState } from "react"
import { Typography, Space, Checkbox, Divider } from "antd"
import { Control, useFieldArray, useWatch, Controller } from "react-hook-form"
import { FormComboBox } from "@/components/form"
import NumberInput from "@/components/common/number-input"
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

  // Chế độ đơn vị nhỏ (VD: 1 chai chứa 500ml)
  const [isSubUnitMode, setIsSubUnitMode] = useState(false);

  const mainUnitId = useWatch({
    control,
    name: "unit_id",
  })

  const watchedConversions = useWatch({
    control,
    name: "unit_conversions",
  })

  // State để biết người dùng đã chủ động nhấn vào checkbox chưa
  const [hasUserToggled, setHasUserToggled] = useState(false);

  // Tự động nhận diện khi dữ liệu được tải từ server về
  useEffect(() => {
    // Chỉ tự động bật nếu người dùng chưa từng chạm vào checkbox
    if (!hasUserToggled && watchedConversions && watchedConversions.length > 1) {
      const factor = Number(watchedConversions[1].conversion_factor);
      
      // QUAN TRỌNG: Nếu hệ số < 1 (ví dụ 0.5, 0.002) 
      // thì chắc chắn đơn vị quy đổi là đơn vị nhỏ hơn đơn vị gốc
      if (factor > 0 && factor < 1) {
        setIsSubUnitMode(true);
      } 
      // Ngược lại nếu hệ số > 1 (ví dụ 24 chai/thùng) thì là đơn vị lớn
      else if (factor > 1) {
        setIsSubUnitMode(false);
      }
    }
  }, [watchedConversions, hasUserToggled]);

  const getUnitName = (id: number) => {
    return units.find((u: any) => u.id === id)?.name || "..."
  }

  // Luôn đảm bảo có 2 phần tử: 0 là base unit, 1 là conversion unit
  useEffect(() => {
    if (mainUnitId && units.length > 0) {
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
        update(0, {
          ...fields[0],
          unit_id: mainUnitId,
          conversion_factor: 1,
          is_base_unit: true,
        })
      }
    }
  }, [mainUnitId, units.length])

  const hasConversion = fields.length > 1;

  const handleToggleConversion = (e: React.MouseEvent, checked: boolean) => {
    e.preventDefault();
    if (checked && fields.length <= 1) {
      append({
        unit_id: undefined as any,
        conversion_factor: isSubUnitMode ? 0.002 : 24, // Mặc định 500ml hoặc 24 chai
        is_base_unit: false,
        is_purchase_unit: true,
        is_sales_unit: true,
      });
    } else if (!checked && fields.length > 1) {
      remove(1);
    }
  };

  return (
    <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 mb-6 mt-4">
      <div className="flex items-center justify-between mb-3">
        <Typography.Text strong className="text-blue-800">
          Quy cách & Đơn vị quy đổi:
        </Typography.Text>
        <Typography.Link 
          onClick={(e) => handleToggleConversion(e, !hasConversion)}
          className="text-xs"
        >
          {hasConversion ? "[ Bỏ quy đổi ]" : "[ Thêm quy đổi (ML, Thùng, Bao...) ]"}
        </Typography.Link>
      </div>

      {hasConversion && (
        <div className="bg-white p-3 rounded border border-blue-50 mb-3 ml-2">
            <Checkbox 
                checked={isSubUnitMode} 
                onChange={(e) => {
                    setIsSubUnitMode(e.target.checked);
                    setHasUserToggled(true); 
                }}
                className="text-xs text-gray-500 mb-3"
            >
                Cho phép chia nhỏ để bán lẻ & phối trộn (ML, Lít, Gram...)
            </Checkbox>

            <div className="grid grid-cols-1 gap-4">
                {!isSubUnitMode ? (
                    <div className="flex flex-col gap-3">
                        {/* Hàng 1: Tên đơn vị */}
                        <div className="flex items-center gap-2">
                             <Typography.Text className="text-gray-500 whitespace-nowrap" style={{ width: 80 }}>Đơn vị:</Typography.Text>
                             <div className="flex-1">
                                <FormComboBox
                                    name={`unit_conversions.1.unit_id`}
                                    control={control}
                                    placeholder="Ví dụ: Thùng, Bao..."
                                    options={units.map((u: any) => ({ label: u.name, value: u.id }))}
                                    className="mb-0"
                                />
                             </div>
                        </div>
                        {/* Hàng 2: Quy cách */}
                        <div className="flex items-center gap-2" style={{ height: '32px' }}>
                            <Typography.Text className="text-gray-400 whitespace-nowrap" style={{ width: 80 }}>Bằng:</Typography.Text>
                            <div style={{ width: 100, height: '100%' }}>
                                <Controller
                                    name={`unit_conversions.1.conversion_factor`}
                                    control={control}
                                    render={({ field }) => (
                                        <NumberInput
                                            value={field.value}
                                            onChange={field.onChange}
                                            placeholder="Số lượng"
                                            style={{ width: '100%', height: '100%', margin: 0 }}
                                        />
                                    )}
                                />
                            </div>
                            <Typography.Text strong className="text-gray-700">
                                {mainUnitId ? getUnitName(mainUnitId) : '...'}
                            </Typography.Text>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {/* Hàng 1: Đơn vị gốc */}
                        <div className="flex items-center gap-2">
                            <Typography.Text className="text-gray-500 whitespace-nowrap">
                                Mỗi 1 <strong>{mainUnitId ? getUnitName(mainUnitId) : '...'}</strong> chứa:
                            </Typography.Text>
                        </div>
                        {/* Hàng 2: Nhập số lượng và đơn vị con */}
                        <div className="flex gap-2 items-stretch" style={{ height: '32px' }}>
                            <div style={{ width: 100 }}>
                                 <Controller
                                    name={`unit_conversions.1.conversion_factor`}
                                    control={control}
                                    render={({ field }) => (
                                        <NumberInput 
                                            placeholder="500"
                                            style={{ 
                                                width: '100%', 
                                                height: '100%', 
                                                margin: 0
                                            }}
                                            value={field.value > 0 && field.value < 1 ? Math.round(1 / field.value) : field.value}
                                            onChange={(val) => {
                                                const num = Number(val);
                                                field.onChange(num > 0 ? 1 / num : 0);
                                            }}
                                        />
                                    )}
                                 />
                            </div>
                            <div className="flex-1">
                                <FormComboBox
                                    name={`unit_conversions.1.unit_id`}
                                    control={control}
                                    placeholder="Chọn đơn vị"
                                    options={units.map((u: any) => ({ label: u.name, value: u.id }))}
                                    className="mb-0 custom-conversion-select"
                                    style={{ 
                                        width: '100%', 
                                        height: '100%',
                                        margin: 0
                                    }}
                                />
                            </div>
                        </div>
                        <div className="text-[10px] text-orange-500 italic font-medium">
                            * Ví dụ: 1 Chai chứa 500 ML hoặc 1 Chai chứa 2 Lít.
                        </div>
                    </div>
                )}
            </div>
        </div>
      )}

      {!hasConversion && (
        <Typography.Text type="secondary" className="text-xs italic ml-2">
          Sản phẩm này hiện chỉ bán theo <strong>{mainUnitId ? getUnitName(mainUnitId) : '...'}</strong>.
        </Typography.Text>
      )}
    </div>
  )
}

export default ProductUnitConversionTable

