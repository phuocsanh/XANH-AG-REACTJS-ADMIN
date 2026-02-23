import React, { useEffect, useState } from "react"
import { Typography, Radio } from "antd"
import { Control, useFieldArray, useWatch, Controller, useFormContext } from "react-hook-form"
import NumberInput from "@/components/common/number-input"
import { useUnitsQuery } from "@/queries/unit"
import { ProductFormValues } from "./form-config"
import { FormComboBox } from "@/components/form"

interface ProductUnitConversionTableProps {
  control: Control<ProductFormValues>
}

const ProductUnitConversionTable: React.FC<ProductUnitConversionTableProps> = ({ control }) => {
  const { setValue, getValues } = useFormContext();
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "unit_conversions" as const,
  })

  const { data: unitsData } = useUnitsQuery()
  const units = unitsData?.data?.items || []

  // Hướng quy đổi
  const [direction, setDirection] = useState<'big_to_base' | 'base_to_sub'>('big_to_base');

  const mainUnitId = useWatch({ control, name: "unit_id" })
  const watchedConversions = useWatch({ control, name: "unit_conversions" })

  const [hasInit, setHasInit] = useState(false);
  useEffect(() => {
    if (!hasInit && watchedConversions && watchedConversions.length > 1) {
      const factor = Number(watchedConversions[1].conversion_factor);
      if (factor > 0 && factor < 1) {
        setDirection('base_to_sub');
      } else {
        setDirection('big_to_base');
      }
      setHasInit(true);
    }
  }, [watchedConversions, hasInit]);

  // Đồng bộ đơn vị gốc
  useEffect(() => {
    if (mainUnitId && units.length > 0) {
      if (fields.length === 0) {
        append({
          unit_id: mainUnitId,
          conversion_factor: 1,
          is_base_unit: true,
          is_purchase_unit: true,
          is_sales_unit: true,
        })
      } else if (fields[0]?.unit_id !== mainUnitId) {
          update(0, { ...fields[0], unit_id: mainUnitId, conversion_factor: 1, is_base_unit: true });
      }
    }
  }, [mainUnitId, units.length, append, fields, update])

  // Chặn chọn đơn vị trùng nhau
  useEffect(() => {
    const convUnitId = watchedConversions?.[1]?.unit_id;
    if (convUnitId && convUnitId === mainUnitId) {
       setValue('unit_conversions.1.unit_id', undefined);
    }
  }, [mainUnitId, watchedConversions, setValue]);

  const getUnitName = (id: number | string | undefined) => {
    if (id === undefined || id === null) return "..."
    return units.find((u: any) => Number(u.id) === Number(id))?.name || "..."
  }

  const hasConversion = fields.length > 1;
  const convFactor = Number(watchedConversions?.[1]?.conversion_factor || 0);
  const convUnitId = watchedConversions?.[1]?.unit_id;

  const displayValue = direction === 'base_to_sub' 
    ? (convFactor > 0 && convFactor < 1 ? Number((1 / convFactor).toFixed(6)) : convFactor)
    : Number(convFactor.toFixed(6));

  const handleToggleConversion = (e: React.MouseEvent, checked: boolean) => {
    e.preventDefault();
    if (checked && fields.length <= 1) {
      append({
        unit_id: undefined as any,
        conversion_factor: direction === 'base_to_sub' ? 0.002 : 50,
        is_base_unit: false,
        is_purchase_unit: true,
        is_sales_unit: true,
      });
    } else if (!checked && fields.length > 1) {
      remove(1);
    }
  };

  return (
    <div className="bg-slate-50 p-2 md:p-3 rounded-xl border border-slate-200 mb-4 mt-2">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
            <div className="w-1 h-3.5 bg-blue-500 rounded-full"></div>
            <Typography.Text strong className="text-slate-700 text-[11px] uppercase tracking-wide">
                Quy cách quy đổi
            </Typography.Text>
        </div>
        <Typography.Link 
          onClick={(e) => handleToggleConversion(e, !hasConversion)}
          className="text-xs font-bold text-blue-600"
        >
          {hasConversion ? "Hủy" : "Thêm quy đổi"}
        </Typography.Link>
      </div>

      {hasConversion && (
        <div className="space-y-2">
            <div className="px-1 flex items-center gap-4">
                <Radio.Group 
                    value={direction} 
                    onChange={(e) => {
                        const newDir = e.target.value;
                        setDirection(newDir);
                        const v = Number(getValues('unit_conversions.1.conversion_factor'));
                        if (v > 0) setValue('unit_conversions.1.conversion_factor', 1/v);
                    }}
                    size="small"
                >
                    <Radio value="big_to_base" className="text-[10px] font-medium !mr-2">Lớn</Radio>
                    <Radio value="base_to_sub" className="text-[10px] font-medium !mr-0">Nhỏ</Radio>
                </Radio.Group>
            </div>

            <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-sm overflow-hidden h-[50px] flex items-center">
                <div className="flex items-center gap-1.5 w-full">
                    {/* VẾ TRÁI: 1 [Đơn vị] */}
                    <div className="flex items-center gap-1 shrink-0">
                        <span className="text-slate-300 font-black text-sm italic">1</span>
                        {direction === 'big_to_base' ? (
                            <div className="w-[85px]">
                                <FormComboBox
                                    name="unit_conversions.1.unit_id"
                                    control={control}
                                    placeholder="..."
                                    options={units.filter((u) => Number(u.id) !== Number(mainUnitId)).map((u) => ({ label: u.name, value: u.id }))}
                                    variant="borderless"
                                    className="font-bold text-blue-600 w-full text-sm mb-0"
                                    style={{ marginBottom: 0 }}
                                    inputStyle={{ height: '32px', border: 'none', boxShadow: 'none' }}
                                />
                            </div>
                        ) : (
                            <span className="text-slate-700 text-sm font-bold min-w-[40px]">
                                {getUnitName(mainUnitId)}
                            </span>
                        )}
                    </div>

                    <div className="text-slate-300 font-bold text-sm leading-none shrink-0">=</div>

                    {/* VẾ PHẢI: Số lượng + Đơn vị - Mở rộng flex-1 để lấp đầy khoảng dư */}
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <Controller
                            name="unit_conversions.1.conversion_factor"
                            control={control}
                            render={({ field }) => (
                                <NumberInput 
                                    placeholder="0"
                                    style={{ 
                                        flex: '0 0 85px', 
                                        height: '32px', 
                                        fontSize: '15px', 
                                        fontWeight: 'bold', 
                                        textAlign: 'center', 
                                        borderRadius: '6px',
                                        background: '#f8fafc',
                                        border: '1px solid #eef2f6'
                                    }}
                                    value={displayValue}
                                    onChange={(val) => {
                                        const n = Number(val);
                                        field.onChange(direction === 'base_to_sub' ? (n > 0 ? 1/n : 0) : n);
                                    }}
                                />
                            )}
                        />
                        {direction === 'big_to_base' ? (
                            <span className="text-slate-500 text-sm font-medium flex-1 truncate">
                                {getUnitName(mainUnitId)}
                            </span>
                        ) : (
                            <div className="flex-1 min-w-[90px]">
                                <FormComboBox
                                    name="unit_conversions.1.unit_id"
                                    control={control}
                                    placeholder="..."
                                    options={units.filter((u) => Number(u.id) !== Number(mainUnitId)).map((u) => ({ label: u.name, value: u.id }))}
                                    className="w-full mb-0"
                                    style={{ width: '100%', marginBottom: 0 }}
                                    inputStyle={{ height: '32px' }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {convUnitId && convFactor > 0 && (
                <div className="px-1.5 text-[10px] text-blue-600 font-medium">
                    Xác nhận: 1 {getUnitName(direction === 'big_to_base' ? convUnitId : mainUnitId)} = {displayValue.toLocaleString('vi-VN')} {getUnitName(direction === 'big_to_base' ? mainUnitId : convUnitId)}
                </div>
            )}
        </div>
      )}
    </div>
  )
}

export default ProductUnitConversionTable
