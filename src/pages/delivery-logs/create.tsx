import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  TimePicker,
  InputNumber,
  Select,
  Button,
  Space,
  Radio,
  Table,
  Divider,
  Row,
  Col,
} from 'antd';
import DatePicker from '../../components/common/DatePicker';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useCreateDeliveryLog } from '../../queries/delivery-logs';
import { useInvoicesQuery, useInvoiceItemsQuery, useInvoiceSearch } from '../../queries/sales';
import { useSeasonsQuery } from '../../queries/season';
import { CreateDeliveryLogDto, DeliveryStatus } from '../../models/delivery-log.model';
import { SalesInvoice, SalesInvoiceItem } from '../../models/sales.model';
import { useProductSearch } from '../../queries/product';
import { useCustomerSearch } from '../../queries/customer';
import ComboBox from '../../components/common/combo-box';

import { toast } from 'react-toastify';
import { formatCurrency } from '../../utils/format';

const { Option } = Select;
const { TextArea } = Input;

type CreationMode = 'standalone' | 'from_invoice';

const CreateDeliveryLog: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [mode, setMode] = useState<CreationMode>('from_invoice');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  
  // Queries
  const createMutation = useCreateDeliveryLog();
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

  // Computed
  const isLoading = createMutation.isPending;

  // Effects
  useEffect(() => {
    form.setFieldsValue({
      delivery_date: dayjs(),
      status: DeliveryStatus.PENDING,
    });
  }, [form]);

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
      delivery_start_time: values.delivery_start_time?.format('HH:mm:ss'),
      delivery_address: values.delivery_address,
      receiver_name: values.receiver_name,
      receiver_phone: values.receiver_phone,
      delivery_notes: values.delivery_notes,
      driver_name: values.driver_name,
      vehicle_number: values.vehicle_number,
      total_cost: values.total_cost,
      status: values.status,
      items: values.items?.map((item: any) => ({
        sales_invoice_item_id: mode === 'from_invoice' ? item.sales_invoice_item_id : undefined,
        product_id: mode === 'standalone' ? item.product_id : undefined,
        quantity: item.quantity,
        unit: item.unit,
        notes: item.notes,
      })),
    };

    createMutation.mutate(payload, {
      onSuccess: () => {
        navigate('/delivery-logs');
      },
    });
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card title="Tạo Phiếu Giao Hàng">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ mode: 'from_invoice' }}
        >
          {/* Mode Selection */}
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
              <Form.Item label="Giờ xuất phát" name="delivery_start_time">
                <TimePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Trạng thái" name="status">
                <Select>
                  <Option value={DeliveryStatus.PENDING}>Chờ giao</Option>
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
              <Form.Item label="Tài xế" name="driver_name">
                <Input placeholder="Tên tài xế" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Biển số xe" name="vehicle_number">
                <Input placeholder="Biển số xe" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Tổng chi phí ước tính" name="total_cost">
            <InputNumber
              style={{ width: '100%' }}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value?.replace(/\$\s?|(,*)/g, '') as unknown as number}
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
                            {invoiceItems?.map((item) => (
                              <Option key={item.id} value={item.id}>
                                {item.product?.name} (Max: {item.quantity})
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                    ) : (
                      // TODO: Implement product search/select properly for standalone
                      // For now, let's use manual entry or a simple ID input as quick fix
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
                        <InputNumber style={{ width: '100%' }} min={0} />
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
                Tạo phiếu giao hàng
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
