import React, { useEffect } from 'react';
import { Modal, message } from 'antd';
import { useForm } from 'react-hook-form';
import FormField from '@/components/form/form-field';
import FormFieldNumber from '@/components/form/form-field-number';
import FormComboBox from '@/components/form/form-combo-box';
import FormDatePicker from '@/components/form/form-date-picker';
import { useUpdateRiceCrop } from '@/queries/rice-crop';
import { useCustomersQuery } from '@/queries/customer';
import { useSeasonsQuery } from '@/queries/season';
import { useAreasQuery } from '@/queries/area-of-each-plot-of-land';
import { GrowthStage, CropStatus, type RiceCrop } from '@/models/rice-farming';
import { useAppStore } from '@/stores/store';
import dayjs from 'dayjs';

interface EditRiceCropModalProps {
  open: boolean;
  onCancel: () => void;
  riceCrop: RiceCrop;
}

interface RiceCropFormValues {
  customer_id: number;
  season_id: number;
  field_name: string;
  amount_of_land: number;
  area_of_each_plot_of_land_id?: number | null;
  field_area: number;
  location?: string;
  rice_variety: string;
  seed_source?: string;
  sowing_date?: string;
  transplanting_date?: string;
  expected_harvest_date?: string;
  actual_harvest_date?: string;
  growth_stage: GrowthStage;
  status: CropStatus;
  notes?: string;
}

// Nhãn cho giai đoạn sinh trưởng
const growthStageLabels: Record<GrowthStage, string> = {
  seedling: 'Giai đoạn mạ',
  tillering: 'Đẻ nhánh',
  panicle: 'Làm đòng',
  heading: 'Trổ bông',
  grain_filling: 'Vô gạo',
  ripening: 'Chín',
  harvested: 'Đã thu hoạch',
};

// Nhãn cho trạng thái
const statusLabels: Record<CropStatus, string> = {
  active: 'Đang canh tác',
  harvested: 'Đã thu hoạch',
  failed: 'Thất bại',
};

export const EditRiceCropModal: React.FC<EditRiceCropModalProps> = ({
  open,
  onCancel,
  riceCrop,
}) => {
  const updateMutation = useUpdateRiceCrop();
  const { data: customersData } = useCustomersQuery({ limit: 100 });
  const { data: seasonsData } = useSeasonsQuery();
  const { data: areasData } = useAreasQuery({ limit: 100 });
  const { userInfo } = useAppStore();
  const isCustomer = userInfo?.role?.code === 'CUSTOMER';

  const { control, handleSubmit, reset, watch, setValue } = useForm<RiceCropFormValues>({
    defaultValues: {
      customer_id: riceCrop.customer_id,
      season_id: riceCrop.season_id,
      field_name: riceCrop.field_name,
      amount_of_land: Number(riceCrop.amount_of_land),
      area_of_each_plot_of_land_id: riceCrop.area_of_each_plot_of_land_id,
      field_area: Number(riceCrop.field_area),
      location: riceCrop.location,
      rice_variety: riceCrop.rice_variety,
      seed_source: riceCrop.seed_source,
      sowing_date: riceCrop.sowing_date,
      transplanting_date: riceCrop.transplanting_date,
      expected_harvest_date: riceCrop.expected_harvest_date,
      actual_harvest_date: riceCrop.actual_harvest_date,
      growth_stage: riceCrop.growth_stage,
      status: riceCrop.status,
      notes: riceCrop.notes,
    },
  });

  // Watch các trường để tự động tính diện tích
  const watchedAmountOfLand = watch('amount_of_land');
  const watchedAreaId = watch('area_of_each_plot_of_land_id');

  // Tự động tính diện tích khi có đủ thông tin
  useEffect(() => {
    if (watchedAmountOfLand && watchedAreaId && areasData?.data?.items) {
      const selectedArea = areasData.data.items.find((area: any) => area.id === watchedAreaId);
      if (selectedArea) {
        const calculatedArea = Number(watchedAmountOfLand) * Number(selectedArea.acreage);
        setValue('field_area', calculatedArea);
      }
    }
  }, [watchedAmountOfLand, watchedAreaId, areasData, setValue]);

  // Reset form khi riceCrop thay đổi
  useEffect(() => {
    if (open) {
      reset({
        customer_id: riceCrop.customer_id,
        season_id: riceCrop.season_id,
        field_name: riceCrop.field_name,
        amount_of_land: Number(riceCrop.amount_of_land),
        area_of_each_plot_of_land_id: riceCrop.area_of_each_plot_of_land_id,
        field_area: Number(riceCrop.field_area),
        location: riceCrop.location,
        rice_variety: riceCrop.rice_variety,
        seed_source: riceCrop.seed_source,
        sowing_date: riceCrop.sowing_date,
        transplanting_date: riceCrop.transplanting_date,
        expected_harvest_date: riceCrop.expected_harvest_date,
        actual_harvest_date: riceCrop.actual_harvest_date,
        growth_stage: riceCrop.growth_stage,
        status: riceCrop.status,
        notes: riceCrop.notes,
      });
    }
  }, [open, riceCrop, reset]);

  const onSubmit = async (data: RiceCropFormValues) => {
    try {
      // Xử lý null value cho area_of_each_plot_of_land_id
      // Format các trường date thành YYYY-MM-DD để tránh lỗi timezone
      const dto = {
        ...data,
        area_of_each_plot_of_land_id: data.area_of_each_plot_of_land_id || undefined,
        sowing_date: data.sowing_date ? dayjs(data.sowing_date).format('YYYY-MM-DD') : undefined,
        transplanting_date: data.transplanting_date ? dayjs(data.transplanting_date).format('YYYY-MM-DD') : undefined,
        expected_harvest_date: data.expected_harvest_date ? dayjs(data.expected_harvest_date).format('YYYY-MM-DD') : undefined,
        actual_harvest_date: data.actual_harvest_date ? dayjs(data.actual_harvest_date).format('YYYY-MM-DD') : undefined,
      };
      
      await updateMutation.mutateAsync({ id: riceCrop.id, dto });
      message.success('Cập nhật thông tin thành công!');
      onCancel();
    } catch (error) {
      console.error('Update failed:', error);
      message.error('Có lỗi xảy ra khi cập nhật');
    }
  };

  // Tạo options cho customers
  const customerOptions = customersData?.data?.items?.map((customer: any) => ({
    value: customer.id,
    label: `${customer.name} - ${customer.phone || ''}`,
  })) || [];

  // Tạo options cho seasons
  const seasonOptions = seasonsData?.data?.items?.map((season: any) => ({
    value: season.id,
    label: `${season.name} (${season.year})`,
  })) || [];

  // Tạo options cho areas
  const areaOptions = areasData?.data?.items?.map((area: any) => ({
    value: area.id,
    label: `${area.name} - ${Number(area.acreage).toLocaleString('vi-VN')}m²`,
  })) || [];

  // Tạo options cho growth stages
  const growthStageOptions = Object.entries(growthStageLabels).map(([value, label]) => ({
    value,
    label,
  }));

  // Tạo options cho status
  const statusOptions = Object.entries(statusLabels).map(([value, label]) => ({
    value,
    label,
  }));

  return (
    <Modal
      title="Chỉnh sửa thông tin Ruộng lúa"
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit(onSubmit)}
      confirmLoading={updateMutation.isPending}
      width={800}
      okText="Cập nhật"
      cancelText="Hủy"
    >
      <form className="mt-4">
        <div className="grid grid-cols-2 gap-x-4">
          <FormComboBox
            name="customer_id"
            control={control}
            label="Khách hàng"
            options={customerOptions}
            required
            placeholder="Chọn khách hàng"
            showSearch
            disabled={isCustomer}
          />

          <FormComboBox
            name="season_id"
            control={control}
            label="Mùa vụ"
            options={seasonOptions}
            required
            placeholder="Chọn mùa vụ"
          />

          <FormField
            name="field_name"
            control={control}
            label="Tên ruộng"
            required
            placeholder="Nhập tên ruộng"
          />

          <FormFieldNumber
            name="amount_of_land"
            control={control}
            label="Số công đất"
            required
            decimalScale={1}
          />

          <FormComboBox
            name="area_of_each_plot_of_land_id"
            control={control}
            label="Diện tích mỗi công"
            options={areaOptions}
            placeholder="Chọn diện tích"
            allowClear
          />

          <FormFieldNumber
            name="field_area"
            control={control}
            label="Tổng diện tích (m²)"
            required
            decimalScale={1}
          />

          <FormComboBox
            name="growth_stage"
            control={control}
            label="Giai đoạn sinh trưởng"
            options={growthStageOptions}
            required
          />

          <FormComboBox
            name="status"
            control={control}
            label="Trạng thái"
            options={statusOptions}
            required
          />

          <FormField
            name="rice_variety"
            control={control}
            label="Giống lúa"
            required
            placeholder="Nhập giống lúa"
          />

          <FormField
            name="seed_source"
            control={control}
            label="Nguồn giống"
            placeholder="Nhập nguồn giống"
          />

          <FormDatePicker
            name="sowing_date"
            control={control}
            label="Ngày gieo mạ"
          />

          <FormDatePicker
            name="transplanting_date"
            control={control}
            label="Ngày cấy"
          />

          <FormDatePicker
            name="expected_harvest_date"
            control={control}
            label="Ngày thu hoạch dự kiến"
          />

          <FormDatePicker
            name="actual_harvest_date"
            control={control}
            label="Ngày thu hoạch thực tế"
          />

          <FormField
            name="location"
            control={control}
            label="Vị trí"
            placeholder="Nhập vị trí"
            className="col-span-2"
          />

          <FormField
            name="notes"
            control={control}
            label="Ghi chú"
            type="textarea"
            placeholder="Nhập ghi chú"
            className="col-span-2"
            rows={3}
          />
        </div>
      </form>
    </Modal>
  );
};
