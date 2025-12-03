// Component hiển thị danh sách sản phẩm với responsive layout
import React from 'react';
import {
  Box,
  Card,
  Typography,
  TextField,
  Select,
  MenuItem,
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

interface ProductsDataResponse {
  data?: {
    items?: Product[];
  };
}

interface ProductField {
  id: string;
  product_id: number;
  product_name?: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  notes?: string;
  price_type: 'cash' | 'credit';
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
                      <Controller
                        name={`items.${index}.price_type`}
                        control={control}
                        render={({ field: priceTypeField }) => (
                          <Select
                            {...priceTypeField}
                            size="small"
                            sx={{ width: 140 }}
                            onChange={(e) => {
                              const newPriceType = e.target.value as 'cash' | 'credit';
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
                          >
                            <MenuItem value="cash">{priceTypeLabels.cash}</MenuItem>
                            <MenuItem value="credit">{priceTypeLabels.credit}</MenuItem>
                          </Select>
                        )}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Controller
                        name={`items.${index}.quantity`}
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            type="number"
                            size="small"
                            inputProps={{ min: 1 }}
                            sx={{ width: 90 }}
                          />
                        )}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Controller
                        name={`items.${index}.unit_price`}
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            type="number"
                            size="small"
                            inputProps={{ min: 0 }}
                            sx={{ width: 150 }}
                          />
                        )}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Controller
                        name={`items.${index}.discount_amount`}
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            type="number"
                            size="small"
                            inputProps={{ min: 0 }}
                            sx={{ width: 130 }}
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

          return (
            <Card key={field.id} sx={{ mb: 2, p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  {watch(`items.${index}.product_name`)}
                </Typography>
                <Box>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => remove(index)}
                  >
                    <DeleteIcon />
                  </IconButton>
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
                </Box>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                    Loại giá
                  </Typography>
                  <Controller
                    name={`items.${index}.price_type`}
                    control={control}
                    render={({ field: priceTypeField }) => (
                      <Select
                        {...priceTypeField}
                        fullWidth
                        size="small"
                        onChange={(e) => {
                          const newPriceType = e.target.value as 'cash' | 'credit';
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
                      >
                        <MenuItem value="cash">{priceTypeLabels.cash}</MenuItem>
                        <MenuItem value="credit">{priceTypeLabels.credit}</MenuItem>
                      </Select>
                    )}
                  />
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                    Số lượng
                  </Typography>
                  <Controller
                    name={`items.${index}.quantity`}
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        type="number"
                        size="small"
                        inputProps={{ min: 1 }}
                      />
                    )}
                  />
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                    Đơn giá
                  </Typography>
                  <Controller
                    name={`items.${index}.unit_price`}
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        type="number"
                        size="small"
                        inputProps={{ min: 0 }}
                      />
                    )}
                  />
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                    Giảm giá
                  </Typography>
                  <Controller
                    name={`items.${index}.discount_amount`}
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        type="number"
                        size="small"
                        inputProps={{ min: 0 }}
                      />
                    )}
                  />
                </Box>

                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  pt: 1,
                  mt: 1,
                  borderTop: '2px solid #e0e0e0'
                }}>
                  <Typography variant="body2" fontWeight="bold">Thành tiền:</Typography>
                  <Typography variant="h6" fontWeight="bold" color="success.main">
                    {formatCurrency(itemTotal)}
                  </Typography>
                </Box>
              </Box>
            </Card>
          );
        })}
      </Box>
    </>
  );
};
