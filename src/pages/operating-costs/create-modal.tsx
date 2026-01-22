import React, { useEffect, useState, useMemo } from 'react';
import { Modal, message } from 'antd';
import { useForm } from 'react-hook-form';
import { FormField, FormComboBox, FormDatePicker, FormFieldNumber } from '@/components/form';
import { CreateOperatingCostDto, OperatingCost } from '@/models/operating-cost';
import { useCreateOperatingCost, useUpdateOperatingCost } from '@/queries/operating-cost';
import { useSeasonSearch } from '@/queries/season';
import { useRiceCropSearch } from '@/queries/rice-crop';
import { useOperatingCostCategories } from '@/queries/operating-cost-category';
import { useCustomerSearch } from '@/queries/customer';
import dayjs from 'dayjs';

interface CreateOperatingCostModalProps {
  visible: boolean;
  onCancel: () => void;
  initialData?: OperatingCost | null;
  defaultValues?: Partial<CreateOperatingCostDto>;
}

interface OperatingCostFormValues {
  name: string;
  value: number;
  category_id: number;
  season_id: number;
  customer_id?: number | null;
  rice_crop_id?: number | null;
  expense_date: string;
  description?: string;
}

const CreateOperatingCostModal: React.FC<CreateOperatingCostModalProps> = ({
  visible,
  onCancel,
  initialData,
  defaultValues,
}) => {
  const createMutation = useCreateOperatingCost();
  const updateMutation = useUpdateOperatingCost();

  // State tìm kiếm
  const [customerSearch, setCustomerSearch] = useState('');
  const [seasonSearch, setSeasonSearch] = useState('');
  const [riceCropSearch, setRiceCropSearch] = useState('');

  // Hooks tìm kiếm infinite loading (mỗi lần load 20 bản ghi)
  const { 
    data: seasonSearchData, 
    isLoading: isSeasonLoading,
    isFetching: isSeasonFetching,
    hasNextPage: seasonHasNextPage,
    isFetchingNextPage: isSeasonFetchingNextPage,
    fetchNextPage: fetchNextSeasonPage,
  } = useSeasonSearch(seasonSearch, 20, visible);

  const { data: categories } = useOperatingCostCategories({ limit: 100 });
  
  const { 
    data: customerSearchData, 
    isLoading: isCustomerLoading,
    isFetching: isCustomerFetching,
    hasNextPage: customerHasNextPage,
    isFetchingNextPage: isCustomerFetchingNextPage,
    fetchNextPage: fetchNextCustomerPage,
  } = useCustomerSearch(customerSearch, 20, visible);
  
  const { control, handleSubmit, reset, watch, setValue } = useForm<OperatingCostFormValues>({
    defaultValues: {
      name: '',
      value: 0,
      expense_date: dayjs().toISOString(),
      description: '',
    },
  });

  // Watch season_id and customer_id to filter rice crops
  const watchedSeasonId = watch('season_id');
  const watchedCustomerId = watch('customer_id');

  // Hook tìm kiếm ruộng lúa phụ thuộc vào season và customer
  const { 
    data: riceCropSearchData, 
    isLoading: isRiceCropLoading,
    isFetching: isRiceCropFetching,
    hasNextPage: riceCropHasNextPage,
    isFetchingNextPage: isRiceCropFetchingNextPage,
    fetchNextPage: fetchNextRiceCropPage,
  } = useRiceCropSearch({
    search: riceCropSearch,
    season_id: watchedSeasonId,
    customer_id: watchedCustomerId || undefined
  }, 20, visible && !!watchedSeasonId && !!watchedCustomerId);

  // Chuyển đổi dữ liệu từ infinite query sang mảng options
  const customerOptions = useMemo(() => {
    return customerSearchData?.pages.flatMap(page => page.data) || [];
  }, [customerSearchData]);

  const seasonOptions = useMemo(() => {
    return seasonSearchData?.pages.flatMap(page => page.data) || [];
  }, [seasonSearchData]);

  const riceCropOptions = useMemo(() => {
    return riceCropSearchData?.pages.flatMap(page => page.data) || [];
  }, [riceCropSearchData]);

  const categoryOptions = useMemo(() => {
    return Array.isArray(categories?.data) ? categories.data.map((c: any) => ({
      label: c.name,
      value: c.id,
    })) : [];
  }, [categories]);

  useEffect(() => {
    if (visible) {
      if (initialData) {
        reset({
          name: initialData.name,
          value: Number(initialData.value),
          category_id: initialData.category_id,
          season_id: initialData.season_id,
          customer_id: initialData.customer_id,
          rice_crop_id: initialData.rice_crop_id,
          expense_date: initialData.expense_date,
          description: initialData.description || '',
        });
      } else {
        reset({
          name: '',
          value: 0,
          expense_date: dayjs().toISOString(),
          description: '',
          ...defaultValues,
        } as any);
      }
    }
  }, [visible, initialData, reset, defaultValues]);

  const onSubmit = async (data: OperatingCostFormValues) => {
    try {
      const payload: CreateOperatingCostDto = {
        ...data,
        expense_date: dayjs(data.expense_date).toISOString(),
        customer_id: data.customer_id || undefined,
        rice_crop_id: data.rice_crop_id || undefined,
      };

      if (initialData) {
        await updateMutation.mutateAsync({ id: initialData.id, data: payload });
        message.success('Cập nhật chi phí thành công');
      } else {
        await createMutation.mutateAsync(payload);
        message.success('Tạo chi phí thành công');
      }
      
      onCancel();
    } catch (error) {
      console.error(error);
      message.error('Có lỗi xảy ra');
    }
  };

  return (
    <Modal
      title={initialData ? "Cập nhật chi phí vận hành" : "Thêm chi phí vận hành mới"}
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit(onSubmit)}
      confirmLoading={createMutation.isPending || updateMutation.isPending}
      okText={initialData ? "Lưu thay đổi" : "Tạo mới"}
      cancelText="Hủy"
    >
      <div className="mt-4 flex flex-col gap-4">
        <FormField
          name="name"
          control={control}
          label="Tên chi phí"
          rules={{ required: 'Vui lòng nhập tên chi phí' }}
          placeholder="VD: Mua phân bón đợt 1"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormFieldNumber
            name="value"
            control={control}
            label="Số tiền"
            rules={{ required: 'Vui lòng nhập số tiền' }}
            placeholder="0"
          />

          <FormComboBox
            name="category_id"
            control={control}
            label="Loại chi phí"
            rules={{ required: 'Vui lòng chọn loại' }}
            placeholder="Chọn loại"
            options={categoryOptions}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormComboBox
            name="season_id"
            control={control}
            label="Mùa vụ"
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

          <FormComboBox
            name="customer_id"
            control={control}
            label="Khách hàng (Tùy chọn)"
            data={customerOptions}
            isLoading={isCustomerLoading}
            isFetching={isCustomerFetching}
            hasNextPage={customerHasNextPage}
            isFetchingNextPage={isCustomerFetchingNextPage}
            fetchNextPage={fetchNextCustomerPage}
            onSearch={setCustomerSearch}
            placeholder="Chọn khách hàng"
            allowClear
            showSearch
          />
        </div>

        <FormComboBox
          name="rice_crop_id"
          control={control}
          label="Thuộc ruộng lúa (Tùy chọn)"
          placeholder={
            !watchedSeasonId ? "Vui lòng chọn mùa vụ trước" :
            !watchedCustomerId ? "Vui lòng chọn khách hàng trước" :
            "Chọn Ruộng lúa"
          }
          data={riceCropOptions}
          isLoading={isRiceCropLoading}
          isFetching={isRiceCropFetching}
          hasNextPage={riceCropHasNextPage}
          isFetchingNextPage={isRiceCropFetchingNextPage}
          fetchNextPage={fetchNextRiceCropPage}
          onSearch={setRiceCropSearch}
          allowClear
          showSearch
          disabled={!watchedSeasonId || !watchedCustomerId}
        />

        <FormDatePicker
          name="expense_date"
          control={control}
          label="Ngày chi"
          rules={{ required: 'Vui lòng chọn ngày chi' }}
          format="DD/MM/YYYY"
          className="w-full"
        />

        <FormField
          name="description"
          control={control}
          label="Mô tả / Ghi chú"
          type="textarea"
          rows={3}
        />
      </div>
    </Modal>
  );
};

export default CreateOperatingCostModal;
