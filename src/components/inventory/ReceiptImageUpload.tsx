// Component upload và quản lý ảnh hóa đơn

import React, { useState } from "react"
import { Card, Button, Upload, Image, Space, message as antdMessage, Popconfirm } from "antd"
import { UploadOutlined, DeleteOutlined } from "@ant-design/icons"
import type { UploadFile } from "antd"

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

  const { data: images, isLoading } = useReceiptImagesQuery(receiptId)
  const uploadFileMutation = useUploadFileMutation()
  const attachImageMutation = useAttachImageToReceiptMutation()
  const deleteImageMutation = useDeleteReceiptImageMutation()

  const handleFileSelect = async (file: File) => {
    try {
      setUploading(true)

      // 1. Upload file lên server
      const uploadResult = await uploadFileMutation.mutateAsync(file)

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

  const uploadProps = {
    beforeUpload: (file: File) => {
      handleFileSelect(file)
      return false // Prevent auto upload
    },
    showUploadList: false,
  }

  return (
    <Card title="Hình ảnh hóa đơn" loading={isLoading}>
      <Space direction="vertical" style={{ width: "100%" }} size="large">
        <Upload {...uploadProps} accept="image/*">
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
            Chưa có ảnh nào được upload
          </div>
        )}
      </Space>
    </Card>
  )
}

export default ReceiptImageUpload
