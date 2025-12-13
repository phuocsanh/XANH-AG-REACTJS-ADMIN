// Form tạo phiếu trả hàng - React Hook Form version

import { useState, useEffect } from 'react';
import { message } from 'antd';
import {
  Box,
  Button,
  Typography,
  Grid,
  Card,
  CardContent,
  Alert,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { FormField, FormComboBox, FormFieldNumber, FormImageUpload } from '@/components/form';
import NumberInput from '@/components/common/number-input';
import ComboBox from '@/components/common/combo-box';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateReturnMutation, useAttachImageToReturnMutation } from '@/queries/inventory-return';
import { useUploadFileMutation, useInventoryReceiptsQuery } from '@/queries/inventory';
import { useAppStore } from '@/stores';
import { InventoryReceiptApiResponse } from '@/models/inventory.model';
import {
  returnFormSchema,
  ReturnFormData,
  defaultReturnValues,
} from './form-config';

const ReturnCreate = () => {
  const navigate = useNavigate();
  const userInfo = useAppStore((state) => state.userInfo);
  const [receiptSearch, setReceiptSearch] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<InventoryReceiptApiResponse | null>(null);
  const [tempProductSelect, setTempProductSelect] = useState<number | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReturnFormData>({
    resolver: zodResolver(returnFormSchema),
    defaultValues: defaultReturnValues,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  // Queries - Chỉ load khi có search term
  const { data: receiptsData } = useInventoryReceiptsQuery(
    receiptSearch ? { limit: 20, code: receiptSearch } : undefined
  );
  const createMutation = useCreateReturnMutation();
  const attachImageMutation = useAttachImageToReturnMutation();

  // Lấy danh sách sản phẩm từ phiếu nhập đã chọn
  const availableProducts = (selectedReceipt as any)?.items?.map((item: any) => ({
    product_id: item.product_id,
    product_name: item.product?.name || `Sản phẩm #${item.product_id}`,
    quantity: item.quantity,
    unit_cost: item.unit_cost || parseFloat(item.final_unit_cost || '0'),
  })) || [];

  // Xử lý chọn phiếu nhập kho
  const handleReceiptSelect = (receiptId: number | null) => {
    const receipt = receiptsData?.data?.items?.find((r) => r.id === receiptId);
    setSelectedReceipt(receipt || null);
    if (receipt) {
      setValue('receipt_id', receipt.id);
      setValue('supplier_id', receipt.supplier_id || 0);
      setValue('return_code', `RT-${receipt.code}`);
      // Reset items khi đổi phiếu
      setValue('items', []);
    } else {
      setValue('receipt_id', 0);
      setValue('supplier_id', 0);
      setValue('return_code', '');
      setValue('items', []);
    }
  };

  // Thêm sản phẩm vào danh sách
  const handleAddProduct = (product: typeof availableProducts[0]) => {
    // Check if already exists
    const exists = fields.some((field) => field.product_id === product.product_id);
    if (exists) return;

    append({
      product_id: product.product_id,
      product_name: product.product_name,
      quantity: 1,
      unit_cost: product.unit_cost,
      total_price: product.unit_cost,
      reason: '',
      notes: '',
    });
  };

  // Submit form
  const onSubmit = async (data: ReturnFormData) => {
    if (!userInfo?.id) {
      alert('Không tìm thấy thông tin người dùng!');
      return;
    }

    try {
      // Recalculate derived values to ensure consistency
      const processedItems = data.items.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_cost: item.unit_cost,
          total_price: item.quantity * item.unit_cost,
          reason: item.reason,
          notes: item.notes,
      }));

      const returnData = {
        return_code: data.return_code,
        supplier_id: data.supplier_id,
        receipt_id: data.receipt_id,
        total_amount: processedItems.reduce((sum, item) => sum + item.total_price, 0),
        reason: data.reason,
        notes: data.notes,
        created_by: userInfo.id,
        items: processedItems,
      };

      // 1. Tạo phiếu trả
      const newReturn = await createMutation.mutateAsync(returnData as any);

      // 2. Gắn ảnh (nếu có)
      // data.images sẽ chứa mảng các object { id, url, name } do FormImageUpload trả về (nhờ prop returnFullObjects)
      if (data.images && data.images.length > 0 && newReturn?.id) {
        const imagePromises = data.images.map(async (img: any) => {
          if (img.id) {
            try {
              await attachImageMutation.mutateAsync({
                returnId: newReturn.id,
                fileId: img.id,
                fieldName: 'return_images',
              });
            } catch (error) {
              console.error("Error attaching image:", error);
            }
          }
        });
        
        await Promise.all(imagePromises);
      }

      navigate('/inventory/returns');
    } catch (error) {
      console.error('Error creating return:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  // Get receipt list
  const receiptList = receiptsData?.data?.items || [];

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate('/inventory/returns')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" fontWeight="bold">
          Tạo phiếu trả hàng
        </Typography>
      </Box>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={3}>
          {/* Phiếu nhập kho */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" mb={2}>
                  Thông tin phiếu nhập
                </Typography>

                <FormComboBox
                  name="receipt_id"
                  control={control}
                  label="Tìm phiếu nhập kho"
                  placeholder="Nhập mã phiếu nhập..."
                  data={receiptList.map((receipt: any) => ({
                    value: receipt.id,
                    label: `${receipt.code} - ${receipt.supplier?.name || 'N/A'} - ${formatCurrency(parseFloat(String(receipt.total_amount) || '0'))}`
                  }))}
                  onSearch={setReceiptSearch}
                  onSelectionChange={(value) => {
                    handleReceiptSelect(typeof value === 'number' ? value : null);
                  }}
                  allowClear
                  showSearch
                />

                {selectedReceipt && (
                  <Box mt={2}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Nhà cung cấp:
                    </Typography>
                    <Typography variant="body1" mb={1}>
                      {(selectedReceipt as any)?.supplier?.name || 'N/A'}
                    </Typography>
                    
                    <Typography variant="subtitle2" color="text.secondary">
                      Mã phiếu trả:
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {watch('return_code')}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Thông tin trả hàng */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" mb={2}>
                  Thông tin trả hàng
                </Typography>

                <FormField
                  name="reason"
                  control={control}
                  label="Lý do trả hàng"
                  type="textarea"
                  rows={3}
                  placeholder="VD: Hàng lỗi, không đúng quy cách..."
                  className="mb-4"
                />

                <FormField
                  name="notes"
                  control={control}
                  label="Ghi chú"
                  type="textarea"
                  rows={2}
                />

                <Box mt={2}>
                  <Typography variant="subtitle2" mb={1}>
                    Hình ảnh chứng từ / sản phẩm lỗi
                  </Typography>
                  <FormImageUpload
                    name="images"
                    control={control}
                    uploadType="common"
                    returnFullObjects={true}
                    multiple
                    maxCount={5}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Sản phẩm */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" mb={2}>
                  Sản phẩm trả lại
                </Typography>

                {selectedReceipt ? (
                  <>
                    <Box mb={3}>
                      <Typography variant="subtitle2" mb={1}>
                        Chọn sản phẩm từ phiếu nhập:
                      </Typography>
                      
                      {/* Quick-add buttons - chỉ hiển thị 10 sản phẩm đầu */}
                      {availableProducts.length > 0 && (
                        <>
                          <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                            {availableProducts.slice(0, 10).map((product: any) => (
                              <Button
                                key={product.product_id}
                                variant="outlined"
                                size="small"
                                onClick={() => handleAddProduct(product)}
                                disabled={fields.some((f) => f.product_id === product.product_id)}
                              >
                                {product.product_name} (SL: {product.quantity})
                              </Button>
                            ))}
                          </Box>
                          
                          {availableProducts.length > 10 && (
                            <Alert severity="info" sx={{ mb: 2 }}>
                              Phiếu nhập có {availableProducts.length} sản phẩm. Hiển thị 10 sản phẩm đầu tiên. 
                              Dùng dropdown bên dưới để chọn sản phẩm khác.
                            </Alert>
                          )}
                        </>
                      )}

                      {/* Dropdown để chọn tất cả sản phẩm */}
                      <Box>
                        <Typography variant="subtitle2" mb={1}>
                          Hoặc tìm kiếm sản phẩm:
                        </Typography>
                        <ComboBox
                          data={availableProducts.map((p: any) => ({
                            value: p.product_id,
                            label: `${p.product_name} (Đã nhập: ${p.quantity})`
                          }))}
                          value={tempProductSelect}
                          onChange={(value) => {
                            const product = availableProducts.find((p: any) => p.product_id === value);
                            if (product) {
                              handleAddProduct(product);
                              setTempProductSelect(null);
                            }
                          }}
                          placeholder="-- Chọn sản phẩm --"
                          showSearch
                          allowClear
                          filterOption={(input, option) => {
                            const label = option?.label?.toString().toLowerCase() || '';
                            const searchText = input.toLowerCase();
                            return label.includes(searchText);
                          }}
                        />
                      </Box>
                    </Box>

                    {errors.items && (
                      <Alert severity="error" sx={{ mb: 2 }}>
                        {errors.items.message}
                      </Alert>
                    )}

                    {fields.length > 0 && (
                      <TableContainer component={Paper} variant="outlined">
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>Sản phẩm</TableCell>
                              <TableCell align="right">Số lượng trả</TableCell>
                              <TableCell align="right">Đơn giá</TableCell>
                              <TableCell align="right">Thành tiền</TableCell>
                              <TableCell>Lý do</TableCell>
                              <TableCell align="center">Xóa</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {fields.map((field, index) => {
                              const quantity = watch(`items.${index}.quantity`) || 0;
                              const unitCost = watch(`items.${index}.unit_cost`) || 0;
                              const total = quantity * unitCost;

                              // Find max quantity from receipt
                              const receiptItem = (selectedReceipt as any)?.items?.find(
                                (i: any) => i.product_id === field.product_id
                              );
                              const maxQuantity = receiptItem ? receiptItem.quantity : 999;

                              return (
                                <TableRow key={field.id}>
                                  <TableCell>
                                    <Typography variant="body2" fontWeight="bold">
                                      {field.product_name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      Đã nhập: {maxQuantity}
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="right">
                                    <Controller
                                      name={`items.${index}.quantity`}
                                      control={control}
                                      render={({ field }) => (
                                        <NumberInput
                                          value={field.value ? Number(field.value) : null}
                                          onChange={(val) => field.onChange(val)}
                                          min={1}
                                          max={maxQuantity}
                                          size="small"
                                          style={{ width: 80 }}
                                        />
                                      )}
                                    />
                                  </TableCell>
                                  <TableCell align="right">
                                    {formatCurrency(unitCost)}
                                  </TableCell>
                                  <TableCell align="right">
                                    <Typography fontWeight="bold" color="error.main">
                                      {formatCurrency(total)}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Controller
                                      name={`items.${index}.reason`}
                                      control={control}
                                      render={({ field }) => (
                                        <input
                                          {...field}
                                          placeholder="Lý do..."
                                          style={{
                                            width: '100%',
                                            padding: '4px 8px',
                                            border: '1px solid #d9d9d9',
                                            borderRadius: '4px',
                                            fontSize: '14px'
                                          }}
                                        />
                                      )}
                                    />
                                  </TableCell>
                                  <TableCell align="center">
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => remove(index)}
                                    >
                                      <DeleteIcon />
                                    </IconButton>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </>
                ) : (
                  <Alert severity="info">
                    Vui lòng chọn phiếu nhập kho trước
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Actions */}
          <Grid item xs={12}>
            <Box display="flex" gap={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                onClick={() => navigate('/inventory/returns')}
                disabled={createMutation.isPending}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? 'Đang tạo...' : 'Tạo phiếu trả'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default ReturnCreate;
