import React, { useEffect } from 'react'
import { Modal, Form, Button } from 'antd'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { newsSchema, NewsFormValues, defaultNewsValues } from './news-schema'
import { FormField, FormImageUpload } from '@/components/form'
import { useCreateNewsMutation, useUpdateNewsMutation, News } from '@/queries/news'
import RichTextEditor from '@/components/common/rich-text-editor'
import { UPLOAD_TYPES } from '@/services/upload.service'

interface NewsFormProps {
  visible: boolean
  onCancel: () => void
  initialData?: News | null
}

interface ImageFile {
  url: string;
  [key: string]: unknown;
}

const NewsForm: React.FC<NewsFormProps> = ({ visible, onCancel, initialData }) => {
  const methods = useForm<NewsFormValues>({
    resolver: zodResolver(newsSchema),
    defaultValues: defaultNewsValues,
  })

  const { handleSubmit, reset, setValue, watch, control } = methods

  const createMutation = useCreateNewsMutation()
  const updateMutation = useUpdateNewsMutation()

  useEffect(() => {
    if (visible) {
      if (initialData) {
        reset({
          title: initialData.title,
          category: initialData.category,
          author: initialData.author,
          content: initialData.content,
          thumbnail_url: initialData.thumbnail_url ? [initialData.thumbnail_url] : [],
          images: initialData.images || [],
          status: initialData.status,
          tags: initialData.tags || [],
        })
      } else {
        reset(defaultNewsValues)
      }
    }
  }, [visible, initialData, reset])

  const onSubmit = async (values: NewsFormValues) => {
    // Xử lý thumbnail_url từ mảng (FormImageUpload trả về mảng)
    const thumbnailObj = values.thumbnail_url?.[0] as unknown as (string | ImageFile);
    const thumbnailUrl = typeof thumbnailObj === 'string' ? thumbnailObj : thumbnailObj?.url || '';

    // Xử lý images từ mảng
    const imagesArray = Array.isArray(values.images) 
      ? values.images.map((img: string | ImageFile) => typeof img === 'string' ? img : img.url).filter(Boolean)
      : []

    const payload = {
      ...values,
      thumbnail_url: thumbnailUrl,
      images: imagesArray
    }

    if (initialData) {
      await updateMutation.mutateAsync({ id: initialData.id, data: payload })
    } else {
      await createMutation.mutateAsync(payload)
    }
    onCancel()
  }

  return (
    <Modal
      title={initialData ? "Chỉnh sửa bài viết" : "Thêm bài viết mới"}
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={1000}
      destroyOnClose
    >
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField name="title" control={control} label="Tiêu đề bài viết" required />
            <FormField name="category" control={control} label="Danh mục" />
            <FormField name="author" control={control} label="Tác giả" />
            <FormField 
              name="status" 
              control={control} 
              label="Trạng thái" 
              type="select"
              options={[
                { label: 'Hoạt động', value: 'active' },
                { label: 'Tạm dừng', value: 'inactive' }
              ]}
            />
          </div>

          <div className="mt-4">
             <FormImageUpload 
                name="thumbnail_url" 
                control={control} 
                label="Ảnh đại diện"
                maxCount={1} 
                multiple={false}
                uploadType={UPLOAD_TYPES.NEWS}
             />
          </div>

          <div className="mt-4">
             <FormImageUpload 
                name="images" 
                control={control} 
                label="Bộ sưu tập ảnh (Nhiều ảnh)"
                maxCount={10} 
                multiple={true}
                uploadType={UPLOAD_TYPES.NEWS}
             />
          </div>

          <div className="mt-4">
            <Form.Item label="Nội dung bài viết" required>
              <RichTextEditor 
                content={watch('content')} 
                onChange={(content) => setValue('content', content)}
                minHeight={400}
                uploadType={UPLOAD_TYPES.NEWS}
              />
            </Form.Item>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button onClick={onCancel}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={createMutation.isPending || updateMutation.isPending}>
              {initialData ? "Cập nhật" : "Lưu bài viết"}
            </Button>
          </div>
        </form>
      </FormProvider>
    </Modal>
  )
}

export default NewsForm
