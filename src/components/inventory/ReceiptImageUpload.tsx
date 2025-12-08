// Component upload và quản lý ảnh hóa đơn

import React, { useState, useRef } from "react"
import { Card, Button, Upload, Image, Space, message as antdMessage, Popconfirm } from "antd"
import { UploadOutlined, DeleteOutlined } from "@ant-design/icons"
import type { UploadFile } from "antd"
import heic2any from "heic2any"

import {
  useReceiptImagesQuery,
  useUploadFileMutation,
  useAttachImageToReceiptMutation,
  useDeleteReceiptImageMutation,
} from "@/queries/inventory"

interface Props {
  receiptId: number
}

const ReceiptImageUpload: React.FC<Props> = ({ receiptId }) => {
  const [uploading, setUploading] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const { data: images, isLoading } = useReceiptImagesQuery(receiptId)
  const uploadFileMutation = useUploadFileMutation()
  const attachImageMutation = useAttachImageToReceiptMutation()
  const deleteImageMutation = useDeleteReceiptImageMutation()

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

      // 2. Gắn file vào phiếu
      await attachImageMutation.mutateAsync({
        receiptId,
        fileId: (uploadResult as any).data.id,
        fieldName: "invoice_images",
      })

      antdMessage.success("Upload ảnh thành công!")
    } catch (error) {
      console.error("Error uploading image:", error)
      antdMessage.error("Upload ảnh thất bại!")
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (imageId: number) => {
    try {
      await deleteImageMutation.mutateAsync({ receiptId, fileId: imageId })
    } catch (error) {
      console.error("Error deleting image:", error)
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
      loading={isLoading}
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

        {images && images.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
            {images.map((image) => (
              <div key={image.id} style={{ position: "relative" }}>
                <Image
                  src={image.url}
                  alt={image.name}
                  style={{ width: "100%", height: "200px", objectFit: "cover", borderRadius: "8px" }}
                />
                <Popconfirm
                  title="Xóa ảnh"
                  description="Bạn có chắc chắn muốn xóa ảnh này?"
                  onConfirm={() => handleDelete(image.id)}
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
                    loading={deleteImageMutation.isPending}
                  />
                </Popconfirm>
              </div>
            ))}
          </div>
        )}

        {images && images.length === 0 && (
          <div style={{ textAlign: "center", padding: "24px", color: "#999" }}>
            Chưa có ảnh nào được upload. Click vào upload hoặc paste ảnh (Ctrl+V).
          </div>
        )}
      </Space>
    </Card>
  )
}

export default ReceiptImageUpload
