import { useState } from 'react';
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
import { FormField, FormFieldNumber, FormImageUpload, FormComboBox } from '@/components/form';
import NumberInput from '@/components/common/number-input';
import ComboBox from '@/components/common/combo-box';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { message } from 'antd';
import { useCreateAdjustmentMutation, useAttachImageToAdjustmentMutation } from '@/queries/inventory-adjustment';
import { useProductsQuery } from '@/queries/product';
import { useAppStore } from '@/stores';
import {
  adjustmentFormSchema,
  AdjustmentFormData,
  defaultAdjustmentValues,
} from './form-config';
import { handleApiError } from '@/utils/error-handler';

const AdjustmentCreate = () => {
  const navigate = useNavigate();
  const userInfo = useAppStore((state) => state.userInfo);
  const [productSearch, setProductSearch] = useState('');
  const [tempProductSelect, setTempProductSelect] = useState<number | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AdjustmentFormData>({
    resolver: zodResolver(adjustmentFormSchema),
    defaultValues: defaultAdjustmentValues,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });


  // Queries
  const { data: productsData } = useProductsQuery({ 
    limit: 100,
    keyword: productSearch || undefined, // Tìm kiếm theo keyword (tên sản phẩm)
  });
  const createMutation = useCreateAdjustmentMutation();
  const attachImageMutation = useAttachImageToAdjustmentMutation();

  const productList = productsData?.data?.items || [];

  // Thêm sản phẩm vào danh sách
  const handleAddProduct = (productId: number) => {
    const product = productList.find((p) => p.id === productId);
    if (!product) return;

    // Check if duplicate
    const exists = fields.some((field) => field.product_id === productId);
    if (exists) {
      message.warning('Sản phẩm đã có trong danh sách!');
      return;
    }

    append({
      product_id: product.id,
      product_name: product.name,
      quantity_change: 0,
      reason: '',
      notes: '',
    });
  };

  // Submit form
  const onSubmit = async (data: AdjustmentFormData) => {
    if (!userInfo?.id) {
      message.error('Không tìm thấy thông tin người dùng!');
      return;
    }

    try {
       // Sanitize items
      const processedItems = data.items.map((item) => ({
          product_id: item.product_id,
          quantity_change: item.quantity_change,
          reason: item.reason,
          notes: item.notes,
      }));

      const adjustmentData = {
        adjustment_type: data.adjustment_type,
        reason: data.reason,
        notes: data.notes,
        created_by: userInfo.id,
        items: processedItems,
      };

      // 1. Tạo phiếu điều chỉnh
      const newAdjustment = await createMutation.mutateAsync(adjustmentData as any);

      // 2. Gắn ảnh (nếu có)
      if (data.images && data.images.length > 0 && newAdjustment?.id) {
        const imagePromises = data.images.map(async (img: any) => {
          if (img.id) {
            try {
              await attachImageMutation.mutateAsync({
                adjustmentId: newAdjustment.id,
                fileId: img.id,
                fieldName: 'adjustment_images',
              });
            } catch (error) {
              console.error("Error attaching image:", error);
            }
          }
        });
        
        await Promise.all(imagePromises);
      }

      navigate('/inventory/adjustments');
    } catch (error) {
      console.error('Error creating adjustment:', error);
       // Error handled by mutation onError with handleApiError or message.error
    }
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate('/inventory/adjustments')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" fontWeight="bold">
          Tạo phiếu điều chỉnh kho
        </Typography>
      </Box>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={3}>
          {/* Thông tin chung */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" mb={2}>
                  Thông tin phiếu
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormComboBox
                      name="adjustment_type"
                      control={control}
                      label="Loại điều chỉnh"
                      placeholder="Chọn loại điều chỉnh"
                      options={[
                        { value: 'IN', label: 'Tăng kho (IN)' },
                        { value: 'OUT', label: 'Giảm kho (OUT)' },
                      ]}
                    />
                  </Grid>
                </Grid>

                <Box mt={2}>
                  <FormField
                    name="reason"
                    control={control}
                    label="Lý do điều chỉnh"
                    type="textarea"
                    rows={3}
                    placeholder="VD: Kiểm kê, hư hỏng, thất lạc..."
                  />
                </Box>

                <Box mt={2}>
                  <FormField
                    name="notes"
                    control={control}
                    label="Ghi chú"
                    type="textarea"
                    rows={2}
                  />
                </Box>

                <Box mt={2}>
                  <Typography variant="subtitle2" mb={1}>
                    Hình ảnh chứng từ / hiện trạng
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

          {/* Chọn sản phẩm */}
          <Grid item xs={12}>
             <Card>
                <CardContent>
                   <Typography variant="h6" mb={2}>Thêm sản phẩm</Typography>
                   <Box>
                      <Typography variant="subtitle2" mb={1}>
                        Tìm kiếm sản phẩm:
                      </Typography>
                      <ComboBox
                        data={productList.map((p) => ({
                          value: p.id,
                          label: p.name
                        }))}
                        value={tempProductSelect}
                        onChange={(value) => {
                          if (value) {
                             handleAddProduct(value);
                             setTempProductSelect(null);
                          }
                        }}
                        placeholder="-- Chọn sản phẩm --"
                        showSearch
                        allowClear
                        onSearch={setProductSearch}
                        filterOption={false}
                      />
                   </Box>
                   <Box mt={2}>
                      <Alert severity="info">
                         Tìm và chọn sản phẩm để thêm vào danh sách điều chỉnh bên dưới.
                      </Alert>
                   </Box>
                </CardContent>
             </Card>
          </Grid>

          {/* Danh sách sản phẩm */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" mb={2}>
                  Danh sách sản phẩm điều chỉnh
                </Typography>

                {errors.items && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {errors.items.message}
                  </Alert>
                )}

                {fields.length > 0 ? (
                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Sản phẩm</TableCell>
                          <TableCell align="right">Số lượng thay đổi</TableCell>
                          <TableCell>Lý do (tuỳ chọn)</TableCell>
                          <TableCell align="center">Xóa</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {fields.map((field, index) => (
                          <TableRow key={field.id}>
                            <TableCell>
                              <Typography variant="body2" fontWeight="bold">
                                {field.product_name}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Controller
                                name={`items.${index}.quantity_change`}
                                control={control}
                                render={({ field }) => {
                                  const adjustmentType = watch('adjustment_type'); // Lấy loại điều chỉnh
                                  const isIncrease = (field.value || 0) >= 0;
                                  const absValue = Math.abs(field.value || 0);
                                  
                                  return (
                                    <Box display="flex" alignItems="center" gap={1} justifyContent="flex-end">
                                      {/* Toggle button - chỉ hiện 1 nút tương ứng */}
                                      {adjustmentType === 'IN' && (
                                        <Button
                                          size="small"
                                          variant="contained"
                                          color="success"
                                          sx={{ minWidth: 60, fontSize: '12px' }}
                                        >
                                          Tăng
                                        </Button>
                                      )}
                                      {adjustmentType === 'OUT' && (
                                        <Button
                                          size="small"
                                          variant="contained"
                                          color="error"
                                          sx={{ minWidth: 60, fontSize: '12px' }}
                                        >
                                          Giảm
                                        </Button>
                                      )}
                                      
                                      {/* Number input */}
                                      <NumberInput
                                        value={absValue || null}
                                        onChange={(val) => {
                                          const newVal = val || 0;
                                          // Tự động set dấu theo loại điều chỉnh
                                          if (adjustmentType === 'IN') {
                                            field.onChange(newVal); // Luôn dương
                                          } else if (adjustmentType === 'OUT') {
                                            field.onChange(-newVal); // Luôn âm
                                          } else {
                                            field.onChange(isIncrease ? newVal : -newVal);
                                          }
                                        }}
                                        min={0}
                                        size="small"
                                        style={{ width: 100 }}
                                        placeholder="Số lượng"
                                      />
                                    </Box>
                                  );
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Controller
                                name={`items.${index}.reason`}
                                control={control}
                                render={({ field }) => (
                                  <input
                                    {...field}
                                    placeholder="Lý do chi tiết..."
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
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Alert severity="warning">
                    Chưa có sản phẩm nào. Vui lòng thêm sản phẩm!
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
                onClick={() => navigate('/inventory/adjustments')}
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
                {createMutation.isPending ? 'Đang tạo...' : 'Tạo phiếu'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default AdjustmentCreate;
