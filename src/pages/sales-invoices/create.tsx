import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  TextField,
  Grid,
  Card,
  CardContent,
  Autocomplete,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  Alert,
  Tabs,
  Tab,
  List,
  ListItem,
  Checkbox,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import {
  PrinterOutlined,
  EnvironmentOutlined,
  AimOutlined,
  SyncOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateSalesInvoiceMutation, useLatestInvoiceByCustomerQuery } from '@/queries/sales-invoice';
import { useCustomerSearchQuery } from '@/queries/customer';
import { useSeasonsQuery, useActiveSeasonQuery } from '@/queries/season';
import { useProductsQuery } from '@/queries/product';
import { Customer } from '@/models/customer';
import { Season } from '@/models/season';
import { Product } from '@/models/product.model';
import { useAiService } from '@/hooks/use-ai-service';
import { weatherService, WeatherData, SimplifiedWeatherData } from '@/lib/weather-service';
import { frontendAiService } from '@/lib/ai-service';
import { VIETNAM_LOCATIONS, DEFAULT_LOCATION, Location } from '@/constants/locations';
import LocationMap from '@/components/LocationMap';
import { Tag, Space, Spin, Modal as AntModal, message } from 'antd';
import {
  salesInvoiceSchema,
  SalesInvoiceFormData,
  defaultSalesInvoiceValues,
  paymentMethodLabels,
} from './form-config';

interface Recommendation {
  time: string;
  temperature: string;
  rain_prob: string;
  wind_speed: string;
  condition: string;
  reason: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const CreateSalesInvoice = () => {
  const navigate = useNavigate();
  const [customerSearch, setCustomerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isGuestCustomer, setIsGuestCustomer] = useState(true);
  const [currentTab, setCurrentTab] = useState(0);

  // Technical Advisory States
  const [selectedProductIdsForAdvisory, setSelectedProductIdsForAdvisory] = useState<number[]>([]);
  const [mixResult, setMixResult] = useState('');
  const [sortResult, setSortResult] = useState('');
  const [weatherForecast, setWeatherForecast] = useState<WeatherData[]>([]);
  const [sprayingRecommendations, setSprayingRecommendations] = useState<Recommendation[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location>(DEFAULT_LOCATION);
  const [isMapModalVisible, setIsMapModalVisible] = useState(false);
  const [isPrintModalVisible, setIsPrintModalVisible] = useState(false);
  const [printSections, setPrintSections] = useState({
    mix: true,
    sort: true,
    spray: true
  });
  const printContentRef = useRef<HTMLDivElement>(null);
  
  // AI Warning Generation States
  const [isGeneratingWarning, setIsGeneratingWarning] = useState(false);

  const { mixPesticides, sortPesticides } = useAiService();

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SalesInvoiceFormData>({
    resolver: zodResolver(salesInvoiceSchema),
    defaultValues: defaultSalesInvoiceValues,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  // Queries
  const { data: customers } = useCustomerSearchQuery(customerSearch);
  const { data: activeSeason } = useActiveSeasonQuery();
  const { data: seasons } = useSeasonsQuery();
  const { data: productsData } = useProductsQuery({ limit: 100 });
  const { data: latestInvoice } = useLatestInvoiceByCustomerQuery(selectedCustomer?.id);
  const createMutation = useCreateSalesInvoiceMutation();

  // Set active season as default
  useEffect(() => {
    if (activeSeason) {
      setValue('season_id', activeSeason.id);
    }
  }, [activeSeason, setValue]);



  // Watch items to calculate totals
  const items = watch('items');
  const discountAmount = watch('discount_amount');
  const partialPaymentAmount = watch('partial_payment_amount');

  useEffect(() => {
    const total = items.reduce((sum, item) => {
      return sum + item.quantity * item.unit_price - (item.discount_amount || 0);
    }, 0);
    setValue('total_amount', total);
    setValue('final_amount', total - discountAmount);
  }, [items, discountAmount, setValue]);

  const handleCustomerSelect = (customer: Customer | null) => {
    setSelectedCustomer(customer);
    if (customer) {
      setIsGuestCustomer(false);
      setValue('customer_id', customer.id);
      setValue('customer_name', customer.name);
      setValue('customer_phone', customer.phone);
      setValue('customer_address', customer.address || '');
    } else {
      setIsGuestCustomer(true);
      setValue('customer_id', undefined);
      setValue('customer_name', '');
      setValue('customer_phone', '');
      setValue('customer_address', '');
    }
  };



  /**
   * Generate warning using AI based on product descriptions
   */
  /**
   * Generate warning using AI based on product descriptions
   */
  const handleGenerateWarning = async (silent = false) => {
    if (items.length === 0) {
      if (!silent) message.warning('Vui lòng thêm sản phẩm vào đơn hàng trước');
      return;
    }

    setIsGeneratingWarning(true);
    
    try {
      // Get product details with descriptions
      const productDescriptions = items
        .map(item => {
          const product = (productsData?.data?.items || []).find((p: Product) => p.id === item.product_id);
          if (product) {
            return `- ${product.name}: ${product.description || 'Không có mô tả'}`;
          }
          return null;
        })
        .filter(Boolean)
        .join('\n');

      if (!productDescriptions) {
        if (!silent) message.warning('Không tìm thấy mô tả sản phẩm');
        setIsGeneratingWarning(false);
        return;
      }

      const prompt = `Dựa trên danh sách sản phẩm và mô tả sau, hãy tạo một lưu ý quan trọng ngắn gọn (1-2 câu) cho đơn hàng. Lưu ý nên tập trung vào:
- Cách sử dụng an toàn
- Thời gian sử dụng tối ưu
- Lưu ý khi phối trộn (nếu có)
- Điều kiện bảo quản

Danh sách sản phẩm:
${productDescriptions}

Chỉ trả về nội dung lưu ý, không thêm tiêu đề hay giải thích.`;

      const response = await frontendAiService.generateWarning(prompt);
      
      if (response.success && response.answer) {
        setValue('warning', response.answer.trim());
        if (!silent) message.success('Đã tạo lưu ý bằng AI');
      } else {
        if (!silent) message.error('Không thể tạo lưu ý. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Error generating warning:', error);
      if (!silent) message.error('Có lỗi xảy ra khi tạo lưu ý');
    } finally {
      setIsGeneratingWarning(false);
    }
  };

  // Auto-generate warning when items change
  useEffect(() => {
    const timer = setTimeout(() => {
      // Create a unique key for current items to check changes
      const currentItemsKey = items.map(i => i.product_id).join(',');
      
      if (items.length > 0) {
        handleGenerateWarning(true);
      }
    }, 2000); // Debounce 2s

    return () => clearTimeout(timer);
  }, [items]); // Re-run when items change

  const handleAddProduct = (product: Product) => {
    append({
      product_id: product.id,
      product_name: product.name,
      quantity: 1,
      unit_price: Number(product.price) || 0,
      discount_amount: 0,
      notes: '',
    });
    setProductSearch('');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  const onSubmit = (data: SalesInvoiceFormData) => {
    const remainingAmount = data.final_amount - data.partial_payment_amount;
    
    const submitData = {
      ...data,
      remaining_amount: remainingAmount,
    };

    createMutation.mutate(submitData as any, {
      onSuccess: () => {
        navigate('/sales-invoices');
      }
    });
  };

  const totalAmount = watch('total_amount');
  const finalAmount = watch('final_amount');
  const remainingAmount = finalAmount - partialPaymentAmount;

  // ============ TECHNICAL ADVISORY FUNCTIONS ============

  // Get products in invoice for advisory
  const invoiceProducts = items
    .map(item => {
      const product = (productsData?.data?.items || []).find((p: Product) => p.id === item.product_id);
      return product;
    })
    .filter((p): p is Product => p !== undefined);

  // Get selected products for advisory
  const selectedProductsForAdvisory = invoiceProducts.filter(p => 
    selectedProductIdsForAdvisory.includes(p.id)
  );

  const createMixPrompt = (products: Product[]): string => {
    const productInfo = products.map((product: Product) => 
      `- ${product.name}: ${product.ingredient?.join(', ') || 'Không có thông tin thành phần'}`
    ).join('\n');
    
    return `Phân tích khả năng phối trộn các loại thuốc sau. Trả lời NGẮN GỌN:
- Kết luận: CÓ/KHÔNG
- Lý do: (1 câu ngắn)

Danh sách thuốc:
${productInfo}`;
  };

  const createSortPrompt = (products: Product[]): string => {
    const productInfo = products.map((product: Product) => 
      `- ${product.name}: ${product.ingredient?.join(', ') || 'Không có thông tin thành phần'}`
    ).join('\n');
    
    return `Sắp xếp thứ tự sử dụng các loại thuốc sau để đạt hiệu quả tốt nhất. Trả lời NGẮN GỌN:
- Liệt kê tên thuốc theo thứ tự (dùng số thứ tự: 1, 2, 3...)
- Lý do ngắn gọn (1 câu cho mỗi thuốc)

Danh sách thuốc:
${productInfo}`;
  };

  const createSprayingPrompt = (forecastData: SimplifiedWeatherData[]): string => {
    const forecastInfo = forecastData.map(item => 
      `- Thời gian: ${item.time}, Nhiệt độ: ${item.temperature}°C, Trời: ${item.description}, Khả năng mưa: ${item.precipitation_probability}%, Lượng mưa: ${item.rain_amount}mm, Gió: ${item.wind_speed}m/s, Độ ẩm: ${item.humidity}%`
    ).join('\n');
    
    return `Dựa trên dữ liệu dự báo thời tiết đã lọc (chỉ bao gồm các giờ từ 07:00 đến 22:00), hãy phân tích và tìm ra các thời điểm phun thuốc tốt nhất.
    
    DỮ LIỆU DỰ BÁO THỜI TIẾT:
    ${forecastInfo}
    
    YÊU CẦU QUAN TRỌNG VỀ CHỌN KHUNG GIỜ:
    1. Với MỖI NGÀY có trong dữ liệu, hãy chọn ra 3 mốc thời gian đại diện cho 3 buổi:
       - Buổi Sáng (07:00 - 11:59): Chọn 1 mốc tốt nhất, ưu tiên từ 08:00 đến 10:00.
       - Buổi Trưa/Chiều (12:00 - 16:59): Chọn 1 mốc tốt nhất, ưu tiên từ 15:00 đến 16:59.
       - Buổi Tối (17:00 - 22:00): Chọn 1 mốc tốt nhất, ưu tiên từ 17:00 đến 19:00.
    
    2. QUAN TRỌNG - Thứ tự ưu tiên khi chọn (từ cao đến thấp):
       a) Khả năng mưa THẤP NHẤT (<20% là tốt, <10% là rất tốt, 0% là hoàn hảo)
       b) Nhiệt độ phù hợp (20-32°C)
       c) Gió nhẹ (<10m/s)
    
    YÊU CẦU VỀ ĐỊNH DẠNG OUTPUT:
    - Trả về kết quả dưới dạng JSON array (tuyệt đối không thêm markdown, không thêm text dẫn dắt).
    - Sắp xếp kết quả theo thời gian tăng dần.
    - Cấu trúc JSON:
    [
      {
        "time": "HH:mm dd/MM/yyyy",
        "temperature": "25°C",
        "rain_prob": "10%",
        "wind_speed": "3.5m/s",
        "condition": "Mô tả ngắn gọn (VD: Trời mát, ít mây)",
        "reason": "Lý do ngắn gọn trong 1 câu (VD: Điều kiện lý tưởng cho phun thuốc)"
      }
    ]`;
  };

  const fetchWeatherForecast = async (forceRefresh = false) => {
    const CACHE_KEY = `weather_forecast_cache_v8_${selectedLocation.id}`;
    
    if (!forceRefresh) {
      const cachedData = localStorage.getItem(CACHE_KEY);
      if (cachedData) {
        try {
          const { timestamp, forecast, recommendations } = JSON.parse(cachedData);
          if (Date.now() - timestamp < 30 * 60 * 1000) {
            setWeatherForecast(forecast);
            if (recommendations && recommendations.length > 0) {
              setSprayingRecommendations(recommendations);
            }
            return;
          }
        } catch (e) {
          console.error('Lỗi đọc cache:', e);
          localStorage.removeItem(CACHE_KEY);
        }
      }
    } else {
      setSprayingRecommendations([]);
    }

    setIsWeatherLoading(true);
    
    try {
      const forecastData = await weatherService.getForecast(selectedLocation.latitude, selectedLocation.longitude);
      const filteredData = weatherService.filterNextTwoDays(forecastData);
      
      const daytimeData = filteredData.filter(item => {
        const date = new Date(item.dt * 1000);
        const hour = date.getHours();
        return hour >= 7 && hour <= 22;
      });
      
      setWeatherForecast(daytimeData);
      
      const simplifiedData = weatherService.simplifyWeatherData(daytimeData);
      
      let recommendations: Recommendation[] = [];
      if (simplifiedData.length > 0) {
        const prompt = createSprayingPrompt(simplifiedData);
        const aiResponse = await frontendAiService.analyzeSprayingTime(prompt);
        
        if (aiResponse.success && aiResponse.answer) {
          try {
            const cleanJson = aiResponse.answer.replace(/```json/g, '').replace(/```/g, '').trim();
            recommendations = JSON.parse(cleanJson);
            if (Array.isArray(recommendations)) {
              setSprayingRecommendations(recommendations);
            } else {
              setSprayingRecommendations([]);
            }
          } catch (parseError) {
            console.error('Error parsing AI response:', parseError);
            setSprayingRecommendations([]);
          }
        }
      }

      try {
        const cacheData = {
          timestamp: Date.now(),
          forecast: daytimeData,
          recommendations: recommendations
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      } catch (e) {
        console.error('Lỗi lưu cache:', e);
      }

    } catch (err) {
      const errorMessage = (err as Error).message || 'Có lỗi khi lấy dữ liệu thời tiết';
      console.error(errorMessage);
      message.error('Không thể lấy dữ liệu thời tiết mới nhất');
    } finally {
      setIsWeatherLoading(false);
    }
  };

  /**
   * Tính khoảng cách giữa 2 điểm tọa độ (Haversine formula)
   */
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Bán kính trái đất (km)
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
    return R * c;
  };

  /**
   * Lấy tên địa điểm chi tiết từ tọa độ (Reverse Geocoding)
   */
  const getPlaceName = async (lat: number, lon: number): Promise<string> => {
    try {
      // Sử dụng Nominatim API của OpenStreetMap (Miễn phí)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1&accept-language=vi`
      );
      const data = await response.json();
      
      if (data.address) {
        const addr = data.address;
        // Ưu tiên lấy các thành phần địa chỉ chi tiết
        const parts = [];
        
        if (addr.road) parts.push(addr.road);
        if (addr.suburb) parts.push(addr.suburb); // Phường
        else if (addr.village) parts.push(addr.village); // Xã
        else if (addr.town) parts.push(addr.town); // Thị trấn
        
        if (addr.city_district) parts.push(addr.city_district); // Quận
        else if (addr.county) parts.push(addr.county); // Huyện
        
        if (addr.city) parts.push(addr.city); // Thành phố
        else if (addr.state) parts.push(addr.state); // Tỉnh
        
        return parts.join(', ');
      }
      return 'Vị trí không xác định';
    } catch (error) {
      console.error('Lỗi lấy tên địa điểm:', error);
      return 'Vị trí hiện tại';
    }
  };

  const detectUserLocation = () => {
    if (!navigator.geolocation) {
      message.error('Trình duyệt của bạn không hỗ trợ định vị.');
      return;
    }

    const hide = message.loading('Đang xác định vị trí chi tiết...', 0);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Lấy tên địa điểm chi tiết
          const detailedName = await getPlaceName(latitude, longitude);
          
          // Tạo location mới với thông tin chi tiết
          const newLocation: Location = {
            id: 'current-user-location',
            name: detailedName,
            latitude: latitude,
            longitude: longitude,
            region: '📍 Vị trí của bạn'
          };

          setSelectedLocation(newLocation);
          hide();
          message.success(`Đã cập nhật: ${detailedName}`);
        } catch (error) {
          hide();
          message.error('Không thể lấy tên địa điểm chi tiết.');
          
          // Fallback: Tìm địa điểm gần nhất trong danh sách có sẵn
          let nearestLocation = VIETNAM_LOCATIONS[0];
          let minDistance = Infinity;
          
          VIETNAM_LOCATIONS.forEach(loc => {
            const distance = calculateDistance(latitude, longitude, loc.latitude, loc.longitude);
            if (distance < minDistance) {
              minDistance = distance;
              nearestLocation = loc;
            }
          });
          
          setSelectedLocation(nearestLocation);
        }
      },
      (error) => {
        hide();
        console.error('Lỗi định vị:', error);
        message.error('Không thể lấy vị trí. Vui lòng kiểm tra quyền truy cập.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    if (currentTab === 1) {
      // Nếu chưa có vị trí (hoặc đang là mặc định), thử tự động định vị
      if (selectedLocation.id === 'hanoi') {
        detectUserLocation();
      }
      fetchWeatherForecast();
    }
  }, [currentTab, selectedLocation]);

  const handleAnalyze = async () => {
    if (selectedProductIdsForAdvisory.length === 0) {
      setError('Vui lòng chọn ít nhất một sản phẩm để phân tích');
      return;
    }

    if (selectedProductsForAdvisory.length === 0) {
      setError('Không tìm thấy thông tin sản phẩm đã chọn');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setMixResult('');
    setSortResult('');

    try {
      const mixPrompt = createMixPrompt(selectedProductsForAdvisory);
      const sortPrompt = createSortPrompt(selectedProductsForAdvisory);

      const [mixResponse, sortResponse] = await Promise.all([
        mixPesticides(mixPrompt),
        sortPesticides(sortPrompt)
      ]);

      if (mixResponse.success && mixResponse.answer) {
        setMixResult(mixResponse.answer);
      } else {
        setError(prev => prev ? `${prev}; Lỗi phân tích phối trộn: ${mixResponse.error}` : `Lỗi phân tích phối trộn: ${mixResponse.error}`);
      }

      if (sortResponse.success && sortResponse.answer) {
        setSortResult(sortResponse.answer);
      } else {
        setError(prev => prev ? `${prev}; Lỗi phân tích sắp xếp: ${sortResponse.error}` : `Lỗi phân tích sắp xếp: ${sortResponse.error}`);
      }
    } catch (err) {
      const errorMessage = (err as Error).message || 'Có lỗi không xác định xảy ra.';
      setError(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatTime = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString('vi-VN');
  };

  const handlePrint = () => {
    setIsPrintModalVisible(true);
  };

  const handlePrintConfirm = () => {
    window.print();
  };

  const handlePrintSectionChange = (section: 'mix' | 'sort' | 'spray') => {
    setPrintSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleProductToggleForAdvisory = (productId: number) => {
    setSelectedProductIdsForAdvisory(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate('/sales-invoices')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" fontWeight="bold">
          Tạo hóa đơn bán hàng mới
        </Typography>
      </Box>

      <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="Thông tin hóa đơn" />
        <Tab label="Tư vấn kỹ thuật" />
      </Tabs>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* TAB 1: Invoice Information */}
        <TabPanel value={currentTab} index={0}>
          <Grid container spacing={3}>
            {/* Customer Information */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" mb={2}>
                    Thông tin khách hàng
                  </Typography>

                  <Autocomplete
                    options={customers || []}
                    getOptionLabel={(option) => `${option.name} - ${option.phone}`}
                    value={selectedCustomer}
                    onChange={(_, newValue) => handleCustomerSelect(newValue)}
                    onInputChange={(_, newInputValue) => setCustomerSearch(newInputValue)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Tìm khách hàng (tên hoặc SĐT)"
                        placeholder="Nhập tên hoặc số điện thoại..."
                        helperText="Để trống nếu là khách vãng lai"
                      />
                    )}
                    sx={{ mb: 2 }}
                  />

                  <Controller
                    name="customer_name"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Tên khách hàng *"
                        error={!!errors.customer_name}
                        helperText={errors.customer_name?.message}
                        disabled={!isGuestCustomer}
                        sx={{ mb: 2 }}
                      />
                    )}
                  />

                  <Controller
                    name="customer_phone"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Số điện thoại *"
                        error={!!errors.customer_phone}
                        helperText={errors.customer_phone?.message}
                        disabled={!isGuestCustomer}
                        sx={{ mb: 2 }}
                      />
                    )}
                  />

                  <Controller
                    name="customer_address"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Địa chỉ"
                        multiline
                        rows={2}
                        disabled={!isGuestCustomer}
                      />
                    )}
                  />
                </CardContent>
              </Card>
            </Grid>

            {/* Invoice Information */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" mb={2}>
                    Thông tin hóa đơn
                  </Typography>

                  <Controller
                    name="season_id"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Mùa vụ</InputLabel>
                        <Select {...field} label="Mùa vụ">
                          {seasons?.data?.items?.map((season: Season) => (
                            <MenuItem key={season.id} value={season.id}>
                              {season.name} ({season.year})
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />

                  <Controller
                    name="payment_method"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Phương thức thanh toán *</InputLabel>
                        <Select {...field} label="Phương thức thanh toán *">
                          {Object.entries(paymentMethodLabels).map(([value, label]) => (
                            <MenuItem key={value} value={value}>
                              {label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />

                  <Box sx={{ mb: 2 }}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Typography variant="body2" color="text.secondary">
                        Lưu ý quan trọng
                      </Typography>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleGenerateWarning(false)}
                        disabled={isGeneratingWarning || items.length === 0}
                        startIcon={
                          isGeneratingWarning ? (
                            <Spin size="small" />
                          ) : (
                            <SyncOutlined />
                          )
                        }
                        sx={{ ml: 'auto' }}
                      >
                        {isGeneratingWarning ? 'Đang tạo...' : 'Tạo bằng AI'}
                      </Button>
                    </Box>
                    <Controller
                      name="warning"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          multiline
                          rows={2}
                          placeholder="AI sẽ tự động tạo lưu ý dựa trên mô tả sản phẩm, hoặc bạn có thể nhập thủ công"
                          helperText="Lưu ý này sẽ được lưu lại và tự động hiển thị khi tạo đơn hàng tiếp theo cho khách hàng này"
                        />
                      )}
                    />
                  </Box>

                  {latestInvoice?.warning && (
                    <Alert 
                      severity="info" 
                      sx={{ mb: 2 }}
                      action={
                        <Button color="inherit" size="small" onClick={() => setValue('warning', latestInvoice.warning)}>
                          Sử dụng
                        </Button>
                      }
                    >
                      <Typography variant="caption" display="block" fontWeight="bold">
                        Lưu ý từ đơn hàng trước ({new Date(latestInvoice.created_at).toLocaleDateString('vi-VN')}):
                      </Typography>
                      <Typography variant="body2">
                        {latestInvoice.warning}
                      </Typography>
                    </Alert>
                  )}

                  <Controller
                    name="notes"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Ghi chú"
                        multiline
                        rows={3}
                      />
                    )}
                  />
                </CardContent>
              </Card>
            </Grid>

            {/* Products */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" mb={2}>
                    Danh sách sản phẩm
                  </Typography>

                  <Autocomplete
                    options={productsData?.data?.items || []}
                    getOptionLabel={(option: Product) => `${option.name} - ${formatCurrency(Number(option.price) || 0)}`}
                    onChange={(_, newValue) => {
                      if (newValue) {
                        handleAddProduct(newValue);
                      }
                    }}
                    inputValue={productSearch}
                    onInputChange={(_, newInputValue) => setProductSearch(newInputValue)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Thêm sản phẩm"
                        placeholder="Tìm kiếm sản phẩm..."
                      />
                    )}
                    sx={{ mb: 2 }}
                  />

                  {errors.items && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {errors.items.message}
                    </Alert>
                  )}

                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Sản phẩm</TableCell>
                          <TableCell align="right">Số lượng</TableCell>
                          <TableCell align="right">Đơn giá</TableCell>
                          <TableCell align="right">Giảm giá</TableCell>
                          <TableCell align="right">Thành tiền</TableCell>
                          <TableCell align="center">Xóa</TableCell>
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
                                      sx={{ width: 80 }}
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
                                      sx={{ width: 120 }}
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
                                      sx={{ width: 100 }}
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
                </CardContent>
              </Card>
            </Grid>

            {/* Payment Summary */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" mb={2}>
                    Thanh toán
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography>Tổng tiền hàng:</Typography>
                        <Typography fontWeight="bold">{formatCurrency(totalAmount)}</Typography>
                      </Box>

                      <Controller
                        name="discount_amount"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Giảm giá tổng đơn"
                            type="number"
                            inputProps={{ min: 0 }}
                            sx={{ mb: 2 }}
                          />
                        )}
                      />

                      <Divider sx={{ my: 2 }} />

                      <Box display="flex" justifyContent="space-between" mb={2}>
                        <Typography variant="h6">Tổng thanh toán:</Typography>
                        <Typography variant="h6" color="success.main" fontWeight="bold">
                          {formatCurrency(finalAmount)}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      {/* Spacer to align with "Tổng tiền hàng" on the left */}
                      <Box display="flex" justifyContent="space-between" mb={1} sx={{ visibility: 'hidden' }}>
                        <Typography>Spacer</Typography>
                      </Box>

                      <Controller
                        name="partial_payment_amount"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Số tiền khách trả trước"
                            type="number"
                            inputProps={{ min: 0, max: finalAmount }}
                            helperText="Nhập số tiền khách trả trước (nếu trả một phần)"
                            sx={{ mb: 2 }}
                          />
                        )}
                      />

                      {remainingAmount > 0 && (
                        <Alert severity="warning">
                          <Typography variant="body2">
                            Số tiền còn nợ: <strong>{formatCurrency(remainingAmount)}</strong>
                          </Typography>
                          <Typography variant="caption">
                            Hệ thống sẽ tự động tạo công nợ cho số tiền này
                          </Typography>
                        </Alert>
                      )}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Actions */}
            <Grid item xs={12}>
              <Box display="flex" gap={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  onClick={() => navigate('/sales-invoices')}
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
                  {createMutation.isPending ? 'Đang tạo...' : 'Tạo hóa đơn'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </TabPanel>

        {/* TAB 2: Technical Advisory */}
        <TabPanel value={currentTab} index={1}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" mb={2}>
                Tư vấn kỹ thuật & Thời tiết
              </Typography>

              {/* Location Display */}
              <Box sx={{ mb: 3, p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  Vị trí dự báo thời tiết:
                </Typography>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <IconButton size="small" onClick={detectUserLocation} title="Lấy vị trí hiện tại">
                    <AimOutlined />
                  </IconButton>
                  <EnvironmentOutlined />
                  <Typography fontWeight="bold">{selectedLocation.name}</Typography>
                  <Tag color="blue">{selectedLocation.region}</Tag>
                </Box>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<EnvironmentOutlined />}
                  onClick={() => setIsMapModalVisible(true)}
                >
                  Chọn vị trí khác
                </Button>
              </Box>

              {/* Product Selection */}
              {items.length > 0 ? (
                <>
                  <Typography variant="subtitle2" mb={1}>
                    Sản phẩm trong hóa đơn (chọn để phân tích phối trộn):
                  </Typography>
                  <List>
                    {invoiceProducts.map((product) => (
                      <ListItem key={product.id} dense>
                        <Checkbox
                          checked={selectedProductIdsForAdvisory.includes(product.id)}
                          onChange={() => handleProductToggleForAdvisory(product.id)}
                        />
                        <Box ml={2}>
                          <Typography fontWeight="bold">{product.name}</Typography>
                          <Box>
                            {product.ingredient?.map((ing: string, index: number) => (
                              <Tag key={index} color="blue">{ing}</Tag>
                            ))}
                          </Box>
                        </Box>
                      </ListItem>
                    ))}
                  </List>

                  <Box mt={2}>
                    <Space>
                      <Button
                        variant="contained"
                        onClick={handleAnalyze}
                        disabled={isAnalyzing || selectedProductIdsForAdvisory.length === 0}
                      >
                        {isAnalyzing ? <Spin size="small" /> : 'Phân tích Phối trộn & Sắp xếp'}
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<PrinterOutlined />}
                        onClick={handlePrint}
                        disabled={!mixResult && !sortResult && sprayingRecommendations.length === 0}
                      >
                        In kết quả
                      </Button>
                    </Space>
                  </Box>
                </>
              ) : (
                <Alert severity="info">
                  Vui lòng thêm sản phẩm vào hóa đơn để sử dụng tính năng Phân tích Phối trộn & Sắp xếp thuốc.
                  <br />
                  Các tính năng Thời tiết bên dưới vẫn hoạt động bình thường.
                </Alert>
              )}
            </CardContent>
          </Card>

          {isAnalyzing && (
            <Box textAlign="center" mb={3}>
              <Spin size="large" />
              <Typography mt={2}>Đang phân tích yêu cầu...</Typography>
            </Box>
          )}

          {isWeatherLoading && (
            <Box textAlign="center" mb={3}>
              <Spin size="large" />
              <Typography mt={2}>Đang lấy dữ liệu thời tiết và phân tích...</Typography>
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2}>
            {/* Mix Result */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" mb={2}>
                    Kết quả Phân tích Phối trộn
                  </Typography>
                  {mixResult ? (
                    <div
                      dangerouslySetInnerHTML={{
                        __html: mixResult
                          .replace(/\n\n/g, '</p><p>')
                          .replace(/\n/g, '<br>')
                          .replace(/^(<br>)+|(<br>)+$/g, '')
                          .replace(/^|$/, '<p>')
                          .replace(/<p><\/p>/g, '')
                      }}
                    />
                  ) : (
                    <Typography color="text.secondary">Chưa có kết quả phân tích phối trộn</Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Sort Result */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" mb={2}>
                    Sắp xếp thứ tự pha thuốc
                  </Typography>
                  {sortResult ? (
                    <div>
                      {sortResult.split('\n').filter(line => line.trim()).map((line, index) => (
                        <Typography key={index} mb={1}>
                          {line.trim()}
                        </Typography>
                      ))}
                    </div>
                  ) : (
                    <Typography color="text.secondary">Chưa có kết quả sắp xếp</Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Weather & Spraying Time */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">
                      Thời điểm phun thuốc tốt nhất
                    </Typography>
                  </Box>
                  {sprayingRecommendations.length > 0 ? (
                    <List>
                      {sprayingRecommendations.map((item, index) => (
                        <ListItem key={index} sx={{ borderBottom: '1px solid #eee' }}>
                          <Box width="100%">
                            <Box display="flex" justifyContent="space-between" mb={0.5}>
                              <Typography fontWeight="bold" color="primary">
                                🕒 {item.time}
                              </Typography>
                              <Typography fontWeight="bold" color="success.main">
                                ☔ Khả năng mưa: {item.rain_prob}
                              </Typography>
                            </Box>
                            <Box display="flex" gap={2} flexWrap="wrap" fontSize="0.875rem">
                              <span>🌡️ Nhiệt độ: {item.temperature}</span>
                              <span>💨 Tốc độ gió: {item.wind_speed}</span>
                              <span>🌤️ {item.condition}</span>
                            </Box>
                          </Box>
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Box textAlign="center" py={4} color="text.secondary">
                      {isWeatherLoading ? <Spin /> : 'Chưa có dữ liệu phân tích'}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Weather Forecast */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">
                      Dự báo thời tiết 2 ngày tới
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => fetchWeatherForecast(true)}
                      title="Lấy dữ liệu mới nhất"
                    >
                      <SyncOutlined spin={isWeatherLoading} />
                    </IconButton>
                  </Box>
                  {weatherForecast.length > 0 ? (
                    <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                      {weatherForecast.map((item, index) => (
                        <ListItem key={index} sx={{ borderBottom: '1px solid #eee' }}>
                          <Box width="100%">
                            <Box display="flex" justifyContent="space-between" mb={0.5}>
                              <Typography fontWeight="bold" color="primary">
                                🕒 {formatTime(item.dt)}
                              </Typography>
                              <Typography fontWeight="bold" color="success.main">
                                ☔ Khả năng mưa: {Math.round(item.pop * 100)}%
                              </Typography>
                            </Box>
                            <Box display="flex" gap={2} flexWrap="wrap" fontSize="0.875rem">
                              <span>🌡️ Nhiệt độ: {item.main.temp}°C</span>
                              <span>💨 Tốc độ gió: {item.wind.speed}m/s</span>
                              <span>🌤️ {item.weather[0]?.description}</span>
                            </Box>
                            {item.rain && (item.rain['1h'] || 0) > 0 && (
                              <Typography fontSize="0.75rem" color="warning.main" mt={0.5}>
                                🌧️ Lượng mưa: {item.rain['1h']}mm
                              </Typography>
                            )}
                          </Box>
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography color="text.secondary">
                      Đang tải dữ liệu thời tiết...
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </form>

      {/* Location Map Modal */}
      <AntModal
        title="Chọn vị trí trên bản đồ"
        open={isMapModalVisible}
        onCancel={() => setIsMapModalVisible(false)}
        width={800}
        footer={null}
      >
        <LocationMap
          selectedLocation={selectedLocation}
          onLocationSelect={(location) => {
            setSelectedLocation(location);
            setIsMapModalVisible(false);
          }}
        />
      </AntModal>

      {/* Print Preview Modal */}
      <AntModal
        title="Xem trước và In"
        open={isPrintModalVisible}
        onCancel={() => setIsPrintModalVisible(false)}
        width={900}
        footer={[
          <Button key="cancel" onClick={() => setIsPrintModalVisible(false)}>
            Đóng
          </Button>,
          <Button
            key="print"
            variant="contained"
            startIcon={<PrinterOutlined />}
            onClick={handlePrintConfirm}
            disabled={!printSections.mix && !printSections.sort && !printSections.spray}
          >
            In
          </Button>
        ]}
      >
        <Box mb={2}>
          <Typography fontWeight="bold" mb={1}>Chọn nội dung cần in:</Typography>
          <Box display="flex" flexDirection="column" gap={1}>
            <Box>
              <Checkbox
                checked={printSections.mix}
                onChange={() => handlePrintSectionChange('mix')}
                disabled={!mixResult}
              />
              Kết quả Phân tích Phối trộn
            </Box>
            <Box>
              <Checkbox
                checked={printSections.sort}
                onChange={() => handlePrintSectionChange('sort')}
                disabled={!sortResult}
              />
              Kết quả Sắp xếp
            </Box>
            <Box>
              <Checkbox
                checked={printSections.spray}
                onChange={() => handlePrintSectionChange('spray')}
                disabled={sprayingRecommendations.length === 0}
              />
              Thời điểm phun thuốc tốt nhất
            </Box>
          </Box>
        </Box>

        {/* Print Content */}
        <Box ref={printContentRef} className="print-content">
          {printSections.mix && mixResult && (
            <Box mb={3}>
              <Typography variant="h6" mb={1}>Kết quả Phân tích Phối trộn</Typography>
              <div dangerouslySetInnerHTML={{ __html: mixResult }} />
            </Box>
          )}
          {printSections.sort && sortResult && (
            <Box mb={3}>
              <Typography variant="h6" mb={1}>Sắp xếp thứ tự pha thuốc</Typography>
              <div>{sortResult}</div>
            </Box>
          )}
          {printSections.spray && sprayingRecommendations.length > 0 && (
            <Box>
              <Typography variant="h6" mb={1}>Thời điểm phun thuốc tốt nhất</Typography>
              {sprayingRecommendations.map((item, index) => (
                <Box key={index} mb={1}>
                  <Typography>
                    {item.time} - Nhiệt độ: {item.temperature}, Mưa: {item.rain_prob}, Gió: {item.wind_speed}
                  </Typography>
                  <Typography fontSize="0.875rem" color="text.secondary">
                    {item.condition} - {item.reason}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </AntModal>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-content, .print-content * {
            visibility: visible;
          }
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </Box>
  );
};

export default CreateSalesInvoice;
