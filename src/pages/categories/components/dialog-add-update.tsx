import { Button, Switch, FormControlLabel } from "@mui/material"
import { useEffect } from "react"
import { IoCloseCircleSharp } from "react-icons/io5"
import DialogCustom from "@/components/dialog"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import FormField from "@/components/form/form-field"
import {
  useCreateProductTypeMutation,
  useUpdateProductTypeMutation,
} from "../../../queries/product-type"
import { toast } from "react-toastify"
import { ProductType } from "@/models/product-type.model"
import { Status } from "@/models/common"
import {
  productTypeSchema,
  ProductTypeFormData,
  defaultProductTypeValues,
} from "./form-config"

function DialogAddUpdate({
  editingRow,
  openDialog,
  setOpenDialog,
}: {
  editingRow: ProductType | null
  openDialog: boolean
  setOpenDialog: (is: boolean) => void
}) {
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
  } = useForm<ProductTypeFormData>({
    resolver: zodResolver(productTypeSchema),
    defaultValues: defaultProductTypeValues,
  })

  // Sử dụng React Query mutations
  const createProductTypeMutation = useCreateProductTypeMutation()
  const updateProductTypeMutation = useUpdateProductTypeMutation()

  // Theo dõi status cho Switch
  const status = watch("status")

  // Load dữ liệu khi edit
  useEffect(() => {
    if (editingRow) {
      const data = editingRow
      setValue("name", data.name)

      setValue("description", data.description || "")
      setValue(
        "status",
        data.status === "active" ? Status.ACTIVE : Status.INACTIVE
      )
    } else if (!editingRow) {
      // Reset form khi thêm mới
      console.log("Resetting form for new product type")
      reset(defaultProductTypeValues)
    }
  }, [editingRow, reset, setValue])

  // Xử lý submit form
  const onSubmit = async (data: ProductTypeFormData) => {
    try {
      if (editingRow?.id) {
        // Cập nhật - toast sẽ được hiển thị trong mutation hook
        await updateProductTypeMutation.mutateAsync({
          id: editingRow.id,
          productTypeData: {
            name: data.name,

            description: data.description,
            status: data.status,
          },
        })
      } else {
        // Thêm mới - toast sẽ được hiển thị trong mutation hook
        await createProductTypeMutation.mutateAsync({
          name: data.name,

          description: data.description,
          status: data.status,
        })
      }
      // Reset form về giá trị mặc định sau khi thành công
      reset(defaultProductTypeValues)
      setOpenDialog(false)
    } catch (error) {
      console.error("Lỗi khi lưu loại sản phẩm:", error)
      // Toast error vẫn giữ lại vì mutation hook không handle error toast
      toast.error("Có lỗi xảy ra khi lưu loại sản phẩm!")
    }
  }

  const isLoading =
    createProductTypeMutation.isPending || updateProductTypeMutation.isPending

  return (
    <DialogCustom open={openDialog} setOpen={setOpenDialog}>
      <div className='relative w-full sm:max-w-[600px] min-h-[300px] max-h-[90vh] px-3 sm:px-10 py-3 sm:py-4 flex flex-col overflow-y-auto'>
        <IoCloseCircleSharp
          className='absolute right-3 top-3 cursor-pointer z-50 hover:opacity-70 transition-opacity'
          size={32}
          onClick={(e) => {
            e.stopPropagation()
            setOpenDialog(false)
          }}
        />

        <div className='relative flex items-center justify-center h-[40px] sm:h-[50px]'>
          <span className='font-bold text-base sm:text-lg'>
            {editingRow?.id ? "Cập nhật" : "Thêm"} loại sản phẩm
          </span>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col'>
          {/* Tên loại sản phẩm */}
          <div className='mt-3'>
            <FormField
              name="name"
              control={control}
              label="Tên loại sản phẩm"
              placeholder="Nhập tên loại sản phẩm"
              required
            />
          </div>

          {/* Mô tả */}
          <div className='mt-3'>
            <FormField
              name="description"
              control={control}
              label="Mô tả"
              placeholder="Nhập mô tả"
              type="textarea"
              rows={3}
            />
          </div>

          {/* Trạng thái hoạt động */}
          <div className='mt-3'>
            <FormControlLabel
              control={
                <Switch
                  checked={status === Status.ACTIVE}
                  onChange={(e) =>
                    setValue(
                      "status",
                      e.target.checked ? Status.ACTIVE : Status.INACTIVE
                    )
                  }
                />
              }
              label='Hoạt động'
            />
          </div>

          {/* Nút submit */}
          <Button
            type='submit'
            className='mt-4'
            variant='contained'
            disabled={isLoading}
          >
            <span>
              {isLoading
                ? "Đang xử lý..."
                : editingRow?.id
                ? "Cập nhật"
                : "Thêm"}
            </span>
          </Button>
        </form>
      </div>
    </DialogCustom>
  )
}

export default DialogAddUpdate
