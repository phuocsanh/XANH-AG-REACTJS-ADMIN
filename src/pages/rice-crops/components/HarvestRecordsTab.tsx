import React, { useState, useEffect } from 'react';
import {
  Button,
  Table,
  Space,
  Modal,
  Row,
  Col,
  message,
  Card,
  Statistic,
  Select,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  GoldOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useForm, useWatch, Controller } from 'react-hook-form';
import {
  useHarvestRecords,
  useCreateHarvestRecord,
  useUpdateHarvestRecord,
  useDeleteHarvestRecord,
} from '@/queries/harvest-record';
import { HarvestRecord, CreateHarvestRecordDto } from '@/models/rice-farming';
import { FormField, FormFieldNumber, FormDatePicker } from '@/components/form';

interface HarvestRecordsTabProps {
  riceCropId: number;
}

const HarvestRecordsTab: React.FC<HarvestRecordsTabProps> = ({ riceCropId }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<HarvestRecord | null>(null);
  
  // React Hook Form
  const { control, handleSubmit, reset, setValue, watch } = useForm<any>({
    defaultValues: {
      harvest_date: new Date().toISOString(),
      yield_amount: undefined,
      selling_price_per_unit: undefined,
      total_revenue: 0,
      quality_grade: '',
      yield_unit: 'tan', // Đơn vị mặc định
    }
  });

  // Queries
  const { data: harvestRecords, isLoading } = useHarvestRecords(riceCropId);
  
  const createMutation = useCreateHarvestRecord();
  const updateMutation = useUpdateHarvestRecord();
  const deleteMutation = useDeleteHarvestRecord();

  // Watch values for auto-calculation
  const yieldAmount = useWatch({ control, name: 'yield_amount' });
  const sellingPrice = useWatch({ control, name: 'selling_price_per_unit' });
  const yieldUnit = useWatch({ control, name: 'yield_unit' });

  // Auto calculate total revenue
  // Nếu đơn vị là "Tấn", phải nhân 1000 để ra kg, vì giá là đ/kg
  useEffect(() => {
    // Mặc định là Tấn nếu chưa chọn hoặc là undefined
    const isKg = yieldUnit === 'kg';
    
    const quantityInKg = isKg 
      ? (Number(yieldAmount) || 0) 
      : (Number(yieldAmount) || 0) * 1000;
      
    const revenue = quantityInKg * (Number(sellingPrice) || 0);
    setValue('total_revenue', revenue);
  }, [yieldAmount, sellingPrice, yieldUnit, setValue]);

  // Tính tổng sản lượng (quy đổi về kg) và doanh thu
  const totalYield = harvestRecords?.reduce((sum: number, item: HarvestRecord) => {
    const isKg = !item.yield_unit || item.yield_unit === 'kg';
    const amountInKg = isKg ? Number(item.yield_amount) : Number(item.yield_amount) * 1000;
    return sum + amountInKg;
  }, 0) || 0;
  
  const totalRevenue = harvestRecords?.reduce((sum: number, item: HarvestRecord) => sum + Number(item.total_revenue), 0) || 0;

  const handleAdd = () => {
    setEditingItem(null);
    reset({
      harvest_date: new Date().toISOString(),
      yield_amount: undefined,
      selling_price_per_unit: undefined,
      total_revenue: 0,
      moisture_content: null,
      quality_grade: '',
      buyer: '',
      notes: '',
      yield_unit: 'tan',
    });
    setIsModalVisible(true);
  };

  const handleEdit = (item: HarvestRecord) => {
    setEditingItem(item);
    reset({
      harvest_date: item.harvest_date ? new Date(item.harvest_date).toISOString() : null,
      yield_amount: item.yield_amount,
      selling_price_per_unit: item.selling_price_per_unit,
      total_revenue: item.total_revenue,
      moisture_content: item.moisture_content,
      quality_grade: item.quality_grade,
      buyer: item.buyer,
      notes: item.notes,
      yield_unit: item.yield_unit || 'kg', // Mặc định kg nếu data cũ không có
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id, cropId: riceCropId });
      message.success('Xóa đợt thu hoạch thành công');
    } catch {
      message.error('Có lỗi xảy ra khi xóa đợt thu hoạch');
    }
  };

  const onSubmit = async (values: any) => {
    try {
      const dto: CreateHarvestRecordDto = {
        ...values,
        rice_crop_id: riceCropId,
        harvest_date: values.harvest_date ? dayjs(values.harvest_date).format('YYYY-MM-DD') : undefined,
        // Giữ nguyên giá trị nhập vào và đơn vị
        yield_amount: Number(values.yield_amount),
        yield_unit: values.yield_unit,
      };

      if (editingItem) {
        await updateMutation.mutateAsync({ id: editingItem.id, dto });
        message.success('Cập nhật đợt thu hoạch thành công');
      } else {
        await createMutation.mutateAsync(dto);
        message.success('Thêm đợt thu hoạch thành công');
      }

      setIsModalVisible(false);
      reset();
      setEditingItem(null);
    } catch (error) {
      console.error('Submit failed:', error);
    }
  };

  const columns = [
    {
      title: 'Ngày thu hoạch',
      dataIndex: 'harvest_date',
      key: 'harvest_date',
      render: (date: string) => date ? dayjs(date).format('DD/MM/YYYY') : '-',
    },
    {
      title: 'Sản lượng',
      dataIndex: 'yield_amount',
      key: 'yield_amount',
      render: (val: number, record: HarvestRecord) => {
        const unit = record.yield_unit === 'tan' ? 'Tấn' : 'kg';
        return `${Number(val)?.toLocaleString('vi-VN')} ${unit}`;
      },
    },
    {
      title: 'Độ ẩm (%)',
      dataIndex: 'moisture_content',
      key: 'moisture_content',
      render: (val: number) => val ? `${val}%` : '-',
    },
    {
      title: 'Chất lượng',
      dataIndex: 'quality_grade',
      key: 'quality_grade',
    },
    {
      title: 'Giá bán (đ/kg)',
      dataIndex: 'selling_price_per_unit',
      key: 'selling_price_per_unit',
      render: (val: number) => Number(val)?.toLocaleString('vi-VN'),
    },
    {
      title: 'Thành tiền',
      dataIndex: 'total_revenue',
      key: 'total_revenue',
      render: (val: number) => (
        <span className="font-medium text-green-600">
          {Number(val)?.toLocaleString('vi-VN')}
        </span>
      ),
    },
    {
      title: 'Người mua',
      dataIndex: 'buyer',
      key: 'buyer',
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: HarvestRecord) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<EditOutlined />}
            className="flex items-center justify-center w-10 h-10"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(record);
            }}
          />
          <Popconfirm
            title="Xác nhận xóa"
            description="Bạn có chắc chắn muốn xóa đợt thu hoạch này?"
            onConfirm={(e) => {
              e?.stopPropagation();
              handleDelete(record.id);
            }}
            onCancel={(e) => e?.stopPropagation()}
            okText="Xóa"
            cancelText="Hủy"
            okType="danger"
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              className="flex items-center justify-center w-10 h-10"
              onClick={(e) => e.stopPropagation()}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={8}>
            <Card bodyStyle={{ padding: '12px' }} className="h-full">
              <Statistic
                title={<span className="text-xs sm:text-base">Tổng sản lượng</span>}
                value={totalYield}
                precision={0}
                suffix={<span className="text-xs sm:text-base ml-0.5">kg</span>}
                prefix={<GoldOutlined style={{ fontSize: '14px' }} />}
                valueStyle={{ fontSize: '18px', fontWeight: 'bold' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8}>
            <Card bodyStyle={{ padding: '12px' }} className="h-full">
              <Statistic
                title={<span className="text-xs sm:text-base">Tổng doanh thu</span>}
                value={totalRevenue}
                precision={0}
                valueStyle={{ color: '#3f8600', fontSize: '18px', fontWeight: 'bold' }}
                suffix={<span className="text-xs sm:text-base ml-0.5">₫</span>}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8} className="flex sm:justify-end items-center">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
              className="w-full sm:w-auto mt-2 sm:mt-0"
              size="middle"
            >
              Thêm bản ghi
            </Button>
          </Col>
        </Row>
      </div>

      <Table
        columns={columns}
        dataSource={harvestRecords}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1000 }}
      />

      <Modal
        title={editingItem ? 'Sửa đợt thu hoạch' : 'Thêm đợt thu hoạch mới'}
        open={isModalVisible}
        onOk={handleSubmit(onSubmit)}
        onCancel={() => setIsModalVisible(false)}
        width={700}
        okText={editingItem ? 'Cập nhật' : 'Lưu'}
        cancelText="Hủy"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 flex flex-col gap-4">
          <Row gutter={16}>
            <Col span={12}>
              <FormDatePicker
                control={control}
                name="harvest_date"
                label="Ngày thu hoạch"
                placeholder="Chọn ngày"
                required
              />
            </Col>
            <Col span={12}>
              <FormFieldNumber
                control={control}
                name="moisture_content"
                label="Độ ẩm (%)"
                placeholder="VD: 14"
                min={0}
                max={100}
                decimalScale={3}
              />
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
             <FormFieldNumber
                control={control}
                name="yield_amount"
                label="Sản lượng"
                placeholder="0"
                required
                min={0}
                decimalScale={3}
                addonAfter={
                  <Controller
                    control={control}
                    name="yield_unit"
                    render={({ field }) => (
                      <Select
                        {...field}
                        style={{ width: 80 }}
                        options={[
                          { label: 'kg', value: 'kg' },
                          { label: 'Tấn', value: 'tan' },
                        ]}
                        onChange={(val) => {
                          field.onChange(val);
                          // Reset giá trị khi đổi đơn vị để tránh nhầm lẫn
                          setValue('yield_amount', undefined);
                        }}
                      />
                    )}
                  />
                }
              />
            </Col>
            <Col span={12}>
              <FormFieldNumber
                control={control}
                name="selling_price_per_unit"
                label="Đơn giá (đ/kg)"
                placeholder="0"
                required
                min={0}
                decimalScale={0}
              />
            </Col>
          </Row>

          <FormFieldNumber
            control={control}
            name="total_revenue"
            label="Thành tiền"
            placeholder="0"
            required
            disabled
            decimalScale={0}
          />

          <Row gutter={16}>
            <Col span={12}>
              <FormField
                control={control}
                name="quality_grade"
                label="Chất lượng lúa"
                placeholder="VD: Loại 1, Đạt chuẩn..."
              />
            </Col>
            <Col span={12}>
              <FormField
                control={control}
                name="buyer"
                label="Người mua"
                placeholder="Tên thương lái hoặc công ty"
              />
            </Col>
          </Row>

          <FormField
            control={control}
            name="notes"
            label="Ghi chú"
            type="textarea"
            rows={2}
            placeholder="Ghi chú thêm"
          />
        </form>
      </Modal>
    </div>
  );
};

export default HarvestRecordsTab;
