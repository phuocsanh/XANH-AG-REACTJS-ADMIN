/**
 * Modal dùng chung cho việc Tạo mới và Chỉnh sửa Ruộng lúa
 * Sử dụng react-hook-form, infinite loading cho ComboBox và tự động tính diện tích
 */
import React, { useEffect, useState, useMemo } from 'react';
import { Modal, message } from 'antd';
import { useForm } from 'react-hook-form';
import { FormField, FormFieldNumber, FormComboBox, FormDatePicker } from '@/components/form';
import { useCreateRiceCrop, useUpdateRiceCrop } from '@/queries/rice-crop';
import { useCustomerSearch } from '@/queries/customer';
import { useSeasonSearch } from '@/queries/season';
import { useAreasQuery } from '@/queries/area-of-each-plot-of-land';
import { GrowthStage, CropStatus, type RiceCrop, type CreateRiceCropDto } from '@/models/rice-farming';
import { useAppStore } from '@/stores/store';
import dayjs from 'dayjs';

interface RiceCropModalProps {
  open: boolean;
  onCancel: () => void;
  editingCrop?: RiceCrop | null;
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
  growth_stage?: GrowthStage;
  status?: CropStatus;
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

export const RiceCropModal: React.FC<RiceCropModalProps> = ({
  open,
  onCancel,
  editingCrop,
}) => {
  const isEditMode = !!editingCrop;
  const createMutation = useCreateRiceCrop();
  const updateMutation = useUpdateRiceCrop();
  
  // State tìm kiếm cho ComboBox
  const [customerSearch, setCustomerSearch] = useState('');
  const [seasonSearch, setSeasonSearch] = useState('');

  // Hooks tìm kiếm infinite loading (mỗi lần load 20 cái)
  const { 
    data: customerSearchData, 
    isLoading: isCustomerLoading,
    isFetching: isCustomerFetching,
    hasNextPage: customerHasNextPage,
    isFetchingNextPage: isCustomerFetchingNextPage,
    fetchNextPage: fetchNextCustomerPage,
  } = useCustomerSearch(customerSearch, 20, open);

  const { 
    data: seasonSearchData, 
    isLoading: isSeasonLoading,
    isFetching: isSeasonFetching,
    hasNextPage: seasonHasNextPage,
    isFetchingNextPage: isSeasonFetchingNextPage,
    fetchNextPage: fetchNextSeasonPage,
  } = useSeasonSearch(seasonSearch, 20, open);

  const { data: areasData } = useAreasQuery({ limit: 100 });
  const { userInfo } = useAppStore();
  const isCustomer = userInfo?.role?.code === 'CUSTOMER';

  // Chuyển đổi dữ liệu sang options
  const customerOptions = useMemo(() => {
    return customerSearchData?.pages.flatMap(page => page.data) || [];
  }, [customerSearchData]);

  const seasonOptions = useMemo(() => {
    return seasonSearchData?.pages.flatMap(page => page.data) || [];
  }, [seasonSearchData]);

  const areaOptions = useMemo(() => {
    return areasData?.data?.items?.map((a: any) => ({
      label: `${a.name} - ${Number(a.acreage).toLocaleString('vi-VN')}m²`,
      value: a.id,
    })) || [];
  }, [areasData]);

  const growthStageOptions = useMemo(() => 
    Object.entries(growthStageLabels).map(([value, label]) => ({ value, label })), []);

  const statusOptions = useMemo(() => 
    Object.entries(statusLabels).map(([value, label]) => ({ value, label })), []);

  const { control, handleSubmit, reset, watch, setValue } = useForm<RiceCropFormValues>({
    defaultValues: {
      field_name: '',
      amount_of_land: 0,
      field_area: 0,
      rice_variety: '',
      notes: '',
    },
  });

  // Tự động tính diện tích
  const watchedAmountOfLand = watch('amount_of_land');
  const watchedAreaId = watch('area_of_each_plot_of_land_id');

  useEffect(() => {
    if (watchedAmountOfLand && watchedAreaId && areasData?.data?.items) {
      const selectedArea = areasData.data.items.find((area: any) => area.id === watchedAreaId);
      if (selectedArea) {
        const calculatedArea = Number(watchedAmountOfLand) * Number(selectedArea.acreage);
        setValue('field_area', calculatedArea);
      }
    }
  }, [watchedAmountOfLand, watchedAreaId, areasData, setValue]);

  // Reset form khi open hoặc editingCrop thay đổi
  useEffect(() => {
    if (open) {
      if (editingCrop) {
        reset({
          customer_id: editingCrop.customer_id,
          season_id: editingCrop.season_id,
          field_name: editingCrop.field_name,
          amount_of_land: Number(editingCrop.amount_of_land),
          area_of_each_plot_of_land_id: editingCrop.area_of_each_plot_of_land_id,
          field_area: Number(editingCrop.field_area),
          location: editingCrop.location || '',
          rice_variety: editingCrop.rice_variety,
          seed_source: editingCrop.seed_source || '',
          sowing_date: editingCrop.sowing_date || undefined,
          transplanting_date: editingCrop.transplanting_date || undefined,
          expected_harvest_date: editingCrop.expected_harvest_date || undefined,
          actual_harvest_date: editingCrop.actual_harvest_date || undefined,
          growth_stage: editingCrop.growth_stage,
          status: editingCrop.status,
          notes: editingCrop.notes || '',
        });
      } else {
        reset({
          customer_id: undefined as any,
          season_id: undefined as any,
          field_name: '',
          amount_of_land: 0,
          area_of_each_plot_of_land_id: null,
          field_area: 0,
          location: '',
          rice_variety: '',
          seed_source: '',
          sowing_date: undefined,
          transplanting_date: undefined,
          expected_harvest_date: undefined,
          actual_harvest_date: undefined,
          growth_stage: GrowthStage.SEEDLING,
          status: CropStatus.ACTIVE,
          notes: '',
        });
      }
    }
  }, [open, editingCrop, reset]);

  const onSubmit = async (data: RiceCropFormValues) => {
    try {
      const dto: any = {
        ...data,
        area_of_each_plot_of_land_id: data.area_of_each_plot_of_land_id || undefined,
        sowing_date: data.sowing_date ? dayjs(data.sowing_date).format('YYYY-MM-DD') : undefined,
        transplanting_date: data.transplanting_date ? dayjs(data.transplanting_date).format('YYYY-MM-DD') : undefined,
        expected_harvest_date: data.expected_harvest_date ? dayjs(data.expected_harvest_date).format('YYYY-MM-DD') : undefined,
        actual_harvest_date: data.actual_harvest_date ? dayjs(data.actual_harvest_date).format('YYYY-MM-DD') : undefined,
      };

      if (isEditMode && editingCrop) {
        await updateMutation.mutateAsync({ id: editingCrop.id, dto });
        message.success('Cập nhật Ruộng lúa thành công!');
      } else {
        await createMutation.mutateAsync(dto);
        message.success('Tạo Ruộng lúa thành công!');
      }

      onCancel();
    } catch (error) {
      console.error('Submit failed:', error);
      message.error('Có lỗi xảy ra');
    }
  };

  return (
    <Modal
      title={isEditMode ? 'Chỉnh sửa Ruộng lúa' : 'Tạo Ruộng lúa mới'}
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit(onSubmit)}
      confirmLoading={createMutation.isPending || updateMutation.isPending}
      width={800}
      okText={isEditMode ? 'Cập nhật' : 'Tạo mới'}
      cancelText="Hủy"
    >
      <form className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-4">
        <FormComboBox
          label="Khách hàng"
          name="customer_id"
          control={control}
          rules={{ required: 'Vui lòng chọn khách hàng' }}
          data={customerOptions}
          isLoading={isCustomerLoading}
          isFetching={isCustomerFetching}
          hasNextPage={customerHasNextPage}
          isFetchingNextPage={isCustomerFetchingNextPage}
          fetchNextPage={fetchNextCustomerPage}
          onSearch={setCustomerSearch}
          placeholder="Chọn khách hàng"
          showSearch
          disabled={isCustomer}
        />

        <FormComboBox
          label="Mùa vụ"
          name="season_id"
          control={control}
          rules={{ required: 'Vui lòng chọn mùa vụ' }}
          data={seasonOptions}
          isLoading={isSeasonLoading}
          isFetching={isSeasonFetching}
          hasNextPage={seasonHasNextPage}
          isFetchingNextPage={isSeasonFetchingNextPage}
          fetchNextPage={fetchNextSeasonPage}
          onSearch={setSeasonSearch}
          placeholder="Chọn mùa vụ"
          showSearch
        />

        <FormField
          label="Tên ruộng"
          name="field_name"
          control={control}
          rules={{ required: 'Vui lòng nhập tên ruộng' }}
          placeholder="VD: Ruộng sau nhà"
        />

        <FormFieldNumber
          label="Số công đất"
          name="amount_of_land"
          control={control}
          rules={{ required: 'Vui lòng nhập số công đất' }}
          placeholder="VD: 10"
          decimalScale={1}
        />

        <FormComboBox
          label="Diện tích mỗi công"
          name="area_of_each_plot_of_land_id"
          control={control}
          options={areaOptions}
          placeholder="Chọn diện tích"
          allowClear
          showSearch
        />

        <FormFieldNumber
          label="Tổng diện tích (m²)"
          name="field_area"
          control={control}
          rules={{ required: 'Vui lòng nhập diện tích' }}
          placeholder="VD: 5000"
          decimalScale={1}
        />

        {/* Hiển thị Trạng thái và Giai đoạn nếu là chế độ Sửa */}
        {isEditMode && (
          <>
            <FormComboBox
              label="Giai đoạn sinh trưởng"
              name="growth_stage"
              control={control}
              options={growthStageOptions}
              required
            />
            <FormComboBox
              label="Trạng thái"
              name="status"
              control={control}
              options={statusOptions}
              required
            />
          </>
        )}

        <FormField
          label="Giống lúa"
          name="rice_variety"
          control={control}
          rules={{ required: 'Vui lòng nhập giống lúa' }}
          placeholder="VD: OM 5451"
        />

        <FormField
          label="Nguồn giống"
          name="seed_source"
          control={control}
          placeholder="VD: Trung tâm giống An Giang"
        />

        <FormField
          label="Vị trí"
          name="location"
          control={control}
          placeholder="VD: Xã Tân Hiệp, An Giang"
        />

        <FormDatePicker
          label="Ngày gieo mạ"
          name="sowing_date"
          control={control}
        />

        <FormDatePicker
          label="Ngày cấy"
          name="transplanting_date"
          control={control}
        />

        <FormDatePicker
          label="Ngày thu hoạch dự kiến"
          name="expected_harvest_date"
          control={control}
        />

        {isEditMode && (
          <FormDatePicker
            label="Ngày thu hoạch thực tế"
            name="actual_harvest_date"
            control={control}
          />
        )}

        <FormField
          label="Ghi chú"
          name="notes"
          control={control}
          type="textarea"
          rows={3}
          placeholder="Ghi chú về Ruộng lúa..."
          className="col-span-2"
        />
      </form>
    </Modal>
  );
};

export default RiceCropModal;
