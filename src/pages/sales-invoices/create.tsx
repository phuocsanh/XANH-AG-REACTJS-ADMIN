import { useState, useEffect, useRef, useMemo } from 'react';
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
  FormControlLabel,
  CircularProgress,
} from '@mui/material';
import { FormFieldNumber, FormField } from '@/components/form';
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
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateSalesInvoiceMutation, useUpdateSalesInvoiceMutation, useSalesInvoiceQuery, useLatestInvoiceByCustomerQuery } from '@/queries/sales-invoice';
import { useCustomerSearchQuery } from '@/queries/customer';
import { useSeasonsQuery, useActiveSeasonQuery } from '@/queries/season';
import { useProductsQuery } from '@/queries/product';
import { Customer } from '@/models/customer';
import { Season } from '@/models/season';
import { Product } from '@/models/product.model';
import { SalesInvoice } from '@/models/sales-invoice';
import { useAiService } from '@/hooks/use-ai-service';
import { weatherService, WeatherData, SimplifiedWeatherData } from '@/services/weather.service';
import { frontendAiService } from '@/services/ai.service';
import { VIETNAM_LOCATIONS, DEFAULT_LOCATION, Location } from '@/constants/locations';
import LocationMap from '@/components/LocationMap';
import { Tag, Space, Spin, Modal as AntModal, message, Card as AntCard, Tabs as AntTabs, Popover } from 'antd';
import {
  salesInvoiceSchema,
  SalesInvoiceFormData,
  defaultSalesInvoiceValues,
  paymentMethodLabels,
  priceTypeLabels,
} from './form-config';
import { ProductsTable } from './components/ProductsTable';

// Disease Warning Imports
import {
  useLocationQuery,
  useUpdateLocationMutation,
  useWarningQuery as useRiceBlastWarningQuery,
  useRunAnalysisMutation as useRunRiceBlastAnalysisMutation,
} from '@/queries/rice-blast';
import {
  useBacterialBlightWarningQuery,
  useRunBacterialBlightAnalysisMutation,
} from '@/queries/bacterial-blight';
import {
  useStemBorerWarningQuery,
  useRunStemBorerAnalysisMutation,
} from '@/queries/stem-borer';
import {
  useGallMidgeWarningQuery,
  useRunGallMidgeAnalysisMutation,
} from '@/queries/gall-midge';
import {
  useBrownPlantHopperWarningQuery,
  useRunBrownPlantHopperAnalysisMutation,
} from '@/queries/brown-plant-hopper';
import {
  useSheathBlightWarningQuery,
  useRunSheathBlightAnalysisMutation,
} from '@/queries/sheath-blight';
import {
  useGrainDiscolorationWarningQuery,
  useRunGrainDiscolorationAnalysisMutation,
} from '@/queries/grain-discoloration';
import {
  WarningCard,
  DailyDataTable,
  LocationForm,
  DiseaseWarningCard,
} from '@/components/disease-warning';
import { UpdateLocationDto } from '@/models/rice-blast';
import { useRiceCrops } from '@/queries/rice-crop';
import { CropStatus, RiceCrop } from '@/types/rice-farming.types';

const { TabPane } = AntTabs;

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
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  
  // Fetch invoice data if in edit mode
  const { data: invoiceData, isLoading: isLoadingInvoice } = useSalesInvoiceQuery(
    id ? parseInt(id) : 0
  );
  
  const [customerSearch, setCustomerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isGuestCustomer, setIsGuestCustomer] = useState(true);
  const [selectedRiceCropId, setSelectedRiceCropId] = useState<number | undefined>(undefined);
  const [currentTab, setCurrentTab] = useState(0);
  const [diseaseWarningTab, setDiseaseWarningTab] = useState('rice-blast');

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
    invoice: true,
    advisory: true,
    diseaseWarning: true
  });
  const [selectedAdvisorySections, setSelectedAdvisorySections] = useState({
    mix: true,
    sort: true,
    spray: true
  });
  const [selectedPrintDiseases, setSelectedPrintDiseases] = useState<string[]>([]);
  const printContentRef = useRef<HTMLDivElement>(null);
  
  // AI Warning Generation States
  const [isGeneratingWarning, setIsGeneratingWarning] = useState(false);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [isCheckingConflict, setIsCheckingConflict] = useState(false);

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
  const { data: latestInvoiceResponse } = useLatestInvoiceByCustomerQuery(selectedCustomer?.id);
  
  // Filter out current invoice if we are editing the latest one
  const latestInvoice = useMemo(() => {
    // API interceptor đã unwrap response, latestInvoiceResponse đã là SalesInvoice hoặc null
    const invoice = latestInvoiceResponse as SalesInvoice | null | undefined;
    if (invoice && id && invoice.id === parseInt(id)) {
      return null;
    }
    return invoice || null;
  }, [latestInvoiceResponse, id]);
  
  // Watch season_id để filter vụ lúa
  const selectedSeasonId = watch('season_id');

  // Lấy tất cả vụ lúa đang hoạt động (để chọn trước)
  const { data: allActiveRiceCrops } = useRiceCrops({ 
    status: CropStatus.ACTIVE 
  });
  
  // Lấy vụ lúa của khách hàng đã chọn VÀ theo mùa vụ đã chọn
  const { data: customerRiceCrops, isLoading: isLoadingRiceCrops } = useRiceCrops({ 
    customer_id: selectedCustomer?.id, 
    season_id: selectedSeasonId,
    status: CropStatus.ACTIVE 
  });
  
  
  const createMutation = useCreateSalesInvoiceMutation();
  const updateMutation = useUpdateSalesInvoiceMutation();

  // State để hiển thị lợi nhuận khi nhấn giữ
  const [showProfit, setShowProfit] = useState(false);
  const pressTimerRef = useRef<any>(null);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Tính lợi nhuận real-time
  const calculatedProfit = useMemo(() => {
    const items = watch('items') || [];
    let totalRevenue = 0;
    let totalCost = 0;

    const productsList = productsData?.data?.items || [];

    items.forEach((item: any) => {
      if (item.product_id && item.quantity) {
        const product = productsList.find((p: any) => p.id === item.product_id);
        const avgCost = Number(product?.average_cost_price || 0);
        const unitPrice = Number(item.unit_price || 0);
        const quantity = Number(item.quantity || 0);
        const itemRevenue = quantity * unitPrice;
        const itemCost = quantity * avgCost;
        
        totalRevenue += itemRevenue;
        totalCost += itemCost;
      }
    });

    const profit = totalRevenue - totalCost;
    const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

    return {
      revenue: totalRevenue,
      cost: totalCost,
      profit,
      margin,
    };
  }, [watch('items'), productsData]);

  // Reset rice_crop_id khi thay đổi season_id
  useEffect(() => {
    if (selectedCustomer) {
      setValue('rice_crop_id', undefined);
      setSelectedRiceCropId(undefined);
    }
  }, [selectedSeasonId, selectedCustomer, setValue]);

  // Populate form when editing
  useEffect(() => {
    // API interceptor đã unwrap response, invoiceData đã là SalesInvoice trực tiếp
    if (isEditMode && invoiceData) {
      const invoice = invoiceData;
      
      // Set form values
      setValue('customer_id', invoice.customer_id);
      setValue('customer_name', invoice.customer_name);
      setValue('customer_phone', invoice.customer_phone || '');
      setValue('customer_address', invoice.customer_address || '');
      setValue('season_id', invoice.season_id);
      setValue('rice_crop_id', invoice.rice_crop_id);
      setValue('payment_method', invoice.payment_method as any);
      setValue('total_amount', invoice.total_amount);
      setValue('discount_amount', invoice.discount_amount);
      setValue('final_amount', invoice.final_amount);
      setValue('partial_payment_amount', invoice.partial_payment_amount);
      setValue('notes', invoice.notes || '');
      setValue('warning', invoice.warning || '');
      
      // Set items if available
      if (invoice.items && invoice.items.length > 0) {
        // Suy luận price_type từ payment_method của invoice
        const inferredPriceType = invoice.payment_method === 'debt' ? 'credit' : 'cash';
        
        setValue('items', invoice.items.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_amount: item.discount_amount || 0,
          notes: item.notes || '',
          price_type: inferredPriceType as 'cash' | 'credit', // Suy luận từ payment_method
        })));
      }
      
      // Set selected customer if customer_id exists
      if (invoice.customer_id) {
        setIsGuestCustomer(false);
        // Khôi phục trạng thái selectedCustomer để các query phụ thuộc (như  Danh sách ruộng lúa) hoạt động
        setSelectedCustomer({
          id: invoice.customer_id,
          name: invoice.customer_name,
          phone: invoice.customer_phone || '',
          address: invoice.customer_address || '',
        } as Customer);
      }

      // Khôi phục trạng thái selectedRiceCropId
      if (invoice.rice_crop_id) {
        setSelectedRiceCropId(invoice.rice_crop_id);
      }
    }
  }, [isEditMode, invoiceData, setValue]);

  // Disease Warning Queries
  const { data: diseaseLocation } = useLocationQuery();
  const { data: riceBlastWarning } = useRiceBlastWarningQuery();
  const { data: bacterialBlightWarning } = useBacterialBlightWarningQuery();
  const { data: stemBorerWarning } = useStemBorerWarningQuery();
  const { data: gallMidgeWarning } = useGallMidgeWarningQuery();
  const { data: brownPlantHopperWarning } = useBrownPlantHopperWarningQuery();
  const { data: sheathBlightWarning } = useSheathBlightWarningQuery();
  const { data: grainDiscolorationWarning } = useGrainDiscolorationWarningQuery();

  // Disease Warning Mutations
  const updateLocationMutation = useUpdateLocationMutation();
  const runRiceBlastMutation = useRunRiceBlastAnalysisMutation();
  const runBacterialBlightMutation = useRunBacterialBlightAnalysisMutation();
  const runStemBorerMutation = useRunStemBorerAnalysisMutation();
  const runGallMidgeMutation = useRunGallMidgeAnalysisMutation();
  const runBrownPlantHopperMutation = useRunBrownPlantHopperAnalysisMutation();
  const runSheathBlightMutation = useRunSheathBlightAnalysisMutation();
  const runGrainDiscolorationMutation = useRunGrainDiscolorationAnalysisMutation();
  // Set active season as default
  useEffect(() => {
    // Chỉ set default nếu chưa có giá trị (để tránh override lựa chọn của user)
    if (activeSeason && !selectedSeasonId) {
      setValue('season_id', activeSeason.id);
    }
  }, [activeSeason, setValue]); // Bỏ selectedSeasonId khỏi dependency để tránh loop

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
      // Khách hàng từ hệ thống
      setIsGuestCustomer(false);
      setValue('customer_id', customer.id);
      setValue('customer_name', customer.name);
      setValue('customer_phone', customer.phone);
      setValue('customer_address', customer.address || '');
      
      // ✨ BẮT BUỘC: Reset season và rice crop để người dùng chọn lại
      setValue('season_id', undefined);
      setValue('rice_crop_id', undefined);
      setSelectedRiceCropId(undefined);
      
      message.info('Vui lòng chọn Mùa vụ và Vụ lúa cho khách hàng này');
    } else {
      // Khách vãng lai
      setIsGuestCustomer(true);
      setValue('customer_id', undefined);
      setValue('customer_name', '');
      setValue('customer_phone', '');
      setValue('customer_address', '');
      // Khách vãng lai không cần season/rice crop
      setValue('season_id', activeSeason?.id); // Set lại active season
      setValue('rice_crop_id', undefined);
      setSelectedRiceCropId(undefined);
    }
  };

  const handleRiceCropSelect = (riceCropId: number | undefined) => {
    console.log('🌾 Selected Rice Crop ID:', riceCropId);
    setSelectedRiceCropId(riceCropId);
    setValue('rice_crop_id', riceCropId);
    // Không cần auto-fill ngược lại season/customer vì flow hiện tại là xuôi: Customer -> Season -> Rice Crop
  };

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
- Lưu ý khi sử dụng cùng với các sản phẩm khác
- Tập chú ý các dữ liệu trong tên sản phẩm , ký hiệu, liều lượng. 

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

  /**
   * Kiểm tra xung đột giữa lưu ý đơn hàng cũ và sản phẩm hiện tại
   */
  const checkProductConflict = async (previousWarning: string, currentProducts: Product[]) => {
    if (!previousWarning || currentProducts.length === 0) {
      setConflictWarning(null);
      return;
    }

    setIsCheckingConflict(true);
    
    try {
      const productInfo = currentProducts
        .map(product => `- ${product.name}: ${product.description || product.ingredient?.join(', ') || 'Không có thông tin'}`)
        .join('\n');

      const prompt = `Phân tích xem có xung đột giữa lưu ý đơn hàng trước và sản phẩm hiện tại không.

LƯU Ý ĐƠN HÀNG TRƯỚC:
${previousWarning}

SẢN PHẨM HIỆN TẠI:
${productInfo}

YÊU CẦU:
- Nếu có xung đột hoặc cảnh báo quan trọng: Trả về cảnh báo ngắn gọn (1-2 câu)
- Nếu KHÔNG có vấn đề gì: Trả về chính xác chuỗi "OK"

Ví dụ xung đột:
- Lưu ý cũ cảnh báo không dùng lưu huỳnh, nhưng sản phẩm mới có lưu huỳnh
- Lưu ý cũ yêu cầu khoảng cách thời gian, nhưng đơn mới vi phạm

Chỉ trả về nội dung cảnh báo hoặc "OK", không thêm giải thích.`;

      const response = await frontendAiService.generateWarning(prompt);
      
      if (response.success && response.answer) {
        const result = response.answer.trim();
        if (result !== 'OK' && result.toLowerCase() !== 'ok') {
          setConflictWarning(result);
          message.warning('⚠️ Phát hiện xung đột với đơn hàng trước!');
        } else {
          setConflictWarning(null);
        }
      }
    } catch (error) {
      console.error('Error checking conflict:', error);
    } finally {
      setIsCheckingConflict(false);
    }
  };

  // Auto-generate warning when items change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (items.length > 0) {
        handleGenerateWarning(true);
      }
    }, 2000); // Debounce 2s

    return () => clearTimeout(timer);
  }, [items]); // Re-run when items change

  // Auto-check conflict when previous warning or selected products change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (latestInvoice?.warning && selectedProductIdsForAdvisory.length > 0) {
        // Chỉ phân tích các sản phẩm được chọn
        const selectedProducts = items
          .filter(item => selectedProductIdsForAdvisory.includes(item.product_id))
          .map(item => {
            const product = (productsData?.data?.items || []).find((p: Product) => p.id === item.product_id);
            return product;
          })
          .filter((p): p is Product => p !== undefined);
        
        if (selectedProducts.length > 0) {
          checkProductConflict(latestInvoice.warning, selectedProducts);
        } else {
          setConflictWarning(null);
        }
      } else {
        setConflictWarning(null);
      }
    }, 1500); // Debounce 1.5s

    return () => clearTimeout(timer);
  }, [latestInvoice?.warning, selectedProductIdsForAdvisory, items]); // Re-run when warning, selected products, or items change

  const handleAddProduct = (product: Product) => {
    // Tự động chọn giá dựa trên phương thức thanh toán
    const currentPaymentMethod = watch('payment_method');
    const isDebt = currentPaymentMethod === 'debt';
    
    // Nếu là công nợ -> dùng giá nợ (nếu có), ngược lại dùng giá tiền mặt
    const priceType = isDebt ? 'credit' : 'cash';
    
    let unitPrice = Number(product.price) || 0;
    // Nếu chọn nợ và sản phẩm có giá nợ -> dùng giá nợ
    if (isDebt && product.credit_price && Number(product.credit_price) > 0) {
        unitPrice = Number(product.credit_price);
    }

    append({
      product_id: product.id,
      product_name: product.name,
      quantity: 1,
      unit_price: unitPrice,
      discount_amount: 0,
      notes: '',
      price_type: priceType,
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
    // ✨ Validation: Nếu có khách hàng từ hệ thống, bắt buộc phải có season_id và rice_crop_id
    if (data.customer_id) {
      if (!data.season_id) {
        message.error('Vui lòng chọn Mùa vụ cho khách hàng này');
        return;
      }
      if (!data.rice_crop_id) {
        message.error('Vui lòng chọn Vụ lúa cho khách hàng này');
        return;
      }
    }
    
    const remainingAmount = data.final_amount - data.partial_payment_amount;
    
    const submitData = {
      ...data,
      remaining_amount: remainingAmount,
      customer_id: data.customer_id || null,
    };

    if (isEditMode && id) {
      // Update existing invoice
      updateMutation.mutate({ id: parseInt(id), invoice: submitData as any }, {
        onSuccess: () => {
          message.success('Cập nhật hóa đơn thành công!');
          navigate('/sales-invoices');
        }
      });
    } else {
      // Create new invoice
      createMutation.mutate(submitData as any, {
        onSuccess: () => {
          message.success('Tạo hóa đơn thành công!');
          navigate('/sales-invoices');
        }
      });
    }
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

  const handleProductToggleForAdvisory = (productId: number) => {
    setSelectedProductIdsForAdvisory(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const createMixPrompt = (products: Product[]): string => {
    const productInfo = products.map((product: Product) => 
      `- ${product.name}: ${product.ingredient?.join(', ') || 'Không có thông tin thành phần'}`
    ).join('\n');
    
    return `Phân tích khả năng phối trộn các loại thuốc sau.
QUAN TRỌNG: TRẢ LỜI HOÀN TOÀN BẰNG TIẾNG VIỆT.

Yêu cầu trả lời NGẮN GỌN:
- Kết luận: CÓ/KHÔNG
- Lý do: (1 câu ngắn bằng tiếng Việt)

Danh sách thuốc:
${productInfo}`;
  };

  const createSortPrompt = (products: Product[]): string => {
    const productInfo = products.map((product: Product) => 
      `- ${product.name}: ${product.ingredient?.join(', ') || 'Không có thông tin thành phần'}`
    ).join('\n');
    
    return `Sắp xếp thứ tự sử dụng các loại thuốc sau để đạt hiệu quả tốt nhất.
QUAN TRỌNG: TRẢ LỜI HOÀN TOÀN BẰNG TIẾNG VIỆT.

Yêu cầu trả lời NGẮN GỌN:
- Liệt kê tên thuốc theo thứ tự (dùng số thứ tự: 1, 2, 3...)
- Lý do ngắn gọn (1 câu cho mỗi thuốc bằng tiếng Việt)

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
    if (selectedProductIdsForAdvisory.length < 2) {
      setError('Vui lòng chọn ít nhất 2 sản phẩm để phân tích phối trộn');
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

  const handlePrintSectionChange = (section: 'invoice' | 'advisory' | 'diseaseWarning') => {
    setPrintSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };



  const availableWarnings = [
    { id: 'rice-blast', name: 'Bệnh Đạo Ôn', data: riceBlastWarning },
    { id: 'bacterial-blight', name: 'Bệnh Cháy Bìa Lá', data: bacterialBlightWarning },
    { id: 'stem-borer', name: 'Sâu Đục Thân', data: stemBorerWarning },
    { id: 'gall-midge', name: 'Muỗi Hành', data: gallMidgeWarning },
    { id: 'brown-plant-hopper', name: 'Rầy Nâu', data: brownPlantHopperWarning },
    { id: 'sheath-blight', name: 'Bệnh Khô Vằn', data: sheathBlightWarning },
    { id: 'grain-discoloration', name: 'Bệnh Lem Lép Hạt', data: grainDiscolorationWarning },
  ].filter(w => w.data);

  const generatePrintContent = () => {
    const styles = `
      <style>
        body { font-family: 'Times New Roman', serif; line-height: 1.5; color: #000; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
        .section { margin-bottom: 25px; }
        .section-title { font-size: 16px; font-weight: bold; border-bottom: 1px solid #ccc; margin-bottom: 10px; padding-bottom: 5px; text-transform: uppercase; }
        .row { display: flex; margin-bottom: 5px; }
        .label { font-weight: bold; width: 150px; }
        .value { flex: 1; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
        th { background-color: #f0f0f0; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .total-section { margin-top: 15px; text-align: right; }
        .warning-box { border: 1px solid #faad14; background-color: #fffbe6; padding: 15px; border-radius: 4px; margin-bottom: 15px; }
        .warning-header { display: flex; align-items: center; margin-bottom: 10px; font-weight: bold; color: #d46b08; }
        .warning-content { white-space: pre-line; }
        .risk-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; color: white; font-size: 12px; margin-right: 10px; }
        .risk-CAO { background-color: #f5222d; }
        .risk-TRUNG_BINH { background-color: #fa8c16; color: #000; }
        .risk-THAP { background-color: #52c41a; }
        .footer { margin-top: 40px; text-align: center; font-style: italic; font-size: 12px; }
        
        /* Disease Warning Specific Styles */
        .disease-warning-item { margin-bottom: 20px; padding: 10px; border-left: 4px solid #fa8c16; background: #fff; }
        .disease-title { font-weight: bold; font-size: 15px; color: #d46b08; margin-bottom: 5px; }
        .disease-content { font-size: 14px; line-height: 1.6; }
      </style>
    `;

    let content = `
      <html>
        <head>
          <title>Phiếu Tư Vấn & Hóa Đơn</title>
          ${styles}
        </head>
        <body>
          <div class="header">
            <h2>PHIẾU TƯ VẤN & HÓA ĐƠN BÁN HÀNG</h2>
            <p>Ngày tạo: ${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString('vi-VN')}</p>
          </div>
    `;

    // 1. INVOICE SECTION
    if (printSections.invoice) {
      content += `
        <div class="section">
          <div class="section-title">I. THÔNG TIN KHÁCH HÀNG & ĐƠN HÀNG</div>
          <div class="row"><span class="label">Khách hàng:</span><span class="value">${watch('customer_name') || 'Khách lẻ'}</span></div>
          <div class="row"><span class="label">Số điện thoại:</span><span class="value">${watch('customer_phone') || '-'}</span></div>
          <div class="row"><span class="label">Địa chỉ:</span><span class="value">${watch('customer_address') || '-'}</span></div>
          
          <table>
            <thead>
              <tr>
                <th>STT</th>
                <th>Sản phẩm</th>
                <th class="text-center">SL</th>
                <th class="text-right">Đơn giá</th>
                <th class="text-right">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((item, index) => `
                <tr>
                  <td class="text-center">${index + 1}</td>
                  <td>${item.product_name}</td>
                  <td class="text-center">${item.quantity}</td>
                  <td class="text-right">${formatCurrency(item.unit_price)}</td>
                  <td class="text-right">${formatCurrency(item.quantity * item.unit_price - (item.discount_amount || 0))}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="total-section">
            <div class="row" style="justify-content: flex-end"><span class="label">Tổng tiền:</span><span class="value" style="flex: 0 auto">${formatCurrency(finalAmount)}</span></div>
            ${partialPaymentAmount > 0 ? `<div class="row" style="justify-content: flex-end"><span class="label">Đã trả:</span><span class="value" style="flex: 0 auto">${formatCurrency(partialPaymentAmount)}</span></div>` : ''}
            ${remainingAmount > 0 ? `<div class="row" style="justify-content: flex-end"><span class="label">Còn nợ:</span><span class="value" style="flex: 0 auto; font-weight: bold;">${formatCurrency(remainingAmount)}</span></div>` : ''}
          </div>
        </div>
      `;
    }

    // 2. TECHNICAL ADVISORY SECTION
    const showMix = printSections.advisory && selectedAdvisorySections.mix && mixResult;
    const showSort = printSections.advisory && selectedAdvisorySections.sort && sortResult;
    const showSpray = printSections.advisory && selectedAdvisorySections.spray && sprayingRecommendations.length > 0;

    if (showMix || showSort || showSpray) {
      content += `<div class="section"><div class="section-title">II. TƯ VẤN KỸ THUẬT</div>`;
      
      if (showMix) {
        content += `
          <div style="margin-bottom: 15px;">
            <strong>Phối trộn thuốc:</strong>
            <div style="margin-top: 5px;">${mixResult.replace(/\n/g, '<br>')}</div>
          </div>
        `;
      }

      if (showSort) {
        content += `
          <div style="margin-bottom: 15px;">
            <strong>Thứ tự pha thuốc:</strong>
            <div style="margin-top: 5px;">${sortResult.replace(/\n/g, '<br>')}</div>
          </div>
        `;
      }

      if (showSpray) {
        content += `
          <div style="margin-bottom: 15px;">
            <strong>Thời điểm phun thuốc tốt nhất:</strong>
            <ul style="margin-top: 5px; padding-left: 20px;">
              ${sprayingRecommendations.map(rec => `
                <li>
                  <strong>${rec.time}</strong> - Mưa: ${rec.rain_prob}, Gió: ${rec.wind_speed}, ${rec.condition}
                </li>
              `).join('')}
            </ul>
          </div>
        `;
      }
      
      content += `</div>`;
    }

    // 3. DISEASE WARNING SECTION
    if (printSections.diseaseWarning) {
      const activeWarnings = availableWarnings.filter(w => selectedPrintDiseases.includes(w.id));

      if (activeWarnings.length > 0) {
        content += `<div class="section"><div class="section-title">III. CẢNH BÁO BỆNH/SÂU HẠI (Tại ${diseaseLocation?.name || 'Vị trí đã chọn'})</div>`;
        
        activeWarnings.forEach(w => {
          let messageHtml = w.data?.message || '';
          
          // Loại bỏ phần "PHÂN TÍCH CHI TIẾT" và "KHUYẾN NGHỊ" khỏi message
          // Chỉ lấy phần từ đầu đến trước "PHÂN TÍCH CHI TIẾT" hoặc "🔍 PHÂN TÍCH CHI TIẾT"
          const detailIndex = messageHtml.indexOf('PHÂN TÍCH CHI TIẾT');
          const detailIndexWithEmoji = messageHtml.indexOf('🔍 PHÂN TÍCH CHI TIẾT');
          
          let cutIndex = -1;
          if (detailIndex !== -1 && detailIndexWithEmoji !== -1) {
            cutIndex = Math.min(detailIndex, detailIndexWithEmoji);
          } else if (detailIndex !== -1) {
            cutIndex = detailIndex;
          } else if (detailIndexWithEmoji !== -1) {
            cutIndex = detailIndexWithEmoji;
          }
          
          if (cutIndex !== -1) {
            messageHtml = messageHtml.substring(0, cutIndex).trim();
          }
          
          content += `
            <div class="disease-warning-item">
              <div class="disease-title">
                ${w.name}
              </div>
              <div class="disease-content">
                ${messageHtml.replace(/\n/g, '<br>')}
              </div>
            </div>
          `;
        });
        
        content += `</div>`;
      } else if (diseaseLocation && selectedPrintDiseases.length === 0 && availableWarnings.length === 0) {
         // Only show this if there are NO warnings at all available, not just because none are selected
         content += `
          <div class="section">
            <div class="section-title">III. CẢNH BÁO BỆNH/SÂU HẠI</div>
            <p>Hiện tại chưa phát hiện nguy cơ cao tại khu vực ${diseaseLocation.name}.</p>
          </div>
        `;
      }
    }

    content += `
          <div class="footer">
            <p>Cảm ơn quý khách đã tin tưởng sử dụng sản phẩm & dịch vụ!</p>
            <p>Hệ thống Xanh AG - Đồng hành cùng nhà nông</p>
          </div>
        </body>
      </html>
    `;
    return content;
  };

  const handlePrint = () => {
    // Initialize selected diseases with all available ones (or filter by high risk if desired)
    const allWarningIds = availableWarnings.map(w => w.id);
    setSelectedPrintDiseases(allWarningIds);
    setIsPrintModalVisible(true);
  };

  const handlePrintConfirm = () => {
    const content = generatePrintContent();
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
    setIsPrintModalVisible(false);
  };

  return (
    <Box>
      {/* ... (Header & Tabs code remains same) ... */}

      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center">
          <IconButton onClick={() => navigate('/sales-invoices')} sx={{ mr: { xs: 1, md: 2 } }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography 
            variant="h4" 
            fontWeight="bold"
            sx={{ 
              fontSize: { xs: '1.1rem', sm: '1.5rem', md: '2.125rem' },
              lineHeight: { xs: 1.2, md: 1.5 }
            }}
          >
            {isEditMode ? 'Chỉnh sửa hóa đơn' : 'Tạo hóa đơn bán hàng mới'}
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<PrinterOutlined />}
          onClick={handlePrint}
          sx={{ 
            ml: 1,
            px: { xs: 1, md: 2 },
            minWidth: { xs: 'auto', md: 'inherit' },
            '& .MuiButton-startIcon': {
              mr: { xs: 0, sm: 1 },
              m: { xs: 0, sm: '0 8px 0 -4px' }
            }
          }}
        >
          <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
            In phiếu tư vấn
          </Box>
          <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
            In
          </Box>
        </Button>
      </Box>

      <Tabs 
        value={currentTab} 
        onChange={(_, newValue) => setCurrentTab(newValue)} 
        sx={{ mb: 3 }}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
      >
        <Tab label="Thông tin hóa đơn" />
        <Tab label="Tư vấn kỹ thuật" />
        <Tab label="Cảnh Báo Bệnh/Sâu Hại" />
      </Tabs>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* TAB 1: Invoice Information */}
        <TabPanel value={currentTab} index={0}>
          <Grid container spacing={3}>
            
            {/* Customer Information */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
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

                  {/* Chọn vụ lúa - BẮT BUỘC khi đã chọn khách hàng */}
                  {/* Chọn vụ lúa - BẮT BUỘC khi đã chọn khách hàng */}
                  {selectedCustomer && (
                    <Box sx={{ mt: 2 }}>
                      {isLoadingRiceCrops ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, height: 56 }}>
                          <CircularProgress size={24} />
                          <Typography variant="body2" color="text.secondary">
                            Đang tải  Danh sách ruộng lúa...
                          </Typography>
                        </Box>
                      ) : customerRiceCrops?.data && customerRiceCrops.data.length > 0 ? (
                        <FormControl 
                          fullWidth 
                          required 
                          error={!selectedRiceCropId}
                        >
                          <InputLabel>Vụ lúa *</InputLabel>
                          <Select
                            value={selectedRiceCropId || ''}
                            onChange={(e) => handleRiceCropSelect(e.target.value as number)}
                            label="Vụ lúa *"
                          >
                            {customerRiceCrops.data.map((crop: RiceCrop) => (
                              <MenuItem key={crop.id} value={crop.id}>
                                {crop.field_name} - {crop.rice_variety} ({crop.field_area.toLocaleString('vi-VN')} m²)
                              </MenuItem>
                            ))}
                          </Select>
                          {!selectedRiceCropId && (
                            <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                              Bắt buộc chọn vụ lúa khi tạo hóa đơn cho khách hàng
                            </Typography>
                          )}
                        </FormControl>
                      ) : (
                        <Alert severity="warning">
                          Khách hàng này chưa có vụ lúa nào trong mùa vụ này.
                        </Alert>
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Invoice Information */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" mb={2}>
                    Thông tin hóa đơn
                  </Typography>

                  <Controller
                    name="season_id"
                    control={control}
                    render={({ field }) => (
                      <FormControl 
                        fullWidth 
                        sx={{ mb: 2 }}
                        required={!!selectedCustomer}
                        error={!!selectedCustomer && !field.value}
                      >
                        <InputLabel>{selectedCustomer ? 'Mùa vụ *' : 'Mùa vụ'}</InputLabel>
                        <Select {...field} label={selectedCustomer ? 'Mùa vụ *' : 'Mùa vụ'}>
                          {seasons?.data?.items?.map((season: Season) => (
                            <MenuItem key={season.id} value={season.id}>
                              {season.name} ({season.year})
                            </MenuItem>
                          ))}
                        </Select>
                        {selectedCustomer && !field.value && (
                          <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                            Bắt buộc chọn mùa vụ khi tạo hóa đơn cho khách hàng
                          </Typography>
                        )}
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

                  {conflictWarning && (
                    <Alert 
                      severity="error" 
                      sx={{ mb: 2 }}
                      icon={isCheckingConflict ? <Spin size="small" /> : undefined}
                    >
                      <Typography variant="caption" display="block" fontWeight="bold">
                        ⚠️ Cảnh báo xung đột:
                      </Typography>
                      <Typography variant="body2">
                        {conflictWarning}
                      </Typography>
                    </Alert>
                  )}

                  <FormField
                        name="notes"
                        control={control}
                        label="Ghi chú"
                        type="textarea"
                        rows={3}
                        placeholder="Nhập ghi chú hóa đơn..."
                        className="mb-4"
                      />

                  {/* Quà tặng khi bán hàng */}
                  <Box sx={{ mt: 2, p: 2, bgcolor: '#fff9e6', borderRadius: 1 }}>
                    <Typography variant="subtitle2" mb={2} color="text.secondary">
                      🎁 Quà tặng (tùy chọn)
                    </Typography>
                    
                    <FormField
                      name="gift_description"
                      control={control}
                      label="Mô tả quà tặng"
                      type="text"
                      placeholder="VD: 1 thùng nước ngọt Coca"
                      className="mb-3"
                    />

                    <FormFieldNumber
                      name="gift_value"
                      control={control}
                      label="Giá trị quà tặng"
                      min={0}
                      size="large"
                      placeholder="0"
                      className="mb-0"
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      Giá trị quà tặng quy đổi ra tiền (VD: 200,000 đ)
                    </Typography>
                  </Box>
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
                    getOptionLabel={(option: Product) => {
                      const cashPrice = formatCurrency(Number(option.price) || 0);
                      const creditPrice = option.credit_price 
                        ? formatCurrency(Number(option.credit_price) || 0)
                        : 'Chưa thiết lập';
                      return `${option.name} - Tiền mặt: ${cashPrice} | Nợ: ${creditPrice}`;
                    }}
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

                      <FormFieldNumber
                        name="discount_amount"
                        control={control}
                        label="Giảm giá tổng đơn"
                        min={0}
                        size="large"
                        placeholder="0"
                        className="mb-4"
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

                      <FormFieldNumber
                        name="partial_payment_amount"
                        control={control}
                        label="Số tiền khách trả trước"
                        min={0}
                        max={finalAmount}
                        size="large"
                        placeholder="0"
                        className="mb-4"
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ mt: -1, mb: 2, display: 'block' }}>
                        Nhập số tiền khách trả trước (nếu trả một phần)
                      </Typography>

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
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', position: 'relative' }}>
                {/* Nút hiển thị lợi nhuận - Hover để xem */}
                <Box
                  sx={{
                    position: 'absolute',
                    left: 0,
                    bottom: 0,
                  }}
                >
                  <Popover
                    content={
                      <div style={{ minWidth: 200 }}>
                        <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                          Dự kiến:
                        </div>
                        <div 
                          style={{ 
                            fontSize: 20, 
                            fontWeight: 'bold',
                            color: calculatedProfit.profit >= 0 ? '#52c41a' : '#ff4d4f',
                            marginBottom: 4,
                          }}
                        >
                          {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND',
                          }).format(calculatedProfit.profit)}
                        </div>
                        <div style={{ fontSize: 12, color: '#666' }}>
                          Tỷ suất: {calculatedProfit.margin.toFixed(2)}%
                        </div>
                      </div>
                    }
                    trigger="hover"
                    placement="topLeft"
                  >
                    <IconButton
                      size="small"
                      sx={{
                        bgcolor: calculatedProfit.profit >= 0 ? 'success.light' : 'error.light',
                        '&:hover': {
                          bgcolor: calculatedProfit.profit >= 0 ? 'success.main' : 'error.main',
                        },
                        width: 32,
                        height: 32,
                        cursor: 'pointer',
                      }}
                    >
                      <ThunderboltOutlined style={{ fontSize: 16, color: '#fff' }} />
                    </IconButton>
                  </Popover>
                </Box>

                <Button
                  variant="outlined"
                  onClick={() => navigate('/sales-invoices')}
                  disabled={createMutation.isPending}
                >
                  Hủy
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleSubmit((data) => onSubmit({ ...data, status: 'draft' }))}
                  disabled={createMutation.isPending}
                  startIcon={<SaveIcon sx={{ color: 'text.secondary' }} />}
                >
                  Lưu nháp
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  onClick={handleSubmit((data) => {
                     let status: 'draft' | 'confirmed' | 'paid' = 'confirmed';
                     // Nếu thanh toán tiền mặt và trả đủ -> Paid
                     if (data.payment_method === 'cash' && (data.final_amount - data.partial_payment_amount) <= 0) {
                        status = 'paid';
                     }
                     onSubmit({ ...data, status });
                  })}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? 'Đang tạo...' : 'Lưu & Xác nhận'}
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
              <Box sx={{ mb: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
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
                        disabled={isAnalyzing || selectedProductIdsForAdvisory.length < 2}
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

        {/* TAB 3: Disease Warning */}
        <TabPanel value={currentTab} index={2}>
          <Box sx={{ px: 2, mt:-5 }}>
            {/* Header Actions */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h1">
              </Typography>
              <Space>
                <Button
                  variant="outlined"
                  startIcon={<ReloadOutlined />}
                  onClick={() => {
                    switch (diseaseWarningTab) {
                      case 'rice-blast': if (riceBlastWarning) runRiceBlastMutation.mutate(); break;
                      case 'bacterial-blight': if (bacterialBlightWarning) runBacterialBlightMutation.mutate(); break;
                      case 'stem-borer': if (stemBorerWarning) runStemBorerMutation.mutate(); break;
                      case 'gall-midge': if (gallMidgeWarning) runGallMidgeMutation.mutate(); break;
                      case 'brown-plant-hopper': if (brownPlantHopperWarning) runBrownPlantHopperMutation.mutate(); break;
                      case 'sheath-blight': if (sheathBlightWarning) runSheathBlightMutation.mutate(); break;
                      case 'grain-discoloration': if (grainDiscolorationWarning) runGrainDiscolorationMutation.mutate(); break;
                    }
                    // Refetch location
                    updateLocationMutation.mutate(diseaseLocation as UpdateLocationDto);
                  }}
                  disabled={
                    runRiceBlastMutation.isPending || 
                    runBacterialBlightMutation.isPending ||
                    runStemBorerMutation.isPending ||
                    runGallMidgeMutation.isPending ||
                    runBrownPlantHopperMutation.isPending ||
                    runSheathBlightMutation.isPending ||
                    runGrainDiscolorationMutation.isPending
                  }
                >
                  Làm mới
                </Button>
                <Button
                  variant="contained"
                  startIcon={<ThunderboltOutlined />}
                  onClick={() => {
                    runRiceBlastMutation.mutate();
                    runBacterialBlightMutation.mutate();
                    runStemBorerMutation.mutate();
                    runGallMidgeMutation.mutate();
                    runBrownPlantHopperMutation.mutate();
                    runSheathBlightMutation.mutate();
                    runGrainDiscolorationMutation.mutate();
                  }}
                  disabled={
                    !diseaseLocation ||
                    runRiceBlastMutation.isPending || 
                    runBacterialBlightMutation.isPending ||
                    runStemBorerMutation.isPending ||
                    runGallMidgeMutation.isPending ||
                    runBrownPlantHopperMutation.isPending ||
                    runSheathBlightMutation.isPending ||
                    runGrainDiscolorationMutation.isPending
                  }
                >
                  Phân tích tất cả
                </Button>
              </Space>
            </Box>

            {/* Location Form */}
            <Box sx={{ mb: 3 }}>
              <LocationForm
                location={diseaseLocation}
                onSubmit={(values: UpdateLocationDto) => {
                  updateLocationMutation.mutate(values, {
                    onSuccess: () => {
                      // Tự động chạy phân tích cho tất cả module
                      setTimeout(() => {
                        runRiceBlastMutation.mutate();
                        runBacterialBlightMutation.mutate();
                        runStemBorerMutation.mutate();
                        runGallMidgeMutation.mutate();
                        runBrownPlantHopperMutation.mutate();
                        runSheathBlightMutation.mutate();
                        runGrainDiscolorationMutation.mutate();
                      }, 500);
                    }
                  });
                }}
                loading={updateLocationMutation.isPending}
              />
            </Box>

            {/* Disease Warnings Tabs */}
            <AntCard>
              <AntTabs activeKey={diseaseWarningTab} onChange={setDiseaseWarningTab}>
                {/* Rice Blast Tab */}
                <TabPane tab="🦠 Bệnh Đạo Ôn" key="rice-blast">
                  <Box sx={{ pt: 2 }}>
                    {riceBlastWarning ? (
                      <>
                        <WarningCard warning={riceBlastWarning} title="Bệnh Đạo Ôn" loading={runRiceBlastMutation.isPending} />
                        {riceBlastWarning.daily_data && riceBlastWarning.daily_data.length > 0 && (
                          <AntCard title="📊 Dữ liệu chi tiết 7 ngày" style={{ marginTop: 16 }}>
                            <DailyDataTable 
                              data={riceBlastWarning.daily_data} 
                              loading={runRiceBlastMutation.isPending}
                            />
                          </AntCard>
                        )}
                      </>
                    ) : (
                      <Alert severity="warning">
                        Chưa có dữ liệu cảnh báo bệnh đạo ôn. Vui lòng cập nhật vị trí ruộng lúa.
                      </Alert>
                    )}
                  </Box>
                </TabPane>

                {/* Bacterial Blight Tab */}
                <TabPane tab="🍃 Bệnh Cháy Bìa Lá" key="bacterial-blight">
                  <Box sx={{ pt: 2 }}>
                    {bacterialBlightWarning ? (
                      <>
                        <WarningCard warning={bacterialBlightWarning} title="Bệnh Cháy Bìa Lá" loading={runBacterialBlightMutation.isPending} />
                        {bacterialBlightWarning.daily_data && bacterialBlightWarning.daily_data.length > 0 && (
                          <AntCard title="📊 Dữ liệu chi tiết 7 ngày" style={{ marginTop: 16 }}>
                            <DailyDataTable 
                              data={bacterialBlightWarning.daily_data} 
                              loading={runBacterialBlightMutation.isPending}
                              diseaseType="bacterial-blight"
                            />
                          </AntCard>
                        )}
                      </>
                    ) : (
                      <Alert severity="warning">
                        Chưa có dữ liệu cảnh báo bệnh cháy bìa lá. Vui lòng cập nhật vị trí ruộng lúa.
                      </Alert>
                    )}
                  </Box>
                </TabPane>

                {/* Stem Borer Tab */}
                <TabPane tab="🐛 Sâu Đục Thân" key="stem-borer">
                  <Box sx={{ pt: 2 }}>
                    {stemBorerWarning ? (
                      <>
                        <DiseaseWarningCard 
                          warning={stemBorerWarning} 
                          loading={runStemBorerMutation.isPending}
                          title="SÂU ĐỤC THÂN"
                          borderColor="#fa8c16"
                        />
                        {stemBorerWarning.daily_data && stemBorerWarning.daily_data.length > 0 && (
                          <AntCard title="📊 Dữ liệu chi tiết 7 ngày" style={{ marginTop: 16 }}>
                            <DailyDataTable 
                              data={stemBorerWarning.daily_data} 
                              loading={runStemBorerMutation.isPending}
                              diseaseType="stem-borer"
                            />
                          </AntCard>
                        )}
                      </>
                    ) : (
                      <Alert severity="warning">
                        Chưa có dữ liệu cảnh báo Sâu Đục Thân. Vui lòng cập nhật vị trí ruộng lúa.
                      </Alert>
                    )}
                  </Box>
                </TabPane>

                {/* Gall Midge Tab */}
                <TabPane tab="🦟 Muỗi Hành" key="gall-midge">
                  <Box sx={{ pt: 2 }}>
                    {gallMidgeWarning ? (
                      <>
                        <DiseaseWarningCard 
                          warning={gallMidgeWarning} 
                          loading={runGallMidgeMutation.isPending}
                          title="MUỖI HÀNH"
                          borderColor="#722ed1"
                        />
                        {gallMidgeWarning.daily_data && gallMidgeWarning.daily_data.length > 0 && (
                          <AntCard title="📊 Dữ liệu chi tiết 7 ngày" style={{ marginTop: 16 }}>
                            <DailyDataTable 
                              data={gallMidgeWarning.daily_data} 
                              loading={runGallMidgeMutation.isPending}
                              diseaseType="gall-midge"
                            />
                          </AntCard>
                        )}
                      </>
                    ) : (
                      <Alert severity="warning">
                        Chưa có dữ liệu cảnh báo Muỗi Hành. Vui lòng cập nhật vị trí ruộng lúa.
                      </Alert>
                    )}
                  </Box>
                </TabPane>

                {/* Brown Plant Hopper Tab */}
                <TabPane tab="🦗 Rầy Nâu" key="brown-plant-hopper">
                  <Box sx={{ pt: 2 }}>
                    {brownPlantHopperWarning ? (
                      <>
                        <DiseaseWarningCard 
                          warning={brownPlantHopperWarning} 
                          loading={runBrownPlantHopperMutation.isPending}
                          title="RẦY NÂU"
                          borderColor="#13c2c2"
                        />
                        {brownPlantHopperWarning.daily_data && brownPlantHopperWarning.daily_data.length > 0 && (
                          <AntCard title="📊 Dữ liệu chi tiết 7 ngày" style={{ marginTop: 16 }}>
                            <DailyDataTable 
                              data={brownPlantHopperWarning.daily_data} 
                              loading={runBrownPlantHopperMutation.isPending}
                              diseaseType="brown-plant-hopper"
                            />
                          </AntCard>
                        )}
                      </>
                    ) : (
                      <Alert severity="warning">
                        Chưa có dữ liệu cảnh báo Rầy Nâu. Vui lòng cập nhật vị trí ruộng lúa.
                      </Alert>
                    )}
                  </Box>
                </TabPane>

                {/* Sheath Blight Tab */}
                <TabPane tab="🍂 Bệnh Khô Vằn" key="sheath-blight">
                  <Box sx={{ pt: 2 }}>
                    {sheathBlightWarning ? (
                      <>
                        <DiseaseWarningCard 
                          warning={sheathBlightWarning} 
                          loading={runSheathBlightMutation.isPending}
                          title="BỆNH KHÔ VẰN"
                          borderColor="#eb2f96"
                        />
                        {sheathBlightWarning.daily_data && sheathBlightWarning.daily_data.length > 0 && (
                          <AntCard title="📊 Dữ liệu chi tiết 7 ngày" style={{ marginTop: 16 }}>
                            <DailyDataTable 
                              data={sheathBlightWarning.daily_data} 
                              loading={runSheathBlightMutation.isPending}
                              diseaseType="sheath-blight"
                            />
                          </AntCard>
                        )}
                      </>
                    ) : (
                      <Alert severity="warning">
                        Chưa có dữ liệu cảnh báo Bệnh Khô Vằn. Vui lòng cập nhật vị trí ruộng lúa.
                      </Alert>
                    )}
                  </Box>
                </TabPane>

                {/* Grain Discoloration Tab */}
                <TabPane tab="🌾 Bệnh Lem Lép Hạt" key="grain-discoloration">
                  <Box sx={{ pt: 2 }}>
                    {grainDiscolorationWarning ? (
                      <>
                        <DiseaseWarningCard 
                          warning={grainDiscolorationWarning} 
                          loading={runGrainDiscolorationMutation.isPending}
                          title="BỆNH LEM LÉP HẠT"
                          borderColor="#a0d911"
                        />
                        {grainDiscolorationWarning.daily_data && grainDiscolorationWarning.daily_data.length > 0 && (
                          <AntCard title="📊 Dữ liệu chi tiết 7 ngày" style={{ marginTop: 16 }}>
                            <DailyDataTable 
                              data={grainDiscolorationWarning.daily_data} 
                              loading={runGrainDiscolorationMutation.isPending}
                              diseaseType="grain-discoloration"
                            />
                          </AntCard>
                        )}
                      </>
                    ) : (
                      <Alert severity="warning">
                        Chưa có dữ liệu cảnh báo Bệnh Lem Lép Hạt. Vui lòng cập nhật vị trí ruộng lúa.
                      </Alert>
                    )}
                  </Box>
                </TabPane>
              </AntTabs>
            </AntCard>
          </Box>
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

      {/* Print Options Modal */}
      <AntModal
        title="Tùy chọn in phiếu tư vấn"
        open={isPrintModalVisible}
        onCancel={() => setIsPrintModalVisible(false)}
        onOk={handlePrintConfirm}
        okText="In phiếu"
        cancelText="Hủy"
        width={1000}
        style={{ top: 20 }}
      >
        <Grid container spacing={3}>
          {/* Left Column: Settings */}
          <Grid item xs={12} md={4}>
            <Box display="flex" flexDirection="column" gap={2}>
              <Typography variant="h6" fontSize="1rem">Tùy chọn nội dung</Typography>
              
              {/* Invoice Section */}
              <FormControlLabel
                control={
                  <Checkbox
                    checked={printSections.invoice}
                    onChange={() => handlePrintSectionChange('invoice')}
                  />
                }
                label="Thông tin hóa đơn & Khách hàng"
              />

              {/* Advisory Section */}
              <FormControlLabel
                control={
                  <Checkbox
                    checked={printSections.advisory}
                    onChange={() => handlePrintSectionChange('advisory')}
                    disabled={!mixResult && !sortResult && sprayingRecommendations.length === 0}
                  />
                }
                label="Tư vấn kỹ thuật"
              />
              {printSections.advisory && (
                <Box ml={3} display="flex" flexDirection="column" gap={0.5}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        size="small"
                        checked={selectedAdvisorySections.mix}
                        onChange={(e) => setSelectedAdvisorySections(prev => ({ ...prev, mix: e.target.checked }))}
                        disabled={!mixResult}
                      />
                    }
                    label={<Typography variant="body2">Phối trộn thuốc</Typography>}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        size="small"
                        checked={selectedAdvisorySections.sort}
                        onChange={(e) => setSelectedAdvisorySections(prev => ({ ...prev, sort: e.target.checked }))}
                        disabled={!sortResult}
                      />
                    }
                    label={<Typography variant="body2">Thứ tự pha thuốc</Typography>}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        size="small"
                        checked={selectedAdvisorySections.spray}
                        onChange={(e) => setSelectedAdvisorySections(prev => ({ ...prev, spray: e.target.checked }))}
                        disabled={sprayingRecommendations.length === 0}
                      />
                    }
                    label={<Typography variant="body2">Thời điểm phun thuốc tốt nhất</Typography>}
                  />
                </Box>
              )}

              {/* Disease Warning Section */}
              <FormControlLabel
                control={
                  <Checkbox
                    checked={printSections.diseaseWarning}
                    onChange={() => handlePrintSectionChange('diseaseWarning')}
                    disabled={!diseaseLocation}
                  />
                }
                label="Cảnh báo Bệnh/Sâu hại"
              />
              
              {printSections.diseaseWarning && availableWarnings.length > 0 && (
                <Box ml={3} display="flex" flexDirection="column" gap={0.5}>
                  {availableWarnings.map(w => (
                    <FormControlLabel
                      key={w.id}
                      control={
                        <Checkbox
                          size="small"
                          checked={selectedPrintDiseases.includes(w.id)}
                          onChange={() => {
                            setSelectedPrintDiseases(prev => 
                              prev.includes(w.id) 
                                ? prev.filter(id => id !== w.id)
                                : [...prev, w.id]
                            );
                          }}
                        />
                      }
                      label={
                        <Typography variant="body2">
                          {w.name} <span style={{ 
                            color: w.data?.risk_level === 'CAO' ? '#f5222d' : '#fa8c16',
                            fontWeight: 'bold',
                            fontSize: '0.75rem'
                          }}>
                            ({w.data?.risk_level === 'CAO' ? 'CAO' : 'TB'})
                          </span>
                        </Typography>
                      }
                    />
                  ))}
                </Box>
              )}
            </Box>
          </Grid>

          {/* Right Column: Preview */}
          <Grid item xs={12} md={8}>
            <Typography variant="h6" fontSize="1rem" mb={2}>Xem trước bản in</Typography>
            <Paper 
              variant="outlined" 
              sx={{ 
                height: '600px', 
                overflow: 'hidden', 
                bgcolor: '#f5f5f5',
                display: 'flex',
                justifyContent: 'center',
                p: 2
              }}
            >
              <iframe
                srcDoc={generatePrintContent()}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  backgroundColor: 'white',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
                title="Print Preview"
              />
            </Paper>
          </Grid>
        </Grid>
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
