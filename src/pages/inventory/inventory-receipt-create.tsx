import React, { useState, useEffect, useCallback, useMemo } from "react"
import { useNavigate, useParams, useLocation } from "react-router-dom"
import {
  Card,
  Button,
  Table,
  Typography,
  Alert,
  Divider,
  Checkbox,
  Radio,
  Space,
  Upload,
} from "antd"
import { toast } from "react-toastify"
import { notifyFormErrors } from "@/utils/form-error"
import type { UploadFile } from "antd"
import {
  ArrowLeftOutlined,
  PlusOutlined,
  SaveOutlined,
} from "@ant-design/icons"
import dayjs from "dayjs"


// Import MobileItemCard từ components
import MobileItemCard from "./components/receipt-create/mobile-item-card"
// Import itemColumns từ components
import useItemColumns from "./components/receipt-create/item-columns"
import { useForm, useFieldArray, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { 
  FormField, 
  FormComboBox, 
  FormFieldNumber, 
  FormDatePicker, 
  FormImageUpload,
} from "@/components/form"
import { 
  receiptFormSchema, 
  ReceiptFormData, 
  defaultReceiptValues 
} from "./receipt-form-config"




import {
  CreateInventoryReceiptRequest,
  InventoryReceiptStatus,
  getInventoryReceiptStatusText,
} from "@/models/inventory.model"
import { 
  useCreateInventoryReceiptMutation,
  useUpdateInventoryReceiptMutation,
  useInventoryReceiptQuery,
  useInventoryReceiptItemsQuery,
  useUploadFileMutation,
} from "@/queries/inventory"
import { useMobile, useTablet } from "@/hooks/use-media-query"
import { useProductSearch } from "@/queries/product"
import { useSupplierSearch } from "@/queries/supplier"
import { useFormGuard } from "@/hooks/use-form-guard"



const { Title, Text } = Typography


const InventoryReceiptCreate: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const receiptId = id ? Number(id) : undefined
  const isEditMode = !!receiptId
  
  const isMobile = useMobile()
  const isTablet = useTablet()




  // State tìm kiếm sản phẩm và nhà cung cấp
  const [searchTerm, setSearchTerm] = useState("")
  const [supplierSearchTerm, setSupplierSearchTerm] = useState("")

  // State lưu sản phẩm ban đầu từ existingItems (để ComboBox hiển thị tên thay vì ID)
  const [initialProductOptions, setInitialProductOptions] = useState<{ value: number; label: string; [key: string]: any }[]>([])

  const {
    control,
    handleSubmit: handleFormSubmit,
    setValue,
    getValues,
    watch,
    formState: { isDirty },
    reset,
  } = useForm<ReceiptFormData>({
    resolver: zodResolver(receiptFormSchema),
    defaultValues: defaultReceiptValues,
  })


  // Sử dụng hook product search ở cấp cao hơn
  const {
    data,
    isLoading,
    isFetching,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useProductSearch(searchTerm, 20, true)

  // Flatten data từ tất cả pages
  const productOptionsFromSearch = useMemo(() => {
    if (!data?.pages) return []
    return data.pages.flatMap((page) => {
      if (!page || !page.data) return []
      return page.data.map((product: any) => ({
        ...product,
        label: product.trade_name || product.name,
        value: product.id,
        scientific_name: product.name,
        unit_name: product.unit?.name || product.unit_name || "",
      }))
    })
  }, [data?.pages])

  // Merge sản phẩm ban đầu (từ existingItems) với kết quả tìm kiếm, tránh trùng lặp
  const productOptions = useMemo(() => {
    const searchIds = new Set(productOptionsFromSearch.map((p) => p.value))
    const dedupedInitials = initialProductOptions.filter((p) => !searchIds.has(p.value))
    return [...dedupedInitials, ...productOptionsFromSearch]
  }, [productOptionsFromSearch, initialProductOptions])

  // Gộp sản phẩm hiện có và sản phẩm tìm kiếm để không bị mất text hiển thị khi search
  const combinedProductOptions = useMemo(() => {
    const searchOptions = productOptions || []
    // Tạo Map để giữ unique by value (ID)
    const optionsMap = new Map();
    
    // Ưu tiên sản phẩm tìm kiếm mới nhất
    searchOptions.forEach(opt => optionsMap.set(opt.value, opt));
    
    // Bổ sung các sản phẩm ban đầu nếu chưa có trong kết quả tìm kiếm
    initialProductOptions.forEach(opt => {
      if (!optionsMap.has(opt.value)) {
        optionsMap.set(opt.value, opt);
      }
    });
    
    return Array.from(optionsMap.values());
  }, [productOptions, initialProductOptions])

  // Phụ thuộc của combo box
  const comboBoxProps = useMemo(() => ({
    data: combinedProductOptions,
    isLoading,
    isFetching,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    onSearch: setSearchTerm,
  }), [
    combinedProductOptions,
    isLoading,
    isFetching,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  ])

  const { fields: itemFields, prepend, remove } = useFieldArray({
    control,
    name: "items",
  })

  // Watch các giá trị để tính toán động
  const watchedItems = watch("items") || []
  const watchedHasSharedShipping = watch("hasSharedShipping")
  const watchedSharedShippingCost = watch("sharedShippingCost") || 0
  const watchedPaymentType = watch("paymentType")
  const watchedStatus = watch("status") // Theo dõi trạng thái phiếu nhập
  const watchedDiscountType = watch("discountType")
  const watchedDiscountValue = watch("discountValue") || 0
  const watchedDiscountMethod = watch("discountMethod")
  
  const isApproved = isEditMode && watchedStatus === 'approved'
  
  // State và hooks tìm kiếm nhà cung cấp
  const {
    data: supplierData,
    isLoading: supplierLoading,
    isFetching: supplierFetching,
    hasNextPage: supplierHasNextPage,
    isFetchingNextPage: supplierFetchingNextPage,
    fetchNextPage: supplierFetchNextPage,
  } = useSupplierSearch(supplierSearchTerm, 50, true)

  const supplierOptions = useMemo(() => {
    if (!supplierData?.pages) return []
    return supplierData.pages.flatMap((page) => 
      (page?.data || []).map((s: any) => ({
        value: s.id,
        label: s.name,
        ...s
      }))
    )
  }, [supplierData?.pages])

  const { confirmExit } = useFormGuard(isDirty);


  // Queries
  const createReceiptMutation = useCreateInventoryReceiptMutation()
  const updateReceiptMutation = useUpdateInventoryReceiptMutation()
  const uploadFileMutation = useUploadFileMutation()
  
  // Load dữ liệu khi edit mode (hooks đã có enabled built-in)
  const { data: existingReceipt, isLoading: isLoadingReceipt } = useInventoryReceiptQuery(receiptId || 0)
  const { data: existingItems, isLoading: isLoadingItems } = useInventoryReceiptItemsQuery(receiptId || 0)


  // Pre-fill form khi load dữ liệu trong edit mode
  useEffect(() => {
    if (isEditMode && existingReceipt && existingItems && !isLoadingReceipt && !isLoadingItems) {
      const receipt = existingReceipt as any
      
      // Mapped items - resolve đúng đơn vị tính từ snapshot DB và conversions
      const mappedItems = existingItems.map((item: any) => {
        const conversions = item.product?.unit_conversions || [];

        // Ưu tiên: unit_id lưu trong DB → nếu null thì tìm đơn vị cơ sở từ conversions
        let resolvedUnitId = item.unit_id ?? undefined;
        if (!resolvedUnitId && conversions.length > 0) {
          const baseConv = conversions.find((c: any) => c.is_base_unit);
          resolvedUnitId = baseConv?.unit_id ?? undefined;
        }

        // Ưu tiên: unit_name snapshot trong DB → tìm từ conversion khớp unit_id → fallback product.unit.name
        let resolvedUnitName = item.unit_name || '';
        if (!resolvedUnitName && resolvedUnitId) {
          const matchConv = conversions.find((c: any) => c.unit_id === resolvedUnitId);
          resolvedUnitName = matchConv?.unit?.name || matchConv?.unit_name || '';
        }
        if (!resolvedUnitName) {
          resolvedUnitName = item.product?.unit?.name || '';
        }

        return {
          product_id: item.product_id,
          product_name: item.product_name || item.product?.trade_name || item.product?.name || '',
          scientific_name: item.product?.name || '',
          unit_name: resolvedUnitName,
          quantity: item.quantity,
          unit_cost: Number(item.unit_cost || item.unitPrice || 0),
          vat_unit_cost: Number(item.vat_unit_cost ?? 0),
          total_price: Number(item.total_price || 0),
          individual_shipping_cost: Number(item.individual_shipping_cost || 0),
          expiry_date: item.expiry_date,
          notes: item.notes,
          taxable_quantity: item.taxable_quantity || 0,
          unit_id: resolvedUnitId,
          conversion_factor: Number(item.conversion_factor || 1),
          base_quantity: Number(item.base_quantity || item.quantity),
          conversions,
        };
      }).reverse()

      // Tạo danh sách option sản phẩm từ existingItems để ComboBox hiển thị tên thay vì ID
      const initOpts = existingItems
        .filter((item: any) => item.product_id)
        .map((item: any) => ({
          value: item.product_id,
          label: item.product?.trade_name || item.product?.name || item.product_name || String(item.product_id),
          name: item.product?.name || '',
          trade_name: item.product?.trade_name || item.product?.name || item.product_name || '',
          unit_id: item.unit_id,
          unit_name: item.product?.unit?.name || item.unit_name || '',
          unit_conversions: item.product?.unit_conversions || [],
          cost_price: item.unit_cost,
          average_vat_input_cost: item.vat_unit_cost,
        }))
      setInitialProductOptions(initOpts)

      // Reset toàn bộ form với dữ liệu mới
      reset({
        supplierId: existingReceipt.supplier_id,
        status: existingReceipt.status_code || existingReceipt.status || 'draft',
        bill_date: existingReceipt.bill_date ? dayjs(existingReceipt.bill_date) : dayjs(existingReceipt.created_at),
        description: existingReceipt.notes || '',
        items: mappedItems.reverse(),
        hasSharedShipping: !!receipt.shared_shipping_cost,
        sharedShippingCost: Number(receipt.shared_shipping_cost || 0),
        allocationMethod: (receipt.shipping_allocation_method as any) || 'by_value',
        paymentType: (receipt.payment_status === 'paid' ? 'full' : (receipt.payment_status === 'partial' ? 'partial' : 'debt')) as any,
        paidAmount: Number(receipt.paid_amount || 0),
        paymentMethod: receipt.payment_method,
        paymentDueDate: receipt.payment_due_date ? dayjs(receipt.payment_due_date) : undefined,

        discountMethod: 'none',
        discountType: receipt.discount_type || 'fixed_amount',
        discountValue: Number(receipt.discount_value || 0),
      })
        setValue('images', receipt.images);
      }
  }, [isEditMode, existingReceipt, existingItems, isLoadingReceipt, isLoadingItems, reset])

  // Reset chiết khấu khi đổi phương thức để tránh tính chồng chéo
  useEffect(() => {
    if (watchedDiscountMethod === 'none') {
      setValue('discountValue', 0)
      const currentItems = getValues('items') || []
      currentItems.forEach((_, index) => {
        setValue(`items.${index}.discountValue`, 0)
      })
    } else if (watchedDiscountMethod === 'per_item') {
      setValue('discountValue', 0)
    } else if (watchedDiscountMethod === 'global') {
      const currentItems = getValues('items') || []
      currentItems.forEach((_, index) => {
        setValue(`items.${index}.discountValue`, 0)
      })
    }
  }, [watchedDiscountMethod, setValue, getValues])

  // Hàm tính tổng tiền (dùng watched values)
  const calculateTotals = () => {
    const totalProductValueRaw = watchedItems.reduce((sum, item) => sum + (Number(item.unit_cost || 0) * Number(item.quantity || 0)), 0)
    
    // 1. Tính chiết khấu riêng trên từng mặt hàng
    const itemsWithNetCost = watchedItems.map(item => {
      const quantity = Number(item.quantity) || 0
      const unitCost = Number(item.unit_cost) || 0
      const itemBaseValue = unitCost * quantity
      
      let itemDisc = 0
      if (watchedDiscountMethod === 'per_item') {
        if (item.discountType === 'percentage') {
          itemDisc = (itemBaseValue * (Number(item.discountValue) || 0)) / 100
        } else {
          itemDisc = Number(item.discountValue) || 0
        }
      }
      
      const valueAfterItemDisc = itemBaseValue - itemDisc
      return {
        ...item,
        itemDiscount: itemDisc,
        valueAfterItemDisc
      }
    })

    const totalValueAfterItemDiscounts = itemsWithNetCost.reduce((sum, item) => sum + item.valueAfterItemDisc, 0)
    const totalItemDiscounts = itemsWithNetCost.reduce((sum, item) => sum + item.itemDiscount, 0)

    // 2. Tính chiết khấu tổng của cả đơn hàng (Global discount)
    let globalDiscountAmount = 0
    if (watchedDiscountMethod === 'global') {
      if (watchedDiscountType === 'percentage') {
        globalDiscountAmount = (totalValueAfterItemDiscounts * (Number(watchedDiscountValue) || 0)) / 100
      } else {
        globalDiscountAmount = Number(watchedDiscountValue) || 0
      }
    }

    // 3. Phân bổ chiết khấu tổng vào từng item để có Giá vốn thực
    const finalItems = itemsWithNetCost.map(item => {
      let allocatedGlobalDisc = 0
      if (globalDiscountAmount > 0 && totalValueAfterItemDiscounts > 0) {
        allocatedGlobalDisc = (item.valueAfterItemDisc / totalValueAfterItemDiscounts) * globalDiscountAmount
      }
      
      const totalDiscountForItem = item.itemDiscount + allocatedGlobalDisc
      const netUnitCost = item.quantity > 0 
        ? Math.round((item.valueAfterItemDisc - allocatedGlobalDisc) / item.quantity)
        : item.unit_cost
      const netTotalValue = Math.round(item.valueAfterItemDisc - allocatedGlobalDisc)
      const totalPriceRaw = item.quantity * item.unit_cost
        
      return {
        ...item,
        totalDiscountForItem,
        netUnitCost,
        netTotalValue,
        totalPriceRaw
      }
    })

    const totalDiscountAmount = totalItemDiscounts + globalDiscountAmount
    
    const totalIndividualShipping = watchedItems.reduce((sum, item) => sum + (Number(item.individual_shipping_cost) || 0), 0)
    const totalSharedShipping = watchedHasSharedShipping ? Number(watchedSharedShippingCost) : 0

    const grandTotal = totalProductValueRaw - totalDiscountAmount + totalIndividualShipping + totalSharedShipping
    
    // Nợ NCC = Tiền hàng thực tế (đã trừ hết chiết khấu)
    const supplierAmount = totalProductValueRaw - totalDiscountAmount
    
    return {
      totalProductValue: Math.round(totalProductValueRaw),
      totalValueAfterItemDiscounts: Math.round(totalValueAfterItemDiscounts),
      totalIndividualShipping: Math.round(totalIndividualShipping),
      totalSharedShipping: Math.round(totalSharedShipping),
      discountAmount: Math.round(totalDiscountAmount),
      globalDiscountAmount: Math.round(globalDiscountAmount),
      totalItemDiscount: Math.round(totalItemDiscounts),
      grandTotal: Math.round(grandTotal),
      supplierAmount: Math.round(supplierAmount),
      finalItems, // Trả về danh sách items kèm giá thực tế
    }
  }

  // Handlers
  const handleBack = () => {
    confirmExit(() => navigate(`/inventory/receipts${location.search}`))
  }

  const handleAddItem = useCallback(() => {
    prepend({
      product_id: 0,
      product_name: "",
      quantity: 1,
      unit_cost: 0,
      vat_unit_cost: 0,
      total_price: 0,
      individual_shipping_cost: 0,
      discountType: 'fixed_amount',
      discountValue: 0,
      discount_amount: 0,
      taxable_quantity: 0,
      unit_id: undefined,
      conversion_factor: 1,
      base_quantity: 1,
      conversions: [],
    })
  }, [prepend])

  const handleDeleteItem = useCallback((index: number) => {
    remove(index)
  }, [remove])

  // Sử dụng hook để lấy cấu hình cột
  const itemColumns = useItemColumns({
    handleDeleteItem,
    comboBoxProps,
    control,
    setValue,
    getValues,
    calculateTotals,
    discountMethod: watchedDiscountMethod,
    isApproved,
  })

  const onSubmit = async (data: ReceiptFormData) => {
    console.log("Submitting form with data:", data);

    try {
      // 1. Lấy danh sách URL ảnh từ form data
      const imageUrls = data.images || [];

      // ========================================================
      // 2A. NẾU PHIẾU ĐÃ DUYỆT: chỉ gửi các trường metadata được phép
      //      (server sẽ từ chối nếu gửi items, status, total_amount...)
      // ========================================================
      if (isApproved && isEditMode && receiptId) {
        const metadataPayload: any = {
          supplier_id: data.supplierId,
          notes: data.description || undefined,
          bill_date: data.bill_date ? dayjs(data.bill_date).format('YYYY-MM-DD') : undefined,
          payment_due_date: data.paymentDueDate ? dayjs(data.paymentDueDate).toISOString() : undefined,
          ...(imageUrls.length > 0 && { images: imageUrls }),
        };
        await updateReceiptMutation.mutateAsync({ id: receiptId, receipt: metadataPayload as any });
        navigate(`/inventory/receipts${location.search}`);
        return;
      }

      // ========================================================
      // 2B. PHIẾU NHÁP: gửi toàn bộ dữ liệu bình thường
      // ========================================================
      const totals = calculateTotals()
      
      let paid_amount = 0;
      let payment_status = 'unpaid' as any;
      if (data.status === 'approved') {
        if (data.paymentType === 'full') {
          paid_amount = totals.supplierAmount;
          payment_status = 'paid';
        } else if (data.paymentType === 'partial') {
          paid_amount = Math.round(data.paidAmount || 0);
          payment_status = 'partial';
        } else {
          paid_amount = 0;
          payment_status = 'unpaid';
        }
      }

      const submissionData: any = {
        supplier_id: data.supplierId,
        total_amount: Math.round(totals.grandTotal),
        notes: data.description,
        bill_date: data.bill_date ? dayjs(data.bill_date).format('YYYY-MM-DD') : undefined,
        status: data.status || "draft",

        created_by: 1,
        shared_shipping_cost: Number(data.sharedShippingCost || 0),
        shipping_allocation_method: data.allocationMethod,
        ...(imageUrls.length > 0 && { images: imageUrls }),
        paid_amount: Number(paid_amount || 0),
        payment_status: payment_status,
        is_shipping_paid_to_supplier: false,
        debt_amount: Math.round(Number(totals.supplierAmount || 0) - Number(paid_amount || 0)),
        payment_method: data.status === 'approved' && data.paymentType !== 'debt' ? data.paymentMethod : null,
        payment_due_date: data.status === 'approved' && data.paymentType !== 'full'
          ? (data.paymentDueDate ? dayjs(data.paymentDueDate).toISOString() : null)
          : null,
        items: totals.finalItems.map((item: any) => ({
          product_id: item.product_id,
          unit_id: item.unit_id,
          unit_name: item.unit_name,
          conversion_factor: item.conversion_factor || 1,
          base_quantity: item.base_quantity || item.quantity,
          quantity: item.quantity,
          taxable_quantity: item.taxable_quantity || 0,
          unit_cost: Number(item.unit_cost || 0),
          vat_unit_cost: Number(item.vat_unit_cost ?? 0),
          total_price: Number(item.totalPriceRaw || 0),
          expiry_date: item.expiry_date ? dayjs(item.expiry_date).toISOString() : undefined,
          notes: item.notes,
          individual_shipping_cost: Number(item.individual_shipping_cost || 0),
          discount_amount: Number(item.itemDiscount || 0),
          discount_value: Number(item.discountValue || 0),
          discount_type: item.discountType || 'fixed_amount',
        })).reverse(),
        discount_amount: 0,
        discount_value: 0,
        discount_type: 'fixed_amount',
      };

      // 3. Gọi API
      if (isEditMode && receiptId) {
        await updateReceiptMutation.mutateAsync({ id: receiptId, receipt: submissionData as any })
      } else {
        await createReceiptMutation.mutateAsync(submissionData as CreateInventoryReceiptRequest)
      }

      navigate(`/inventory/receipts${location.search}`);
    } catch (error) {
      console.error("Error saving receipt:", error)
    }
  }

  // Sử dụng card layout cho cả mobile và tablet
  const useCardLayout = isMobile || isTablet

  /**
   * Xử lý cập nhật metadata cho phiếu đã duyệt - bypass hoàn toàn Zod validation
   * vì phiếu đã duyệt không cho đổi items/payment, chỉ sửa NCC / ngày / ghi chú
   */
  const handleMetadataUpdate = async () => {
    if (!receiptId) return;
    try {
      const data = getValues();

      // Validate đơn giản: phải có nhà cung cấp
      if (!data.supplierId) {
        toast.error('Vui lòng chọn nhà cung cấp');
        return;
      }

      const metadataPayload: any = {
        supplier_id: data.supplierId,
        notes: data.description || undefined,
        bill_date: data.bill_date ? dayjs(data.bill_date).format('YYYY-MM-DD') : undefined,
        payment_due_date: data.paymentDueDate ? dayjs(data.paymentDueDate).toISOString() : undefined,
        shared_shipping_cost: data.hasSharedShipping ? data.sharedShippingCost : 0,
        shipping_allocation_method: data.allocationMethod,
        images: data.images || [],
      };

      await updateReceiptMutation.mutateAsync({ id: receiptId, receipt: metadataPayload as any });
      navigate(`/inventory/receipts${location.search}`);
    } catch (error) {
      console.error('Error updating approved receipt metadata:', error);
    }
  };

  // Callback khi validate form thất bại
  const onFormError = (errors: any) => {
    console.error("Form validation errors:", errors);
    notifyFormErrors(errors, "Vui lòng kiểm tra lại các trường thông tin bắt buộc");
  };

  // Loading state khi đang load dữ liệu trong edit mode
  if (isEditMode && (isLoadingReceipt || isLoadingItems)) {
    return (
      <div className='p-4 flex justify-center items-center' style={{ minHeight: '400px' }}>
        <div className='text-center'>
          <div className='mb-4'>Đang tải dữ liệu...</div>
        </div>
      </div>
    )
  }

  return (
    <div className='p-4'>
      <div className='mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2'>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={handleBack}
          className='flex items-center'
        >
          Quay lại
        </Button>
        <Title level={4} className='m-0 text-lg sm:text-xl'>
          {isEditMode ? "Chỉnh sửa phiếu nhập hàng" : "Tạo phiếu nhập hàng"}
        </Title>
      </div>

      <form onSubmit={handleFormSubmit(onSubmit, onFormError)}>
        <Card className='mb-4'>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
            <FormComboBox
              label='Nhà cung cấp'
              name='supplierId'
              control={control}
              required
              placeholder='Tìm kiếm nhà cung cấp'
              data={supplierOptions}
              isLoading={supplierLoading}
              isFetching={supplierFetching}
              hasNextPage={supplierHasNextPage}
              isFetchingNextPage={supplierFetchingNextPage}
              fetchNextPage={supplierFetchNextPage}
              onSearch={setSupplierSearchTerm}
              showSearch={true}
            />

            <FormComboBox
              label='Trạng thái'
              name='status'
              control={control}
              required
              disabled={isApproved}
              placeholder='Chọn trạng thái'
              options={Object.values(InventoryReceiptStatus).map(status => ({
                value: status,
                label: getInventoryReceiptStatusText(status)
              }))}
            />

            <FormDatePicker
              label='Ngày nhập hàng'
              name='bill_date'
              control={control}
              required
              placeholder='Chọn ngày nhập hàng'
              className='w-full'
            />
          </div>

            <FormField
              label='Ghi chú'
              name='description'
              control={control}
              type="textarea"
              placeholder='Nhập ghi chú (nếu có)'
              rows={3}
            />

        </Card>

          <Divider className='my-4' />

          <div className='mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
            <div className="flex flex-col gap-2">
              <Text strong className='text-lg'>
                Danh sách sản phẩm
              </Text>
              <Controller
                name="discountMethod"
                control={control}
                render={({ field }) => (
                  <Radio.Group 
                    size="small"
                    disabled={isApproved}
                    value={field.value} 
                    onChange={(e) => field.onChange(e.target.value)}
                  >
                    <Radio value="none">Không CK</Radio>
                    <Radio value="per_item">CK từng món</Radio>
                    <Radio value="global">CK tổng đơn</Radio>
                  </Radio.Group>
                )}
              />
            </div>
            <Button
              type='primary'
              icon={<PlusOutlined />}
              onClick={handleAddItem}
              disabled={isApproved}
            >
              Thêm sản phẩm
            </Button>
          </div>

          {watchedItems.length === 0 ? (
            <Alert
              message='Chưa có sản phẩm nào'
              description='Vui lòng thêm sản phẩm vào phiếu nhập hàng'
              type='info'
              showIcon
              className='mb-4'
            />
          ) : useCardLayout ? (
            <div className='w-full'>
              {itemFields.map((item, index) => (
                <MobileItemCard
                  key={item.id}
                  index={index}
                  handleDeleteItem={handleDeleteItem}
                  comboBoxProps={comboBoxProps}
                  control={control}
                  setValue={setValue}
                  getValues={getValues}
                  isApproved={isApproved}
                />
              ))}
            </div>
          ) : (
            <div className='overflow-x-auto w-full'>
              <Table
                dataSource={itemFields}
                columns={itemColumns}
                pagination={false}
                rowKey='id'
                scroll={{ x: "max-content" }}
                className='min-w-full'
              />
            </div>
          )}

          {/* Phần chiết khấu */}
          {watchedDiscountMethod === 'global' && (
            <Card title="Chiết khấu (Tùy chọn)" className='mt-4'>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Text className="block mb-2">Loại chiết khấu</Text>
                  <Controller
                    name="discountType"
                    control={control}
                    render={({ field }) => (
                      <Radio.Group 
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                      >
                        <Space>
                          <Radio value="fixed_amount">Số tiền cố định (VND)</Radio>
                          <Radio value="percentage">Phần trăm (%)</Radio>
                        </Space>
                      </Radio.Group>
                    )}
                  />
                </div>
                
                <FormFieldNumber
                  label={watchedDiscountType === 'percentage' ? "Phần trăm (%)" : "Số tiền giảm (VND)"}
                  name="discountValue"
                  control={control}
                  addonAfter={watchedDiscountType === 'percentage' ? "%" : "VND"}
                  placeholder={watchedDiscountType === 'percentage' ? "Nhập %" : "Nhập số tiền"}
                />
              </div>
              {watchedDiscountValue > 0 && (
                <div className="mt-2 text-sm flex items-center gap-2">
                  <span className="text-green-600 font-medium">
                    Tổng giảm: -{calculateTotals().discountAmount.toLocaleString('vi-VN')} VND
                  </span>
                  {watchedDiscountType === 'fixed_amount' && calculateTotals().totalProductValue > 0 && (
                    <span className="text-gray-400 italic text-xs">
                      (Tương đương: {((calculateTotals().discountAmount / calculateTotals().totalProductValue) * 100).toFixed(2)}%)
                    </span>
                  )}
                  {watchedDiscountType === 'percentage' && (
                    <span className="text-gray-400 italic text-xs">
                      (Đã tính dựa trên tổng tiền hàng)
                    </span>
                  )}
                </div>
              )}
            </Card>
          )}

          {/* Phần phí vận chuyển/bốc vác */}
          <Card title="Phí Vận Chuyển/Bốc Vác (Tùy chọn)" className='mt-4'>
            <Controller
              name="hasSharedShipping"
              control={control}
              render={({ field }) => (
                <Checkbox 
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                >
                  Có phí vận chuyển/bốc vác
                </Checkbox>
              )}
            />
            
            {watchedHasSharedShipping && (
              <>
                <FormFieldNumber
                  label="Số tiền"
                  name="sharedShippingCost"
                  control={control}
                  addonAfter="VND"
                  placeholder="Nhập số tiền"
                  className="mt-4"
                />
                

                <div className="mt-4">
                  <Text className="block mb-2">Phương thức phân bổ phí chung</Text>
                  <Controller
                    name="allocationMethod"
                    control={control}
                    render={({ field }) => (
                      <Radio.Group 
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                      >
                        <Space direction="vertical">
                          <Radio value="by_value">
                            Theo giá trị (sản phẩm đắt chịu phí nhiều hơn)
                          </Radio>
                          <Radio value="by_quantity">
                            Theo số lượng (chia đều)
                          </Radio>
                        </Space>
                      </Radio.Group>
                    )}
                  />
                </div>
                
                {/* Ghi chú: Phí vận chuyển luôn do bạn tự chịu, không tính vào nợ NCC */}
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <Text className="text-sm text-blue-700">
                    💡 <strong>Lưu ý:</strong> Phí vận chuyển/bốc vác này chỉ để kiểm soát tổng chi phí đơn hàng. 
                    Bạn tự thanh toán cho đơn vị vận chuyển, <strong>không tính vào công nợ nhà cung cấp</strong>.
                  </Text>
                </div>
              </>
            )}
          </Card>

          {/* Phần upload ảnh hóa đơn */}
          <Card title="Hình ảnh hóa đơn (Tùy chọn)" className='mt-4'>
            <FormImageUpload
              name="images"
              control={control}
              uploadType="common"
              multiple
              maxCount={10}
            />
          </Card>

          {/* Phần thanh toán - Chỉ hiển thị khi trạng thái là Đã duyệt */}
          {watchedStatus === 'approved' && (
            <Card title="Thông tin thanh toán" className='mt-4 border-blue-200'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div>
                  <Text className="block mb-2 font-medium">Hình thức thanh toán</Text>
                  <Controller
                    name="paymentType"
                    control={control}
                    render={({ field }) => (
                      <Radio.Group 
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="w-full"
                      >
                        <Space direction="vertical" className="w-full bg-blue-50/50 p-4 rounded-md border border-blue-100">
                          <Radio value="full">Thanh toán toàn bộ</Radio>
                          <Radio value="partial">Thanh toán một phần (Ghi nợ còn lại)</Radio>
                          <Radio value="debt">Ghi nợ hoàn toàn (Trả sau)</Radio>
                        </Space>
                      </Radio.Group>
                    )}
                  />
                </div>

                <div className="flex flex-col gap-4">
                  {watchedPaymentType !== 'debt' && (
                    <FormComboBox
                      label='Phương thức thanh toán'
                      name='paymentMethod'
                      control={control}
                      required={(watchedPaymentType as string) !== 'debt'}
                      options={[
                        { value: 'cash', label: 'Tiền mặt' },
                        { value: 'transfer', label: 'Chuyển khoản' },
                      ]}
                    />
                  )}

                  {watchedPaymentType === 'partial' && (
                    <>
                      <FormFieldNumber
                        label="Số tiền trả trước"
                        name="paidAmount"
                        control={control}
                        addonAfter="VND"
                        required
                      />
                      
                      {/* Hiển thị số tiền còn nợ NCC */}
                      {watch('paidAmount') && (
                        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-orange-700">
                              Còn nợ NCC:
                            </span>
                            <strong className="text-lg text-orange-600">
                              {(calculateTotals().supplierAmount - (watch('paidAmount') || 0)).toLocaleString('vi-VN')} VND
                            </strong>
                          </div>
                          <p className="text-xs text-orange-600 mt-1">
                            (Đã trừ phí vận chuyển/bốc vác bạn tự chịu)
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  { (watchedPaymentType as string) !== 'full' && (
                    <FormDatePicker
                      label={(watchedPaymentType as string) === 'debt' ? 'Hạn trả nợ' : 'Hạn trả nợ còn lại'}
                      name='paymentDueDate'
                      control={control}
                      required
                      placeholder='Chọn ngày hạn'
                      className='w-full'
                    />
                  )}
                </div>
              </div>
            </Card>
          )}


          {/* Hiển thị tổng tiền chi tiết */}
          <div className='mt-4 p-4 bg-gray-50 rounded-lg'>
            <div style={{ fontSize: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>Tổng tiền hàng:</span>
                <strong>{calculateTotals().totalProductValue.toLocaleString('vi-VN')} VND</strong>
              </div>

              {calculateTotals().discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: '#52c41a' }}>
                  <span>Chiết khấu ({watchedDiscountType === 'percentage' ? `${watchedDiscountValue}%` : 'Cố định'}):</span>
                  <strong>-{calculateTotals().discountAmount.toLocaleString('vi-VN')} VND</strong>
                </div>
              )}
              
              {calculateTotals().totalIndividualShipping > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>Phí vận chuyển riêng:</span>
                  <strong>{calculateTotals().totalIndividualShipping.toLocaleString('vi-VN')} VND</strong>
                </div>
              )}
              
              {calculateTotals().totalSharedShipping > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>Phí vận chuyển/bốc vác:</span>
                  <strong>{calculateTotals().totalSharedShipping.toLocaleString('vi-VN')} VND</strong>
                </div>
              )}
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginTop: 16, 
                paddingTop: 16, 
                borderTop: '2px solid #d9d9d9',
                fontSize: 18,
              }}>
                <span>TỔNG GIÁ TRỊ NHẬP KHO:</span>
                <strong style={{ color: '#1890ff' }}>
                  {calculateTotals().grandTotal.toLocaleString('vi-VN')} VND
                </strong>
              </div>


            </div>
          </div>

          <div className='mt-6 flex justify-end'>
            {isApproved ? (
              // Phếu đã duyệt: bề qua Zod validation, chỉ gửi metadata
              <Button
                type='primary'
                icon={<SaveOutlined />}
                loading={updateReceiptMutation.isPending}
                size='large'
                onClick={handleMetadataUpdate}
              >
                Cập nhật thông tin phiếu
              </Button>
            ) : (
              // Phếu nháp: submit form bình thường qua Zod
              <Button
                type='primary'
                htmlType='submit'
                icon={<SaveOutlined />}
                loading={isEditMode ? updateReceiptMutation.isPending : createReceiptMutation.isPending}
                size='large'
              >
                {isEditMode ? "Cập nhật phiếu nhập hàng" : "Tạo phiếu nhập hàng"}
              </Button>
            )}
          </div>
      </form>
    </div>
  )
}

export default InventoryReceiptCreate
