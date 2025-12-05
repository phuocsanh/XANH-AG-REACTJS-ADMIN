import ProductComparisonPanel from '@/pages/products/components/ProductComparisonPanel'
import { Spin } from 'antd'
import { useProductsQuery } from '@/queries/product'
import { useProductTypesQuery } from '@/queries/product-type'
import { useUnitsQuery } from '@/queries/unit'
import { useSymbolsQuery } from '@/queries/symbol'

/**
 * Trang So sánh Sản phẩm với AI
 * Cho phép người dùng so sánh nhiều sản phẩm bằng AI
 */
export default function ProductComparisonPage() {
  // Lấy danh sách tất cả sản phẩm - dùng hook có auth
  const { data: productsData, isLoading: productsLoading } = useProductsQuery({
    limit: 1000,
  })

  // Lấy danh sách loại sản phẩm
  const { data: productTypesData, isLoading: typesLoading } = useProductTypesQuery()

  // Lấy danh sách đơn vị tính
  const { data: unitsData, isLoading: unitsLoading } = useUnitsQuery()

  // Lấy danh sách ký hiệu (symbol)
  const { data: symbolsData, isLoading: symbolsLoading } = useSymbolsQuery()

  const allProducts = productsData?.data?.items || []
  const productTypes = productTypesData?.data?.items || []
  const units = unitsData?.data?.items || []
  const symbols = symbolsData?.data?.items || []

  const availableProducts = allProducts.map((p: any) => ({
    id: p.id,
    name: p.name,
    product_type: productTypes.find((t: any) => t.id === p.type)?.name,
    ingredient: Array.isArray(p.ingredient) ? p.ingredient.join(', ') : p.ingredient,
    active_ingredient: Array.isArray(p.ingredient) ? p.ingredient.join(', ') : p.ingredient, // Giữ lại để tương thích ngược
    concentration: p.attributes?.concentration as string | undefined,
    unit: units.find((u: any) => u.id === p.unit_id)?.name,
    price: parseFloat(p.price || '0'),
    manufacturer: p.attributes?.manufacturer as string | undefined,
    description: p.description,
    usage: p.attributes?.usage as string | undefined,
    attributes: p.attributes, // Thêm toàn bộ attributes
    symbol: symbols.find((s: any) => s.id === p.symbol_id)?.name, // Thêm symbol
  }))

  console.log('✅ Available products:', availableProducts)

  const isLoading = productsLoading || typesLoading || unitsLoading || symbolsLoading

  return (
    <div className="p-2 md:p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">So sánh Sản phẩm với AI</h1>
        <p className="text-gray-600 mb-6">
          Sử dụng AI để so sánh các sản phẩm thuốc bảo vệ thực vật, phân tích ưu nhược điểm và đưa ra khuyến nghị.
        </p>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Spin size="large" tip="Đang tải dữ liệu sản phẩm..." />
          </div>
        ) : (
          <ProductComparisonPanel
            currentProduct={{
              name: '',
            }}
            availableProducts={availableProducts}
          />
        )}
      </div>
    </div>
  )
}
