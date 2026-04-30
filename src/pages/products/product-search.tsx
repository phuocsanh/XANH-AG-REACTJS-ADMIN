import * as React from "react"
import { ExtendedProduct } from "../../models/product.model"
import { useProductsQuery } from "../../queries/product"
import { Tag, Input, Card, Typography, message } from "antd"
import { SearchOutlined } from "@ant-design/icons"
import DataTable from "../../components/common/data-table"
import ProductDetailModal from "./components/product-detail-modal"
import VoiceSearchButton from "@/components/VoiceSearchButton"
import { useVoiceSearch } from "@/hooks/useVoiceSearch"

const { Title } = Typography

/**
 * Trang tìm kiếm sản phẩm chuyên dụng
 * Cho phép tìm kiếm theo tên, tên thương mại và ghi chú
 * Hỗ trợ tìm kiếm bằng giọng nói (Web Speech API)
 * Hiển thị cột ghi chú cho từng sản phẩm
 */
const ProductSearch: React.FC = () => {
  // State quản lý tìm kiếm và phân trang
  const [inputValue, setInputValue] = React.useState("")
  const [searchTerm, setSearchTerm] = React.useState("")
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)

  // Voice Search Hook
  const {
    isListening,
    interimTranscript,
    error: voiceError,
    isSupported: isVoiceSupported,
    startListening,
    stopListening,
  } = useVoiceSearch({
    lang: "vi-VN",
    continuous: true, // Cho phép ghi âm liên tục, không tự động dừng
    interimResults: true,
    onTranscript: (text) => {
      // Khi có kết quả từ giọng nói, tự động điền vào ô tìm kiếm
      setInputValue(text)
      message.success(`Đã nhận: "${text}"`)
      // Hook sẽ tự động dừng sau 1.5s không có giọng nói
    },
    onError: (errorMsg) => {
      message.error(errorMsg)
    },
  })

  // Debounce logic: Đợi 1.5 giây sau khi ngừng gõ mới tìm kiếm
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(inputValue)
      setCurrentPage(1)
    }, 1500)

    return () => clearTimeout(timer)
  }, [inputValue])

  // Hàm xử lý khi người dùng nhấn Enter (tìm kiếm ngay lập tức)
  const handleSearchNow = () => {
    setSearchTerm(inputValue)
    setCurrentPage(1)
  }

  // State cho Modal chi tiết
  const [isDetailModalVisible, setIsDetailModalVisible] = React.useState(false)
  const [selectedProduct, setSelectedProduct] =
    React.useState<ExtendedProduct | null>(null)

  // Build Params cho Query - Sử dụng query 'keyword' để tìm kiếm tổng quát
  const queryParams = React.useMemo(
    () => ({
      page: currentPage,
      limit: pageSize,
      keyword: searchTerm,
      status: "active", // Chỉ tìm sản phẩm đang bán
    }),
    [currentPage, pageSize, searchTerm],
  )

  // Sử dụng Server-side Query
  const { data: productsData, isLoading: isQueryLoading } =
    useProductsQuery(queryParams)

  // Hiển thị loading khi đang đợi debounce HOẶC đang gọi API
  const isLoading = isQueryLoading || inputValue !== searchTerm

  const products = productsData?.data?.items || []
  const totalProducts = productsData?.data?.total || 0

  // Hàm mở modal chi tiết
  const handleViewDetail = (product: ExtendedProduct) => {
    setSelectedProduct(product)
    setIsDetailModalVisible(true)
  }

  // Hook để detect screen size
  const [windowWidth, setWindowWidth] = React.useState(
    typeof window !== "undefined" ? window.innerWidth : 1024,
  )

  React.useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Responsive widths
  const isMobile = windowWidth < 768
  const isTablet = windowWidth >= 768 && windowWidth < 1024

  const getColumnWidth = (mobile: number, tablet: number, desktop: number) => {
    if (isMobile) return mobile
    if (isTablet) return tablet
    return desktop
  }

  // Helper function để format plain text notes thành HTML
  const formatPlainTextNotes = (text: string): string => {
    // Thay thế • và + bằng xuống dòng + ký tự gốc
    return text
      .split("\n")
      .map((line) => {
        // Xử lý dòng bắt đầu bằng •
        if (line.trim().startsWith("•")) {
          return `<div style="margin-top: 8px; margin-bottom: 4px;"><strong>${line.trim()}</strong></div>`
        }
        // Xử lý dòng bắt đầu bằng +
        if (line.trim().startsWith("+")) {
          return `<div style="margin-left: 16px; margin-bottom: 2px;">${line.trim()}</div>`
        }
        // Dòng thường
        return line.trim() ? `<div>${line.trim()}</div>` : ""
      })
      .filter((line) => line) // Loại bỏ dòng trống
      .join("")
  }

  // ✅ Helper để lấy hệ số quy đổi Bao của sản phẩm
  const getBaoConversion = (product: ExtendedProduct) => {
    const conversions = product.unit_conversions || []
    const baoConv = conversions.find((c: any) =>
      (c.unit_name || c.unit?.name || "").toLowerCase().includes("bao"),
    )
    if (!baoConv) return null
    return {
      factor: Number(baoConv.conversion_factor),
      unitName: baoConv.unit_name || baoConv.unit?.name || "Bao",
    }
  }

  // Cấu hình columns cho DataTable
  const columns = [
    {
      key: "name",
      title: "Tên sản phẩm",
      width: getColumnWidth(180, 220, 280),
      fixed: "left" as const,
      render: (_: unknown, record: ExtendedProduct) => (
        <div className='flex flex-col gap-0.5'>
          <div className='font-medium text-gray-900 whitespace-normal break-words'>
            {record.name}
          </div>
          {record.trade_name && record.trade_name !== record.name && (
            <div className='text-[12px] text-gray-500 italic whitespace-normal break-words'>
              ({record.trade_name})
            </div>
          )}
        </div>
      ),
    },
    {
      key: "unit",
      title: "Đơn vị",
      width: getColumnWidth(80, 100, 100),
      render: (_: unknown, record: ExtendedProduct) => {
        const unitName =
          record.unit_name ||
          (typeof record.unit === "object" && record.unit
            ? record.unit.name
            : "---")
        return <div className='text-gray-600'>{unitName}</div>
      },
    },
    {
      key: "notes",
      title: "Ghi chú",
      width: getColumnWidth(210, 250, 350), // Mobile: 210, Tablet: 250, Desktop: 350
      render: (_: unknown, record: ExtendedProduct) => {
        const isHTML = record.notes && /<[^>]+>/.test(record.notes)

        return (
          <div className='text-gray-600 bg-gray-50 p-2 rounded border border-gray-100 italic whitespace-normal break-words'>
            {record.notes ? (
              isHTML ? (
                <div dangerouslySetInnerHTML={{ __html: record.notes }} />
              ) : (
                <div
                  dangerouslySetInnerHTML={{
                    __html: formatPlainTextNotes(record.notes),
                  }}
                />
              )
            ) : (
              <span className='text-gray-300'>Không có ghi chú</span>
            )}
          </div>
        )
      },
    },
    {
      key: "active_promotions",
      title: "Khuyến mãi",
      width: getColumnWidth(180, 220, 260),
      render: (_: unknown, record: ExtendedProduct) => {
        const promotions = record.active_promotions || []
        if (!promotions.length) {
          return <span className='text-gray-300'>Không có</span>
        }

        return (
          <div className='flex flex-wrap gap-1'>
            {promotions.map((promotion) => (
              <Tag key={promotion.id} color='gold'>
                {promotion.code ? `${promotion.code} - ${promotion.name}` : promotion.name}
              </Tag>
            ))}
          </div>
        )
      },
    },
    {
      key: "price",
      title: "Giá tiền mặt",
      width: 140,
      render: (value: string, record: ExtendedProduct) => {
        const bao = getBaoConversion(record)
        return (
          <div>
            <div className='font-bold text-emerald-600'>
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
              }).format(Number(record.price || 0))}
            </div>
            {bao && Number(record.price) > 0 && (
              <div className='text-[11px] font-bold text-emerald-500 bg-emerald-50 px-1 rounded border border-emerald-100 w-fit'>
                {Number(record.price) * bao.factor >= 1000
                  ? `${(Number(record.price) * bao.factor).toLocaleString("vi-VN")} đ/${bao.unitName}`
                  : `${(Number(record.price) * bao.factor).toLocaleString("vi-VN")} đ/${bao.unitName}`}
              </div>
            )}
          </div>
        )
      },
    },
    {
      key: "credit_price",
      title: "Giá nợ",
      width: 140,
      render: (value: string, record: ExtendedProduct) => {
        const bao = getBaoConversion(record)
        return (
          <div>
            <div className='font-bold text-blue-600'>
              {record.credit_price
                ? new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(Number(record.credit_price))
                : "---"}
            </div>
            {bao && record.credit_price && Number(record.credit_price) > 0 && (
              <div className='text-[11px] font-bold text-blue-500 bg-blue-50 px-1 rounded border border-blue-100 w-fit'>
                {(Number(record.credit_price) * bao.factor).toLocaleString(
                  "vi-VN",
                )}{" "}
                đ/{bao.unitName}
              </div>
            )}
          </div>
        )
      },
    },
    {
      key: "tax_selling_price",
      title: "GBKT",
      width: 140,
      render: (value: string, record: ExtendedProduct) => {
        const bao = getBaoConversion(record)
        return (
          <div>
            <div className='font-bold text-pink-600'>
              {record.tax_selling_price
                ? new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(Number(record.tax_selling_price))
                : "---"}
            </div>
            {bao &&
              record.tax_selling_price &&
              Number(record.tax_selling_price) > 0 && (
                <div className='text-[11px] font-bold text-pink-500 bg-pink-50 px-1 rounded border border-pink-100 w-fit'>
                  {(
                    Number(record.tax_selling_price) * bao.factor
                  ).toLocaleString("vi-VN")}{" "}
                  đ/{bao.unitName}
                </div>
              )}
          </div>
        )
      },
    },
    {
      key: "has_input_invoice",
      title: "Hóa đơn",
      width: 100,
      render: (value: boolean) => (
        <Tag color={value ? "blue" : "default"}>
          {value ? "Có hóa đơn" : "Không hóa đơn"}
        </Tag>
      ),
    },
    {
      key: "quantity",
      title: "Tồn kho",
      width: 120,
      align: "center" as const,
      render: (_: number, record: ExtendedProduct) => {
        const bao = getBaoConversion(record)
        const qty = record.quantity || 0
        const roundedQty = Math.round(qty)
        const unitName = record.unit?.name || record.unit_name || ""

        if (bao && Math.abs(qty) >= bao.factor) {
          const baoQty = Math.floor(qty / bao.factor)
          return (
            <div className='flex flex-col items-center'>
              <Tag color={roundedQty > 0 ? "green" : "default"} className='m-0'>
                {new Intl.NumberFormat("vi-VN").format(roundedQty)} {unitName}
              </Tag>
              <div className='text-[10px] font-bold text-green-600 whitespace-nowrap mt-1'>
                ≈ {new Intl.NumberFormat("vi-VN").format(baoQty)} {bao.unitName}
              </div>
            </div>
          )
        }

        return (
          <Tag color={roundedQty > 0 ? "green" : "default"} className='m-0'>
            {new Intl.NumberFormat("vi-VN").format(roundedQty)} {unitName}
          </Tag>
        )
      },
    },
  ]

  return (
    <div className='p-4 md:p-8 bg-gray-50 min-h-screen'>
      <Card className='shadow-lg border-emerald-100 mb-6'>
        <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
          <div>
            <Title level={2} className='!mb-0 !text-emerald-800'>
              Tìm sản phẩm
            </Title>
            <Typography.Text type='secondary'>
              Tìm nhanh theo tên sản phẩm, tên thương mại hoặc ghi chú kỹ thuật
            </Typography.Text>
          </div>
          <div className='w-full md:w-96'>
            <Input
              prefix={<SearchOutlined className='text-emerald-500' />}
              suffix={
                <VoiceSearchButton
                  isListening={isListening}
                  isSupported={isVoiceSupported}
                  error={voiceError}
                  interimTranscript={interimTranscript}
                  onStart={startListening}
                  onStop={stopListening}
                />
              }
              placeholder='Nhập tên, hiệu thuốc hoặc ghi chú...'
              size='large'
              allowClear
              className='rounded-full border-emerald-200'
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onPressEnter={handleSearchNow}
              autoFocus
            />
          </div>
        </div>
      </Card>

      <div className='bg-white rounded-xl shadow-md overflow-hidden border border-gray-100'>
        <DataTable
          data={products as ExtendedProduct[]}
          columns={columns}
          loading={isLoading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: totalProducts,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50"],
            showTotal: (total: number) => `Tìm thấy ${total} sản phẩm`,
          }}
          onChange={(pagination) => {
            if (pagination.current && pagination.pageSize) {
              setCurrentPage(pagination.current)
              setPageSize(pagination.pageSize)
            }
          }}
          onView={(record) => handleViewDetail(record as ExtendedProduct)}
          onRow={() => ({
            className: "cursor-pointer hover:bg-emerald-50 transition-colors",
          })}
          searchableColumns={[]}
          showSearch={false}
          showFilters={false}
          showActions={false}
        />
      </div>

      <ProductDetailModal
        visible={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        product={selectedProduct}
      />
    </div>
  )
}

export default ProductSearch
