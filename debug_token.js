import axios from 'axios';

// Tạo API instance giống như trong utils/api.ts
const api = axios.create({
  baseURL: 'http://localhost:8002/v1',
  timeout: 30000
});

// Thêm interceptor để log headers
api.interceptors.request.use(
  (config) => {
    console.log('🔍 Request URL:', config.url);
    console.log('🔍 Request Headers:', JSON.stringify(config.headers, null, 2));
    console.log('🔍 Authorization Header:', config.headers.Authorization);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    throw error;
  }
);

// Test 1: Request không có token
console.log('\n=== TEST 1: Request không có token ===');
api.get('/manage/product/type')
  .then(response => {
    console.log('✅ Success:', response.status);
  })
  .catch(error => {
    console.log('❌ Error:', error.response?.status, error.response?.statusText);
    console.log('❌ Error Data:', error.response?.data);
  })
  .finally(() => {
    // Test 2: Request có token
    console.log('\n=== TEST 2: Request có token ===');
    api.get('/manage/product/type', {
      headers: {
        Authorization: 'Bearer test-token-123'
      }
    })
    .then(response => {
      console.log('✅ Success:', response.status);
    })
    .catch(error => {
      console.log('❌ Error:', error.response?.status, error.response?.statusText);
      console.log('❌ Error Data:', error.response?.data);
    })
    .finally(() => {
      // Test 3: Login để lấy token thật
      console.log('\n=== TEST 3: Login để lấy token thật ===');
      api.post('/user/login', {
        user_account: 'phuocsanhtps@gmail.com',
        user_password: '12345678'
      })
      .then(response => {
        console.log('✅ Login Success!');
        console.log('📋 Full Response:', JSON.stringify(response.data, null, 2));
        const token = response.data?.data?.tokens?.access_token;
        console.log('🔑 Token:', token ? token.substring(0, 20) + '...' : 'No token');
        
        if (token) {
          // Test 4: Request với token thật
          console.log('\n=== TEST 4: Request với token thật ===');
          api.get('/manage/product/type', {
            headers: {
              Authorization: `Bearer ${token}`
            }
          })
          .then(response => {
            console.log('✅ Success với token thật:', response.status);
            console.log('📊 Data count:', response.data?.data?.length || 0);
          })
          .catch(error => {
            console.log('❌ Error với token thật:', error.response?.status, error.response?.statusText);
            console.log('❌ Error Data:', error.response?.data);
          });
        }
      })
      .catch(error => {
        console.log('❌ Login Error:', error.response?.status, error.response?.statusText);
        console.log('❌ Login Error Data:', error.response?.data);
      });
    });
  });