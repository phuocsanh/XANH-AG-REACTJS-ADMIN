import React, { useState, useEffect } from 'react';
import { 
  Product, 
  ProductType, 
  ProductSubtype, 
  ProductStats,
  CreateProductTypeRequest,
  CreateProductSubtypeRequest 
} from '@/models/product.model';
import { productService } from '@/services/product.service';

// Component example để demo cách sử dụng các API mới
const ProductManagementExample: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [productSubtypes, setProductSubtypes] = useState<ProductSubtype[]>([]);
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<number | undefined>();

  // Load dữ liệu ban đầu
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Load tất cả dữ liệu song song
      const [productsRes, typesRes, subtypesRes, statsRes] = await Promise.all([
        productService.getProducts({ limit: 10, offset: 0 }),
        productService.getProductTypes(),
        productService.getProductSubtypes(),
        productService.getProductStats()
      ]);

      setProducts(productsRes.data.items);
      setProductTypes(typesRes.data.items);
      setProductSubtypes(subtypesRes.data.items);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Lỗi khi load dữ liệu:', error);
    } finally {
      setLoading(false);
    }
  };

  // Tìm kiếm sản phẩm
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadInitialData();
      return;
    }

    setLoading(true);
    try {
      const result = await productService.searchProducts(searchQuery, 10, 0);
      setProducts(result.data.items);
    } catch (error) {
      console.error('Lỗi khi tìm kiếm:', error);
    } finally {
      setLoading(false);
    }
  };

  // Lọc sản phẩm theo loại
  const handleFilter = async () => {
    if (!selectedType) {
      loadInitialData();
      return;
    }

    setLoading(true);
    try {
      const result = await productService.filterProducts({ type: selectedType, limit: 10 });
      setProducts(result.data.items);
    } catch (error) {
      console.error('Lỗi khi lọc:', error);
    } finally {
      setLoading(false);
    }
  };

  // Tạo loại sản phẩm mới
  const handleCreateProductType = async () => {
    const name = prompt('Nhập tên loại sản phẩm:');
    if (!name) return;

    const description = prompt('Nhập mô tả (tùy chọn):');
    
    try {
      const newType: CreateProductTypeRequest = {
        name,
        description: description || undefined
      };
      
      await productService.createProductType(newType);
      alert('Tạo loại sản phẩm thành công!');
      
      // Reload product types
      const typesRes = await productService.getProductTypes();
      setProductTypes(typesRes.data.items);
    } catch (error) {
      console.error('Lỗi khi tạo loại sản phẩm:', error);
      alert('Có lỗi xảy ra khi tạo loại sản phẩm!');
    }
  };

  // Tạo phân loại sản phẩm mới
  const handleCreateProductSubtype = async () => {
    if (productTypes.length === 0) {
      alert('Vui lòng tạo loại sản phẩm trước!');
      return;
    }

    const name = prompt('Nhập tên phân loại sản phẩm:');
    if (!name) return;

    const description = prompt('Nhập mô tả (tùy chọn):');
    const productTypeId = parseInt(prompt(`Nhập ID loại sản phẩm (${productTypes.map(t => `${t.id}: ${t.name}`).join(', ')}):`) || '0');
    
    if (!productTypeId || !productTypes.find(t => t.id === productTypeId)) {
      alert('ID loại sản phẩm không hợp lệ!');
      return;
    }
    
    try {
      const newSubtype: CreateProductSubtypeRequest = {
        name,
        description: description || undefined,
        productTypeId
      };
      
      await productService.createProductSubtype(newSubtype);
      alert('Tạo phân loại sản phẩm thành công!');
      
      // Reload product subtypes
      const subtypesRes = await productService.getProductSubtypes();
      setProductSubtypes(subtypesRes.data.items);
    } catch (error) {
      console.error('Lỗi khi tạo phân loại sản phẩm:', error);
      alert('Có lỗi xảy ra khi tạo phân loại sản phẩm!');
    }
  };

  if (loading) {
    return <div className="p-4">Đang tải...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Quản lý sản phẩm</h1>
      
      {/* Thống kê */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-100 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800">Tổng sản phẩm</h3>
            <p className="text-2xl font-bold text-blue-600">{stats.totalProducts}</p>
          </div>
          <div className="bg-green-100 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800">Đã xuất bản</h3>
            <p className="text-2xl font-bold text-green-600">{stats.publishedProducts}</p>
          </div>
          <div className="bg-yellow-100 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-800">Bản nháp</h3>
            <p className="text-2xl font-bold text-yellow-600">{stats.draftProducts}</p>
          </div>
          <div className="bg-purple-100 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-800">Giá trung bình</h3>
            <p className="text-2xl font-bold text-purple-600">{stats.averagePrice.toLocaleString()}đ</p>
          </div>
        </div>
      )}

      {/* Tìm kiếm và lọc */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-64">
            <label className="block text-sm font-medium mb-2">Tìm kiếm sản phẩm</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nhập từ khóa tìm kiếm..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Tìm kiếm
              </button>
            </div>
          </div>
          
          <div className="min-w-48">
            <label className="block text-sm font-medium mb-2">Lọc theo loại</label>
            <div className="flex gap-2">
              <select
                value={selectedType || ''}
                onChange={(e) => setSelectedType(e.target.value ? parseInt(e.target.value) : undefined)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tất cả loại</option>
                {productTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
              <button
                onClick={handleFilter}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
              >
                Lọc
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quản lý loại và phân loại */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Loại sản phẩm ({productTypes.length})</h2>
            <button
              onClick={handleCreateProductType}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            >
              Thêm loại
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {productTypes.map(type => (
              <div key={type.id} className="p-2 border-b border-gray-200 last:border-b-0">
                <div className="font-medium">{type.name}</div>
                {type.description && (
                  <div className="text-sm text-gray-600">{type.description}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Phân loại sản phẩm ({productSubtypes.length})</h2>
            <button
              onClick={handleCreateProductSubtype}
              className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
            >
              Thêm phân loại
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {productSubtypes.map(subtype => (
              <div key={subtype.id} className="p-2 border-b border-gray-200 last:border-b-0">
                <div className="font-medium">{subtype.name}</div>
                {subtype.description && (
                  <div className="text-sm text-gray-600">{subtype.description}</div>
                )}
                <div className="text-xs text-blue-600">
                  Loại: {productTypes.find(t => t.id === subtype.productTypeId)?.name || 'N/A'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Danh sách sản phẩm */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Danh sách sản phẩm ({products.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số lượng</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map(product => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{product.id}</td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {product.thumb && (
                        <img className="h-10 w-10 rounded-full mr-3" src={product.thumb} alt={product.name} />
                      )}
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {parseInt(product.price).toLocaleString()}đ
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{product.quantity}</td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      product.isPublished 
                        ? 'bg-green-100 text-green-800' 
                        : product.isDraft 
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {product.isPublished ? 'Đã xuất bản' : product.isDraft ? 'Bản nháp' : 'Chưa xác định'}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {productTypes.find(t => t.id === product.type)?.name || 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {products.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            Không có sản phẩm nào được tìm thấy.
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductManagementExample;