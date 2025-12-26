import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  TimePicker,
  Select,
  Button,
  Space,
  Radio,
  Table,
  Divider,
  Row,
  Col,
} from 'antd';
import NumberInput from '../../components/common/number-input';
import DatePicker from '../../components/common/DatePicker';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';
import { useCreateDeliveryLog, useUpdateDeliveryLog, useDeliveryLog } from '../../queries/delivery-logs';
import { useInvoicesQuery, useInvoiceItemsQuery, useInvoiceSearch } from '../../queries/sales';
import { useSeasonsQuery } from '../../queries/season';
import { CreateDeliveryLogDto, DeliveryStatus } from '../../models/delivery-log.model';
import { SalesInvoice, SalesInvoiceItem } from '../../models/sales.model';
import { useProductSearch } from '../../queries/product';
import { useCustomerSearch } from '../../queries/customer';
import { useAllUsersQuery } from '../../queries/user';
import ComboBox from '../../components/common/combo-box';

import { toast } from 'react-toastify';
import { formatCurrency } from '../../utils/format';

const { Option } = Select;
const { TextArea } = Input;

type CreationMode = 'standalone' | 'from_invoice';

const CreateDeliveryLog: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');
  const isEditMode = !!editId;
  
  const [form] = Form.useForm();
  const [mode, setMode] = useState<CreationMode>('from_invoice');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  
  // Load data nếu đang edit
  const stateData = location.state?.deliveryLog;
  
  // Chỉ fetch nếu có editId và không có stateData
  const shouldFetch = isEditMode && !stateData;
  const { data: apiData, isLoading: isLoadingEdit } = useDeliveryLog(
    shouldFetch && editId ? Number(editId) : 0
  );
  
  const editData = stateData || apiData;
  
  // Debug log
  console.log('🔍 Edit Mode Debug:', {
    isEditMode,
    editId,
    hasStateData: !!stateData,
    hasApiData: !!apiData,
    editData,
  });
  
  // Queries
  const createMutation = useCreateDeliveryLog();
  const updateMutation = useUpdateDeliveryLog();
  const { data: invoicesData, isLoading: isLoadingInvoices } = useInvoicesQuery({ page: 1, limit: 100 });
  const { data: invoiceItems, isLoading: isLoadingItems } = useInvoiceItemsQuery(selectedInvoiceId || 0);

  // Product Search for Standalone mode
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const {
    data: productData,
    isLoading: isLoadingProducts,
    isFetching: isFetchingProducts,
    fetchNextPage: fetchNextProducts,
    hasNextPage: hasNextProducts,
    isFetchingNextPage: isFetchingMoreProducts,
  } = useProductSearch(productSearchTerm, 20);

  const productOptions = productData?.pages.flatMap((page) => page.data) || [];

  // Invoice Search for 'from_invoice' mode
  const [invoiceSearchTerm, setInvoiceSearchTerm] = useState('');
  const {
    data: invoiceSearchData,
    isLoading: isLoadingInvoiceSearch,
    isFetching: isFetchingInvoiceSearch,
    fetchNextPage: fetchNextInvoices,
    hasNextPage: hasNextInvoices,
    isFetchingNextPage: isFetchingMoreInvoices,
  } = useInvoiceSearch(invoiceSearchTerm, 20);

  const invoiceOptions = invoiceSearchData?.pages.flatMap((page) => page.data) || [];

  // Season Search
  const [seasonSearchTerm, setSeasonSearchTerm] = useState('');
  const { data: seasonsData, isLoading: isLoadingSeasons } = useSeasonsQuery({
    page: 1,
    limit: 50,
    name: seasonSearchTerm,
  });

  const seasonOptions = seasonsData?.data?.items?.map((s: any) => ({
    value: s.id,
    label: s.name,
  })) || [];

  // Customer Search for Standalone mode
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const {
    data: customerSearchData,
    isLoading: isLoadingCustomerSearch,
    isFetching: isFetchingCustomerSearch,
    fetchNextPage: fetchNextCustomers,
    hasNextPage: hasNextCustomers,
    isFetchingNextPage: isFetchingMoreCustomers,
  } = useCustomerSearch(customerSearchTerm, 20);

  const customerOptions = customerSearchData?.pages.flatMap((page) => page.data) || [];

  // User Search for Driver selection
  const { data: usersData, isLoading: isLoadingUsers } = useAllUsersQuery({ page: 1, limit: 100 });
  const userOptions = usersData?.data?.items?.map((u: any) => ({
    value: u.id,
    label: `${u.profile?.nickname || u.account} (${u.profile?.mobile || 'Chưa có SĐT'})`,
    name: u.profile?.nickname || u.account,
  })) || [];

  // Computed
  const isLoading = createMutation.isPending;

  // Watch cost fields for automatic calculation
  const fuelCost = Form.useWatch('fuel_cost', form);
  const driverCost = Form.useWatch('driver_cost', form);
  const otherCosts = Form.useWatch('other_costs', form);

  useEffect(() => {
    const total = Number(fuelCost || 0) + Number(driverCost || 0) + Number(otherCosts || 0);
    form.setFieldsValue({ total_cost: total });
  }, [fuelCost, driverCost, otherCosts, form]);

  // Effects
  useEffect(() => {
    form.setFieldsValue({
      delivery_date: dayjs(),
      status: DeliveryStatus.PENDING,
    });
  }, [form]);

  // 1. Xác định Mode và InvoiceId (luôn chạy khi có editData)
  useEffect(() => {
    if (isEditMode && editData) {
      const data = editData.data || editData;
      console.log('🔄 Mode detection:', { 
        hasInvoiceId: !!data.invoice_id, 
        invoiceId: data.invoice_id 
      });
      
      if (data.invoice_id) {
        setMode('from_invoice');
        setSelectedInvoiceId(data.invoice_id);
      } else {
        setMode('standalone');
      }
    }
  }, [isEditMode, editData]);

  // 2. Điền form khi dữ liệu đã sẵn sàng
  useEffect(() => {
    const data = editData?.data || editData;
    const items = data?.items || [];
    const availableItems = invoiceItems || [];
    
    // Điều kiện để điền form: 
    // - Có data của phiếu giao hàng
    // - Nếu là from_invoice thì phải có list invoiceItems (để match dropdown)
    const canSetValues = isEditMode && data && (
      mode === 'from_invoice' 
        ? (Array.isArray(availableItems) && availableItems.length > 0) 
        : true
    );

    if (canSetValues) {
      console.log('⏰ Setting form values now...');
      
      form.setFieldsValue({
        invoice_id: data.invoice_id,
        season_id: data.season_id,
        delivery_date: data.delivery_date ? dayjs(data.delivery_date) : dayjs(),
        delivery_start_time: data.delivery_start_time ? dayjs(data.delivery_start_time, 'HH:mm:ss') : null,
        delivery_address: data.delivery_address || data.invoice?.customer?.address,
        receiver_name: data.receiver_name || data.invoice?.customer?.name,
        receiver_phone: data.receiver_phone || data.invoice?.customer?.phone,
        driver_name: data.driver_name,
        vehicle_number: data.vehicle_number || data.vehicle_plate,
        fuel_cost: data.fuel_cost || 0,
        driver_cost: data.driver_cost || 0,
        other_costs: data.other_costs || 0,
        total_cost: data.total_cost || 0,
        status: data.status || DeliveryStatus.PENDING,
        delivery_notes: data.delivery_notes,
        items: items.map((item: any) => ({
          sales_invoice_item_id: item.sales_invoice_item_id || item.id,
          product_id: item.product_id,
          quantity: item.quantity_delivered || item.quantity,
          unit: item.unit || item.product?.unit,
          notes: item.notes,
        })) || [],
      });
      
      console.log('✅ Form values set successfully!');
    }
  }, [isEditMode, editData, invoiceItems, mode, form]);

  // Handle invoice selection
  const handleInvoiceChange = (invoiceId: number) => {
    setSelectedInvoiceId(invoiceId);
    form.setFieldsValue({ items: [] }); // Reset items
    
    // Tự động điền thông tin từ hóa đơn (Tên người nhận, SĐT, Địa chỉ)
    if (invoiceOptions.length > 0) {
      const invoice = invoiceOptions.find((inv) => inv.id === invoiceId);
      if (invoice) {
        form.setFieldsValue({
          receiver_name: invoice.customer_name,
          receiver_phone: invoice.customer_phone,
          delivery_address: invoice.customer_address,
        });
      }
    }
  };

  // Handle customer selection in standalone mode
  const handleCustomerChange = (customerId: number) => {
    const customer = customerOptions.find((c) => c.status !== undefined ? c.id === customerId : c.value === customerId);
    if (customer) {
      form.setFieldsValue({
        receiver_name: customer.name,
        receiver_phone: customer.phone,
        delivery_address: customer.address,
      });
    }
  };

  // Submit
  const onFinish = (values: any) => {
    const payload: CreateDeliveryLogDto = {
      invoice_id: mode === 'from_invoice' ? selectedInvoiceId! : undefined,
      season_id: mode === 'standalone' ? values.season_id : undefined,
      delivery_date: values.delivery_date.format('YYYY-MM-DD'),
      delivery_start_time: values.delivery_start_time.format('HH:mm:ss'),
      delivery_address: values.delivery_address,
      receiver_name: values.receiver_name,
      receiver_phone: values.receiver_phone,
      delivery_notes: values.delivery_notes,
      driver_id: values.driver_id,
      driver_name: values.driver_name,
      vehicle_number: values.vehicle_number,
      distance_km: values.distance_km,
      fuel_cost: values.fuel_cost,
      driver_cost: values.driver_cost,
      other_costs: values.other_costs,
      total_cost: values.total_cost,
      status: values.status,
      items: (values.items || []).map((item: any) => ({
        sales_invoice_item_id: mode === 'from_invoice' ? item.sales_invoice_item_id : undefined,
        product_id: mode === 'standalone' ? item.product_id : undefined,
        quantity: item.quantity,
        unit: item.unit,
        notes: item.notes,
      })),
    };

    if (isEditMode && editId) {
      // Update mode
      updateMutation.mutate(
        { id: Number(editId), data: payload },
        {
          onSuccess: () => {
            toast.success('Cập nhật phiếu giao hàng thành công!');
            navigate('/delivery-logs');
          },
        }
      );
    } else {
      // Create mode
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success('Tạo phiếu giao hàng thành công!');
          navigate('/delivery-logs');
        },
      });
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card title={isEditMode ? "Chỉnh Sửa Phiếu Giao Hàng" : "Tạo Phiếu Giao Hàng"}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ mode: 'from_invoice' }}
        >
          {/* Mode Selection - Chỉ hiện khi tạo mới */}

          {!isEditMode && (

            <Form.Item label="Phương thức tạo" name="mode">
              <Radio.Group
                onChange={(e) => {
                  setMode(e.target.value);
                  setSelectedInvoiceId(null);
                  form.setFieldsValue({ items: [] });
                }}
                value={mode}
              >
                <Radio.Button value="from_invoice">Từ hóa đơn bán hàng</Radio.Button>
                <Radio.Button value="standalone">Tạo mới (Độc lập)</Radio.Button>
              </Radio.Group>
          </Form.Item>
          )}

          <Divider orientation="left">Thông tin chung</Divider>

          {mode === 'from_invoice' && (
            <Form.Item
              label="Chọn hóa đơn"
              name="invoice_id"
              rules={[{ required: true, message: 'Vui lòng chọn hóa đơn' }]}
            >
              <ComboBox
                placeholder="Tìm kiếm hóa đơn..."
                data={invoiceOptions}
                isLoading={isLoadingInvoiceSearch}
                isFetching={isFetchingInvoiceSearch}
                onSearch={setInvoiceSearchTerm}
                fetchNextPage={fetchNextInvoices}
                hasNextPage={hasNextInvoices}
                isFetchingNextPage={isFetchingMoreInvoices}
                onChange={handleInvoiceChange}
                style={{ width: '100%' }}
              />
            </Form.Item>
          )}

          {mode === 'standalone' && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Mùa vụ"
                  name="season_id"
                  rules={[{ required: true, message: 'Vui lòng chọn mùa vụ' }]}
                >
                  <ComboBox
                    placeholder="Tìm kiếm mùa vụ..."
                    data={seasonOptions}
                    isLoading={isLoadingSeasons}
                    onSearch={setSeasonSearchTerm}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Chọn khách hàng (Hệ thống)" name="customer_id">
                  <ComboBox
                    placeholder="Tìm kiếm khách hàng..."
                    data={customerOptions}
                    isLoading={isLoadingCustomerSearch}
                    isFetching={isFetchingCustomerSearch}
                    onSearch={setCustomerSearchTerm}
                    fetchNextPage={fetchNextCustomers}
                    hasNextPage={hasNextCustomers}
                    isFetchingNextPage={isFetchingMoreCustomers}
                    onChange={handleCustomerChange}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
            </Row>
          )}

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Ngày giao"
                name="delivery_date"
                rules={[{ required: true, message: 'Chọn ngày giao' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item 
                label="Giờ xuất phát" 
                name="delivery_start_time"
                rules={[{ required: true, message: 'Chọn giờ xuất phát' }]}
              >
                <TimePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Trạng thái" name="status">
                <Select>
                  <Option value={DeliveryStatus.PENDING}>Chờ giao</Option>
                  <Option value={DeliveryStatus.DELIVERING}>Đang giao</Option>
                  <Option value={DeliveryStatus.COMPLETED}>Đã giao</Option>
                  <Option value={DeliveryStatus.FAILED}>Thất bại</Option>
                  <Option value={DeliveryStatus.CANCELLED}>Đã hủy</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item 
                label="Tên người nhận" 
                name="receiver_name"
                rules={[{ required: true, message: 'Vui lòng nhập tên người nhận' }]}
              >
                <Input placeholder="Nhập tên người nhận" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                label="SĐT người nhận" 
                name="receiver_phone"
                rules={[{ required: true, message: 'Vui lòng nhập SĐT người nhận' }]}
              >
                <Input placeholder="Nhập SĐT" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item 
            label="Địa chỉ giao hàng" 
            name="delivery_address"
            rules={[{ required: true, message: 'Vui lòng nhập địa chỉ giao hàng' }]}
          >
            <TextArea rows={2} placeholder="Nhập địa chỉ giao hàng" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Tài xế" name="driver_id">
                <Select
                  showSearch
                  allowClear
                  placeholder="Chọn tài xế từ hệ thống hoặc nhập tên"
                  loading={isLoadingUsers}
                  filterOption={(input, option) =>
                    (option?.label?.toString() || '').toLowerCase().includes(input.toLowerCase())
                  }
                  onChange={(value) => {
                    // Khi chọn từ danh sách, tự động điền tên
                    if (value) {
                      const selectedUser = userOptions.find(u => u.value === value);
                      if (selectedUser) {
                        form.setFieldsValue({ driver_name: selectedUser.name });
                      }
                    } else {
                      form.setFieldsValue({ driver_name: '' });
                    }
                  }}
                  options={userOptions}
                />
              </Form.Item>
              <Form.Item 
                label="Tên tài xế (Hiển thị)" 
                name="driver_name"
                tooltip="Tự động điền khi chọn từ danh sách, hoặc nhập tay nếu là tài xế ngoài"
              >
                <Input placeholder="Nhập tên tài xế nếu không chọn từ danh sách" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Biển số xe" name="vehicle_number">
                <Input placeholder="Biển số xe" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={6}>
              <Form.Item label="Khoảng cách (km)" name="distance_km">
                <NumberInput placeholder="Số km" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Tiền xăng" name="fuel_cost">
                <NumberInput addonAfter="VND" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Tiền tài xế" name="driver_cost">
                <NumberInput addonAfter="VND" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Chi phí khác" name="other_costs">
                <NumberInput addonAfter="VND" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Tổng chi phí ước tính" name="total_cost">
            <NumberInput
              addonAfter="VND"
            />
          </Form.Item>

          <Form.Item label="Ghi chú" name="delivery_notes">
            <TextArea rows={2} />
          </Form.Item>

          <Divider orientation="left">Danh sách hàng hóa</Divider>

          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Row key={key} gutter={16} align="middle" style={{ marginBottom: 8 }}>
                    {mode === 'from_invoice' ? (
                      <Col span={8}>
                        <Form.Item
                          {...restField}
                          name={[name, 'sales_invoice_item_id']}
                          label="Sản phẩm (từ hóa đơn)"
                          rules={[{ required: true, message: 'Chọn sản phẩm' }]}
                        >
                          <Select placeholder="Chọn sản phẩm">
                            {invoiceItems?.map((item: any) => (
                              <Option key={item.id} value={item.id}>
                                {item.product?.trade_name || item.product?.name || item.product_name} (Max: {item.quantity})
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                    ) : (
                      <Col span={8}>
                         <Form.Item
                          {...restField}
                          name={[name, 'product_id']}
                          label="Sản phẩm"
                          rules={[{ required: true, message: 'Chọn sản phẩm' }]}
                         >
                           <ComboBox
                             placeholder="Tìm kiếm sản phẩm..."
                             data={productOptions}
                             isLoading={isLoadingProducts}
                             isFetching={isFetchingProducts}
                             onSearch={setProductSearchTerm}
                             fetchNextPage={fetchNextProducts}
                             hasNextPage={hasNextProducts}
                             isFetchingNextPage={isFetchingMoreProducts}
                             style={{ width: '100%' }}
                           />
                         </Form.Item>
                      </Col>
                    )}

                    <Col span={6}>
                      <Form.Item
                        {...restField}
                        name={[name, 'quantity']}
                        label="Số lượng"
                        rules={[{ required: true, message: 'Nhập số lượng' }]}
                      >
                        <NumberInput min={0} />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item
                        {...restField}
                        name={[name, 'unit']}
                        label="Đơn vị"
                      >
                        <Input placeholder="Đơn vị" />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item
                        {...restField}
                        name={[name, 'notes']}
                        label="Ghi chú"
                      >
                        <Input placeholder="..." />
                      </Form.Item>
                    </Col>
                    <Col span={2}>
                      <Button danger onClick={() => remove(name)}>
                        Xóa
                      </Button>
                    </Col>
                  </Row>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block icon={'+'}>
                    Thêm sản phẩm
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={isLoading}>
                {isEditMode ? "Cập Nhật" : "Tạo Phiếu Giao Hàng"}
              </Button>
              <Button onClick={() => navigate('/delivery-logs')}>Hủy</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default CreateDeliveryLog;
