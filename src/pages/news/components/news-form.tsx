import React, { useEffect } from 'react'
import { Modal, Form, Button, Switch } from 'antd'
import { useForm, FormProvider, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { newsSchema, NewsFormValues, defaultNewsValues } from './news-schema'
import { FormField, FormImageUpload, FormComboBox } from '@/components/form'
import { useCreateNewsMutation, useUpdateNewsMutation, News } from '@/queries/news'
import { useProductSearch, useProductsByIdsQuery } from '@/queries/product'
import RichTextEditor from '@/components/common/rich-text-editor'
import { UPLOAD_TYPES } from '@/services/upload.service'
import { PushpinOutlined, RobotOutlined } from '@ant-design/icons'
import SEOChecker from './seo-checker'
import { frontendAiService } from '@/services/ai.service'
import { message } from 'antd'
import { Input } from 'antd'

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

  // AI Tags
  const [isGeneratingTags, setIsGeneratingTags] = React.useState(false)

  // Search sản phẩm
  const [searchTerm, setSearchTerm] = React.useState('')
  const { 
    data: productSearchData, 
    isLoading: isProductLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage
  } = useProductSearch(searchTerm)

  const productOptionsFromSearch = productSearchData?.pages.flatMap(page => page.data) || []

  // Lấy dữ liệu tên sản phẩm cho các ID đã chọn ban đầu (khi edit)
  const initialProductIds = React.useMemo(() => initialData?.related_product_ids || [], [initialData])
  const { data: initialProductsData } = useProductsByIdsQuery(initialProductIds)

  // Gộp thông tin sản phẩm từ search và sản phẩm đã chọn ban đầu để hiển thị Label thay vì ID
  const combinedProductOptions = React.useMemo(() => {
    // Map initial products sang format label/value
    const initialOptions = (initialProductsData || []).map(p => ({
      ...p,
      value: p.id,
      label: p.trade_name?.trim() || p.name?.trim() || `Sản phẩm ${p.id}`
    }))

    // Merge và loại bỏ trùng lặp
    const merged = [...initialOptions, ...productOptionsFromSearch]
    const uniqueMap = new Map()
    merged.forEach(opt => uniqueMap.set(opt.value, opt))
    return Array.from(uniqueMap.values())
  }, [initialProductsData, productOptionsFromSearch])

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

  const handleGenerateTags = async () => {
    const title = watch('title')
    const content = watch('content')
    
    if (!content || content === '<p></p>') {
      message.warning('Vui lòng nhập nội dung bài viết trước khi tạo tag.')
      return
    }

    try {
      setIsGeneratingTags(true)
      const response = await frontendAiService.generateSeoTags(title, content)
      if (response.success && response.answer) {
        // Lấy tags hiện tại để tránh ghi đè hoàn toàn nếu user đã nhập
        const currentTags = watch('tags') || []
        const aiTags = response.answer.split(',').map(t => t.trim()).filter(Boolean)
        
        // Trộn và loại bỏ trùng lặp
        const uniqueTags = Array.from(new Set([...currentTags, ...aiTags]))
        setValue('tags', uniqueTags)
        message.success('Đã gợi ý thêm tag chuẩn SEO!')
      } else {
        message.error(response.error || 'Lỗi khi tạo tag.')
      }
    } catch (error) {
       message.error('Không thể kết nối với AI vào lúc này.')
    } finally {
      setIsGeneratingTags(false)
    }
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-3">
                  <FormField name="title" control={control} label="Tiêu đề bài viết" required />
                </div>
                <FormField 
                  name="category" 
                  control={control} 
                  label="Danh mục" 
                  type="select"
                  options={[
                    { label: 'Kỹ thuật canh tác', value: 'Kỹ thuật canh tác' },
                    { label: 'Bảo vệ thực vật', value: 'Bảo vệ thực vật' },
                    { label: 'Thị trường nông sản', value: 'Thị trường nông sản' },
                    { label: 'Công nghệ xanh', value: 'Công nghệ xanh' },
                    { label: 'Tin tức & Sự kiện', value: 'Tin tức & Sự kiện' },
                  ]}
                />
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

              <div className="mt-4 flex items-center gap-4 bg-orange-50 p-3 rounded-xl border border-orange-100">
                <div className="flex items-center gap-2">
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
                  <span className="text-sm font-bold text-orange-800">Ghim bài viết này lên đầu trang</span>
                </div>
                <span className="text-xs text-orange-600 italic">
                  * Bài viết được ghim sẽ luôn nằm trên cùng của danh sách tin tức.
                </span>
              </div>

              <div className="mt-4">
                <FormComboBox
                  name="related_product_ids"
                  control={control}
                  label="Sản phẩm liên quan"
                  placeholder="Chọn sản phẩm liên quan đến bài viết"
                  mode="multiple"
                  data={combinedProductOptions}
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
               
               <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                 <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-gray-700">Từ khóa (Tags)</span>
                    <Button 
                        type="link" 
                        size="small" 
                        icon={<RobotOutlined />} 
                        onClick={handleGenerateTags}
                        loading={isGeneratingTags}
                        className="text-blue-600 font-medium"
                    >
                        Gợi ý bằng AI
                    </Button>
                 </div>
                 
                 <Controller
                    name="tags"
                    control={control}
                    render={({ field }) => (
                        <Input.TextArea
                            placeholder="Nhập các tag, phân cách bằng dấu phẩy..."
                            rows={4}
                            className="rounded-lg text-sm border-gray-200 focus:border-blue-300"
                            value={field.value?.join(', ')}
                            onChange={(e) => {
                                const val = e.target.value
                                // Chuyển đổi chuỗi comma-separated về mảng cho schema
                                field.onChange(val.split(',').map(t => t.trim()).filter(Boolean))
                            }}
                        />
                    )}
                 />

                 <div className="text-[11px] text-gray-400 mt-2 italic flex items-start gap-1">
                    <span>💡</span>
                    <span>Gợi ý: Dùng dấu phẩy (,) để phân cách các từ khóa. AI sẽ dựa vào bài viết để đề xuất tag chuẩn SEO nhất.</span>
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
