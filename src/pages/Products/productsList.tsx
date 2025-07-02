import React, { useState, useEffect, useCallback } from 'react';
import { Product, ProductType, ProductStatus } from '../../models/product.model';
import { ProductService } from '../../services/product.service';
import { ProductTypeService } from '../../services/product-type.service';

const ProductsList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await ProductService.getProducts();
      setProducts(response.data);
    } catch (err) {
      setError('Failed to fetch products.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProductTypes = useCallback(async () => {
    try {
      const response = await ProductTypeService.getProductTypes();
      setProductTypes(response.data);
    } catch (err) {
      console.error('Failed to fetch product types:', err);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchProductTypes();
  }, [fetchProducts, fetchProductTypes]);

  const handleSearch = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  }, []);

  const handleFilter = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterType(event.target.value);
  }, []);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType ? product.productType?.name === filterType : true;
    return matchesSearch && matchesFilter;
  });

  if (loading) return <div>Loading products...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Product List</h1>
      <div>
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={handleSearch}
        />
        <select onChange={handleFilter} value={filterType}>
          <option value="">All Types</option>
          {productTypes.map((type) => (
            <option key={type.id} value={type.name}>
              {type.name}
            </option>
          ))}
        </select>
      </div>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Price</th>
            <th>Type</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {filteredProducts.map((product) => (
            <tr key={product.id}>
              <td>{product.id}</td>
              <td>{product.name}</td>
              <td>{product.price}</td>
              <td>{product.productType?.name}</td>
              <td>{product.status === ProductStatus.Active ? 'Active' : 'Inactive'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProductsList;