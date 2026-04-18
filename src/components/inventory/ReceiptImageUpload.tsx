// Component upload và quản lý ảnh hóa đơn

import React, { useState, useRef } from "react"
import { Card, Button, Upload, Image, Space, message as antdMessage, Popconfirm } from "antd"
import { UploadOutlined, DeleteOutlined } from "@ant-design/icons"
import type { UploadFile } from "antd"
import heic2any from "heic2any"

import {
  useUploadFileMutation,
  useUpdateInventoryReceiptMutation,
} from "@/queries/inventory"

interface ImageData {
  id: number
  url: string
  name: string
  type?: string
  size?: number
  created_at?: string
}

interface Props {
  receiptId: number
  images?: string[] // Mảng URL ảnh từ API chi tiết phiếu nhập
  onImagesChange?: () => void // Callback để refresh dữ liệu phiếu nhập
}

const ReceiptImageUpload: React.FC<Props> = ({ receiptId, images = [], onImagesChange }) => {
  const [uploading, setUploading] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const uploadFileMutation = useUploadFileMutation()
  const updateReceiptMutation = useUpdateInventoryReceiptMutation()

  // Chuyển đổi mảng URL string thành ImageData để hiển thị
  const imageData: ImageData[] = images.map((url, index) => ({
    id: index,
    url,
    name: `Image ${index + 1}`,
  }))

  const handleFileSelect = async (file: File) => {
    try {
      setUploading(true)
      let fileToUpload = file

      // Convert HEIC nếu cần
      if (file.type === 'image/heic' || file.type === 'image/heif' || 
          file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
        antdMessage.loading({ content: 'Đang xử lý ảnh HEIC...', key: 'heic-convert', duration: 0 })
        
        try {
          const convertedBlob = await heic2any({
            blob: file,
            toType: 'image/jpeg',
            quality: 0.8,
          })

          const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob
          fileToUpload = new File(
            [blob], 
            file.name.replace(/\.(heic|heif)$/i, '.jpg'),
            { type: 'image/jpeg' }
          )
          
          antdMessage.success({ content: 'Chuyển đổi ảnh thành công!', key: 'heic-convert', duration: 1 })
        } catch (error) {
          console.error("HEIC convert error:", error)
          antdMessage.error({ content: 'Lỗi chuyển đổi ảnh HEIC', key: 'heic-convert' })
          return
        }
      }

      // 1. Upload file lên server
      const uploadResult = await uploadFileMutation.mutateAsync(fileToUpload)

      // 2. Cập nhật phiếu nhập với mảng images mới
      const imageUrl = (uploadResult as any).data?.url || (uploadResult as any).url
      if (!imageUrl) throw new Error("Không lấy được URL ảnh sau khi upload")

      const updatedImages = [...images, imageUrl]
      
      await updateReceiptMutation.mutateAsync({
        id: receiptId,
        receipt: { 
          id: receiptId,
          images: updatedImages 
        }
      })

      antdMessage.success("Upload ảnh thành công!")
      
      // 3. Refresh dữ liệu phiếu nhập
      if (onImagesChange) {
        onImagesChange()
      }
    } catch (error) {
      console.error("Error uploading image:", error)
      antdMessage.error("Upload ảnh thất bại!")
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (imageUrl: string) => {
    try {
      // Xóa ảnh khỏi mảng images
      const updatedImages = images.filter(url => url !== imageUrl)
      
      // Cập nhật phiếu nhập với mảng images mới
      await updateReceiptMutation.mutateAsync({
        id: receiptId,
        receipt: { 
          id: receiptId,
          images: updatedImages 
        }
      })
      
      antdMessage.success("Xóa ảnh thành công!")
      
      // Refresh dữ liệu phiếu nhập
      if (onImagesChange) {
        onImagesChange()
      }
    } catch (error) {
      console.error("Error deleting image:", error)
      antdMessage.error("Xóa ảnh thất bại!")
    }
  }

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items
    let hasImage = false

    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            const file = items[i].getAsFile()
            if (file) {
                hasImage = true
                await handleFileSelect(file)
            }
        }
    }

    if (hasImage) {
        e.preventDefault()
    }
  }

  const uploadProps = {
    beforeUpload: (file: File) => {
      handleFileSelect(file)
      return false // Prevent auto upload
    },
    showUploadList: false,
    accept: "image/*,.heic,.heif"
  }

  return (
    <Card 
      title="Hình ảnh hóa đơn" 
      tabIndex={0}
      onPaste={handlePaste}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      ref={containerRef as any}
      style={{
        outline: 'none',
        border: isFocused ? '1px solid #1890ff' : '1px solid #f0f0f0',
        transition: 'border-color 0.3s',
      }}
      extra={isFocused && <span style={{ fontSize: '12px', color: '#1890ff' }}>📋 Ctrl+V để paste</span>}
    >
      <Space direction="vertical" style={{ width: "100%" }} size="large">
        <Upload {...uploadProps}>
          <Button icon={<UploadOutlined />} loading={uploading}>
            {uploading ? "Đang upload..." : "Upload ảnh"}
          </Button>
        </Upload>

        {imageData && imageData.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
            {imageData.map((image) => (
              <div key={image.id} style={{ position: "relative" }}>
                <Image
                  src={image.url}
                  alt={image.name}
                  style={{ width: "100%", height: "200px", objectFit: "cover", borderRadius: "8px" }}
                />
                <Popconfirm
                  title="Xóa ảnh"
                  description="Bạn có chắc chắn muốn xóa ảnh này?"
                  onConfirm={() => handleDelete(image.url)}
                  okText="Xóa"
                  cancelText="Hủy"
                >
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    size="small"
                    style={{
                      position: "absolute",
                      top: "8px",
                      right: "8px",
                    }}
                    loading={updateReceiptMutation.isPending}
                  />
                </Popconfirm>
              </div>
            ))}
          </div>
        )}

        {imageData && imageData.length === 0 && (
          <div style={{ textAlign: "center", padding: "24px", color: "#999" }}>
            Chưa có ảnh nào được upload. Click vào upload hoặc paste ảnh (Ctrl+V).
          </div>
        )}
      </Space>
    </Card>
  )
}

export default ReceiptImageUpload
