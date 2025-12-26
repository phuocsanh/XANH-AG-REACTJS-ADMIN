import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Grid,
  Checkbox,
  FormControlLabel,
  Collapse,
  IconButton,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { TimePicker, Input, Row, Col, Select as AntSelect, Form, Divider as AntDivider } from 'antd';
import NumberInput from '@/components/common/number-input';
import DatePicker from '@/components/common/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { CreateDeliveryLogDto, DeliveryStatus } from '@/models/delivery-log.model';

interface DeliveryInfoSectionProps {
  /** Danh sách sản phẩm trong hóa đơn */
  items: Array<{
    id?: number;
    product_id: number;
    product_name: string;
    quantity: number;
    unit_price: number;
  }>;
  /** Địa chỉ khách hàng (auto-fill) */
  customerAddress?: string;
  /** Tên khách hàng (auto-fill) */
  customerName?: string;
  /** SĐT khách hàng (auto-fill) */
  customerPhone?: string;
  /** Callback khi dữ liệu delivery thay đổi */
  onChange: (deliveryData: CreateDeliveryLogDto | null) => void;
  /** Giá trị khởi tạo (khi edit) */
  initialValue?: CreateDeliveryLogDto;
}

/**
 * Component nhập thông tin giao hàng khi tạo hóa đơn
 * Cho phép chọn sản phẩm nào cần giao
 */
export const DeliveryInfoSection: React.FC<DeliveryInfoSectionProps> = ({
  items,
  customerAddress,
  customerName,
  customerPhone,
  onChange,
  initialValue,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [enableDelivery, setEnableDelivery] = useState(false);
  
  // Delivery form state
  const [deliveryDate, setDeliveryDate] = useState<Dayjs | null>(dayjs());
  const [deliveryTime, setDeliveryTime] = useState<Dayjs | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [driverName, setDriverName] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [totalCost, setTotalCost] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<DeliveryStatus>(DeliveryStatus.PENDING);
  
  // Danh sách sản phẩm được chọn để giao (lưu sales_invoice_item_id)
  const [selectedItems, setSelectedItems] = useState<Map<number, number>>(new Map());
  const isInitialized = useRef(false);

  // Populate from initialValue (edit mode)
  useEffect(() => {
    if (initialValue && !isInitialized.current) {
      isInitialized.current = true;
      setEnableDelivery(true);
      setExpanded(true);
      if (initialValue.delivery_date) setDeliveryDate(dayjs(initialValue.delivery_date));
      if (initialValue.delivery_start_time) setDeliveryTime(dayjs(initialValue.delivery_start_time, 'HH:mm:ss'));
      if (initialValue.delivery_address) setDeliveryAddress(initialValue.delivery_address);
      if (initialValue.receiver_name) setReceiverName(initialValue.receiver_name);
      if (initialValue.receiver_phone) setReceiverPhone(initialValue.receiver_phone);
      if (initialValue.driver_name) setDriverName(initialValue.driver_name);
      if (initialValue.vehicle_number) setVehiclePlate(initialValue.vehicle_number);
      setTotalCost(initialValue.total_cost || 0);
      if (initialValue.delivery_notes) setNotes(initialValue.delivery_notes);
      if (initialValue.status) setStatus(initialValue.status);
      
      if (initialValue.items) {
        const itemMap = new Map<number, number>();
        initialValue.items.forEach(item => {
          if (item.sales_invoice_item_id !== undefined) {
            itemMap.set(item.sales_invoice_item_id, item.quantity || 0);
          }
        });
        setSelectedItems(itemMap);
      }
    }
  }, [initialValue]);

  // Auto-fill thông tin từ khách hàng
  useEffect(() => {
    if (customerAddress && !deliveryAddress) {
      setDeliveryAddress(customerAddress);
    }
    if (customerName && !receiverName) {
      setReceiverName(customerName);
    }
    if (customerPhone && !receiverPhone) {
      setReceiverPhone(customerPhone);
    }
  }, [customerAddress, customerName, customerPhone]);

  // Emit data khi có thay đổi
  useEffect(() => {
    if (!enableDelivery) {
      onChange(null);
      return;
    }

    // Validate: phải có ngày giao, giờ giao, tên, sđt, địa chỉ và ít nhất 1 sản phẩm
    if (!deliveryDate || !deliveryTime || !receiverName || !receiverPhone || !deliveryAddress || selectedItems.size === 0) {
      onChange(null);
      return;
    }

    const deliveryData: CreateDeliveryLogDto = {
      delivery_date: deliveryDate.format('YYYY-MM-DD'),
      delivery_start_time: deliveryTime!.format('HH:mm:ss'),
      delivery_address: deliveryAddress,
      receiver_name: receiverName,
      receiver_phone: receiverPhone,
      driver_name: driverName || undefined,
      vehicle_number: vehiclePlate || undefined,
      total_cost: totalCost,
      status: status,
      delivery_notes: notes || undefined,
      items: Array.from(selectedItems.entries()).map(([productIndex, quantity]) => ({
        sales_invoice_item_id: productIndex, // Sẽ được map sau khi tạo invoice items
        quantity: quantity,
      })),
    };

    onChange(deliveryData);
  }, [
    enableDelivery,
    deliveryDate,
    deliveryTime,
    deliveryAddress,
    driverName,
    vehiclePlate,
    totalCost,
    notes,
    status,
    selectedItems,
    receiverName,
    receiverPhone,
  ]);

  const handleToggleItem = (index: number, checked: boolean) => {
    const newSelected = new Map(selectedItems);
    if (checked) {
      // Mặc định giao toàn bộ số lượng
      newSelected.set(index, items[index].quantity);
    } else {
      newSelected.delete(index);
    }
    setSelectedItems(newSelected);
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const newSelected = new Map(selectedItems);
    newSelected.set(index, quantity);
    setSelectedItems(newSelected);
  };

  return (
    <Card sx={{ mt: 3 }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <FormControlLabel
            control={
              <Checkbox
                checked={enableDelivery}
                onChange={(e) => {
                  setEnableDelivery(e.target.checked);
                  setExpanded(e.target.checked);
                }}
              />
            }
            label={
              <Typography variant="h6">
                🚚 Tạo phiếu giao hàng (tùy chọn)
              </Typography>
            }
          />
          {enableDelivery && (
            <IconButton
              onClick={() => setExpanded(!expanded)}
              sx={{
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: '0.3s',
              }}
            >
              <ExpandMoreIcon />
            </IconButton>
          )}
        </Box>

        <Collapse in={enableDelivery && expanded}>
          <Box sx={{ mt: 2 }}>
            <AntDivider orientation="left">Thông tin chung</AntDivider>
            
            <Row gutter={16}>
              <Col span={8}>
                <Typography variant="subtitle2" gutterBottom>
                  Ngày giao hàng <span style={{ color: 'red' }}>*</span>
                </Typography>
                <DatePicker
                  value={deliveryDate}
                  onChange={setDeliveryDate}
                  style={{ width: '100%' }}
                />
              </Col>
              <Col span={8}>
                <Typography variant="subtitle2" gutterBottom>
                  Giờ bắt đầu giao <span style={{ color: 'red' }}>*</span>
                </Typography>
                <TimePicker
                  value={deliveryTime}
                  onChange={setDeliveryTime}
                  format="HH:mm"
                  placeholder="Chọn giờ"
                  style={{ width: '100%' }}
                />
              </Col>
              <Col span={8}>
                <Typography variant="subtitle2" gutterBottom>
                  Trạng thái
                </Typography>
                <AntSelect 
                  value={status} 
                  onChange={(val) => setStatus(val)} 
                  style={{ width: '100%' }}
                >
                  <AntSelect.Option value={DeliveryStatus.PENDING}>Chờ giao</AntSelect.Option>
                  <AntSelect.Option value={DeliveryStatus.COMPLETED}>Đã giao</AntSelect.Option>
                  <AntSelect.Option value={DeliveryStatus.FAILED}>Thất bại</AntSelect.Option>
                  <AntSelect.Option value={DeliveryStatus.CANCELLED}>Đã hủy</AntSelect.Option>
                </AntSelect>
              </Col>
            </Row>

            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Tên người nhận <span style={{ color: 'red' }}>*</span>
                </Typography>
                <Input
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  placeholder="Nhập tên người nhận"
                />
              </Col>
              <Col span={12}>
                <Typography variant="subtitle2" gutterBottom>
                  SĐT người nhận <span style={{ color: 'red' }}>*</span>
                </Typography>
                <Input
                  value={receiverPhone}
                  onChange={(e) => setReceiverPhone(e.target.value)}
                  placeholder="Nhập SĐT"
                />
              </Col>
            </Row>

            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Địa chỉ giao hàng <span style={{ color: 'red' }}>*</span>
              </Typography>
              <Input.TextArea
                rows={2}
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Nhập địa chỉ giao hàng"
              />
            </Box>

            <AntDivider orientation="left">Thông tin tài xế & Chi phí</AntDivider>

            <Row gutter={16}>
              <Col span={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Tên tài xế
                </Typography>
                <Input
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="Nhập tên tài xế"
                />
              </Col>
              <Col span={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Biển số xe
                </Typography>
                <Input
                  value={vehiclePlate}
                  onChange={(e) => setVehiclePlate(e.target.value)}
                  placeholder="VD: 67A-12345"
                />
              </Col>
            </Row>

            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Chi phí giao hàng ước tính (đ)
              </Typography>
              <NumberInput
                style={{ width: '100%' }}
                value={totalCost}
                onChange={(val) => setTotalCost(val || 0)}
                placeholder="0"
              />
            </Box>

            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Ghi chú giao hàng
              </Typography>
              <Input.TextArea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ghi chú về giao hàng..."
              />
            </Box>

            {/* Chọn sản phẩm cần giao */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Chọn sản phẩm cần giao <span style={{ color: 'red' }}>*</span>
              </Typography>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">Chọn</TableCell>
                      <TableCell>Sản phẩm</TableCell>
                      <TableCell align="right">SL trong đơn</TableCell>
                      <TableCell align="right">SL giao</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          Chưa có sản phẩm trong đơn hàng
                        </TableCell>
                      </TableRow>
                    ) : (
                      items.map((item, index) => {
                        const isSelected = selectedItems.has(index);
                        const deliveryQty = selectedItems.get(index) || item.quantity;

                        return (
                          <TableRow key={index}>
                            <TableCell padding="checkbox">
                              <Checkbox
                                checked={isSelected}
                                onChange={(e) => handleToggleItem(index, e.target.checked)}
                              />
                            </TableCell>
                            <TableCell>{item.product_name}</TableCell>
                            <TableCell align="right">{item.quantity}</TableCell>
                            <TableCell align="right">
                              {isSelected ? (
                                <NumberInput
                                  size="small"
                                  value={deliveryQty}
                                  onChange={(val) =>
                                    handleQuantityChange(index, val || 0)
                                  }
                                  min={0}
                                  max={item.quantity}
                                  style={{ width: 80 }}
                                />
                              ) : (
                                '-'
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              {selectedItems.size === 0 && enableDelivery && (
                <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                  * Vui lòng chọn ít nhất 1 sản phẩm để giao
                </Typography>
              )}
            </Box>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};
