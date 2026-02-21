
import React, { useEffect, useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Button, message, Form, Spin, Alert, Typography, Card } from "antd"
import { SaveOutlined, PlusOutlined, DeleteOutlined, ArrowLeftOutlined } from "@ant-design/icons"
import { useFormGuard } from "@/hooks/use-form-guard"
import { Sparkles } from "lucide-react"
import { useForm, useFieldArray, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  FormField,
  FormFieldNumber,
  FormComboBox,
  FormImageUpload,
} from "@/components/form"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import { UploadFile, UploadFileStatus } from "antd/lib/upload/interface"

import {
  useProductQuery,
  useUpdateProductMutation,
  useCreateProductMutation,
} from "../../../queries/product"
import { Product, ProductFormProps } from "../../../models/product.model"
import {
  productFormSchema,
  ProductFormValues,
  ConvertedProductValues,
  defaultProductFormValues,
} from "./form-config"
import { useProductTypesQuery as useProductTypes } from "@/queries/product-type"
import { useProductSubtypesQuery } from "@/queries/product-subtype"
import { useUnitsQuery } from "@/queries/unit"
import { BASE_STATUS } from "@/constant/base-status"
import { ProductType } from "@/models/product-type.model"
// Thêm import cho symbol
import { useSymbolsQuery } from "@/queries/symbol"
import { Symbol } from "@/models/symbol.model"
import { ProductSubtype } from "@/models/product-subtype.model"
import ProductComparisonPanel from "@/pages/products/components/ProductComparisonPanel"
import AdjustStockModal from "./AdjustStockModal"
import { useProductsQuery } from "@/queries/product"
import { UPLOAD_TYPES } from "@/services/upload.service"
// Thêm import cho ImageAnalyzer
import { ImageAnalyzer, ExtractedProductData } from "@/components/image-analyzer"
import ImageStudio from "@/components/image-studio/image-studio"
import { useUploadImageMutation } from "@/queries/upload"
import { UploadType } from "@/services/upload.service"
import ProductUnitConversionTable from "./ProductUnitConversionTable"
import ProductBOMTable from "./ProductBOMTable"

const { Title } = Typography

// TiptapEditor component
const TiptapEditor: React.FC<{
  content: string
  onChange: (content: string) => void
}> = ({ content, onChange }) => {
  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  // Update editor content when content prop changes
  useEffect(() => {
    if (editor && content && editor.getHTML() !== content) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  if (!editor) {
    return null
  }

  return (
    <div style={{ border: "1px solid #d9d9d9", borderRadius: "6px" }}>
      {/* Toolbar */}
      <div
        style={{
          borderBottom: "1px solid #d9d9d9",
          padding: "8px 12px",
          display: "flex",
          gap: "8px",
          backgroundColor: "#fafafa",
        }}
      >
        <button
          type='button'
          onClick={() => editor.chain().focus().toggleBold().run()}
          style={{
            padding: "4px 8px",
            border: "1px solid #d9d9d9",
            borderRadius: "4px",
            backgroundColor: editor.isActive("bold") ? "#1890ff" : "#fff",
            color: editor.isActive("bold") ? "#fff" : "#000",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: "bold",
          }}
        >
          B
        </button>
        <button
          type='button'
          onClick={() => editor.chain().focus().toggleItalic().run()}
          style={{
            padding: "4px 8px",
            border: "1px solid #d9d9d9",
            borderRadius: "4px",
            backgroundColor: editor.isActive("italic") ? "#1890ff" : "#fff",
            color: editor.isActive("italic") ? "#fff" : "#000",
            cursor: "pointer",
            fontSize: "12px",
            fontStyle: "italic",
          }}
        >
          I
        </button>
        <button
          type='button'
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          style={{
            padding: "4px 8px",
            border: "1px solid #d9d9d9",
            borderRadius: "4px",
            backgroundColor: editor.isActive("underline") ? "#1890ff" : "#fff",
            color: editor.isActive("underline") ? "#fff" : "#000",
            cursor: "pointer",
            fontSize: "12px",
            textDecoration: "underline",
          }}
        >
          U
        </button>
        <button
          type='button'
          onClick={() => editor.chain().focus().toggleStrike().run()}
          style={{
            padding: "4px 8px",
            border: "1px solid #d9d9d9",
            borderRadius: "4px",
            backgroundColor: editor.isActive("strike") ? "#1890ff" : "#fff",
            color: editor.isActive("strike") ? "#fff" : "#000",
            cursor: "pointer",
            fontSize: "12px",
            textDecoration: "line-through",
          }}
        >
          S
        </button>
      </div>
      {/* Editor Content */}
      <div style={{ minHeight: "200px", padding: "12px" }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

const ProductForm: React.FC<ProductFormProps> = (props) => {
  const { isEdit = false, productId } = props
  const { control, handleSubmit, watch, reset, setValue, getValues, formState: { isDirty } } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: defaultProductFormValues,
  })
  
  // Field array cho thuộc tính động
  const { fields: attributeFields, append: appendAttribute, remove: removeAttribute } = useFieldArray({
    control,
    name: "attribute_list" as const,
  })

  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(false)

  const [description, setDescription] = useState("")
  const [notes, setNotes] = useState("") // State cho Ghi chú (rich text)

  // State cho tính năng kiểm tra trùng tên sản phẩm
  const [duplicateProducts, setDuplicateProducts] = useState<Product[]>([])
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false)

  // State cho AI Image Studio
  const [studioVisible, setStudioVisible] = useState(false)
  const [adjustModalVisible, setAdjustModalVisible] = useState(false)
  const [isSubmitSuccess, setIsSubmitSuccess] = useState(false) // State để đánh dấu đã submit thành công
  const uploadMutation = useUploadImageMutation()

  // Watch form values
  const watchedName = watch("name")
  const watchedTradeName = watch("trade_name")
  const watchedQuantity = watch("quantity") || 0

  // Xác định ID sản phẩm để sử dụng từ props
  const currentProductId = productId ? parseInt(productId) : 0

  // Sử dụng query hooks thay vì service
  const { data: productData, isLoading: productLoading } =
    useProductQuery(currentProductId)
  const updateProductMutation = useUpdateProductMutation()
  const createProductMutation = useCreateProductMutation()

  const { data: productSubtypes } = useProductSubtypesQuery()
  const { data: productTypes } = useProductTypes()
  const { data: units } = useUnitsQuery()
  // Thêm query cho symbols
  const { data: symbols } = useSymbolsQuery()
  // Thêm query cho danh sách sản phẩm
  const { data: allProducts } = useProductsQuery({ offset: 0, limit: 1000 })

  // Kiểm tra dirty cho cả form và nội dung rich text
  // Lưu ý: Chỉ coi là dirty nếu dữ liệu thực sự khác với dữ liệu ban đầu từ API (nếu đang ở mode Edit)
  const productItemData = productData && 'data' in (productData as any) ? (productData as any).data : productData;
  const isFormDirty = isDirty || 
    (isEdit && productItemData ? 
      (description !== (productItemData as any)?.description || notes !== (productItemData as any)?.notes) : 
      (description !== "" || (notes !== "" && notes !== "<p></p>"))
    );

  const { confirmExit } = useFormGuard(isFormDirty && !isSubmitSuccess);

  const watchedUnitId = useWatch({
    control,
    name: 'unit_id',
  });

  const unitsList = (units as any)?.data?.items || [];
  const mainUnitName = unitsList.find((u: any) => u.id === watchedUnitId)?.name || '';

  useEffect(() => {
    if (isEdit && productData && !productLoading) {
      try {
        setInitialLoading(true)

        // Lấy dữ liệu từ response
        let productItem: any = productData;
        if (productData && 'data' in (productData as any)) {
            productItem = (productData as any).data;
        }

        if (!productItem) {
          throw new Error("Không tìm thấy thông tin sản phẩm")
        }

        // Hàm tiện ích để chuẩn hóa một URL thành đối tượng file cho Upload component
        const normalizeFile = (url: string, index: number): UploadFile => ({
          uid: `${index}-${url}`,
          name: url.substring(url.lastIndexOf("/") + 1),
          status: "done" as UploadFileStatus,
          url: url,
        })

        // Hàm tiện ích để chuẩn hóa một mảng các URL thành mảng các đối tượng file
        const normalizeFileList = (
          urls: string[] | undefined
        ): UploadFile[] => {
          if (!urls) return []
          return urls.map((url, index) => normalizeFile(url, index))
        }

        // Reset form với dữ liệu sản phẩm
        reset({
          name: productItem.name?.trim() || "",
          trade_name: productItem.trade_name?.trim() || productItem.name?.trim() || "",
          volume: productItem.volume?.trim() || "",
          price: String(productItem.price || ""),
          credit_price: String(productItem.credit_price || ""), // Giá bán nợ
          tax_selling_price: String(productItem.tax_selling_price || ""), // Giá bán khai thuế
          type: productItem.type || undefined,
          quantity: productItem.quantity || 0,
          attributes: productItem.attributes || {},
          unit_id: productItem.unit_id || undefined, // Đơn vị tính
          sub_types: productItem.sub_product_type || [], // Loại phụ sản phẩm
          symbol_id: productItem.symbol_id || undefined,
          discount: productItem.discount || "",
          status: productItem.status || "active",
          thumb: productItem.thumb ? [normalizeFile(productItem.thumb, 0)] : [], // Ảnh đại diện
          pictures: normalizeFileList(productItem.pictures), // Danh sách ảnh
          videos: productItem.videos || [], // Danh sách video
          description: productItem.description || "", // Mô tả
          profit_margin_percent: String(productItem.profit_margin_percent || ""), // Chuyển sang string
          average_cost_price: String(productItem.average_cost_price || ""), // Chuyển sang string
          ingredient: Array.isArray(productItem.ingredient)
            ? productItem.ingredient.join(", ")
            : productItem.ingredient || "", // Chuyển đổi mảng thành chuỗi
          notes: productItem.notes || "", // Ghi chú
          has_input_invoice: productItem.has_input_invoice !== undefined ? productItem.has_input_invoice : true, // Hóa đơn đầu vào
          taxable_quantity_stock: Number(productItem.taxable_quantity_stock || 0), // Ép kiểu number để tránh lỗi string từ database "0.00"
          is_sold_on_web: (productItem as any).is_sold_on_web !== undefined ? (productItem as any).is_sold_on_web : false,
          show_price_on_web: (productItem as any).show_price_on_web !== undefined ? (productItem as any).show_price_on_web : true,
          
          unit_conversions: productItem.unit_conversions || [],
          
          // Chuyển đổi attributes object thành array cho form
          attribute_list: productItem.attributes && typeof productItem.attributes === 'object'
            ? Object.entries(productItem.attributes)
                .filter(([key]) => key !== 'unit') // Lọc bỏ trường unit vì đã có trường riêng
                .map(([key, value]) => ({ key, value }))
            : [],
          
          components: productItem.components || [],
        } as ProductFormValues)

        // Product type will be watched through watchedType

        // Đặt giá trị cho mô tả và ghi chú
        setDescription(productItem.description || "")
        setNotes(productItem.notes || "")
      } catch (error) {
        console.error("Error fetching product:", error)
        message.error("Không thể tải thông tin sản phẩm")
      } finally {
        setInitialLoading(false)
      }
    }
  }, [isEdit, productData, productLoading, reset])

  // Reset form khi chuyển từ trang edit sang trang create
  useEffect(() => {
    if (!isEdit && !productLoading) {
      reset(defaultProductFormValues)
      setDescription("")
      setNotes("")
    }
  }, [isEdit, productLoading, reset])

  // Kiểm tra trùng tên sản phẩm khi người dùng nhập tên (chỉ khi tạo mới)
  useEffect(() => {
    
    // Chỉ kiểm tra khi đang tạo mới (không phải edit)
    if (isEdit) {
      setDuplicateProducts([])
      return
    }

    // Debounce: Chỉ kiểm tra sau khi người dùng ngừng gõ 2 giây
    const timer = setTimeout(async () => {
      const productName = watchedName?.trim()
      const tradeName = watchedTradeName?.trim()
      
      // Chỉ kiểm tra nếu có ít nhất tên sản phẩm hoặc hiệu thuốc (ít nhất 2 ký tự)
      if ((!productName || productName.length < 2) && (!tradeName || tradeName.length < 2)) {
        setDuplicateProducts([])
        return
      }

      try {
        setIsCheckingDuplicate(true)
        
        // Import api từ utils
        const api = (await import("@/utils/api")).default
        
        // Gọi API search để tìm sản phẩm có tên hoặc hiệu thuốc tương tự
        const response = await api.postRaw<{
          success: boolean
          data: Product[]
          pagination: {
            total: number
            totalPages: number | null
          }
        }>('/products/search', { 
          keyword: productName || tradeName, // Tìm theo tên hoặc hiệu thuốc
          limit: 10, // Tăng limit để tìm nhiều hơn
          page: 1
        })
        
        
        // Lọc các sản phẩm có tên hoặc hiệu thuốc giống/tương tự
        const duplicates = response?.data?.filter((product: Product) => {
          const normalizedProductName = product.name?.toLowerCase().trim()
          const normalizedProductTradeName = (product as Product & { trade_name?: string }).trade_name?.toLowerCase().trim()
          const normalizedInputName = productName?.toLowerCase().trim()
          const normalizedInputTradeName = tradeName?.toLowerCase().trim()
          
          // Kiểm tra trùng tên sản phẩm
          const nameMatch = normalizedInputName && (
            normalizedProductName === normalizedInputName || 
            normalizedProductName?.includes(normalizedInputName)
          )
          
          // Kiểm tra trùng hiệu thuốc
          const tradeNameMatch = normalizedInputTradeName && (
            normalizedProductTradeName === normalizedInputTradeName ||
            normalizedProductTradeName?.includes(normalizedInputTradeName) ||
            normalizedProductName === normalizedInputTradeName || // Tên sản phẩm trùng với hiệu thuốc đang nhập
            normalizedProductName?.includes(normalizedInputTradeName)
          )
          
          return nameMatch || tradeNameMatch
        }) || []
        
        setDuplicateProducts(duplicates)
      } catch (error) {
        console.error('❌ Lỗi khi kiểm tra trùng tên sản phẩm:', error)
        setDuplicateProducts([])
      } finally {
        setIsCheckingDuplicate(false)
      }
    }, 2000) // Debounce 2 giây

    return () => {
      clearTimeout(timer)
    }
  }, [watchedName, watchedTradeName, isEdit])

  // Render các thuộc tính sản phẩm động
  const renderProductAttributes = () => {
    return (
      <div className='mb-4 bg-gray-50 p-4 rounded-lg border border-gray-200'>
        <div className="flex justify-between items-center mb-4">
          <h3 className='text-lg font-medium m-0'>Thuộc tính sản phẩm</h3>
          <Button 
            type="dashed" 
            onClick={() => appendAttribute({ key: "", value: "" })}
            icon={<PlusOutlined />}
          >
            Thêm thuộc tính
          </Button>
        </div>
        
        {attributeFields.length === 0 && (
          <div className="text-center text-gray-500 py-4 italic">
            Chưa có thuộc tính nào. Nhấn &quot;Thêm thuộc tính&quot; để tạo mới.
          </div>
        )}

        <div className='space-y-3'>
          {attributeFields.map((field, index) => (
            <div key={field.id} className='flex gap-2 items-end'>
              <div className='flex-1'>
                <FormField
                  name={`attribute_list.${index}.key`}
                  control={control}
                  label="Tên thuộc tính"
                  placeholder='VD: Liều phun'
                  className='mb-0'
                />
              </div>
              <div className='flex-1'>
                <FormField
                  name={`attribute_list.${index}.value`}
                  control={control}
                  label="Giá trị"
                  placeholder='VD: 100ml'
                  className='mb-0'
                />
              </div>
              <Button 
                danger 
                icon={<DeleteOutlined />} 
                onClick={() => removeAttribute(index)}
                className="mb-2"
              />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const onSubmit = async (values: ProductFormValues) => {
    console.log("🚀 ~ ProductForm ~ onSubmit called with values:", values);
    try {
      setLoading(true)

      // Chuyển đổi UploadFile[] về string và string[] cho API
      const convertedValues: ConvertedProductValues = {
        ...(values as unknown as ConvertedProductValues),
        description: description,
        thumb:
          values.thumb && values.thumb.length > 0
            ? typeof values.thumb[0] === "string"
              ? values.thumb[0]
              : values.thumb[0].url || ""
            : "",
        pictures: values.pictures
          ? values.pictures
              .map((file) => {
                if (typeof file === "string") {
                  return file
                } else {
                  return (file as UploadFile).url || ""
                }
              })
              .filter((url) => url)
          : [],
        // Thêm đơn vị tính vào attributes
        // Thêm đơn vị tính vào attributes và xử lý attribute_list
        attributes: {
          ...((values as ProductFormValues & { attribute_list?: Array<{ key: string; value: string }> }).attribute_list || []).reduce((acc: Record<string, string>, item: { key: string; value: string }) => {
            if (item.key) {
              acc[item.key] = item.value;
            }
            return acc;
          }, {}),
          unit: values.unit_id?.toString() || "",
        },
        status: values.status,
        // Giữ nguyên giá trị price vì đã được xử lý trong FormField
        price: values.price,
        credit_price: values.credit_price || "", // Giá bán nợ
        tax_selling_price: values.tax_selling_price || "", // Giá bán khai thuế
        symbol_id: values.symbol_id,
        sub_types: values.sub_types || [],
        profit_margin_percent: values.profit_margin_percent || "", // Thêm trường mới
        average_cost_price: values.average_cost_price || "", // Thêm trường mới
        has_input_invoice: values.has_input_invoice,
        is_sold_on_web: values.is_sold_on_web,
        show_price_on_web: values.show_price_on_web,
      }

      // Đảm bảo các trường bắt buộc có giá trị
      if (!convertedValues.name) convertedValues.name = ""
      if (!convertedValues.price) convertedValues.price = ""
      if (!convertedValues.type) convertedValues.type = 0
      if (!convertedValues.quantity) convertedValues.quantity = 0

      // Tạo object với tên các trường theo yêu cầu của server
      // TODO: Cập nhật service API để tự động mapping tên các trường thay vì phải convert thủ công
      const serverData = {
        name: convertedValues.name,
        trade_name: convertedValues.trade_name,
        volume: convertedValues.volume,
        price: convertedValues.price,
        credit_price: convertedValues.credit_price, // Giá bán nợ
        tax_selling_price: convertedValues.tax_selling_price, // Giá bán khai thuế
        type: convertedValues.type,
        quantity: convertedValues.quantity,
        description: convertedValues.description,
        thumb: convertedValues.thumb,
        pictures: Array.isArray(convertedValues.pictures)
          ? convertedValues.pictures
          : [],
        attributes: convertedValues.attributes || {},
        discount: convertedValues.discount || "0",
        discounted_price: "0",
        average_cost_price: convertedValues.average_cost_price || "0",
        profit_margin_percent: convertedValues.profit_margin_percent || "0",
        suggested_price: "0",
        status: convertedValues.status,
        sub_product_type: Array.isArray(convertedValues.sub_types)
          ? convertedValues.sub_types
          : convertedValues.sub_types
          ? [convertedValues.sub_types]
          : [],
        unit_id: convertedValues.unit_id,
        symbol_id: convertedValues.symbol_id,
        ingredient: Array.isArray(convertedValues.ingredient)
          ? convertedValues.ingredient
          : convertedValues.ingredient
          ? (convertedValues.ingredient as string)
              .split(",")
              .map((item: string) => item.trim())
          : [],
        notes: notes || "", // Ghi chú (rich text HTML)
        has_input_invoice: convertedValues.has_input_invoice,
        taxable_quantity_stock: convertedValues.taxable_quantity_stock,
        is_sold_on_web: convertedValues.is_sold_on_web,
        show_price_on_web: convertedValues.show_price_on_web,
        unit_conversions: values.unit_conversions || [],
        components: values.components || [],
      }

      // Log dữ liệu trước khi gửi để kiểm tra

      // Đảm bảo các trường mảng luôn là mảng ngay cả khi là null hoặc undefined
      if (!Array.isArray(serverData.pictures)) {
        serverData.pictures = []
      }

      if (!Array.isArray(serverData.sub_product_type)) {
        serverData.sub_product_type = []
      }

      if (isEdit && currentProductId) {
        // Thêm ID cho update request
        await updateProductMutation.mutateAsync({
          id: currentProductId,
          productData: {
            ...serverData,
            id: currentProductId,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any,
        })
        setIsSubmitSuccess(true)
        message.success("Cập nhật sản phẩm thành công")
        navigate(`/products${location.search}`)
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await createProductMutation.mutateAsync(serverData as any)
        setIsSubmitSuccess(true)
        message.success("Thêm sản phẩm thành công!")
        reset()
        navigate(`/products${location.search}`)
      }
    } catch (error: any) {
      console.error("Error saving product:", error)
      
      // Xử lý lỗi chi tiết từ backend
      let errorMessage = "Có lỗi xảy ra khi lưu sản phẩm"
      
      // Kiểm tra lỗi từ response
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error?.message) {
        errorMessage = error.message
      }
      
      message.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Xử lý khi AI trích xuất được thông tin từ ảnh
   */
  const handleDataExtracted = (data: ExtractedProductData) => {
    
    // Tự động điền thông tin vào form
    if (data.name) {
      setValue('name', data.name);
    
    // Set trade_name: Nếu AI trả về trade_name thì dùng, không thì dùng name (loại bỏ dung tích)
    if (data.trade_name) {
      setValue('trade_name', data.trade_name);
    } else if (data.name) {
      // Nếu không có trade_name, dùng name nhưng loại bỏ phần dung tích (nếu có)
      const nameWithoutVolume = data.name.replace(/\s*\([^)]*\)\s*$/g, '').trim();
      setValue('trade_name', nameWithoutVolume);
    }
    
    // Set volume nếu AI trả về
    if (data.volume) {
      setValue('volume', data.volume);
    }
    
    // Set notes nếu AI trả về (bao gồm tính toán liều lượng)
    if (data.notes) {
      const formattedNotes = data.notes.replace(/\n/g, '<br/>');
      setNotes(`<p>${formattedNotes}</p>`);
    }
    }
    
    if (data.active_ingredient) {
      setValue('ingredient', data.active_ingredient);
    }
    
    // Xử lý mô tả chi tiết từ AI
    if (data.details) {
      // Helper function để giữ xuống dòng
      const formatText = (text?: string) => {
        if (!text) return '';
        return text.replace(/\n/g, '<br/>');
      };

      let htmlDescription = '';
      
      if (data.details.usage) {
        htmlDescription += `<p><strong>Công dụng:</strong><br/>${formatText(data.details.usage)}</p>`;
      }
      
      if (data.details.application_time) {
        htmlDescription += `<p><strong>Thời điểm sử dụng:</strong><br/>${formatText(data.details.application_time)}</p>`;
      }

      if (data.details.dosage) {
        htmlDescription += `<p><strong>Liều lượng / Hướng dẫn sử dụng:</strong><br/>${formatText(data.details.dosage)}</p>`;
      }
      
      if (data.details.preharvest_interval) {
        htmlDescription += `<p><strong>Thời gian cách ly:</strong><br/>${formatText(data.details.preharvest_interval)}</p>`;
      }
      
      if (data.details.notes) {
        htmlDescription += `<p><strong>Lưu ý / Cảnh báo:</strong><br/>${formatText(data.details.notes)}</p>`;
      }
      
      // Nếu có dữ liệu chi tiết thì dùng, không thì fallback về description thường
      if (htmlDescription) {
        setDescription(htmlDescription);
      } else if (data.description || data.usage) {
        setDescription(data.description || data.usage || '');
      }
    } else if (data.description || data.usage) {
      const desc = data.description || data.usage || '';
      setDescription(desc);
    }
    
    message.success('Đã điền thông tin tự động. Vui lòng kiểm tra và chỉnh sửa nếu cần.');
  }

  return (
    <div className=''>
      {/* Header cho Form */}
      <div className='flex items-center mb-6'>
        <Button
          type='text'
          icon={<ArrowLeftOutlined />}
          onClick={() => confirmExit(() => navigate(`/products${location.search}`))}
          className='mr-4'
        />
        <Title level={3} className='mb-0'>
          {isEdit ? "Chỉnh sửa sản phẩm" : "Thêm Sản phẩm mới"}
        </Title>
      </div>
      
      <Card className="mb-4">
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-2 md:gap-6'>
        {/* Form sản phẩm - 2 cột */}
        <div className='lg:col-span-2'>
          <div className="bg-white rounded-lg shadow-sm h-full overflow-hidden">
            <Spin spinning={loading || productLoading || initialLoading}>
              <form onSubmit={handleSubmit(onSubmit, (errors) => console.error("❌ Form Validation Errors:", errors))} className="product-form">
              {/* Component trích xuất thông tin từ hình ảnh - Hỗ trợ cả tạo mới và chỉnh sửa */}
              <div className="px-3 md:px-6 pt-3 md:pt-6">
                <ImageAnalyzer 
                  onDataExtracted={handleDataExtracted}
                  loading={loading || initialLoading}
                />
              </div>

              {/* AI Image Studio Trigger */}
              <div className="px-3 md:px-6 mb-4">
                <Button 
                  icon={<Sparkles className="w-4 h-4" />} 
                  onClick={() => setStudioVisible(true)}
                  style={{ 
                    background: 'linear-gradient(to right, #3b82f6, #4f46e5)',
                    color: 'white',
                    border: 'none',
                    height: 'auto',
                    padding: '10px 24px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    fontWeight: 600,
                    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
                    width: '100%', // Chiếm full width
                    whiteSpace: 'normal', // Cho phép xuống dòng
                    textAlign: 'center', // Căn giữa text
                    justifyContent: 'center', // Căn giữa nội dung
                  }}
                  className="hover:opacity-90 transition-opacity"
                >
                 Tạo ảnh sản phẩm chuyên nghiệp
                </Button>
                
                <ImageStudio 
                  visible={studioVisible}
                  onCancel={() => setStudioVisible(false)}
                  onSave={async (file) => {
                    try {
                      message.loading({ content: 'Đang tải ảnh lên hệ thống...', key: 'upload-ai' });
                      const result = await uploadMutation.mutateAsync({
                        file,
                        type: UPLOAD_TYPES.COMMON as UploadType
                      });
                      
                      // 1. Cập nhật trường thumb (Ảnh đại diện)
                      setValue('thumb', [{
                        uid: result.id,
                        name: result.name || 'product-ai.png',
                        status: 'done',
                        url: result.url
                      }]);

                      // 2. Thêm vào trường pictures (Hình ảnh chi tiết)
                      const currentPictures = getValues('pictures') || [];
                      setValue('pictures', [...currentPictures, {
                        uid: result.id,
                        name: result.name || 'product-ai.png',
                        status: 'done',
                        url: result.url
                      }]);
                      
                      message.success({ content: 'Đã cập nhật ảnh đại diện và thêm vào bộ sưu tập!', key: 'upload-ai' });
                    } catch (error) {
                      console.error('Upload Error:', error);
                      message.error({ content: 'Lỗi khi tải ảnh lên hệ thống', key: 'upload-ai' });
                    }
                  }}
                />
              </div>
              
              <div className='grid grid-cols-1 md:grid-cols-2 gap-x-2 gap-y-0 md:gap-x-4 md:gap-y-0 px-3 md:px-6 pb-3 md:pb-6'>
                <div className='w-full md:col-span-2'>
                  <FormField
                    name='name'
                    control={control}
                    label='Tên sản phẩm'
                    placeholder='Nhập tên sản phẩm'
                    required
                    rules={{ required: "Vui lòng nhập tên sản phẩm" }}
                    className='w-full'
                    autoComplete='off'
                  />
                  
                  {/* Hiển thị trạng thái kiểm tra */}
                  {isCheckingDuplicate && (
                    <Alert
                      message="Đang kiểm tra trùng lặp..."
                      type="info"
                      showIcon
                      className="mt-2"
                      icon={<Spin size="small" />}
                    />
                  )}
                  
                  {/* Hiển thị cảnh báo nếu có sản phẩm trùng tên */}
                  {!isCheckingDuplicate && duplicateProducts.length > 0 && (
                    <Alert
                      message={
                        <div>
                          <div className="font-semibold mb-2">
                            ⚠️ Phát hiện {duplicateProducts.length} sản phẩm có tên hoặc hiệu thuốc tương tự:
                          </div>
                          {/* Danh sách sản phẩm với scroll nếu quá nhiều */}
                          <div 
                            className="overflow-y-auto" 
                            style={{ maxHeight: '200px' }}
                          >
                            <ul className="list-disc pl-5 mb-0">
                              {duplicateProducts.slice(0, 5).map((product) => (
                                <li key={product.id} className="mb-1">
                                  <strong>{product.name}</strong>
                                  {product.price && (
                                    <span className="text-gray-600 ml-2">
                                      - Giá: {Number(product.price).toLocaleString('vi-VN')}đ
                                    </span>
                                  )}
                                  {product.code && (
                                    <span className="text-gray-500 ml-2 text-sm">
                                      (Mã: {product.code})
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                            {/* Hiển thị thông báo nếu có nhiều hơn 5 sản phẩm */}
                            {duplicateProducts.length > 5 && (
                              <div className="mt-2 text-sm text-gray-500 italic">
                                ... và {duplicateProducts.length - 5} sản phẩm khác
                              </div>
                            )}
                          </div>
                         
                        </div>
                      }
                      type="warning"
                  
                      className="mt-2"
                    />
                  )}
                </div>

                {/* Hiệu thuốc / Tên thương mại */}
                <div className='w-full md:col-span-2'>
                  <FormField
                    name='trade_name'
                    control={control}
                    label='Hiệu thuốc / Tên thương mại'
                    placeholder='Nhập hiệu thuốc (nếu không có sẽ dùng tên sản phẩm)'
                    required
                    rules={{ required: "Vui lòng nhập hiệu thuốc" }}
                    className='w-full'
                    autoComplete='off'
                  />
                  
                </div>

                {/* Dung tích / Khối lượng */}
                <div className='w-full md:col-span-2'>
                  <FormField
                    name='volume'
                    control={control}
                    label='Dung tích / Khối lượng'
                    placeholder='VD: 450ml, 1 lít, 500g'
                    className='w-full'
                    autoComplete='off'
                  />
                 
                </div>

                <div className='w-full'>
                  <FormComboBox
                    name='type'
                    control={control}
                    label='Loại sản phẩm'
                    placeholder='Chọn loại sản phẩm'
                    required
                    rules={{ required: "Vui lòng chọn loại sản phẩm" }}
                    options={
                      productTypes?.data?.items?.map((type: ProductType) => ({
                        label: type.name,
                        value: type.id,
                      })) || []
                    }
                    className='w-full'
                  />
                </div>

                <div className='col-span-1'>
                  <FormFieldNumber
                    name='price'
                    control={control}
                    label={`Giá bán tiền mặt (VNĐ${mainUnitName ? '/' + mainUnitName : ''})`}
                    placeholder='150.000'
                    className='w-full'
                    fixedDecimalScale={false}
                    outputType="string"
                    // Trường price theo schema là string nên component sẽ tự động trả về string
                  />
                </div>

                <div className='col-span-1'>
                  <FormFieldNumber
                    name='credit_price'
                    control={control}
                    label={`Giá bán nợ (VNĐ${mainUnitName ? '/' + mainUnitName : ''})`}
                    placeholder='160.000'
                    className='w-full'
                    fixedDecimalScale={false}
                    outputType="string"
                  />
                </div>

                <div className='col-span-1'>
                  <FormFieldNumber
                    name='tax_selling_price'
                    control={control}
                    label={`GBKT (VNĐ${mainUnitName ? '/' + mainUnitName : ''})`}
                    placeholder='140.000'
                    className='w-full'
                    fixedDecimalScale={false}
                    outputType="string"
                  />
                </div>

                <div className='w-full'>
                  <FormComboBox
                    name='unit_id'
                    control={control}
                    label='Đơn vị tính'
                    placeholder='Chọn đơn vị tính'
                    options={
                      units?.data?.items?.map((unit: any) => ({
                        label: unit.name,
                        value: unit.id,
                      })) || []
                    }
                    className='w-full'
                    required
                    rules={{ required: "Vui lòng chọn đơn vị tính" }}
                  />
                </div>

                <div className='md:col-span-2 mt-2'>
                   <ProductUnitConversionTable control={control} />
                </div>


                <div className='w-full'>
                  <FormFieldNumber
                    name='quantity'
                    control={control}
                    label={
                      <span>
                        Số lượng <Typography.Text type="secondary" style={{ fontSize: '11px', fontWeight: 'normal' }}>(Khóa: Dùng phiếu nhập hàng)</Typography.Text>
                      </span>
                    }
                    placeholder='Số lượng sẽ tự tăng khi nhập hàng'
                    className='w-full'
                    disabled={true}
                    {...(isEdit && {
                      addonAfter: (
                        <div 
                          className="cursor-pointer px-2 hover:text-blue-500 transition-colors"
                          onClick={() => setAdjustModalVisible(true)}
                          title="Điều chỉnh tồn kho"
                        >
                          ✏️
                        </div>
                      )
                    })}
                  />
                </div>

                {/* Thêm trường profit_margin_percent */}
                <div className='w-full'>
                  <FormFieldNumber
                    name='profit_margin_percent'
                    control={control}
                    label='Phần trăm lợi nhuận mong muốn (%)'
                    placeholder='Nhập phần trăm lợi nhuận mong muốn'
                    className='w-full'
                    outputType="string"
                  />
                </div>

                {/* Thêm trường average_cost_price */}
                <div className='w-full'>
                  <FormFieldNumber
                    name='average_cost_price'
                    control={control}
                    label='Giá vốn trung bình (VNĐ)'
                    placeholder='Nhập giá vốn trung bình'
                    className='w-full'
                    outputType="string"
                  />
                </div>

                {/* Thêm trường symbol */}
                <div className='w-full'>
                  <FormComboBox
                    name='symbol_id'
                    control={control}
                    label='Ký hiệu'
                    placeholder='Chọn ký hiệu'
                    options={
                      symbols?.data?.items?.map((symbol: Symbol) => ({
                        label: `${symbol.name}`,
                        value: symbol.id,
                      })) || []
                    }
                    className='w-full'
                  />
                </div>

                {/* Thêm trường ingredient với yêu cầu bắt buộc */}
                <div className='w-full'>
                  <FormField
                    name='ingredient'
                    control={control}
                    label='Thành phần nguyên liệu'
                    placeholder='Nhập các thành phần, ngăn cách bằng dấu phẩy'
                    className='w-full'
                    required
                    type="textarea"
                    rows={4}
                    rules={{ required: "Vui lòng nhập thành phần nguyên liệu" }}
                  />
                </div>

                <div className='w-full'>
                  <FormComboBox
                    name='sub_types'
                    control={control}
                    label='Loại phụ sản phẩm'
                    placeholder='Chọn loại phụ sản phẩm'
                    mode='multiple'
                    options={
                      productSubtypes?.data?.items?.map(
                        (subtype: ProductSubtype) => ({
                          label: (subtype.subtypeName ||
                            subtype.name ||
                            "") as string,
                          value: subtype.id,
                        })
                      ) || []
                    }
                    className='w-full'
                  />
                </div>

                <div className='w-full'>
                  <FormFieldNumber
                    name='discount'
                    control={control}
                    label='Giảm giá (%)'
                    placeholder='Nhập giảm giá'
                    className='w-full'
                    outputType="string"
                    min={0}
                    max={100}
                  />
                </div>

                <div className='w-full'>
                  <FormComboBox
                    name='status'
                    control={control}
                    label='Trạng thái'
                    placeholder='Chọn trạng thái'
                    options={BASE_STATUS.map((status) => ({
                      label: status.label,
                      value: status.value,
                    }))}
                    className='w-full'
                  />
                </div>

                <div className='w-full'>
                  <FormComboBox
                    name='has_input_invoice'
                    control={control}
                    label='Hóa đơn đầu vào'
                    placeholder='Chọn loại hóa đơn'
                    options={[
                      { label: "Có hóa đơn", value: true },
                      { label: "Không có hóa đơn", value: false },
                      ]}
                    className='w-full'
                  />
                </div>

                <div className='w-full'>
                  <FormFieldNumber
                    name='taxable_quantity_stock'
                    control={control}
                    label={
                      <span>
                        SL tồn khai thuế <Typography.Text type="secondary" style={{ fontSize: '11px', fontWeight: 'normal' }}>(Khóa: Dùng phiếu nhập hàng)</Typography.Text>
                      </span>
                    }
                    placeholder='Số lượng thuế sẽ tự tăng khi nhập hàng'
                    className='w-full'
                    disabled={true}
                  />
                </div>

                <div className='w-full'>
                  <FormComboBox
                    name='is_sold_on_web'
                    control={control}
                    label='Bán trên Web'
                    placeholder='Chọn'
                    options={[
                      { label: "Có", value: true },
                      { label: "Không", value: false },
                    ]}
                    className='w-full'
                  />
                </div>

                <div className='w-full'>
                  <FormComboBox
                    name='show_price_on_web'
                    control={control}
                    label='Hiển thị giá trên Web'
                    placeholder='Chọn'
                    options={[
                      { label: "Hiện giá", value: true },
                      { label: "Giá liên hệ", value: false },
                    ]}
                    className='w-full'
                  />
                </div>
              </div>

              <div className="px-3 md:px-6 pb-3 md:pb-6">
                {/* Ghi chú - Đặt trước Mô tả */}
                <Form.Item
                  label='Ghi chú'
                  className='w-full mb-4'
                  layout='vertical'
                >
                  <div className='w-full'>
                    <TiptapEditor
                      content={notes}
                      onChange={(content) => {
                        setNotes(content)
                      }}
                    />
                  </div>
                </Form.Item>

                <Form.Item
                  label='Mô tả sản phẩm'
                  className='w-full'
                  layout='vertical'
                >
                  <div className='w-full'>
                    <TiptapEditor
                      content={description}
                      onChange={(content) => {
                        setDescription(content)
                      }}
                    />
                  </div>
                </Form.Item>

                <div className='w-full'>
                  <FormImageUpload
                    name='pictures'
                    control={control}
                    label='Hình ảnh chi tiết'
                    maxCount={5}
                    multiple={true}
                    uploadType={UPLOAD_TYPES.PRODUCT}
                    className='w-full'
                  />
                </div>

                <div className='w-full'>
                  <ProductBOMTable control={control} />
                </div>

                {renderProductAttributes()}

                <div style={{ textAlign: "right", marginTop: "24px" }}>
                  <Button
                    style={{ marginRight: "8px" }}
                    onClick={() => confirmExit(() => navigate(`/products${location.search}`))}
                  >
                    Hủy
                  </Button>
                  <Button
                    type='primary'
                    htmlType='submit'
                    loading={loading}
                    icon={<SaveOutlined />}
                  >
                    {isEdit ? "Cập nhật" : "Thêm mới"}
                  </Button>
                </div>
              </div>
            </form>
            </Spin>
          </div>
        </div>

        {/* AI So sánh sản phẩm - 1 cột */}
        <div className='lg:col-span-1'>
          <div className='sticky top-4'>
            <ProductComparisonPanel
              currentProduct={{
                name: watch('name') || '',
                product_type: productTypes?.data?.items?.find((t: ProductType) => t.id === watch('type'))?.name,
                active_ingredient: watch('ingredient') || '',
                price: watch('price') ? parseFloat(watch('price')) : undefined,
                unit: units?.data?.items?.find((u: any) => u.id === watch('unit_id'))?.name,
                description: description,
              }}
              availableProducts={
                allProducts?.data?.items?.map((p) => ({
                  id: p.id,
                  name: p.name,
                  product_type: productTypes?.data?.items?.find((t: ProductType) => t.id === p.type)?.name,
                  active_ingredient: Array.isArray(p.ingredient) ? p.ingredient.join(', ') : p.ingredient,
                  concentration: p.attributes?.concentration as string | undefined,
                  unit: units?.data?.items?.find((u: any) => u.id === p.unit_id)?.name,
                  price: parseFloat(p.price || '0'),
                  manufacturer: p.attributes?.manufacturer as string | undefined,
                  description: p.description,
                  usage: p.attributes?.usage as string | undefined,
                })) || []
              }
            />
          </div>
        </div>
      </div>
      </Card>

      {/* Modal điều chỉnh tồn kho */}
      {isEdit && productItemData && (
        <AdjustStockModal
          visible={adjustModalVisible}
          onClose={() => setAdjustModalVisible(false)}
          product={{
            id: currentProductId,
            name: watchedName || (productItemData as any)?.name,
            trade_name: watchedTradeName || (productItemData as any)?.trade_name,
            currentQuantity: watchedQuantity,
          }}
        />
      )}
    </div>
  )
}

export default ProductForm

