import React, { useState } from "react"
import { Upload, message } from "antd"
import { UploadFile, UploadProps } from "antd/lib/upload/interface"
import { useUploadFileMutation } from "../../queries/upload"

interface ImageUploadProps {
  value?: string[]
  onChange?: (urls: string[]) => void
  maxCount?: number
  multiple?: boolean
}

const { Dragger } = Upload

const ImageUpload: React.FC<ImageUploadProps> = ({
  value = [],
  onChange,
  maxCount = 5,
  multiple = true,
}) => {
  const [loading, setLoading] = useState(false)
  const [fileList, setFileList] = useState<UploadFile[]>([])

  // Upload mutation
  const uploadFileMutation = useUploadFileMutation()

  // Convert URLs to UploadFile objects
  React.useEffect(() => {
    if (value && value.length > 0) {
      const files = value.map((url, index) => ({
        uid: `-${index}`,
        name: `image-${index}.jpg`,
        status: "done" as const,
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
        // Fix: Create proper UploadFileRequest object with required properties
        const uploadRequest = {
          file: currentFile.originFileObj as File,
          type: "image", // Default to image type
          folder: "images", // Default folder
        }

        const response = await uploadFileMutation.mutateAsync(uploadRequest)

        // Update the file in the list with the URL from the server
        const updatedList = newFileList.map((item) => {
          if (item.uid === uploadedFile.uid) {
            return {
              ...item,
              // Fix: Use correct property name from UploadResponse interface
              url: response.file_url,
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

        // Extract URLs and call onChange even when there's an error
        const urls = updatedList
          .filter((item) => item.status === "done" && item.url)
          .map((item) => item.url as string)

        onChange?.(urls)
      } finally {
        setLoading(false)
      }
    } else {
      // For files that are already uploaded or in other states,
      // extract URLs and call onChange
      const urls = filteredList
        .filter((item) => item.status === "done" && item.url)
        .map((item) => item.url as string)

      onChange?.(urls)
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

  return (
    <Dragger
      fileList={fileList}
      onChange={handleChange}
      onRemove={handleRemove}
      multiple={multiple}
      maxCount={maxCount}
      beforeUpload={() => false} // Prevent automatic upload
      listType='picture-card'
      disabled={loading}
    >
      <div className='flex flex-col items-center justify-center p-2'>
        <div className='text-blue-500 text-lg mb-1'>Tải ảnh lên</div>
        <div className='text-gray-500 text-sm'>
          Click hoặc kéo thả ảnh vào đây
        </div>
      </div>
    </Dragger>
  )
}

export default ImageUpload
