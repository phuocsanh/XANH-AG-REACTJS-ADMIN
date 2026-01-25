/* eslint-disable react/prop-types */
// Component quản lý danh sách sản phẩm trong hóa đơn
import React from 'react';
import { Card, CardContent, Typography, Alert } from '@mui/material';
import { Control, UseFormWatch, UseFormSetValue, FieldArrayWithId } from 'react-hook-form';
import ComboBox from '@/components/common/combo-box';
import { Product } from '@/models/product.model';
import { SalesInvoiceFormData } from '../../form-config';
import { ProductsTable } from '../ProductsTable';

interface ProductsSectionProps {
  control: Control<SalesInvoiceFormData>;
  watch: UseFormWatch<SalesInvoiceFormData>;
  setValue: UseFormSetValue<SalesInvoiceFormData>;
  fields: FieldArrayWithId<SalesInvoiceFormData, 'items', 'id'>[];
  remove: (index: number) => void;
  productsData: { data?: { items?: Product[] } } | undefined;
  productSearch: string;
  setProductSearch: (value: string) => void;
  handleAddProduct: (product: Product) => void;
  formatCurrency: (value: number) => string;
  selectedProductIdsForAdvisory: number[];
  setSelectedProductIdsForAdvisory: React.Dispatch<React.SetStateAction<number[]>>;
  latestInvoice: any;
  errors: any;
}

export const ProductsSection = React.memo<ProductsSectionProps>(({
  control,
  watch,
  setValue,
  fields,
  remove,
  productsData,
  productSearch,
  setProductSearch,
  handleAddProduct,
  formatCurrency,
  selectedProductIdsForAdvisory,
  setSelectedProductIdsForAdvisory,
  latestInvoice,
  errors,
}) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" mb={2}>
          Danh sách sản phẩm
        </Typography>

        <ComboBox
          label="Thêm sản phẩm"
          placeholder="Tìm kiếm sản phẩm..."
          data={productsData?.data?.items?.map((product: Product) => {
            return {
              value: product.id,
              label: product.trade_name || product.name,
              scientific_name: product.name,
              unit_name: product.unit?.name || product.unit_name || ""
            };
          }) || []}
          value={undefined}
          searchValue={productSearch}
          onChange={(value: string | number) => {
            const product = productsData?.data?.items?.find((p: Product) => p.id === value);
            if (product) {
              handleAddProduct(product);
              // Xóa sạch ComboBox sau khi thêm sản phẩm
              setProductSearch('');
            }
          }}
          onSearch={(val) => setProductSearch(val)}
          searchDebounceMs={1000}
          filterOption={false}
          allowClear
          showSearch
        />

        {latestInvoice?.warning && (
          <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
            💡 Tích chọn sản phẩm cần kiểm tra xung đột với lưu ý đơn hàng trước
          </Typography>
        )}

        {errors.items && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.items.message}
          </Alert>
        )}

        <ProductsTable
          fields={fields}
          control={control}
          watch={watch}
          setValue={setValue}
          remove={remove}
          formatCurrency={formatCurrency}
          selectedProductIdsForAdvisory={selectedProductIdsForAdvisory}
          setSelectedProductIdsForAdvisory={setSelectedProductIdsForAdvisory}
          productsData={productsData}
        />
      </CardContent>
    </Card>
  );
});

ProductsSection.displayName = 'ProductsSection';
