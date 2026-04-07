import * as React from "react"
import { Modal, Button, Descriptions, Image, Tag } from "antd"
import { Product } from "../../../models/product.model"

interface ProductDetailModalProps {
  visible: boolean
  onCancel: () => void
  product: Product | null
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  visible,
  onCancel,
  product,
}) => {
  // Hàm tiện ích để xử lý đường dẫn ảnh
  const getImageUrl = (url: string | undefined): string => {
    if (!url) return "https://via.placeholder.com/80?text=No+Image"
    if (url.startsWith("http")) return url
    if (url.startsWith("/")) return `http://localhost:3003${url}`
    return url
  }

  // Helper function for currency formatting
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value)
  }

  // ✅ Helper để lấy hệ số quy đổi Bao
  const getBaoConversion = (product: Product) => {
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

  const renderValueWithBao = (
    value: number,
    product: Product,
    isPrice: boolean = true,
  ) => {
    const bao = getBaoConversion(product)
    // ✅ Lấy đơn vị tính mặc định của sản phẩm (kg, chai, gói, etc.)
    const defaultUnit =
      product.unit_name ||
      (typeof product.unit === "object" && product.unit
        ? product.unit.name
        : "kg")
    const mainValue = isPrice ? (
      formatCurrency(value)
    ) : (
      <span>
        {new Intl.NumberFormat("vi-VN", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }).format(value)}{" "}
        {defaultUnit}
      </span>
    )

    if (!bao || value <= 0) return mainValue

    const converted = isPrice ? value * bao.factor : value / bao.factor
    const convertedStr = isPrice
      ? formatCurrency(converted).replace("₫", `đ/${bao.unitName}`)
      : `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(converted)} ${bao.unitName}`

    return (
      <div className='flex flex-col'>
        <span>{mainValue}</span>
        <span className='text-[12px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 w-fit mt-1'>
          {convertedStr}
        </span>
      </div>
    )
  }

  // Helper function để format plain text notes thành HTML
  const formatPlainTextNotes = (text: string): string => {
    return text
      .split("\n")
      .map((line) => {
        if (line.trim().startsWith("•")) {
          return `<div style="margin-top: 8px; margin-bottom: 4px;"><strong>${line.trim()}</strong></div>`
        }
        if (line.trim().startsWith("+")) {
          return `<div style="margin-left: 16px; margin-bottom: 2px;">${line.trim()}</div>`
        }
        return line.trim() ? `<div>${line.trim()}</div>` : ""
      })
      .filter((line) => line)
      .join("")
  }

  return (
    <Modal
      title='Chi tiết sản phẩm'
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key='close' onClick={onCancel}>
          Đóng
        </Button>,
      ]}
      width={700}
    >
      {product && (
        <Descriptions bordered column={1}>
          {(product.thumb ||
            (product.pictures && product.pictures.length > 0)) && (
            <Descriptions.Item label='Hình ảnh'>
              <Image
                src={getImageUrl(
                  product.thumb ||
                    (product.pictures && product.pictures.length > 0
                      ? product.pictures[0]
                      : undefined),
                )}
                width={80}
                height={80}
                style={{ objectFit: "cover", borderRadius: "4px" }}
                alt={product.name}
              />
            </Descriptions.Item>
          )}
          <Descriptions.Item label='Tên sản phẩm'>
            {product.name}
          </Descriptions.Item>
          {product.notes && (
            <Descriptions.Item label='Ghi chú'>
              {/<[^>]+>/.test(product.notes) ? (
                <div
                  dangerouslySetInnerHTML={{ __html: product.notes }}
                  style={{
                    maxHeight: "200px",
                    overflowY: "auto",
                    wordBreak: "break-word",
                  }}
                />
              ) : (
                <div
                  dangerouslySetInnerHTML={{
                    __html: formatPlainTextNotes(product.notes),
                  }}
                  style={{
                    maxHeight: "200px",
                    overflowY: "auto",
                    wordBreak: "break-word",
                  }}
                />
              )}
            </Descriptions.Item>
          )}
          <Descriptions.Item label='Mô tả'>
            {product.description ? (
              <div
                dangerouslySetInnerHTML={{ __html: product.description }}
                style={{
                  maxHeight: "300px",
                  overflowY: "auto",
                  wordBreak: "break-word",
                }}
              />
            ) : (
              "Không có mô tả"
            )}
          </Descriptions.Item>
          {product.mechanism && (
            <Descriptions.Item label='Cơ chế tác động'>
              <div
                dangerouslySetInnerHTML={{ __html: product.mechanism }}
                style={{
                  maxHeight: "200px",
                  overflowY: "auto",
                  wordBreak: "break-word",
                }}
              />
            </Descriptions.Item>
          )}
          <Descriptions.Item label='Giá bán (Tiền mặt)'>
            {renderValueWithBao(Number(product.price || 0), product)}
          </Descriptions.Item>
          <Descriptions.Item label='Giá bán (Nợ)'>
            {product.credit_price
              ? renderValueWithBao(Number(product.credit_price), product)
              : "Chưa thiết lập"}
          </Descriptions.Item>
          <Descriptions.Item label='Giá vốn trung bình'>
            {renderValueWithBao(
              Number(product.average_cost_price || 0),
              product,
            )}
          </Descriptions.Item>
          <Descriptions.Item label='GBKT'>
            {product.tax_selling_price
              ? renderValueWithBao(Number(product.tax_selling_price), product)
              : "Chưa thiết lập"}
          </Descriptions.Item>
          <Descriptions.Item label='Giá sau giảm'>
            {formatCurrency(Number(product.discounted_price || 0))}
          </Descriptions.Item>
          <Descriptions.Item label='Số lượng'>
            {renderValueWithBao(Number(product.quantity || 0), product, false)}
          </Descriptions.Item>
          <Descriptions.Item label='Đã bán'>
            {product.selled || 0}
          </Descriptions.Item>
          <Descriptions.Item label='Đánh giá trung bình'>
            {product.ratings_average || "Chưa có đánh giá"}
          </Descriptions.Item>
          <Descriptions.Item label='Trạng thái'>
            <Tag color={product.status === "active" ? "green" : "default"}>
              {product.status === "active" ? "Đang bán" : "Bản nháp"}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label='Hóa đơn đầu vào'>
            <Tag color={product.has_input_invoice ? "blue" : "default"}>
              {product.has_input_invoice ? "Có hóa đơn" : "Không có hóa đơn"}
            </Tag>
          </Descriptions.Item>
          {product.discount && product.discount !== "0" && (
            <Descriptions.Item label='Giảm giá'>
              <Tag color='red'>Giảm {product.discount}%</Tag>
            </Descriptions.Item>
          )}
          <Descriptions.Item label='Phần trăm lợi nhuận'>
            {product.profit_margin_percent || "0"}%
          </Descriptions.Item>
          <Descriptions.Item label='Giá bán đề xuất'>
            {product.suggested_price
              ? formatCurrency(Number(product.suggested_price || 0))
              : "Chưa tính"}
          </Descriptions.Item>
          <Descriptions.Item label='Giá nhập mới nhất'>
            {product.latest_purchase_price
              ? renderValueWithBao(
                  Number(product.latest_purchase_price || 0),
                  product,
                )
              : "Chưa có"}
          </Descriptions.Item>
          <Descriptions.Item label='Ngày tạo'>
            {product.created_at
              ? new Date(product.created_at).toLocaleString("vi-VN")
              : "Không có"}
          </Descriptions.Item>
          <Descriptions.Item label='Ngày cập nhật'>
            {product.updated_at
              ? new Date(product.updated_at).toLocaleString("vi-VN")
              : "Chưa cập nhật"}
          </Descriptions.Item>
          {(product.symbol || product.symbol_id) && (
            <Descriptions.Item label='Ký hiệu'>
              {product.symbol?.name || product.symbol_id}
            </Descriptions.Item>
          )}
          {product.ingredient && product.ingredient.length > 0 && (
            <Descriptions.Item label='Thành phần'>
              {product.ingredient.join(", ")}
            </Descriptions.Item>
          )}
          {(product.unit || product.unit_id) && (
            <Descriptions.Item label='Đơn vị tính'>
              {typeof product.unit === "object" && product.unit !== null
                ? product.unit.name
                : product.unit || product.unit_id}
            </Descriptions.Item>
          )}
          {product.attributes && (
            <Descriptions.Item label='Thuộc tính'>
              <div className='grid grid-cols-2 gap-2'>
                {typeof product.attributes === "object" &&
                  product.attributes !== null &&
                  Object.entries(product.attributes as Record<string, unknown>)
                    .filter(([key]) => key !== "unit")
                    .map(([key, value]) => (
                      <div key={key} className='flex'>
                        <span className='font-medium mr-2'>{key}:</span>
                        <span>
                          {typeof value === "object"
                            ? JSON.stringify(value)
                            : String(value)}
                        </span>
                      </div>
                    ))}
              </div>
            </Descriptions.Item>
          )}
          {product.videos && product.videos.length > 0 && (
            <Descriptions.Item label='Videos'>
              <div className='flex flex-wrap gap-2'>
                {product.videos.map((video, index) => (
                  <a
                    key={index}
                    href={video}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-blue-500 hover:underline'
                  >
                    Video {index + 1}
                  </a>
                ))}
              </div>
            </Descriptions.Item>
          )}
          <Descriptions.Item label='Slug'>
            {product.slug || "Không có"}
          </Descriptions.Item>
        </Descriptions>
      )}
    </Modal>
  )
}

export default ProductDetailModal
