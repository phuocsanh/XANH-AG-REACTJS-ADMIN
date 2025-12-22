// Form tạo phiếu trả hàng - React Hook Form version

import { useState, useEffect, useMemo } from 'react';
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
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  useCreateReturnMutation, 
  useUpdateReturnMutation,
  useReturnQuery,
  useAttachImageToReturnMutation
} from '@/queries/inventory-return';
import { useUploadFileMutation, useInventoryReceiptsQuery, useInventoryReceiptQuery } from '@/queries/inventory';
import { useProductSearch } from '@/queries/product';
import { useAppStore } from '@/stores';
import { InventoryReceiptApiResponse } from '@/models/inventory.model';
import {
  returnFormSchema,
  ReturnFormData,
  defaultReturnValues,
} from './form-config';

const ReturnCreate = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const returnId = id ? Number(id) : undefined;
  const isEditMode = !!returnId;
  
  const userInfo = useAppStore((state) => state.userInfo);
  const [receiptSearch, setReceiptSearch] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<InventoryReceiptApiResponse | null>(null);
  const [tempProductSelect, setTempProductSelect] = useState<number | null>(null);

  // State tìm kiếm sản phẩm server-side
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const { 
    data: productSearchData, 
    isLoading: isProductSearchLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useProductSearch(productSearchTerm, 20);

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
  const updateMutation = useUpdateReturnMutation();
  const attachImageMutation = useAttachImageToReturnMutation();

  console.log('🔍 Debug return-create:', { id, returnId, isEditMode });

  // Load existing data for edit mode
  const { data: existingReturn, isLoading: isLoadingReturn } = useReturnQuery(returnId as number);
  
  // Load receipt if edit mode to get available products
  const { data: editStageReceipt } = useInventoryReceiptQuery(existingReturn?.receipt_id || 0);

  // Set form data khi có existingReturn
  useEffect(() => {
    if (isEditMode && existingReturn) {
      console.log('📝 Setting form data:', existingReturn);
      
      setValue('receipt_id', existingReturn.receipt_id || 0);
      setValue('supplier_id', existingReturn.supplier_id);
      setValue('return_code', existingReturn.code);
      setValue('reason', existingReturn.reason);
      setValue('notes', existingReturn.notes || '');
      
      setValue('status', existingReturn.status as any || 'draft');
      
      if (existingReturn.items) {
        setValue('items', existingReturn.items.map(item => ({
          product_id: item.product_id,
          product_name: (item as any).product?.trade_name || (item as any).product?.name || (item as any).product_name || `Sản phẩm #${item.product_id}`,
          quantity: item.quantity,
          unit_cost: typeof item.unit_cost === 'string' ? parseFloat(item.unit_cost) : item.unit_cost,
          total_price: typeof item.total_price === 'string' ? parseFloat(item.total_price) : item.total_price,
          reason: item.reason || '',
          notes: item.notes || '',
        })));
      }

      if ((existingReturn as any).images) {
        const rawImages = (existingReturn as any).images;
        if (Array.isArray(rawImages)) {
          setValue('images', rawImages.map((img: any, index: number) => {
            if (typeof img === 'string') {
              return {
                uid: `-${index}`,
                name: `Image ${index + 1}`,
                status: 'done',
                url: img,
                thumbUrl: img,
              };
            }
            return {
              uid: img.id || `-${index}`,
              url: img.url,
              name: img.name || `Image ${index + 1}`,
              status: 'done'
            };
          }));
        }
      }
    }
  }, [isEditMode, existingReturn, setValue]);

  // Set selectedReceipt khi có editStageReceipt
  useEffect(() => {
    if (isEditMode && editStageReceipt) {
      setSelectedReceipt(editStageReceipt as any);
    }
  }, [isEditMode, editStageReceipt]);

  // Lấy danh sách sản phẩm từ phiếu nhập đã chọn
  const availableProducts = useMemo(() => {
    const sourceReceipt = isEditMode ? editStageReceipt : selectedReceipt;
    
    return (sourceReceipt as any)?.items?.map((item: any) => ({
      product_id: item.product_id,
      product_name: item.product?.trade_name || item.product?.name || item.product_name || `Sản phẩm #${item.product_id}`,
      quantity: item.quantity,
      unit_cost: item.unit_cost || parseFloat(item.final_unit_cost || '0'),
    })) || [];
  }, [isEditMode, editStageReceipt, selectedReceipt]);

  // Compute options for ComboBox based on search results
  const productOptions = useMemo(() => {
    // Nếu không tìm kiếm, hiển thị list available (client-side)
    if (!productSearchTerm) {
        return availableProducts.map((p: any) => ({
            value: p.product_id,
            label: `${p.product_name} (Đã nhập: ${p.quantity})`,
            productData: p
        }));
    }

    // Nếu tìm kiếm, hiển thị kết quả từ server merge với info receipt
    if (!productSearchData?.pages) return [];

    return productSearchData.pages.flatMap((page: any) => page?.data || []).map((product: any) => {
        // Tìm info trong receipt
        const inReceipt = availableProducts.find((ap: any) => ap.product_id === product.id);
        
        return {
            value: product.id,
            label: `${product.trade_name || product.name} ${inReceipt ? `(Đã nhập: ${inReceipt.quantity})` : '(Không có trong phiếu)'}`,
            disabled: !inReceipt, // Disable nếu không có trong phiếu
            productData: inReceipt // Null nếu không có
        };
    });
  }, [availableProducts, productSearchTerm, productSearchData]);

  const handleReceiptSelect = (receiptId: number | null) => {
    const receipt = receiptsData?.data?.items?.find((r) => r.id === receiptId);
    setSelectedReceipt(receipt || null);
    if (receipt) {
      setValue('receipt_id', receipt.id);
      setValue('supplier_id', receipt.supplier_id || 0);
      setValue('return_code', `RT-${receipt.code}`);
      setValue('items', []);
    } else {
      setValue('receipt_id', 0);
      setValue('supplier_id', 0);
      setValue('return_code', '');
      setValue('items', []);
    }
  };

  const handleAddProduct = (product: typeof availableProducts[0]) => {
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

  const onSubmit = async (data: ReturnFormData) => {
    if (!userInfo?.id) {
      alert('Không tìm thấy thông tin người dùng!');
      return;
    }

    try {
      const processedItems = data.items.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_cost: item.unit_cost,
          total_price: item.quantity * item.unit_cost,
          reason: item.reason,
          notes: item.notes,
      }));

      const imageUrls = data.images?.map((img: any) => {
        if (img.url) return img.url;
        if (img.response?.data?.url) return img.response.data.url;
        return img.response?.url || img.thumbUrl;
      }).filter(Boolean) || [];

      const returnData = {
        return_code: data.return_code,
        supplier_id: data.supplier_id,
        receipt_id: data.receipt_id,
        total_amount: processedItems.reduce((sum, item) => sum + item.total_price, 0),
        reason: data.reason,
        notes: data.notes,
        status: data.status,
        created_by: userInfo.id,
        items: processedItems,
        images: imageUrls,
      };

      if (isEditMode && returnId) {
        await updateMutation.mutateAsync({ id: returnId, data: returnData as any });
      } else {
        await createMutation.mutateAsync(returnData as any);
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

  const receiptList = useMemo(() => {
    const list = receiptsData?.data?.items || [];
    if (editStageReceipt && !list.find((r: any) => r.id === editStageReceipt.id)) {
      return [editStageReceipt, ...list];
    }
    return list;
  }, [receiptsData, editStageReceipt]);

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate('/inventory/returns')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" fontWeight="bold">
          {isEditMode ? 'Chỉnh sửa phiếu trả hàng' : 'Tạo phiếu trả hàng'}
        </Typography>
      </Box>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
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
                    label: receipt.code
                  }))}
                  onSearch={setReceiptSearch}
                  onSelectionChange={(value) => {
                    handleReceiptSelect(typeof value === 'number' ? value : null);
                  }}
                  allowClear
                  showSearch
                  disabled={isEditMode}
                />

                {(isEditMode && existingReturn) || selectedReceipt ? (
                  <Box mt={2}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Nhà cung cấp:
                    </Typography>
                    <Typography variant="body1" mb={1}>
                      {isEditMode 
                        ? (existingReturn as any)?.supplier?.name || 'N/A'
                        : (selectedReceipt as any)?.supplier?.name || 'N/A'
                      }
                    </Typography>
                    
                    <Typography variant="subtitle2" color="text.secondary">
                      Tổng tiền phiếu nhập:
                    </Typography>
                    <Typography variant="body1" mb={1} fontWeight="bold" color="primary">
                      {isEditMode
                        ? formatCurrency(parseFloat(String((existingReturn as any)?.total_amount || '0')))
                        : formatCurrency(parseFloat(String((selectedReceipt as any)?.total_amount || '0')))
                      }
                    </Typography>
                    
                    <Typography variant="subtitle2" color="text.secondary">
                      Mã phiếu trả:
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {watch('return_code')}
                    </Typography>
                  </Box>
                ) : null}

                <Box mt={2}>
                  <FormComboBox
                    name="status"
                    control={control}
                    label="Trạng thái"
                    data={[
                      { value: 'draft', label: 'Nháp' },
                      { value: 'approved', label: 'Đã duyệt' },
                      { value: 'cancelled', label: 'Đã hủy' },
                    ]}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
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

                {/* Status moved to left column */}

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

                      <Box>
                        <Typography variant="subtitle2" mb={1}>
                          Hoặc tìm kiếm sản phẩm:
                        </Typography>
                        <ComboBox
                          data={productOptions}
                          value={tempProductSelect}
                          onChange={(value, option: any) => {
                            if (option?.disabled) {
                                message.warning('Sản phẩm này không có trong phiếu nhập đã chọn');
                                return;
                            }
                            
                            const productToAdd = option?.productData || availableProducts.find((p: any) => p.product_id === value);
                            
                            if (productToAdd) {
                              handleAddProduct(productToAdd);
                              setTempProductSelect(null);
                              setProductSearchTerm('');
                            }
                          }}
                          placeholder="-- Tìm kiếm và chọn sản phẩm --"
                          showSearch
                          allowClear
                          onSearch={setProductSearchTerm}
                          loading={isProductSearchLoading}
                          onPopupScroll={(e) => {
                              const target = e.target as HTMLDivElement;
                              if (target.scrollTop + target.offsetHeight === target.scrollHeight && hasNextPage) {
                                  fetchNextPage();
                              }
                          }}
                          filterOption={false}
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

          <Grid item xs={12}>
            <Box display="flex" gap={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                onClick={() => navigate('/inventory/returns')}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {isEditMode 
                  ? (updateMutation.isPending ? 'Đang cập nhật...' : 'Cập nhật phiếu trả')
                  : (createMutation.isPending ? 'Đang tạo...' : 'Tạo phiếu trả')
                }
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default ReturnCreate;
