import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Button,
  Typography,
  Grid,
  IconButton,
  Tabs,
  Tab,
  Alert,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import {
  PrinterOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { previewSalesInvoiceProfit, useCreateSalesInvoiceMutation, useUpdateSalesInvoiceMutation, useSalesInvoiceQuery, useLatestInvoiceByCustomerQuery, useCustomerSeasonStatsQuery } from '@/queries/sales-invoice';
import { useCustomerSearchQuery } from '@/queries/customer';
import { useSeasonsQuery, useActiveSeasonQuery } from '@/queries/season';
import { useProductsQuery, useProductsByIdsQuery } from '@/queries/product';
import { Customer } from '@/models/customer';
import { Product } from '@/models/product.model';
import { SalesInvoice } from '@/models/sales-invoice';
import { useAiService } from '@/hooks/use-ai-service';
import { weatherService, WeatherData, SimplifiedWeatherData } from '@/services/weather.service';
import { frontendAiService } from '@/services/ai.service';
import { VIETNAM_LOCATIONS, DEFAULT_LOCATION, Location } from '@/constants/locations';
import LocationMap from '@/components/LocationMap';
import { Modal as AntModal, App as AntApp } from 'antd';
import { useFormGuard } from '@/hooks/use-form-guard';
import { notifyFormErrors } from '@/utils/form-error';
import {
  salesInvoiceSchema,
  SalesInvoiceFormData,
  defaultSalesInvoiceValues,
} from './form-config';
import { DeliveryInfoSection } from './components/DeliveryInfoSection';
// Refactored Components
import { 
  CustomerInfoSection, 
  InvoiceInfoSection, 
  ProductsSection, 
  PaymentSummarySection, 
  InvoiceActions 
} from './components/invoice-form';
import { TechnicalAdvisoryTab } from './components/advisory-tab/TechnicalAdvisoryTab';
import { DiseaseWarningTab } from './components/disease-tab/DiseaseWarningTab';
import { PrintOptionsModal } from './components/print-modal/PrintOptionsModal';
import { generatePrintContent as generatePrintContentUtil } from './utils/print-utils';

// Disease Warning Queries
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
import { useRiceCrops } from '@/queries/rice-crop';
import { CropStatus } from '@/models/rice-farming';
import { CreateDeliveryLogDto } from '@/models/delivery-log.model';

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

const parseProductMoney = (value: unknown): number => {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return value;
  return Number(String(value).replace(/[^0-9.-]/g, '')) || 0;
};

const resolveProductCostByPriceType = (
  product: Product | undefined,
  priceType: 'cash' | 'credit',
): number => {
  if (!product) return 0;
  if (product.costing_method === 'by_price_type') {
    return priceType === 'credit'
      ? parseProductMoney(product.credit_cost_price)
      : parseProductMoney(product.cash_cost_price);
  }
  return parseProductMoney(product.average_cost_price);
};

const CreateSalesInvoice = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  
  // Fetch invoice data if in edit mode
  const { data: invoiceData } = useSalesInvoiceQuery(
    id ? parseInt(id) : 0
  );

  const [customerSearch, setCustomerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const { message: antMessage } = AntApp.useApp();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isGuestCustomer, setIsGuestCustomer] = useState(true);
  const [currentTab, setCurrentTab] = useState(0);
  const [diseaseWarningTab, setDiseaseWarningTab] = useState('rice-blast');

  // Disease Warning Queries - Phải khai báo trước để dùng trong selectedLocation
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

  // Technical Advisory States
  const [selectedProductIdsForAdvisory, setSelectedProductIdsForAdvisory] = useState<number[]>([]);
  const [mixResult, setMixResult] = useState('');
  const [sortResult, setSortResult] = useState('');
  const [fullWeatherForecast, setFullWeatherForecast] = useState<WeatherData[]>([]); // Dữ liệu đầy đủ tất cả giờ cho "Dự báo 2 ngày"
  const [sprayingRecommendations, setSprayingRecommendations] = useState<Recommendation[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Location state - Khởi tạo từ database
  const [selectedLocation, setSelectedLocation] = useState<Location>(() => {
    if (diseaseLocation) {
      return {
        id: 'db-location',
        name: diseaseLocation.name,
        latitude: diseaseLocation.lat,
        longitude: diseaseLocation.lon,
        region: '📍 Vị trí từ hệ thống'
      };
    }
    return DEFAULT_LOCATION;
  });
  const [isMapModalVisible, setIsMapModalVisible] = useState(false);
  const [isPrintModalVisible, setIsPrintModalVisible] = useState(false);
  const [isPrintOptionsOpen, setIsPrintOptionsOpen] = useState(false); // Mobile drawer toggle
  const [paperSize, setPaperSize] = useState<'A4' | 'K80'>('A4'); // Khổ giấy: A4 hoặc K80

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
  
  // AI Warning Generation States
  const [isGeneratingWarning, setIsGeneratingWarning] = useState(false);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [isCheckingConflict, setIsCheckingConflict] = useState(false);

  // Delivery Log State
  const [deliveryData, setDeliveryData] = useState<CreateDeliveryLogDto | null>(null);
  const [isDeliveryEnabled, setIsDeliveryEnabled] = useState(false); // Track xem có bật tạo phiếu giao không
  const [shouldPrintDelivery, setShouldPrintDelivery] = useState(false); // Track xem có in phiếu giao không

  const { mixPesticides, sortPesticides } = useAiService();

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors, isDirty },
  } = useForm<SalesInvoiceFormData>({
    resolver: zodResolver(salesInvoiceSchema),
    defaultValues: defaultSalesInvoiceValues,
  });

  const { fields, append, remove, prepend } = useFieldArray({
    control,
    name: 'items',
  });

  const { confirmExit } = useFormGuard(isDirty);

  // Queries
  const { data: customers } = useCustomerSearchQuery(customerSearch);
  const { data: activeSeason } = useActiveSeasonQuery(); // Lấy mùa vụ mới nhất
  const { data: seasons } = useSeasonsQuery();
  const { data: productsData } = useProductsQuery({ 
    limit: 100,
    keyword: productSearch || undefined, // Tìm kiếm theo keyword (tên sản phẩm)
  });
  const { data: latestInvoiceResponse } = useLatestInvoiceByCustomerQuery(selectedCustomer?.id);
  
  const items = watch('items') || [];

  // Lấy toàn bộ thông tin sản phẩm có trong hóa đơn (bao gồm cả thành phần/ingredients)
  // để đảm bảo tab Tư vấn kỹ thuật luôn có đủ dữ liệu, không bị phụ thuộc vào kết quả search
  const productIdsInInvoice = useMemo(() => {
    return (items || []).map(item => item.product_id).filter(id => !!id);
  }, [items]);

  const { data: fullInvoiceProducts } = useProductsByIdsQuery(productIdsInInvoice);
  
  // Filter out current invoice if we are editing the latest one
  const latestInvoice = useMemo(() => {
    // API interceptor đã unwrap response, latestInvoiceResponse đã là SalesInvoice hoặc null
    const invoice = latestInvoiceResponse as SalesInvoice | null | undefined;
    if (invoice && id && invoice.id === parseInt(id)) {
      return null;
    }
    return invoice || null;
  }, [latestInvoiceResponse, id]);
  
  // Watch season_id để filter Ruộng lúa
  const selectedSeasonId = watch('season_id');
  
  // Lấy Ruộng lúa của khách hàng đã chọn VÀ theo mùa vụ đã chọn
  const { data: customerRiceCrops, isLoading: isLoadingRiceCrops } = useRiceCrops(
    { 
      customer_id: selectedCustomer?.id ? Number(selectedCustomer.id) : undefined, 
      season_id: selectedSeasonId ? Number(selectedSeasonId) : undefined,
      status: CropStatus.ACTIVE 
    }, 
    { 
      enabled: !!selectedCustomer?.id && !!selectedSeasonId,
      staleTime: 0,
      refetchOnMount: true,
    }
  );
  
  
  const createMutation = useCreateSalesInvoiceMutation();
  const updateMutation = useUpdateSalesInvoiceMutation();

  // State để lưu kết quả tính toán
  const [calculatedProfit, setCalculatedProfit] = useState({
    revenue: 0,
    cost: 0,
    profit: 0,
    margin: 0,
  });

  const partialPaymentAmount = watch('partial_payment_amount');
  const seasonId = watch('season_id');
  const customerId = watch('customer_id');
  const discountAmount = watch('discount_amount');

  // Hook lấy thống kê khách hàng trong mùa vụ
  const { data: customerSeasonStats } = useCustomerSeasonStatsQuery(customerId, seasonId);




  // Tự động set season_id nếu có activeSeason (chỉ cho form tạo mới)
  useEffect(() => {
    if (!isEditMode && activeSeason?.id && !getValues('season_id')) {
      setValue('season_id', activeSeason.id);
    }
  }, [activeSeason, isEditMode, setValue, getValues]);

  // Reset rice_crop_id khi thay đổi season_id
  useEffect(() => {
    if (selectedCustomer) {
      setValue('rice_crop_id', undefined);
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
      
      // Khôi phục ngày bán
      if (invoice.sale_date) {
        setValue('sale_date', invoice.sale_date);
      }
      
      // Set items if available
      if (invoice.items && invoice.items.length > 0) {
        // Suy luận price_type từ payment_method của invoice
        const inferredPriceType = invoice.payment_method === 'debt' ? 'credit' : 'cash';
        
        setValue('items', invoice.items.map((item: any) => ({
          product_id: item.product_id,
          product_name: item.product_name,
          unit_name: item.unit_name || '',
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_amount: item.discount_amount || 0,
          tax_selling_price: item.tax_selling_price || '0',
          sale_unit_id: item.sale_unit_id,
          conversion_factor: Number(item.conversion_factor || 1),
          base_quantity: Number(item.base_quantity || (Number(item.quantity || 0) * Number(item.conversion_factor || 1))),
          notes: item.notes || '',
          price_type: (item.price_type || inferredPriceType) as 'cash' | 'credit',
          average_cost_price: Number(item.cost_price || 0),
          costing_method: item.costing_method_snapshot || 'fixed',
        })).reverse());

        // ✅ Mặc định chọn tất cả sản phẩm để phân tích khi load dữ liệu chỉnh sửa
        setSelectedProductIdsForAdvisory(invoice.items.map((item: any) => item.product_id));
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

      // Khôi phục thông tin giao hàng nếu có
      if (invoice.delivery_logs && invoice.delivery_logs.length > 0) {
        setDeliveryData(invoice.delivery_logs[0] as any);
      }
    }
  }, [isEditMode, invoiceData, setValue]);

  // Set active season as default
  useEffect(() => {
    // Chỉ set default nếu chưa có giá trị (để tránh override lựa chọn của user)
    // Kiểm tra cả isEditMode để không override khi đang edit
    if (activeSeason && selectedSeasonId === undefined && !isEditMode) {
      setValue('season_id', activeSeason.id);
    }
  }, [activeSeason, selectedSeasonId, isEditMode, setValue]);

  // Watch items to calculate totals

  // Tính toán tổng tiền tự động khi có thay đổi
  useEffect(() => {
    let isCalculating = false; // Flag để tránh infinite loop
    
    const subscription = watch((value, { name, type }) => {
      // Bỏ qua nếu đang trong quá trình tính toán
      if (isCalculating) return;
      
      // Chỉ tính lại khi có thay đổi liên quan đến items hoặc discount
      // Không tính lại khi thay đổi total_amount hoặc final_amount
      if (name?.startsWith('items') || name === 'discount_amount') {
        // Không tính lại nếu thay đổi từ total_amount hoặc final_amount
        if (name === 'total_amount' || name === 'final_amount') return;
        
        isCalculating = true; // Bắt đầu tính toán
        
        const currentItems = value.items || [];
        let totalRev = 0;
        let totalCst = 0;
        
        const total = currentItems.reduce((sum: number, item: any) => {
          const quantity = Number(item?.quantity) || 0;
          const unitPrice = Number(item?.unit_price) || 0;
          const itemDiscount = Number(item?.discount_amount) || 0;
          
          const prod = productsData?.data?.items?.find((p: any) => p.id === item.product_id);
          const priceType = (item.price_type || 'cash') as 'cash' | 'credit';
          const cstPrice = item.average_cost_price !== undefined
             ? Number(item.average_cost_price || 0)
             : resolveProductCostByPriceType(prod, priceType);

          // Sử dụng base_quantity (số lượng đã quy đổi sang đơn vị cơ sở như Kg) để nhân với giá vốn Kg
          // Nếu base_quantity không có (trường hợp cũ), fallback về qty * factor
          const factor = Number(item.conversion_factor || 1);
          const baseQty = Number(item.base_quantity || (quantity * factor));
          
          totalRev += (quantity * unitPrice) - itemDiscount;
          totalCst += (baseQty * cstPrice);
          
          return sum + (quantity * unitPrice) - itemDiscount;
        }, 0);
        
        const currentDiscount = Number(value.discount_amount) || 0;
        const finalAmount = total - currentDiscount;
        
        const grossProfit = totalRev - totalCst - currentDiscount;
        setCalculatedProfit({
           revenue: totalRev - currentDiscount,
           cost: totalCst,
           profit: grossProfit,
           margin: (totalRev - currentDiscount) > 0 ? (grossProfit / (totalRev - currentDiscount)) * 100 : 0
        });

        
        setValue('total_amount', total, { shouldValidate: false, shouldDirty: false });
        setValue('final_amount', finalAmount, { shouldValidate: false, shouldDirty: false });
        
        isCalculating = false; // Kết thúc tính toán
      }
    });
    
    return () => subscription.unsubscribe();
  }, [watch, setValue, productsData]);

  useEffect(() => {
    const currentItems = items || [];
    const currentDiscount = Number(discountAmount || 0);

    if (!currentItems.length) {
      setCalculatedProfit({
        revenue: 0,
        cost: 0,
        profit: 0,
        margin: 0,
      });
      return;
    }

    const previewItems = currentItems
      .map((item) => ({
        productId: Number(item.product_id || 0),
        quantity: Number(
          item.base_quantity ||
            Number(item.quantity || 0) * Number(item.conversion_factor || 1),
        ),
        priceType:
          item.price_type === 'credit' ? 'credit' : 'cash',
      }))
      .filter((item) => item.productId > 0 && item.quantity > 0);

    if (!previewItems.length) {
      return;
    }

    const revenue = currentItems.reduce((sum, item: any) => {
      return (
        sum +
        (Number(item?.quantity) || 0) * (Number(item?.unit_price) || 0) -
        (Number(item?.discount_amount) || 0)
      );
    }, 0) - currentDiscount;

    const timer = window.setTimeout(async () => {
      try {
        const preview = await previewSalesInvoiceProfit({
          items: previewItems,
        });
        const cost = Number(preview.totalCostValue || 0);
        const profit = revenue - cost;
        setCalculatedProfit({
          revenue,
          cost,
          profit,
          margin: revenue > 0 ? (profit / revenue) * 100 : 0,
        });
      } catch (error) {
        console.error('Error previewing profit by batch:', error);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [discountAmount, items]);

  // ✅ Tự động set số tiền khách trả trước khi chọn phương thức thanh toán
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      // Xử lý khi thay đổi payment_method HOẶC final_amount
      if (name === 'payment_method' || name === 'final_amount') {
        const paymentMethod = value.payment_method?.toLowerCase();
        const currentFinalAmount = Number(value.final_amount || 0);
        
        // Nếu chọn tiền mặt hoặc chuyển khoản → Tự động set đã trả đủ
        if (paymentMethod === 'cash' || paymentMethod === 'transfer' || paymentMethod === 'bank_transfer') {
          setValue('partial_payment_amount', currentFinalAmount, { shouldValidate: false });

        }
        // Nếu chọn công nợ → Set về 0
        else if (paymentMethod === 'debt') {
          setValue('partial_payment_amount', 0, { shouldValidate: false });

        }

        if (name === 'payment_method') {
          const newPriceType = paymentMethod === 'debt' ? 'credit' : 'cash';
          const currentItems = value.items || [];

          currentItems.forEach((item: any, index: number) => {
            const product = productsData?.data?.items?.find(
              (p: Product) => Number(p.id) === Number(item.product_id),
            );
            if (!product) return;

            const factor = Number(item.conversion_factor || 1);
            const basePrice = newPriceType === 'credit'
              ? parseProductMoney(product.credit_price || product.price)
              : parseProductMoney(product.price);

            setValue(`items.${index}.price_type`, newPriceType, { shouldValidate: true });
            setValue(`items.${index}.unit_price`, basePrice * factor, { shouldValidate: true });
            setValue(
              `items.${index}.average_cost_price`,
              resolveProductCostByPriceType(product, newPriceType),
              { shouldValidate: true },
            );
            setValue(
              `items.${index}.costing_method`,
              product.costing_method || 'fixed',
              { shouldValidate: false },
            );
          });
        }
      }
    });
    
    return () => subscription.unsubscribe();
  }, [watch, setValue, productsData]);

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
      setValue('season_id', undefined as any);
      setValue('rice_crop_id', undefined);
      
      antMessage.info('Vui lòng chọn Mùa vụ và Ruộng lúa cho khách hàng này');
    } else {
      // Khách vãng lai
      setIsGuestCustomer(true);
      setValue('customer_id', undefined);
      setValue('customer_name', '');
      setValue('customer_phone', '');
      setValue('customer_address', '');
      // Khách vãng lai không cần season/rice crop
      setValue('season_id', activeSeason?.id as any); // Set lại active season
      setValue('rice_crop_id', undefined);
    }
  };


  /**
   * Generate warning using AI based on product descriptions
   */
  const handleGenerateWarning = async (silent = false) => {
    if (items.length === 0) {
      if (!silent) antMessage.warning('Vui lòng thêm sản phẩm vào đơn hàng trước');
      return;
    }

    setIsGeneratingWarning(true);
    
    try {
      // Get product details with descriptions
      const productDescriptions = items
        .map(item => {
          const product = (productsData?.data?.items || []).find((p: Product) => p.id === item.product_id);
          if (product) {
            const parts = [];
            if (product.description) parts.push(`Mô tả: ${product.description}`);
            if (product.ingredient && product.ingredient.length > 0) parts.push(`Thành phần: ${product.ingredient.join(', ')}`);
            if (product.notes) parts.push(`Ghi chú danh mục: ${product.notes}`);
            if (item.notes) parts.push(`Ghi chú riêng trong đơn: ${item.notes}`);
            
            const detail = parts.length > 0 ? parts.join(' | ') : 'Không có mô tả';
            return `- SẢN PHẨM: ${product.trade_name || product.name} | ${detail}`;
          }
          return null;
        })
        .filter(Boolean)
        .join('\n');

      if (!productDescriptions) {
        if (!silent) antMessage.warning('Không tìm thấy mô tả sản phẩm');
        setIsGeneratingWarning(false);
        return;
      }

      const prompt = `Dựa trên danh sách sản phẩm dưới đây (bao gồm tên, mô tả, thành phần và ghi chú), hãy tạo một lưu ý quan trọng cực kỳ ngắn gọn (tối đa 2-3 câu) cho người nông dân.

YÊU CẦU BẮT BUỘC:
1. GỌI TÊN SẢN PHẨM ĐÍCH DANH: Nếu phát hiện xung đột giữa các thuốc đang chọn (ví dụ: thuốc A kỵ hoạt chất của thuốc B). Không pha chung [Thuốc A] với [Thuốc B] vì xung đột hoạt chất với thuốc B".
2. KIỂM TRA CHÉO TƯƠNG TÁC: Phân tích kỹ xem các sản phẩm TRONG DANH SÁCH này có kỵ nhau không dựa trên thành phần và mô tả. 
3. HƯỚNG DẪN KỸ THUẬT: Tập trung vào cách dùng an toàn, thời điểm xịt và liều lượng đặc thù cho các sản phẩm này.

Danh sách sản phẩm phân tích:
${productDescriptions}

Chỉ trả về nội dung lưu ý cuối cùng, không tiêu đề, không giải thích.`;

      const response = await frontendAiService.generateWarning(prompt);
      
      if (response.success && response.answer) {
        setValue('warning', response.answer.trim());
        if (!silent) antMessage.success('Đã tạo lưu ý bằng AI');
      } else {
        if (!silent) antMessage.error('Không thể tạo lưu ý. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Error generating warning:', error);
      if (!silent) antMessage.error('Có lỗi xảy ra khi tạo lưu ý');
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
        .map(product => {
          const parts = [];
          if (product.description) parts.push(`Mô tả: ${product.description}`);
          if (product.ingredient && product.ingredient.length > 0) parts.push(`Thành phần: ${product.ingredient.join(', ')}`);
          if (product.notes) parts.push(`Ghi chú: ${product.notes}`);
          const detail = parts.length > 0 ? parts.join(' | ') : 'Không có thông tin';
          return `- ${product.trade_name || product.name}: ${detail}`;
        })
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
          antMessage.warning('⚠️ Phát hiện xung đột với đơn hàng trước!');
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
    
    // Kiểm tra xem sản phẩm đã có trong danh sách chưa
    const currentItems = getValues('items') || [];
    const existingItemIndex = currentItems.findIndex((item: any) => Number(item.product_id) === Number(product.id));

    if (existingItemIndex !== -1) {
      // Nếu sản phẩm đã tồn tại, hiển thị thông báo và không thêm mới (sử dụng antMessage cho context antd)
      antMessage.warning(`Sản phẩm "${product.trade_name || product.name}" đã có trong danh sách!`);
      setProductSearch('');
      return;
    }

    // Nếu là công nợ -> dùng giá nợ (nếu có), ngược lại dùng giá tiền mặt
    const priceType = isDebt ? 'credit' : 'cash';
    const baseCostPrice = resolveProductCostByPriceType(product, priceType);
    
    let unitPrice = Number(product.price) || 0;
    // Nếu chọn nợ và sản phẩm có giá nợ -> dùng giá nợ
    if (isDebt && product.credit_price && Number(product.credit_price) > 0) {
        unitPrice = Number(product.credit_price);
    }

    // Tìm đơn vị bán hàng mặc định (ưu tiên đơn vị gốc nếu nó cũng là đơn vị bán hàng)
    const salesConv = product.unit_conversions?.find((c: any) => c.is_sales_unit && c.unit_id === product.unit_id)
                   || product.unit_conversions?.find((c: any) => c.is_sales_unit);
    
    const saleUnitId = salesConv ? salesConv.unit_id : product.unit_id;
    const factor = salesConv ? Number(salesConv.conversion_factor) : 1;
    const unitName = salesConv 
      ? (salesConv.is_base_unit ? (salesConv.unit?.name || salesConv.unit_name) : `${salesConv.unit?.name || salesConv.unit_name} (${factor})`)
      : (product.unit_name || product.unit?.name || '');

    prepend({
      product_id: Number(product.id),
      product_name: product.trade_name || product.name,
      unit_name: unitName,
      quantity: 1,
      unit_price: Number(unitPrice) || 0,
      discount_amount: 0,
      notes: '',
      price_type: priceType,
      average_cost_price: baseCostPrice,
      cash_cost_price: parseProductMoney(product.cash_cost_price),
      credit_cost_price: parseProductMoney(product.credit_cost_price),
      costing_method: product.costing_method || 'fixed',
      stock_quantity: Number(product.quantity || 0),
      taxable_quantity_stock: Number(product.taxable_quantity_stock || 0),
      tax_selling_price: '0',
      sale_unit_id: Number(saleUnitId),
      conversion_factor: Number(factor) || 1,
      base_quantity: Number(factor) || 1,
      conversions: product.unit_conversions || [],
    });

    // ✅ Mặc định đưa sản phẩm mới vào danh sách phân tích kỹ thuật
    setSelectedProductIdsForAdvisory(prev => [...prev, product.id]);
  };

  // Hàm xóa sản phẩm khỏi danh sách và đồng thời xóa khỏi selectedProductIdsForAdvisory
  const handleRemoveProduct = (index: number) => {
    const currentItems = getValues('items') || [];
    const productToRemove = currentItems[index];
    
    if (productToRemove) {
      // Xóa product_id khỏi selectedProductIdsForAdvisory
      setSelectedProductIdsForAdvisory(prev => 
        prev.filter(id => id !== productToRemove.product_id)
      );
    }
    
    // Xóa sản phẩm khỏi form
    remove(index);
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
        antMessage.error('Vui lòng chọn Mùa vụ cho khách hàng này');
        return;
      }
      if (!data.rice_crop_id) {
        antMessage.error('Vui lòng chọn Ruộng lúa cho khách hàng này');
        return;
      }
    }

    const byPriceTypeCount = (data.items || []).filter(
      (item) => item.costing_method === 'by_price_type',
    ).length;
    if (byPriceTypeCount > 0 && byPriceTypeCount < (data.items || []).length) {
      antMessage.error(
        'Không được trộn lúa giống quyết toán theo loại bán với sản phẩm thường trong cùng một phiếu bán.',
      );
      return;
    }

    for (const item of data.items || []) {
      if (item.costing_method === 'by_price_type' && Number(item.average_cost_price || 0) <= 0) {
        const priceTypeLabel = item.price_type === 'credit' ? 'bán nợ' : 'tiền mặt';
        antMessage.error(
          `Sản phẩm "${item.product_name}" chưa có giá vốn ${priceTypeLabel}. Vui lòng cập nhật lại trong danh mục sản phẩm.`
        );
        return;
      }
    }
    
    const remainingAmount = data.final_amount - data.partial_payment_amount;
    
    // ✅ Validation cho delivery_log nếu NGƯỜI DÙNG ĐÃ BẬT tính năng tạo phiếu giao
    if (isDeliveryEnabled) {
      // Nếu bật nhưng không có data hoặc thiếu thông tin → BẮT BUỘC phải điền đủ
      if (!deliveryData) {
        antMessage.error('Vui lòng điền đầy đủ thông tin phiếu giao hàng');
        return;
      }
      // Kiểm tra các trường bắt buộc
      if (!deliveryData.delivery_date) {
        antMessage.error('Vui lòng chọn ngày giao hàng');
        return;
      }
      if (!deliveryData.delivery_start_time) {
        antMessage.error('Vui lòng chọn giờ giao hàng');
        return;
      }
      if (!deliveryData.receiver_name) {
        antMessage.error('Vui lòng nhập tên người nhận');
        return;
      }
      if (!deliveryData.receiver_phone) {
        antMessage.error('Vui lòng nhập SĐT người nhận');
        return;
      }
      if (!deliveryData.delivery_address) {
        antMessage.error('Vui lòng nhập địa chỉ giao hàng');
        return;
      }
      if (!deliveryData.items || deliveryData.items.length === 0) {
        antMessage.error('Vui lòng chọn ít nhất 1 sản phẩm để giao');
        return;
      }
    }
    
    // Chuẩn bị delivery_log nếu có
    let deliveryLogData = deliveryData;
    if (deliveryData && deliveryData.items) {
      deliveryLogData = {
        ...deliveryData,
        items: deliveryData.items.map((item) => ({
          ...item,
          // sales_invoice_item_id chính là index trong danh sách sản phẩm
          sales_invoice_item_id: item.sales_invoice_item_id,
        })),
      };
    }
    
    
    const submitData = {
      ...data,
      items: [...(data.items || [])].reverse(), // Đảo ngược lại để đúng thứ tự thêm vào (cũ nhất lên đầu)
      remaining_amount: remainingAmount,
      customer_id: data.customer_id || null,
      delivery_log: deliveryLogData || undefined,
    };

    // Debug logs
    console.log('📦 Delivery Data:', deliveryData);
    console.log('📤 Submit Data:', submitData);
    console.log('🚚 Delivery Log in Submit:', submitData.delivery_log);

    if (isEditMode && id) {
      // Update existing invoice
      updateMutation.mutate({ id: parseInt(id), invoice: submitData as any, silent: true }, {
        onSuccess: () => {
          antMessage.success('Cập nhật hóa đơn thành công!');
          navigate(`/sales-invoices${location.search}`);
        }
      });
    } else {
      // Create new invoice
      createMutation.mutate({ invoice: submitData as any, silent: true }, {
        onSuccess: (response) => {
          antMessage.success('Tạo hóa đơn thành công!');
          
          // Nếu người dùng chọn in phiếu giao hàng
          const responseData = response as any;
          if (shouldPrintDelivery && responseData?.delivery_logs && responseData.delivery_logs.length > 0) {
            const deliveryLogId = responseData.delivery_logs[0].id;
            // Mở trang in phiếu giao hàng trong tab mới
            window.open(`/delivery-logs/print/${deliveryLogId}`, '_blank');
          }
          
          navigate(`/sales-invoices${location.search}`);
        }
      });
    }
  };

  const handleFormInvalid = (formErrors: typeof errors) => {
    notifyFormErrors(formErrors, 'Vui lòng kiểm tra lại thông tin hóa đơn');
  };

  const totalAmount = watch('total_amount');
  const finalAmount = watch('final_amount');
  const remainingAmount = finalAmount - partialPaymentAmount;

  // ============ TECHNICAL ADVISORY FUNCTIONS ============

  // Get products in invoice for advisory (using full detailed data from useProductsByIdsQuery)
  const invoiceProducts = useMemo(() => {
    if (!fullInvoiceProducts) return [];
    
    // Sắp xếp lại theo thứ tự items trong hóa đơn để đồng bộ giao diện
    return items.map(item => {
      return fullInvoiceProducts.find(p => p.id === item.product_id);
    }).filter((p): p is Product => p !== undefined);
  }, [items, fullInvoiceProducts]);

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
      `- ${product.trade_name || product.name}:
        + Thành phần: ${product.ingredient?.join(', ') || 'Không có'}
        + Mô tả: ${product.description || 'Không có'}
        + Ghi chú: ${product.notes || 'Không có'}`
    ).join('\n');
    
    return `Phân tích khả năng phối trộn CHUNG của nhóm thuốc dưới đây trong cùng 1 bình phun.
QUAN TRỌNG: TRẢ LỜI HOÀN TOÀN BẰNG TIẾNG VIỆT, CỰC KỲ NGẮN GỌN.

Yêu cầu về nội dung:
1. Nếu tất cả phối trộn được: Trả về duy nhất 1 dòng "Kết luận: CÓ. Lý do: Các hoạt chất này an toàn khi phối trộn chung."
2. Nếu có cặp thuốc kỵ nhau: Chỉ liệt kê các cặp kỵ nhau đó (Tên thuốc + Lý do ngắn gọn). Không liệt kê các cặp an toàn.

Danh sách thuốc cần phân tích:
${productInfo}`;
  };

  const createSortPrompt = (products: Product[]): string => {
    const productInfo = products.map((product: Product) => 
      `- ${product.trade_name || product.name}:
        + Thành phần: ${product.ingredient?.join(', ') || 'Không có'}
        + Mô tả: ${product.description || 'Không có'}
        + Ghi chú: ${product.notes || 'Không có'}`
    ).join('\n');
    
    return `Sắp xếp thứ tự hòa tan các loại thuốc sau vào bình phun (Từ ưu tiên 1 đến hết).
QUAN TRỌNG: TRẢ LỜI HOÀN TOÀN BẰNG TIẾNG VIỆT, CỰC KỲ NGẮN GỌN.

Yêu cầu trả lời:
1. Chỉ liệt kê danh sách theo thứ tự: 1. [Tên thuốc] -> 2. [Tên thuốc]...
2. Một câu giải thích ngắn gọn tại sao sắp xếp như vậy (ví dụ: Thứ tự pha theo quy tắc bột -> nước -> dầu).

Danh sách thuốc:
${productInfo}`;
  };

  const createSprayingPrompt = (forecastData: SimplifiedWeatherData[]): string => {
    const forecastInfo = forecastData.map(item => 
      `- Thời gian: ${item.time}, Nhiệt độ: ${item.temperature}°C, Trời: ${item.description}, Khả năng mưa: ${item.precipitation_probability}%, Lượng mưa: ${item.rain_amount}mm, Gió: ${item.wind_speed}m/s, Độ ẩm: ${item.humidity}%`
    ).join('\n');
    
    return `Dựa trên dữ liệu dự báo thời tiết đã lọc (CHỈ BAO GỒM KHUNG GIỜ PHUN THUỐC TỐT NHẤT: Sáng 7:30-9:00 và Chiều 16:00-19:00), hãy phân tích và tìm ra các thời điểm phun thuốc tốt nhất.
    
    DỮ LIỆU DỰ BÁO THỜI TIẾT:
    ${forecastInfo}
    
    YÊU CẦU QUAN TRỌNG VỀ CHỌN KHUNG GIỜ:
    1. Với MỖI NGÀY có trong dữ liệu, hãy chọn ra ĐÚNG 3 mốc thời gian theo thứ tự ưu tiên:
       - BUỔI SÁNG (7:30 - 9:00): Chọn 1 mốc tốt nhất.
       - BUỔI CHIỀU (16:00 - 19:00): Chọn 2 mốc tốt nhất.
       - Chỉ khi KHÔNG ĐỦ giờ ở buổi sáng hoặc chiều, mới lấy thêm từ buổi trưa (12:00-15:59).
    
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
          const { timestamp, recommendations } = JSON.parse(cachedData);
          if (Date.now() - timestamp < 30 * 60 * 1000) {
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
      
      // Lọc lấy khung giờ phun thuốc (ưu tiên sáng + chiều, fallback trưa):
      // - Sáng: 7:30 - 9:00
      // - Chiều: 16:00 - 19:00
      // - Trưa: 12:00 - 15:59 (fallback)
      const optimalHoursData = filteredData.filter(item => {
        const date = new Date(item.dt * 1000);
        const hour = date.getHours();
        const minute = date.getMinutes();
        
        // Sáng: 7:30 - 9:00 (7h30 đến trước 9h)
        const isMorning = (hour === 7 && minute >= 30) || (hour === 8);
        
        // Chiều: 16:00 - 19:00 (4h chiều đến 7h tối)
        const isAfternoon = hour >= 16 && hour < 19;
        
        // Trưa: 12:00 - 15:59 (fallback khi không đủ sáng/chiều)
        const isNoon = hour >= 12 && hour < 16;
        
        return isMorning || isAfternoon || isNoon;
      });
      
      // Lưu dữ liệu đầy đủ (tất cả giờ trong 2 ngày) cho phần hiển thị tabs
      setFullWeatherForecast(filteredData);
      
      const simplifiedData = weatherService.simplifyWeatherData(optimalHoursData);
      
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
          forecast: optimalHoursData,
          recommendations: recommendations
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      } catch (e) {
        console.error('Lỗi lưu cache:', e);
      }

    } catch (err) {
      const errorMessage = (err as Error).message || 'Có lỗi khi lấy dữ liệu thời tiết';
      console.error(errorMessage);
      antMessage.error('Không thể lấy dữ liệu thời tiết mới nhất');
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
      antMessage.error('Trình duyệt của bạn không hỗ trợ định vị.');
      return;
    }

    const hide = antMessage.loading('Đang xác định vị trí chi tiết...', 0);

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
          // Lưu vào database
          updateLocationMutation.mutate({
            name: detailedName,
            lat: latitude,
            lon: longitude
          });
          hide();
          antMessage.success(`Đã cập nhật: ${detailedName}`);
        } catch (error) {
          hide();
          antMessage.error('Không thể lấy tên địa điểm chi tiết.');
          
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
        antMessage.error('Không thể lấy vị trí. Vui lòng kiểm tra quyền truy cập.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Sync location từ database khi diseaseLocation thay đổi
  useEffect(() => {
    if (diseaseLocation) {
      setSelectedLocation({
        id: 'db-location',
        name: diseaseLocation.name,
        latitude: diseaseLocation.lat,
        longitude: diseaseLocation.lon,
        region: '📍 Vị trí từ hệ thống'
      });
    }
  }, [diseaseLocation]);

  useEffect(() => {
    if (currentTab === 1) {
      // Nếu chưa có location trong DB, tự động lấy GPS
      if (!diseaseLocation) {

        detectUserLocation();
      }
      fetchWeatherForecast();
    }
  }, [currentTab, diseaseLocation]);


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
    const items = [...(getValues('items') || [])].reverse(); // Đảo ngược lại để in món cũ trước, món mới sau
    return generatePrintContentUtil({
      paperSize,
      printSections,
      customerInfo: {
        name: watch('customer_name'),
        phone: watch('customer_phone'),
        address: watch('customer_address'),
        warning: watch('warning'),
        notes: watch('notes'),
      },
      items,
      formatCurrency,
      finalAmount,
      partialPaymentAmount,
      remainingAmount,
      seasonStats: {
        customerId,
        seasonId,
        stats: customerSeasonStats,
        seasonsData: seasons,
      },
      delivery: {
        isEnabled: isDeliveryEnabled,
        shouldPrint: shouldPrintDelivery,
        data: deliveryData,
      },
      advisory: {
        sections: selectedAdvisorySections,
        mixResult,
        sortResult,
        sprayingRecommendations,
      },
      disease: {
        location: diseaseLocation,
        selectedDiseases: selectedPrintDiseases,
        availableWarnings,
      }
    });
  };

  const handlePrint = () => {
    // Initialize selected diseases with all available ones (or filter by high risk if desired)
    const allWarningIds = availableWarnings.map(w => w.id);
    setSelectedPrintDiseases(allWarningIds);
    
    // Tự động tick "In phiếu giao hàng" nếu đã enable delivery
    if (isDeliveryEnabled) {
      setShouldPrintDelivery(true);
    }
    
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
          <IconButton onClick={() => confirmExit(() => navigate(`/sales-invoices${location.search}`))} sx={{ mr: { xs: 1, md: 2 } }}>
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
              display: { xs: 'none', sm: 'flex' },
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

      <form onSubmit={handleSubmit(onSubmit, handleFormInvalid)}>
        {/* TAB 1: Invoice Information */}
        <TabPanel value={currentTab} index={0}>
          {Object.keys(errors).length > 0 && (
            <Alert severity="error" sx={{ mb: 3 }}>
              Vui lòng kiểm tra lại các thông tin còn thiếu hoặc sai định dạng trong hóa đơn (Tên khách hàng, SĐT, Ruộng lúa, Sản phẩm...).
            </Alert>
          )}
          <Grid container spacing={3}>
            
            {/* Customer Information */}
            <Grid item xs={12} md={6}>
              <CustomerInfoSection
                control={control}
                customers={customers}
                customerSearch={customerSearch}
                setCustomerSearch={setCustomerSearch}
                handleCustomerSelect={handleCustomerSelect}
                selectedCustomer={selectedCustomer}
                isGuestCustomer={isGuestCustomer}
                customerSeasonStats={customerSeasonStats}
                formatCurrency={formatCurrency}
              />
            </Grid>

            {/* Invoice Information */}
            <Grid item xs={12} md={6}>
              <InvoiceInfoSection
                control={control}
                setValue={setValue}
                selectedCustomer={selectedCustomer}
                seasons={seasons}
                customerRiceCrops={customerRiceCrops}
                isLoadingRiceCrops={isLoadingRiceCrops}
                latestInvoice={latestInvoice}
                conflictWarning={conflictWarning}
                isCheckingConflict={isCheckingConflict}
                isGeneratingWarning={isGeneratingWarning}
                handleGenerateWarning={handleGenerateWarning}
                items={items}
              />
            </Grid>

            {/* Products */}
            <Grid item xs={12}>
              <ProductsSection
                control={control}
                watch={watch}
                setValue={setValue}
                fields={fields}
                remove={handleRemoveProduct}
                productsData={productsData}
                productSearch={productSearch}
                setProductSearch={setProductSearch}
                handleAddProduct={handleAddProduct}
                formatCurrency={formatCurrency}
                selectedProductIdsForAdvisory={selectedProductIdsForAdvisory}
                setSelectedProductIdsForAdvisory={setSelectedProductIdsForAdvisory}
                latestInvoice={latestInvoice}
                errors={errors}
              />
            </Grid>

            {/* Delivery Information */}
            <Grid item xs={12}>
              <DeliveryInfoSection
                items={items.map((item, index) => ({
                  id: index,
                  product_id: item.product_id,
                  product_name: item.product_name || '',
                  quantity: item.quantity,
                  unit_price: item.unit_price,
                  unit: item.unit_name || '',
                }))}
                customerAddress={watch('customer_address')}
                customerName={watch('customer_name')}
                customerPhone={watch('customer_phone')}
                onChange={setDeliveryData}
                onEnableChange={setIsDeliveryEnabled}
                initialValue={deliveryData || undefined}
              />
            </Grid>

            {/* Payment Summary */}
            <Grid item xs={12}>
              <PaymentSummarySection
                control={control}
                totalAmount={totalAmount}
                finalAmount={finalAmount}
                partialPaymentAmount={partialPaymentAmount}
                formatCurrency={formatCurrency}
                customerId={customerId}
                seasonId={seasonId}
              />
            </Grid>

            {/* Actions */}
            <Grid item xs={12}>
              <InvoiceActions
                onCancel={() => confirmExit(() => navigate(`/sales-invoices${location.search}`))}
                onSaveDraft={handleSubmit((data) => onSubmit({ ...data, status: 'draft' }), handleFormInvalid)}
                onSaveConfirm={handleSubmit((data) => {
                  let status: 'draft' | 'confirmed' | 'paid' = 'confirmed';
                  if (data.payment_method === 'cash' && (data.final_amount - data.partial_payment_amount) <= 0) {
                    status = 'paid';
                  }
                  onSubmit({ ...data, status });
                }, handleFormInvalid)}
                isPending={createMutation.isPending}
                calculatedProfit={calculatedProfit}
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* TAB 2: Technical Advisory */}
        <TabPanel value={currentTab} index={1}>
          <TechnicalAdvisoryTab 
            currentTab={currentTab}
            selectedLocation={selectedLocation}
            detectUserLocation={detectUserLocation}
            setIsMapModalVisible={setIsMapModalVisible}
            updateLocationMutation={updateLocationMutation}
            antMessage={antMessage}
            items={items}
            invoiceProducts={invoiceProducts}
            selectedProductIdsForAdvisory={selectedProductIdsForAdvisory}
            handleProductToggleForAdvisory={handleProductToggleForAdvisory}
            handleAnalyze={handleAnalyze}
            handlePrint={handlePrint}
            isAnalyzing={isAnalyzing}
            mixResult={mixResult}
            sortResult={sortResult}
            sprayingRecommendations={sprayingRecommendations}
            isWeatherLoading={isWeatherLoading}
            error={error}
            fullWeatherForecast={fullWeatherForecast}
            fetchWeatherForecast={fetchWeatherForecast}
            formatTime={formatTime}
          />
        </TabPanel>

        {/* TAB 3: Disease Warning */}
        <TabPanel value={currentTab} index={2}>
          <DiseaseWarningTab 
            diseaseWarningTab={diseaseWarningTab}
            setDiseaseWarningTab={setDiseaseWarningTab}
            diseaseLocation={diseaseLocation}
            updateLocationMutation={updateLocationMutation}
            riceBlastWarning={riceBlastWarning}
            bacterialBlightWarning={bacterialBlightWarning}
            stemBorerWarning={stemBorerWarning}
            gallMidgeWarning={gallMidgeWarning}
            brownPlantHopperWarning={brownPlantHopperWarning}
            sheathBlightWarning={sheathBlightWarning}
            grainDiscolorationWarning={grainDiscolorationWarning}
            runRiceBlastMutation={runRiceBlastMutation}
            runBacterialBlightMutation={runBacterialBlightMutation}
            runStemBorerMutation={runStemBorerMutation}
            runGallMidgeMutation={runGallMidgeMutation}
            runBrownPlantHopperMutation={runBrownPlantHopperMutation}
            runSheathBlightMutation={runSheathBlightMutation}
            runGrainDiscolorationMutation={runGrainDiscolorationMutation}
          />
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
            // Lưu vào database
            updateLocationMutation.mutate({
              name: location.name,
              lat: location.latitude,
              lon: location.longitude
            });
            setIsMapModalVisible(false);
          }}
        />
      </AntModal>

      {/* Print Options Modal */}
      <PrintOptionsModal 
        isVisible={isPrintModalVisible}
        onCancel={() => setIsPrintModalVisible(false)}
        onOk={handlePrintConfirm}
        isPrintOptionsOpen={isPrintOptionsOpen}
        setIsPrintOptionsOpen={setIsPrintOptionsOpen}
        paperSize={paperSize}
        setPaperSize={setPaperSize}
        printSections={printSections}
        handlePrintSectionChange={handlePrintSectionChange}
        isDeliveryEnabled={isDeliveryEnabled}
        shouldPrintDelivery={shouldPrintDelivery}
        setShouldPrintDelivery={setShouldPrintDelivery}
        deliveryData={deliveryData}
        mixResult={mixResult}
        sortResult={sortResult}
        sprayingRecommendations={sprayingRecommendations}
        selectedAdvisorySections={selectedAdvisorySections}
        setSelectedAdvisorySections={setSelectedAdvisorySections}
        diseaseLocation={diseaseLocation}
        availableWarnings={availableWarnings}
        selectedPrintDiseases={selectedPrintDiseases}
        setSelectedPrintDiseases={setSelectedPrintDiseases}
        generatePrintContent={generatePrintContent}
      />

      {/* Print Styles */}
      <style>{`
        /* Mobile: Options trong drawer slide từ trái */
        @media (max-width: 768px) {
          .print-options-modal .ant-modal {
            max-width: 100vw !important;
            margin: 0 !important;
            top: 0 !important;
            padding: 0 !important;
          }
          
          .print-options-modal .ant-modal-content {
            height: 100vh;
            border-radius: 0;
            display: flex;
            flex-direction: column;
            overflow: hidden;
          }
          
          .print-options-modal .ant-modal-body {
            flex: 1;
            overflow: hidden;
            padding: 0 !important;
            position: relative;
            background: #f0f2f5;
          }
          
          /* Options column - Drawer style - SỬA LẠI THỨ TỰ THẺ (NƠI CHỨA CÁC CHECKBOX) */
          .print-options-modal .MuiGrid-root > .MuiGrid-item:nth-child(2) {
            position: absolute;
            left: 0;
            top: 0;
            height: 100%;
            width: 85%;
            max-width: 320px;
            background: white;
            z-index: 101; /* Luôn cao hơn lớp phủ (100) */
            box-shadow: 4px 0 15px rgba(0,0,0,0.15);
            overflow-y: auto;
            padding: 16px !important;
            transform: translateX(-105%);
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border-right: 1px solid #e8e8e8;
            visibility: hidden;
          }
          
          .print-options-modal .MuiGrid-root > .MuiGrid-item:nth-child(2).open {
            transform: translateX(0);
            visibility: visible;
          }
          
          /* Preview column - Full screen */
          .print-options-modal .MuiGrid-root > .MuiGrid-item:nth-child(3) {
            width: 100% !important;
            max-width: 100% !important;
            flex-basis: 100% !important;
            padding: 0 !important;
            height: 100%;
            z-index: 1;
          }
          
          /* Giảm padding các checkbox items */
          .print-options-modal .MuiFormControlLabel-root {
            margin-top: 2px !important;
            margin-bottom: 2px !important;
            padding: 4px 8px;
            border-radius: 8px;
            width: 100%;
          }
          
          .print-options-modal .MuiFormControlLabel-label {
            font-size: 0.9rem !important;
          }
          
          /* Tùy chỉnh Header Modal trên mobile */
          .print-options-modal .ant-modal-title {
            display: block !important;
            width: 100%;
          }
          .print-options-modal .ant-modal-header {
             padding: 10px 16px !important;
             margin-bottom: 0 !important;
             background: #f8f9fa;
             border-bottom: 1px solid #e8e8e8;
          }

          /* Overlay Fade effect */
          .drawer-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5); /* Đậm hơn chút cho rõ */
            z-index: 100; /* Nằm dưới Drawer (101) */
            transition: opacity 0.3s ease;
            opacity: 0;
            pointer-events: none;
          }
          .drawer-overlay.visible {
            opacity: 1;
            pointer-events: auto;
          }
        }
        
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
