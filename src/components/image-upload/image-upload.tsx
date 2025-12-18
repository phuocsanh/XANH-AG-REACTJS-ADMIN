import React, { useState, useRef } from "react"
import { Upload, message } from "antd"
import { UploadFile, UploadProps } from "antd/lib/upload/interface"
import { useUploadImageMutation } from "../../queries/upload"

import { UPLOAD_TYPES, UploadType } from "@/services/upload.service"

interface ImageUploadProps {
  value?: any[] // string[] or object[]
  onChange?: (files: any[]) => void
  maxCount?: number
  multiple?: boolean
  uploadType?: UploadType
  returnFullObjects?: boolean
}

const { Dragger } = Upload

const ImageUpload: React.FC<ImageUploadProps> = ({
  value = [],
  onChange,
  maxCount = 5,
  multiple = true,
  uploadType = UPLOAD_TYPES.COMMON,
  returnFullObjects = false,
}) => {
  const [loading, setLoading] = useState(false)
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [isFocused, setIsFocused] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Upload mutation
  const uploadImageMutation = useUploadImageMutation()

  // Convert URLs to UploadFile objects
  React.useEffect(() => {
    if (value && value.length > 0) {
      const files = value.map((item, index) => {
        // Handle both string URLs and objects
        const url = typeof item === 'string' ? item : item?.url || '';
        return {
          uid: typeof item === 'object' && item?.id ? String(item.id) : `-${index}`,
          name: typeof item === 'object' && item?.name ? item.name : `image-${index}.jpg`,
          status: "done" as const,
          url: url,
          response: typeof item === 'object' ? item : undefined, // Keep original object in response
        };
      });
      setFileList(files)
    } else {
      setFileList([])
    }
  }, [value])

  /**
   * Xử lý khi paste ảnh từ clipboard
   */
  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items
    let hasImage = false

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile()
        if (file) {
          hasImage = true
          
          // Kiểm tra maxCount
          if (fileList.length >= maxCount) {
            message.warning(`Chỉ được tải tối đa ${maxCount} ảnh`)
            return
          }

          // Tạo UploadFile object từ file paste
          const uploadFile: UploadFile = {
            uid: `paste-${Date.now()}-${i}`,
            name: file.name || `pasted-image-${Date.now()}.png`,
            status: 'uploading',
            originFileObj: file as any,
          }

          // Thêm vào fileList
          const newFileList = [...fileList, uploadFile]
          setFileList(newFileList)

          // Upload file
          try {
            setLoading(true)
            const uploadRequest = {
              file: file,
              type: uploadType,
            }

            const response = await uploadImageMutation.mutateAsync(uploadRequest)

            // Cập nhật file với URL từ server
            const updatedList = newFileList.map((item) => {
              if (item.uid === uploadFile.uid) {
                return {
                  ...item,
                  url: response.url,
                  thumbUrl: response.url,
                  status: "done" as const,
                }
              }
              return item
            })

            setFileList(updatedList)

            // Extract URLs và gọi onChange
            const result = updatedList
              .filter((item) => item.status === "done" && item.url)
              .map((item) => {
                if (returnFullObjects) {
                    return {
                        id: response.id,
                        url: response.url,
                        name: item.name,
                    };
                }
                return item.url;
              });

            onChange?.(result as any[])
            message.success('Đã paste ảnh thành công!')
          } catch (error) {
            console.error('Upload error:', error)
            message.error('Tải ảnh lên thất bại')
            
            // Xóa file lỗi khỏi list
            const updatedList = newFileList.filter(
              (item) => item.uid !== uploadFile.uid
            )
            setFileList(updatedList)
          } finally {
            setLoading(false)
          }
        }
      }
    }

    if (hasImage) {
      e.preventDefault()
    }
  }

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
        // Create proper UploadFileRequest object with required properties
        const uploadRequest = {
          file: currentFile.originFileObj as File,
          type: uploadType,
        }

        const response = await uploadImageMutation.mutateAsync(uploadRequest)

        // Update the file in the list with the URL from the server
        const updatedList = newFileList.map((item) => {
          if (item.uid === uploadedFile.uid) {
            return {
              ...item,
              // Use correct property name from server response
              url: response.url,
              response: response, // Store full response
              thumbUrl: response.url,
              status: "done" as const,
            }
          }
          return item
        })

        setFileList(updatedList)

        // Extract URLs and call onChange
        const result = updatedList
          .filter((item) => item.status === "done" && item.url)
          .map((item) => {
             if (returnFullObjects) {
                 return {
                     id: item.response?.id || item.uid, // Use response ID if available
                     url: item.url,
                     name: item.name,
                     type: item.response?.type || 'image',
                 };
             }
             return item.url;
          });

        console.log('📸 Upload thành công, calling onChange with:', result);
        onChange?.(result as any[])
      } catch (error) {
        console.error("Upload error:", error)
        message.error("Tải ảnh lên thất bại")
        // Remove the failed upload from the list
        const updatedList = newFileList.filter(
          (item) => item.uid !== uploadedFile.uid
        )
        setFileList(updatedList)

        // Extract URLs and call onChange even when there's an error
        const result = updatedList
          .filter((item) => item.status === "done" && item.url)
          .map((item) => {
             if (returnFullObjects) {
                 return item.response || { url: item.url };
             }
             return item.url;
          });

        onChange?.(result as any[])
      } finally {
        setLoading(false)
      }
    } else {
      // For files that are already uploaded or in other states,
      // extract URLs and call onChange
      const urls = filteredList
        .filter((item) => item.status === "done" && item.url)
        .map((item) => item.url as string)

      // Only call onChange if URLs actually changed
      const currentUrls = value || []
      const hasChanged = 
        urls.length !== currentUrls.length ||
        urls.some((url, index) => url !== currentUrls[index])
      
      if (hasChanged) {
        onChange?.(urls)
      }
    }
  }

  // Update response property when using paste
  const handlePasteUpdate = (updatedList: UploadFile[]) => {
      const result = updatedList
        .filter((item) => item.status === "done" && item.url)
        .map((item) => {
           if (returnFullObjects) {
               return {
                   id: item.response?.id || item.uid,
                   url: item.url,
                   name: item.name,
               };
           }
           return item.url;
        });
      onChange?.(result as any[]);
  };

  const handleRemove = (file: UploadFile) => {
    const newFileList = fileList.filter((item) => item.uid !== file.uid)
    setFileList(newFileList)

    // Extract URLs of remaining files and call onChange
    const result = newFileList
      .filter((item) => item.status === "done" && item.url)
      .map((item) => {
         if (returnFullObjects) {
             return item.response || { url: item.url };
         }
         return item.url;
      });

    onChange?.(result as any[])
    return true // Allow the default remove behavior
  }

  return (
    <div
      ref={containerRef}
      onPaste={handlePaste}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      tabIndex={0}
      style={{
        outline: 'none',
        border: isFocused ? '2px solid #1890ff' : '2px solid transparent',
        borderRadius: '8px',
        padding: '2px',
        transition: 'border-color 0.3s',
      }}
    >
      <Dragger
        fileList={fileList}
        onChange={handleChange}
        onRemove={handleRemove}
        multiple={multiple}
        maxCount={maxCount}
        beforeUpload={() => false} // Prevent automatic upload
        listType='picture-card'
        disabled={loading}
        accept="image/*,.heic,.heif"
      >
        <div className='flex flex-col items-center justify-center p-2'>
          <div className='text-blue-500 text-lg mb-1'>Tải ảnh lên</div>
          <div className='text-gray-500 text-sm'>
            Click hoặc kéo thả ảnh vào đây
          </div>
          <div className='text-gray-400 text-xs mt-1'>
            Hỗ trợ JPG, PNG, HEIC (iPhone)
          </div>
          {isFocused && (
            <div className='text-blue-500 text-xs mt-2 font-semibold animate-pulse'>
              📋 Nhấn Ctrl+V để paste ảnh
            </div>
          )}
        </div>
      </Dragger>
    </div>
  )
}

export default ImageUpload
