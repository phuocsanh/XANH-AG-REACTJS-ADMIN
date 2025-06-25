// Test script để kiểm tra các API product service với auto login
// Chạy với: node test_product_api.js

import axios from 'axios';

// Cấu hình base URL
const API_URL = 'http://localhost:8002/v1';

// Tạo axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Thông tin đăng nhập
const LOGIN_CREDENTIALS = {
  user_account: 'phuocsanhtps@gmail.com',  // snake_case như Go server expect
  user_password: '12345678'
};

// Hàm đăng nhập để lấy token
async function login() {
  try {
    console.log('🔐 Đang đăng nhập...');
    
    const response = await api.post('/user/login', LOGIN_CREDENTIALS);
    
    console.log('🔍 Debug - Full response:', JSON.stringify(response.data, null, 2));
    console.log('🔍 Debug - Response data type:', typeof response.data);
    console.log('🔍 Debug - Response data keys:', Object.keys(response.data || {}));
    
    // Thử tìm token trong response
    let token = null;
    const responseData = response.data;
    
    // Tìm kiếm token trong tất cả các level
    function findToken(obj, path = '') {
      if (!obj || typeof obj !== 'object') return null;
      
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key;
        
        if (key === 'access_token' && typeof value === 'string') {
          console.log(`🎯 Found access_token at: ${currentPath}`);
          return value;
        }
        
        if (typeof value === 'object' && value !== null) {
          const found = findToken(value, currentPath);
          if (found) return found;
        }
      }
      return null;
    }
    
    token = findToken(responseData);
    
    if (token) {
      console.log('✅ Đăng nhập thành công!');
      console.log('🎫 Token:', token.substring(0, 20) + '...');
      
      // Cập nhật header Authorization cho các request tiếp theo
      api.defaults.headers.Authorization = `Bearer ${token}`;
      
      return token;
    } else {
      throw new Error('Không nhận được token từ response');
    }
  } catch (error) {
    console.error('❌ Lỗi đăng nhập:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Message:', error.message);
    }
    throw error;
  }
}

// Test các API endpoint
async function testProductAPIs() {
  try {
    console.log('🚀 Bắt đầu test Product APIs...');
    console.log('=' .repeat(50));
    
    // Đăng nhập trước
    await login();
    
    console.log('\n📋 Testing Product List API...');
    try {
      const products = await api.get('/manage/product?limit=5&offset=0');
      console.log('✅ Product List Success!');
      console.log('📊 Total products:', products.data.data?.total || 0);
      console.log('📦 Items returned:', products.data.data?.items?.length || 0);
      
      if (products.data.data?.items?.length > 0) {
        const firstProduct = products.data.data.items[0];
        console.log('🔍 First product:', {
          id: firstProduct.id,
          name: firstProduct.name,
          price: firstProduct.price
        });
      }
    } catch (error) {
      console.error('❌ Product List Error:', error.response?.data || error.message);
    }
    
    console.log('\n🔍 Testing Product Search API...');
    try {
      const searchResult = await api.get('/manage/product/search?query=test&limit=3');
      console.log('✅ Search Success!');
      console.log('🔎 Search results:', searchResult.data.data?.items?.length || 0, 'items');
    } catch (error) {
      console.error('❌ Search Error:', error.response?.data || error.message);
    }
    
    console.log('\n🔧 Testing Product Filter API...');
    try {
      const filterResult = await api.get('/manage/product/filter?type=1&limit=3');
      console.log('✅ Filter Success!');
      console.log('🎯 Filter results:', filterResult.data.data?.items?.length || 0, 'items');
    } catch (error) {
      console.error('❌ Filter Error:', error.response?.data || error.message);
    }
    
    console.log('\n📊 Testing Product Stats API...');
    try {
      const stats = await api.get('/manage/product/stats');
      console.log('✅ Stats Success!');
      if (stats.data.data) {
        console.log('📈 Stats:', {
          totalProducts: stats.data.data.total_products,
          publishedProducts: stats.data.data.published_products,
          draftProducts: stats.data.data.draft_products,
          averagePrice: stats.data.data.average_price
        });
      }
    } catch (error) {
      console.error('❌ Stats Error:', error.response?.data || error.message);
    }
    
    console.log('\n📂 Testing Product Types API...');
    try {
      const productTypes = await api.get('/manage/product/type');
      console.log('✅ Product Types Success!');
      console.log('📋 Types count:', productTypes.data.data?.items?.length || 0);
      
      if (productTypes.data.data?.items?.length > 0) {
        console.log('🏷️ First type:', {
          id: productTypes.data.data.items[0].id,
          name: productTypes.data.data.items[0].name
        });
      }
    } catch (error) {
      console.error('❌ Product Types Error:', error.response?.data || error.message);
    }
    
    console.log('\n🏷️ Testing Product Subtypes API...');
    try {
      const productSubtypes = await api.get('/manage/product/subtype');
      console.log('✅ Product Subtypes Success!');
      console.log('🔖 Subtypes count:', productSubtypes.data.data?.items?.length || 0);
      
      if (productSubtypes.data.data?.items?.length > 0) {
        console.log('🏷️ First subtype:', {
          id: productSubtypes.data.data.items[0].id,
          name: productSubtypes.data.data.items[0].name
        });
      }
    } catch (error) {
      console.error('❌ Product Subtypes Error:', error.response?.data || error.message);
    }
    
    // Test CRUD operations
    console.log('\n➕ Testing CRUD Operations...');
    
    // Test tạo product type mới
    console.log('\n🆕 Testing Create Product Type...');
    let createdTypeId = null;
    try {
      const newProductType = await api.post('/manage/product/type', {
        name: 'Test Product Type ' + Date.now(),
        description: 'This is a test product type created by automated script'
      });
      console.log('✅ Created Product Type Success!');
      createdTypeId = newProductType.data.data?.id;
      console.log('🆔 New Type ID:', createdTypeId);
      
      // Test cập nhật product type
      if (createdTypeId) {
        console.log('\n✏️ Testing Update Product Type...');
        try {
          const updatedProductType = await api.put(`/manage/product/type/${createdTypeId}`, {
            name: 'Updated Test Product Type ' + Date.now(),
            description: 'This is an updated test product type'
          });
          console.log('✅ Updated Product Type Success!');
        } catch (updateError) {
          console.error('❌ Update Product Type Error:', updateError.response?.data || updateError.message);
        }
        
        // Test xóa product type
        console.log('\n🗑️ Testing Delete Product Type...');
        try {
          await api.delete(`/manage/product/type/${createdTypeId}`);
          console.log('✅ Deleted Product Type Success!');
        } catch (deleteError) {
          console.error('❌ Delete Product Type Error:', deleteError.response?.data || deleteError.message);
        }
      }
    } catch (error) {
      console.error('❌ Create Product Type Error:', error.response?.data || error.message);
    }
    
    console.log('\n' + '=' .repeat(50));
    console.log('🎉 Tất cả API tests đã hoàn thành!');
    console.log('✨ Script chạy thành công với auto login!');
    
  } catch (error) {
    console.error('\n💥 Test failed:', error.message);
    if (error.response) {
      console.error('📋 Response status:', error.response.status);
      console.error('📄 Response data:', error.response.data);
    }
  }
}

// Hàm hiển thị thông tin hệ thống
function showSystemInfo() {
  console.log('🔧 System Information:');
  console.log('📍 API Base URL:', API_URL);
  console.log('👤 Login Account:', LOGIN_CREDENTIALS.user_account);
  console.log('🕐 Test Time:', new Date().toLocaleString());
  console.log('=' .repeat(50));
}

// Main function
async function main() {
  console.log('🚀 GN Farm Product API Test Script');
  console.log('=' .repeat(50));
  
  showSystemInfo();
  
  try {
    await testProductAPIs();
  } catch (error) {
    console.error('\n💥 Script execution failed:', error.message);
    process.exit(1);
  }
}

// Chạy script
main();

export {
  login,
  testProductAPIs,
  api
};