import React, { useEffect } from "react"
import { Modal, Form, Input, Select, Button, Space } from "antd"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "react-toastify"
import { ProductSubtype } from "@/models/product-subtype.model"
import {
  CreateProductSubtypeDto,
  UpdateProductSubtypeDto,
} from "@/models/product-subtype.model"
import {
  useCreateProductSubtypeMutation,
  useUpdateProductSubtypeMutation,
} from "@/queries/product-subtype"
import { ProductType } from "@/models/product-type.model"
import { useProductTypesQuery as useProductTypes } from "@/queries/product-type"
import {
  productSubtypeSchema,
  ProductSubtypeFormData,
  defaultProductSubtypeValues,
} from "./formConfig"

interface DialogAddUpdateProps {
  open: boolean
  onClose: () => void
  editingSubtype?: ProductSubtype | null
}

const DialogAddUpdate: React.FC<DialogAddUpdateProps> = ({
  open,
  onClose,
  editingSubtype,
}) => {
  const queryClient = useQueryClient()
  const { data: productTypesResponse } = useProductTypes()
  // useAllProductTypesQuery trả về { items: ProductType[], total: number }
  const productTypes = productTypesResponse?.data?.items || []

  // Mutations
  const createProductSubtypeMutation = useCreateProductSubtypeMutation()
  const updateProductSubtypeMutation = useUpdateProductSubtypeMutation()

  // Form configuration
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Partial<ProductSubtypeFormData>>({
    resolver: zodResolver(productSubtypeSchema),
    defaultValues: defaultProductSubtypeValues,
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateProductSubtypeDto) =>
      createProductSubtypeMutation.mutateAsync(data),
    onSuccess: () => {
      // Toast sẽ được hiển thị trong mutation hook
      queryClient.invalidateQueries({ queryKey: ["productSubtypes"] })
      onClose()
      reset()
    },
    onError: (error: Error) => {
      toast.error(error?.message || "Có lỗi xảy ra khi tạo loại phụ sản phẩm!")
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateProductSubtypeDto }) =>
      updateProductSubtypeMutation.mutateAsync({ id, subtypeData: data }),
    onSuccess: () => {
      // Toast sẽ được hiển thị trong mutation hook
      queryClient.invalidateQueries({ queryKey: ["productSubtypes"] })
      onClose()
      reset()
    },
    onError: (error: Error) => {
      toast.error(
        error?.message || "Có lỗi xảy ra khi cập nhật loại phụ sản phẩm!"
      )
    },
  })

  // Reset form khi dialog mở/đóng hoặc khi có dữ liệu chỉnh sửa
  useEffect(() => {
    if (open) {
      if (editingSubtype) {
        reset({
          name: editingSubtype.name,
          code: editingSubtype.code,
          product_type_id: editingSubtype.product_type_id,
          description: editingSubtype.description || "",
          status: editingSubtype.status,
        })
      } else {
        reset(defaultProductSubtypeValues)
      }
    }
  }, [open, editingSubtype, reset])

  // Xử lý submit form
  const onSubmit = (data: Partial<ProductSubtypeFormData>) => {
    // Kiểm tra các field bắt buộc
    if (!data.name || !data.code || !data.product_type_id) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc!")
      return
    }

    if (editingSubtype) {
      // For update, we need to use the DTO format
      const updateData: UpdateProductSubtypeDto = {
        name: data.name,
        product_type_id: data.product_type_id,
        description: data.description,
      }

      updateMutation.mutate({
        id: editingSubtype.id,
        data: updateData,
      })
    } else {
      // For create, we need to use the DTO format
      const createData: CreateProductSubtypeDto = {
        name: data.name,
        code: data.code,
        product_type_id: data.product_type_id,
        description: data.description,
        status: data.status,
      }

      createMutation.mutate(createData)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <Modal
      title={
        editingSubtype
          ? "Chỉnh sửa loại phụ sản phẩm"
          : "Thêm loại phụ sản phẩm"
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      <Form layout='vertical' onFinish={handleSubmit(onSubmit)}>
        {/* Tên loại phụ sản phẩm */}
        <Form.Item
          label='Tên loại phụ sản phẩm'
          validateStatus={errors.name ? "error" : ""}
          help={errors.name?.message}
          required
        >
          <Controller
            name='name'
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder='Nhập tên loại phụ sản phẩm'
                disabled={isLoading}
              />
            )}
          />
        </Form.Item>

        {/* Mã loại phụ sản phẩm */}
        <Form.Item
          label='Mã loại phụ sản phẩm'
          validateStatus={errors.code ? "error" : ""}
          help={errors.code?.message}
          required
        >
          <Controller
            name='code'
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder='Nhập mã loại phụ sản phẩm'
                disabled={isLoading}
              />
            )}
          />
        </Form.Item>

        {/* Loại sản phẩm */}
        <Form.Item
          label='Loại sản phẩm'
          validateStatus={errors.product_type_id ? "error" : ""}
          help={errors.product_type_id?.message}
          required
        >
          <Controller
            name='product_type_id'
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                placeholder='Chọn loại sản phẩm'
                disabled={isLoading}
                options={productTypes.map((type: ProductType) => ({
                  label: type.name,
                  value: type.id,
                }))}
              />
            )}
          />
        </Form.Item>

        {/* Mô tả */}
        <Form.Item
          label='Mô tả'
          validateStatus={errors.description ? "error" : ""}
          help={errors.description?.message}
        >
          <Controller
            name='description'
            control={control}
            render={({ field }) => (
              <Input.TextArea
                {...field}
                placeholder='Nhập mô tả (tùy chọn)'
                rows={3}
                disabled={isLoading}
              />
            )}
          />
        </Form.Item>

        {/* Trạng thái */}
        <Form.Item
          label='Trạng thái'
          validateStatus={errors.status ? "error" : ""}
          help={errors.status?.message}
        >
          <Controller
            name='status'
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                placeholder='Chọn trạng thái'
                disabled={isLoading}
                options={[{ label: "Hoạt động", value: "active" }]}
              />
            )}
          />
        </Form.Item>

        {/* Buttons */}
        <Form.Item>
          <Space>
            <Button onClick={onClose} disabled={isLoading}>
              Hủy
            </Button>
            <Button type='primary' htmlType='submit' loading={isLoading}>
              {editingSubtype ? "Cập nhật" : "Tạo mới"}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default DialogAddUpdate
