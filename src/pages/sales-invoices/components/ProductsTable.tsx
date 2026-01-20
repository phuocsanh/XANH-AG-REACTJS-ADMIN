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
                <TableCell>Sản phẩm</TableCell>
                <TableCell align="center">ĐVT</TableCell>
                <TableCell align="center">Tồn kho</TableCell>
                <TableCell align="center">Loại giá</TableCell>
                <TableCell align="right">Số lượng</TableCell>
                <TableCell align="right">Đơn giá</TableCell>
                <TableCell align="right">Giảm giá</TableCell>
                <TableCell align="right">Thành tiền</TableCell>
                <TableCell align="center">Xóa</TableCell>
                <TableCell align="center">Phân tích</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {fields.map((field, index) => {
                const itemTotal =
                  Number(watch(`items.${index}.quantity`)) * Number(watch(`items.${index}.unit_price`)) -
                  (Number(watch(`items.${index}.discount_amount`)) || 0);

                return (
                  <TableRow key={field.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {watch(`items.${index}.product_name`)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" color="text.secondary">
                        {watch(`items.${index}.unit_name`)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {(() => {
                        const stock = Number(watch(`items.${index}.stock_quantity`)) || 0;
                        const sellQty = Number(watch(`items.${index}.quantity`)) || 0;
                        const isOver = sellQty > stock;
                        return (
                          <Field 
                            value={`Kho: ${stock}`}
                            disabled
                            className="w-full"
                            status={isOver ? 'error' : undefined}
                            size="small"
                          />
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
                                if (val > stock) {
                                  antMessage.warning(`Số lượng nhập (${val}) vượt quá tồn kho (${stock})!`);
                                }
                              }
                            }}
                            min={1}
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
                    <TableCell align="center">
                      <Checkbox
                        checked={selectedProductIdsForAdvisory.includes(field.product_id)}
                        onChange={() => {
                          const productId = field.product_id;
                          setSelectedProductIdsForAdvisory(prev =>
                            prev.includes(productId)
                              ? prev.filter(id => id !== productId)
                              : [...prev, productId]
                          );
                        }}
                      />
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
                  <Checkbox
                    size="small"
                    checked={selectedProductIdsForAdvisory.includes(field.product_id)}
                    onChange={() => {
                      const productId = field.product_id;
                      setSelectedProductIdsForAdvisory(prev =>
                        prev.includes(productId)
                          ? prev.filter(id => id !== productId)
                          : [...prev, productId]
                      );
                    }}
                  />
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
                  <Field 
                    value={watch(`items.${index}.unit_name`) || '---'}
                    disabled
                    className="w-full"
                  />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.25}>
                    Tồn kho
                  </Typography>
                  <Field 
                    value={`Kho: ${stock}`}
                    disabled
                    className="w-full"
                    status={remaining < 0 ? 'error' : undefined}
                  />
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
                            if (val > stockQty) {
                              antMessage.warning(`Số lượng nhập (${val}) vượt quá tồn kho (${stockQty})!`);
                            }
                          }
                        }}
                        min={1}
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
