// Component hiển thị danh sách sản phẩm với responsive layout
import React from 'react';
import {
  Box,
  Card,
  Typography,
  IconButton,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { Controller, Control, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { SalesInvoiceFormData } from '../form-config';
import { priceTypeLabels } from '../form-config';
import { Product } from '@/models/product.model';
import NumberInput from '@/components/common/number-input';
import ComboBox from '@/components/common/combo-box';
import { message, App as AntApp } from 'antd';
import Field from '@/components/common/field';

interface ProductsDataResponse {
  data?: {
    items?: Product[];
  };
}

interface ProductField {
  id: string;
  product_id: number;
  product_name?: string;
  unit_name?: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  notes?: string;
  price_type: 'cash' | 'credit';
  stock_quantity?: number;
  sale_unit_id?: number;
  conversion_factor?: number;
  base_quantity?: number;
  conversions?: any[];
}

interface ProductsTableProps {
  fields: ProductField[];
  control: Control<SalesInvoiceFormData>;
  watch: UseFormWatch<SalesInvoiceFormData>;
  setValue: UseFormSetValue<SalesInvoiceFormData>;
  remove: (index: number) => void;
  formatCurrency: (value: number) => string;
  selectedProductIdsForAdvisory: number[];
  setSelectedProductIdsForAdvisory: React.Dispatch<React.SetStateAction<number[]>>;
  productsData: ProductsDataResponse | undefined;
}

export const ProductsTable: React.FC<ProductsTableProps> = ({
  fields,
  control,
  watch,
  setValue,
  remove,
  formatCurrency,
  selectedProductIdsForAdvisory,
  setSelectedProductIdsForAdvisory,
  productsData,
}) => {
  const { message: antMessage } = AntApp.useApp();
  return (
    <>
      {/* Desktop: Table view */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <TableContainer component={Paper} variant="outlined">
          <Table 
            size="small" 
            sx={{ 
              borderSpacing: 0,
              borderCollapse: 'collapse',
              '& .MuiTableCell-root': { 
                padding: '4px 4px',
                whiteSpace: 'nowrap',
                border: '1px solid #e0e0e0',
                fontSize: '0.8rem'
              },
              '& .MuiTableCell-head': {
                fontWeight: 600,
                fontSize: '0.8rem',
                backgroundColor: '#f5f5f5',
                padding: '4px 4px'
              }
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell align="center" sx={{ width: 40 }}>STT</TableCell>
                <TableCell sx={{ minWidth: 200 }}>Sản phẩm</TableCell>
                <TableCell align="center" sx={{ width: 60 }}>ĐVT</TableCell>
                <TableCell align="center" sx={{ width: 100 }}>Tồn kho</TableCell>
                <TableCell align="center" sx={{ width: 150 }}>Loại giá</TableCell>
                <TableCell align="right" sx={{ width: 100 }}>Số lượng</TableCell>
                <TableCell align="right" sx={{ width: 160 }}>Đơn giá</TableCell>
                <TableCell align="right" sx={{ width: 140 }}>Giảm giá</TableCell>
                <TableCell align="center" sx={{ width: 160 }}>Thành tiền</TableCell>
                <TableCell align="center" sx={{ width: 50 }}>Xóa</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {fields.map((field, index) => {
                const itemTotal =
                  Number(watch(`items.${index}.quantity`)) * Number(watch(`items.${index}.unit_price`)) -
                  (Number(watch(`items.${index}.discount_amount`)) || 0);

                return (
                  <TableRow key={field.id}>
                    <TableCell align="center">
                      <Typography variant="body2">{index + 1}</Typography>
                    </TableCell>
                    <TableCell sx={{ minWidth: 200 }}>
                      <Typography 
                        variant="body2" 
                        fontWeight="bold"
                        sx={{ 
                          whiteSpace: 'normal',
                          wordWrap: 'break-word',
                          lineHeight: 1.3
                        }}
                      >
                        {watch(`items.${index}.product_name`)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {(() => {
                        const conversions = watch(`items.${index}.conversions`) || [];
                        const hasConversions = conversions.length > 0;
                        
                        if (!hasConversions) {
                          return (
                            <Typography variant="body2" color="text.secondary">
                              {watch(`items.${index}.unit_name`)}
                            </Typography>
                          );
                        }

                        return (
                          <Controller
                            name={`items.${index}.sale_unit_id`}
                            control={control}
                            render={({ field: unitField }) => (
                              <ComboBox
                                value={unitField.value}
                                onChange={(value) => {
                                  unitField.onChange(value);
                                  const selectedConv = conversions.find((c: any) => c.unit_id === value);
                                  if (selectedConv) {
                                    const factor = Number(selectedConv.conversion_factor) || 1;
                                    setValue(`items.${index}.conversion_factor`, factor);
                                    // Cập nhật base_quantity
                                    const qty = Number(watch(`items.${index}.quantity`)) || 0;
                                    const baseQty = qty * factor;
                                    setValue(`items.${index}.base_quantity`, baseQty);
                                    
                                    // Lưu tên đơn vị chính xác (bao gồm cả label có factor nếu cần)
                                    const label = selectedConv.is_base_unit 
                                      ? (selectedConv.unit?.name || selectedConv.unit_name) 
                                      : `${selectedConv.unit?.name || selectedConv.unit_name} (${factor})`;
                                    setValue(`items.${index}.unit_name`, label);

                                    // Kiểm tra tồn kho sau khi đổi đơn vị
                                    const stock = Number(watch(`items.${index}.stock_quantity`)) || 0;
                                    if (baseQty > stock) {
                                      const unitLabel = selectedConv.unit?.name || selectedConv.unit_name || '';
                                      const displayStock = factor > 0 ? (stock / factor).toFixed(2) : stock;
                                      antMessage.warning(`Số lượng (${qty} ${unitLabel}) vượt quá tồn kho (${displayStock} ${unitLabel})!`);
                                    }
                                  }
                                }}
                                options={conversions.map((c: any) => {
                                  const factorValue = Number(c.conversion_factor) || 1;
                                  const isBase = c.is_base_unit;
                                  // Label chuẩn: Tên đơn vị + (Hệ số) nếu không phải đơn vị gốc
                                  const label = isBase 
                                    ? (c.unit?.name || c.unit_name) 
                                    : `${c.unit?.name || c.unit_name} (${factorValue})`;
                                  
                                  return {
                                    label: label || "---",
                                    value: c.unit_id,
                                  };
                                })}
                                size="small"
                                style={{ width: 100 }}
                                showSearch={false}
                              />
                            )}
                          />
                        );
                      })()}
                    </TableCell>
                    <TableCell align="center">
                      {(() => {
                        const stock = Number(watch(`items.${index}.stock_quantity`)) || 0;
                        const factor = Number(watch(`items.${index}.conversion_factor`)) || 1;
                        const sellQty = Number(watch(`items.${index}.quantity`)) || 0;
                        const baseQty = sellQty * factor;
                        const isOver = baseQty > stock;
                        
                        // Tính tồn kho theo đơn vị đã chọn (ví dụ: KG quy đổi ra BAO)
                        const displayStock = factor > 0 ? Math.floor((stock / factor) * 100) / 100 : stock;
                        
                        return (
                          <Tooltip title={`Tồn thực tế: ${stock} (Đơn vị cơ sở)`} arrow>
                            <div style={{ minWidth: '70px' }}>
                              <Field 
                                value={`${displayStock}`}
                                disabled
                                className="w-full text-center"
                                status={isOver ? 'error' : undefined}
                                size="small"
                              />
                            </div>
                          </Tooltip>
                        );
                      })()}
                    </TableCell>
                    <TableCell align="center">
                      <Controller
                        name={`items.${index}.price_type`}
                        control={control}
                        render={({ field: priceTypeField }) => (
                          <ComboBox
                            value={priceTypeField.value}
                            onChange={(value) => {
                              const newPriceType = value as 'cash' | 'credit';
                              priceTypeField.onChange(newPriceType);
                              
                              const product = (productsData?.data?.items || []).find(
                                (p: Product) => p.id === field.product_id
                              );
                              
                              if (product) {
                                const newPrice = newPriceType === 'cash' 
                                  ? Number(product.price) || 0
                                  : Number(product.credit_price) || Number(product.price) || 0;
                                setValue(`items.${index}.unit_price`, newPrice);
                              }
                            }}
                            options={[
                              { value: 'cash', label: priceTypeLabels.cash },
                              { value: 'credit', label: priceTypeLabels.credit }
                            ]}
                            size="small"
                            style={{ width: 140 }}
                            showSearch={false}
                            allowClear={true}
                          />
                        )}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Controller
                        name={`items.${index}.quantity`}
                        control={control}
                        render={({ field }) => (
                          <NumberInput
                            value={field.value}
                            onChange={(val) => {
                              field.onChange(val);
                              if (val !== null) {
                                const stock = Number(watch(`items.${index}.stock_quantity`)) || 0;
                                const factor = Number(watch(`items.${index}.conversion_factor`)) || 1;
                                const baseQty = Number(val) * factor;
                                
                                if (baseQty > stock) {
                                  const displayStock = factor > 0 ? (stock / factor).toFixed(2) : stock;
                                  const unitName = watch(`items.${index}.unit_name`) || '';
                                  antMessage.warning(`Số lượng nhập (${val} ${unitName}) vượt quá tồn kho (${displayStock} ${unitName})!`);
                                }
                                
                                // Cập nhật base_quantity
                                setValue(`items.${index}.base_quantity`, baseQty);
                              }
                            }}
                            min={1}
                            status={(() => {
                              const qty = Number(watch(`items.${index}.quantity`)) || 0;
                              const factor = Number(watch(`items.${index}.conversion_factor`)) || 1;
                              const stock = Number(watch(`items.${index}.stock_quantity`)) || 0;
                              return (qty * factor > stock) ? 'error' : undefined;
                            })()}
                            allowClear
                            size="small"
                            style={{ width: 90 }}
                          />
                        )}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Controller
                        name={`items.${index}.unit_price`}
                        control={control}
                        render={({ field }) => (
                          <NumberInput
                            value={field.value}
                            onChange={(val) => field.onChange(val)}
                            min={0}
                            allowClear
                            size="small"
                            style={{ width: 150 }}
                          />
                        )}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Controller
                        name={`items.${index}.discount_amount`}
                        control={control}
                        render={({ field }) => (
                          <NumberInput
                            value={field.value}
                            onChange={(val) => field.onChange(val)}
                            min={0}
                            allowClear
                            size="small"
                            style={{ width: 130 }}
                          />
                        )}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold" color="success.main">
                        {formatCurrency(itemTotal)}
                      </Typography>
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
      </Box>

      {/* Mobile: Card view */}
      <Box sx={{ 
        display: { xs: 'block', md: 'none' },
        overflowY: 'auto',
        maxHeight: 'calc(100vh - 300px)',
        WebkitOverflowScrolling: 'touch' // Smooth scrolling trên iOS
      }}>
        {fields.map((field, index) => {
          const itemTotal =
            Number(watch(`items.${index}.quantity`)) * Number(watch(`items.${index}.unit_price`)) -
            (Number(watch(`items.${index}.discount_amount`)) || 0);
          const stock = Number(watch(`items.${index}.stock_quantity`)) || 0;
          const sellQty = Number(watch(`items.${index}.quantity`)) || 0;
          const remaining = stock - sellQty;

          return (
            <Card key={field.id} sx={{ mb: 2, p: 2, borderLeft: '4px solid #10b981' }}>
              {/* Header: Name and Actions */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#1e293b', lineHeight: 1.2 }}>
                  {watch(`items.${index}.product_name`)}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: -0.5 }}>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => remove(index)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>

              {/* Grid 3 Rows x 2 Columns */}
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: 2,
                mb: 2 
              }}>
                {/* Row 1: ĐVT & Tồn kho */}
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.25}>
                    Đơn vị
                  </Typography>
                  {(() => {
                    const conversions = watch(`items.${index}.conversions`) || [];
                    const hasConversions = conversions.length > 0;
                    
                    if (!hasConversions) {
                      return (
                        <Field 
                          value={watch(`items.${index}.unit_name`) || '---'}
                          disabled
                          className="w-full"
                        />
                      );
                    }

                    return (
                      <Controller
                        name={`items.${index}.sale_unit_id`}
                        control={control}
                        render={({ field: unitField }) => (
                          <ComboBox
                            value={unitField.value}
                            onChange={(value) => {
                              unitField.onChange(value);
                              const selectedConv = conversions.find((c: any) => c.unit_id === value);
                              if (selectedConv) {
                                const factor = Number(selectedConv.conversion_factor) || 1;
                                setValue(`items.${index}.conversion_factor`, factor);
                                setValue(`items.${index}.unit_name`, selectedConv.unit?.name || selectedConv.unit_name);
                                
                                // Cập nhật base_quantity
                                const qty = Number(watch(`items.${index}.quantity`)) || 0;
                                const baseQty = qty * factor;
                                setValue(`items.${index}.base_quantity`, baseQty);

                                // Kiểm tra tồn kho mobile
                                const stock = Number(watch(`items.${index}.stock_quantity`)) || 0;
                                if (baseQty > stock) {
                                  const unitLabel = selectedConv.unit?.name || selectedConv.unit_name || '';
                                  const displayStock = factor > 0 ? (stock / factor).toFixed(2) : stock;
                                  antMessage.warning(`Số lượng vượt quá tồn kho (${displayStock} ${unitLabel})!`);
                                }
                              }
                            }}
                            options={conversions.map((c: any) => {
                              const factorValue = Number(c.conversion_factor) || 1;
                              const label = c.is_base_unit 
                                ? (c.unit?.name || c.unit_name) 
                                : `${c.unit?.name || c.unit_name} (${factorValue})`;
                                
                              return {
                                label: label || "---",
                                value: c.unit_id,
                              };
                            })}
                            style={{ width: '100%' }}
                            showSearch={false}
                          />
                        )}
                      />
                    );
                  })()}
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.25}>
                    Tồn kho
                  </Typography>
                  {(() => {
                    const stock = Number(watch(`items.${index}.stock_quantity`)) || 0;
                    const factor = Number(watch(`items.${index}.conversion_factor`)) || 1;
                    const displayStock = factor > 0 ? Math.floor((stock / factor) * 100) / 100 : stock;
                    const sellQty = Number(watch(`items.${index}.quantity`)) || 0;
                    const isOver = (sellQty * factor) > stock;

                    return (
                      <Field 
                        value={`${displayStock}`}
                        disabled
                        className="w-full"
                        status={isOver ? 'error' : undefined}
                      />
                    );
                  })()}
                </Box>

                {/* Row 2: Loại giá & Số lượng */}
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.25}>
                    Loại giá
                  </Typography>
                  <Controller
                    name={`items.${index}.price_type`}
                    control={control}
                    render={({ field: priceTypeField }) => (
                      <ComboBox
                        value={priceTypeField.value}
                        onChange={(value) => {
                          const newPriceType = value as 'cash' | 'credit';
                          priceTypeField.onChange(newPriceType);
                          
                          const product = (productsData?.data?.items || []).find(
                            (p: Product) => p.id === field.product_id
                          );
                          
                          if (product) {
                            const newPrice = newPriceType === 'cash' 
                              ? Number(product.price) || 0
                              : Number(product.credit_price) || Number(product.price) || 0;
                            setValue(`items.${index}.unit_price`, newPrice);
                          }
                        }}
                        options={[
                          { value: 'cash', label: priceTypeLabels.cash },
                          { value: 'credit', label: priceTypeLabels.credit }
                        ]}
                        style={{ width: '100%' }}
                        showSearch={false}
                        allowClear={true}
                      />
                    )}
                  />
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.25}>
                    Số lượng
                  </Typography>
                  <Controller
                    name={`items.${index}.quantity`}
                    control={control}
                    render={({ field }) => (
                      <NumberInput
                        value={field.value}
                        onChange={(val) => {
                          field.onChange(val);
                            if (val !== null) {
                              const stockQty = Number(watch(`items.${index}.stock_quantity`)) || 0;
                              const factor = Number(watch(`items.${index}.conversion_factor`)) || 1;
                              const baseQty = Number(val) * factor;

                              if (baseQty > stockQty) {
                                const displayStock = factor > 0 ? (stockQty / factor).toFixed(2) : stockQty;
                                antMessage.warning(`Số lượng vượt quá tồn kho (${displayStock})!`);
                              }
                              
                              // Cập nhật base_quantity
                              setValue(`items.${index}.base_quantity`, baseQty);
                            }
                          }}
                        min={1}
                        status={(() => {
                          const qty = Number(watch(`items.${index}.quantity`)) || 0;
                          const factor = Number(watch(`items.${index}.conversion_factor`)) || 1;
                          const stock = Number(watch(`items.${index}.stock_quantity`)) || 0;
                          return (qty * factor > stock) ? 'error' : undefined;
                        })()}
                        allowClear
                        style={{ width: '100%' }}
                      />
                    )}
                  />
                </Box>

                {/* Row 3: Đơn giá & Giảm giá */}
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                    Đơn giá
                  </Typography>
                  <Controller
                    name={`items.${index}.unit_price`}
                    control={control}
                    render={({ field }) => (
                      <NumberInput
                        value={field.value}
                        onChange={(val) => field.onChange(val)}
                        min={0}
                        allowClear
                        style={{ width: '100%' }}
                      />
                    )}
                  />
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.25}>
                    Giảm giá
                  </Typography>
                  <Controller
                    name={`items.${index}.discount_amount`}
                    control={control}
                    render={({ field }) => (
                      <NumberInput
                        value={field.value}
                        onChange={(val) => field.onChange(val)}
                        min={0}
                        allowClear
                        style={{ width: '100%' }}
                      />
                    )}
                  />
                </Box>
              </Box>

              {/* Footer: Item Total */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                pt: 1.5,
                borderTop: '1px dashed #e2e8f0'
              }}>
                <Typography variant="body2" fontWeight="medium" color="#64748b">Thành tiền:</Typography>
                <Typography variant="subtitle1" fontWeight="bold" color="#10b981">
                  {formatCurrency(itemTotal)}
                </Typography>
              </Box>
            </Card>
          );
        })}
      </Box>
    </>
  );
};
