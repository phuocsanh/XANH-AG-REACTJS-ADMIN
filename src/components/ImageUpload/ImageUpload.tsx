import React, { useState } from "react"
import { Upload, UploadFile, UploadProps, message, Spin } from "antd"
import { UploadOutlined } from "@ant-design/icons"
import { uploadFile } from "../../services/upload.service"

interface ImageUploadProps {
  value?: string[]
  onChange?: (urls: string[]) => void
  maxCount?: number
  multiple?: boolean
  folder: string
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  value = [],
  onChange,
  maxCount = 5,
  multiple = true,
  folder = "temporary",
}) => {
  const [loading, setLoading] = useState(false)
  const [fileList, setFileList] = useState<UploadFile[]>([])

  // Convert URLs to UploadFile objects
  React.useEffect(() => {
    if (value && value.length > 0) {
      const files = value.map((url, index) => ({
        uid: `-${index}`,
        name: `image-${index}.jpg`,
        status: "done",
        url: url,
      }))
      setFileList(files)
    } else {
      setFileList([])
    }
  }, [value])

  const handleChange: UploadProps["onChange"] = async ({
    file: uploadedFile,
    fileList: newFileList,
  }) => {
    console.log("🚀 ~ file:", uploadedFile)

    // Filter out files that are done uploading
    const filteredList = newFileList.filter(
      (file) => file.status !== "done" || file.url
    )
    console.log("🚀 ~ filteredList:", filteredList)

    // Set file list first to show the file is being uploaded
    setFileList(filteredList)

    // Find the current file in the filtered list to get originFileObj
    const currentFile = filteredList.find((f) => f.uid === uploadedFile.uid)

    // If file is newly added and has originFileObj
    if (currentFile?.originFileObj) {
      try {
        setLoading(true)
        const response = await uploadFile(
          currentFile.originFileObj as File,
          folder
        )

        // Update the file in the list with the URL from the server
        const updatedList = newFileList.map((item) => {
          if (item.uid === uploadedFile.uid) {
            return {
              ...item,
              url: response.url,
              status: "done" as const,
            }
          }
          return item
        })

        setFileList(updatedList)

        // Extract URLs and call onChange
        const urls = updatedList
          .filter((item) => item.status === "done" && item.url)
          .map((item) => item.url as string)

        onChange?.(urls)
      } catch (error) {
        console.error("Upload error:", error)
        message.error("Tải ảnh lên thất bại")
        // Remove the failed upload from the list
        const updatedList = newFileList.filter(
          (item) => item.uid !== uploadedFile.uid
        )
        setFileList(updatedList)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleRemove = (file: UploadFile) => {
    const newFileList = fileList.filter((item) => item.uid !== file.uid)
    setFileList(newFileList)

    // Extract URLs of remaining files and call onChange
    const urls = newFileList
      .filter((item) => item.status === "done" && item.url)
      .map((item) => item.url) as string[]

    onChange?.(urls)
    return true // Allow the default remove behavior
  }

  const uploadButton = (
    <div>
      <UploadOutlined />
      <div style={{ marginTop: 8 }}>Tải lên</div>
    </div>
  )

  return (
    <Spin spinning={loading}>
      <Upload
        listType='picture-card'
        fileList={fileList}
        onChange={handleChange}
        onRemove={handleRemove}
        beforeUpload={() => false} // Prevent default upload
        multiple={multiple}
        maxCount={maxCount}
      >
        {fileList.length >= maxCount ? null : uploadButton}
      </Upload>
    </Spin>
  )
}

export default ImageUpload
