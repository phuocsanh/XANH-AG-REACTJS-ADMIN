import React, { useEffect } from 'react'
import { Modal, Form, Button, Switch } from 'antd'
import { useForm, FormProvider, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { newsSchema, NewsFormValues, defaultNewsValues } from './news-schema'
import { FormField, FormImageUpload, FormComboBox } from '@/components/form'
import { useCreateNewsMutation, useUpdateNewsMutation, News } from '@/queries/news'
import { useProductSearch } from '@/queries/product'
import RichTextEditor from '@/components/common/rich-text-editor'
import { UPLOAD_TYPES } from '@/services/upload.service'
import { PushpinOutlined } from '@ant-design/icons'
import SEOChecker from './seo-checker'

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

  // Search sản phẩm
  const [searchTerm, setSearchTerm] = React.useState('')
  const { 
    data: productSearchData, 
    isLoading: isProductLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage
  } = useProductSearch(searchTerm)

  const productOptions = productSearchData?.pages.flatMap(page => page.data) || []

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
          related_product_ids: initialData.related_product_ids || [],
          is_pinned: initialData.is_pinned || false,
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
      width="100%"
      style={{ top: 0, padding: 0, maxWidth: '100vw' }}
      styles={{ 
        body: { 
          height: 'calc(100vh - 55px)', 
          overflowY: 'auto',
          padding: '24px'
        },
        content: {
          borderRadius: 0,
          height: '100vh',
        }
      }}
      destroyOnClose
    >
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Column: Form Inputs */}
            <div className="flex-grow lg:w-2/3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField name="title" control={control} label="Tiêu đề bài viết" required />
                <FormField name="category" control={control} label="Danh mục" />
                <FormField name="author" control={control} label="Tác giả" />
                <div className="grid grid-cols-2 gap-4">
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
                  <div className="flex flex-col">
                    <span className="mb-2 block text-sm font-medium text-gray-700">Ghim lên đầu trang</span>
                    <div className="flex items-center gap-2 h-[32px]">
                      <Controller
                        name="is_pinned"
                        control={control}
                        render={({ field }) => (
                          <Switch 
                            checked={field.value} 
                            onChange={field.onChange}
                            checkedChildren={<PushpinOutlined />}
                            unCheckedChildren={<PushpinOutlined />}
                          />
                        )}
                      />
                      <span className="text-xs text-gray-400">Ưu tiên bài viết này lên đầu danh sách</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <FormComboBox
                  name="related_product_ids"
                  control={control}
                  label="Sản phẩm liên quan"
                  placeholder="Chọn sản phẩm liên quan đến bài viết"
                  mode="multiple"
                  data={productOptions}
                  isLoading={isProductLoading}
                  hasNextPage={hasNextPage}
                  isFetchingNextPage={isFetchingNextPage}
                  fetchNextPage={fetchNextPage}
                  onSearch={setSearchTerm}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                 <FormImageUpload 
                    name="thumbnail_url" 
                    control={control} 
                    label="Ảnh đại diện"
                    maxCount={1} 
                    multiple={false}
                    uploadType={UPLOAD_TYPES.NEWS}
                 />
                 <FormImageUpload 
                    name="images" 
                    control={control} 
                    label="Bộ sưu tập ảnh"
                    maxCount={10} 
                    multiple={true}
                    uploadType={UPLOAD_TYPES.NEWS}
                 />
              </div>

              <div className="mt-4">
                <div className="mb-2">
                  <span className="text-red-500 mr-1">*</span>
                  <span className="font-bold text-gray-700">Nội dung bài viết</span>
                </div>
                <RichTextEditor 
                  content={watch('content')} 
                  onChange={(content) => setValue('content', content)}
                  minHeight={600}
                  uploadType={UPLOAD_TYPES.NEWS}
                />
                {methods.formState.errors.content && (
                  <div className="text-red-500 text-xs mt-1">
                    {methods.formState.errors.content.message}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: SEO Checker & Additional Info */}
            <div className="lg:w-1/3 space-y-4">
               <SEOChecker 
                 title={watch('title')}
                 content={watch('content')}
                 thumbnailUrl={watch('thumbnail_url')}
                 tags={watch('tags')}
               />
               
               <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                 <FormComboBox
                   name="tags"
                   control={control}
                   label="Từ khóa (Tags)"
                   placeholder="Nhập tag và nhấn Enter"
                   mode="tags"
                   options={[]} // Static tags if any, or empty for free input
                   allowClear
                 />
                 <div className="text-[11px] text-gray-400 mt-1 italic">
                   Gợi ý: Nhập từ khóa liên quan giúp bài viết dễ tìm thấy hơn trên Google.
                 </div>
               </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2 border-t pt-4">
            <Button onClick={onCancel}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={createMutation.isPending || updateMutation.isPending} size="large" className="px-8 font-bold">
              {initialData ? "Cập nhật bài viết" : "Lưu bài viết"}
            </Button>
          </div>
        </form>
      </FormProvider>
    </Modal>
  )
}

export default NewsForm
