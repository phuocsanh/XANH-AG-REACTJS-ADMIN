import { Button, TextField, Switch, FormControlLabel } from "@mui/material"
import { useEffect } from "react"
import { IoCloseCircleSharp } from "react-icons/io5"
import DialogCustom from "@/components/dialog"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
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
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProductTypeFormData>({
    resolver: zodResolver(productTypeSchema),
    defaultValues: defaultProductTypeValues,
  })

  // Sử dụng React Query mutations
  const createProductTypeMutation = useCreateProductTypeMutation()
  const updateProductTypeMutation = useUpdateProductTypeMutation()

  // Theo dõi các giá trị form
  const typeName = watch("typeName")
  const typeCode = watch("typeCode")
  const description = watch("description")
  const status = watch("status")

  // Load dữ liệu khi edit
  useEffect(() => {
    if (editingRow) {
      const data = editingRow
      setValue("typeName", data.name)
      setValue("typeCode", data.code || "")
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
            typeName: data.typeName,
            typeCode: data.typeCode,
            description: data.description,
            status: data.status,
          },
        })
      } else {
        // Thêm mới - toast sẽ được hiển thị trong mutation hook
        await createProductTypeMutation.mutateAsync({
          typeName: data.typeName,
          typeCode: data.typeCode,
          description: data.description,
          status: data.status,
        })
      }
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
      <div className='relative w-[600px] min-h-[400px] max-h-[800px] px-10 py-4 flex flex-col'>
        <IoCloseCircleSharp
          className='absolute right-4 cursor-pointer'
          size={30}
          onClick={() => setOpenDialog(false)}
        />

        <div className='relative flex items-center justify-center h-[50px]'>
          <span className='font-bold text-lg'>
            {editingRow?.id ? "Cập nhật" : "Thêm"} loại sản phẩm
          </span>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col'>
          {/* Tên loại sản phẩm */}
          <div className='mt-3'>
            <h4 className='font-semibold mb-2'>Tên loại sản phẩm *</h4>
            <TextField
              variant='outlined'
              fullWidth
              value={typeName || ""}
              sx={{
                "& .MuiInputBase-input": {
                  fontSize: 15,
                  height: 25,
                  paddingX: 2,
                  paddingY: 1,
                },
              }}
              error={!!errors.typeName?.message}
              onChange={(e) => setValue("typeName", e.target.value)}
            />
            {errors.typeName && (
              <p className='mt-1 text-red-600'>{errors.typeName.message}</p>
            )}
          </div>

          {/* Mã loại sản phẩm */}
          <div className='mt-3'>
            <h4 className='font-semibold mb-2'>Mã loại sản phẩm *</h4>
            <TextField
              variant='outlined'
              fullWidth
              value={typeCode || ""}
              sx={{
                "& .MuiInputBase-input": {
                  fontSize: 15,
                  height: 25,
                  paddingX: 2,
                  paddingY: 1,
                },
              }}
              error={!!errors.typeCode?.message}
              onChange={(e) =>
                setValue("typeCode", e.target.value.toUpperCase())
              }
            />
            {errors.typeCode && (
              <p className='mt-1 text-red-600'>{errors.typeCode.message}</p>
            )}
          </div>

          {/* Mô tả */}
          <div className='mt-3'>
            <h4 className='font-semibold mb-2'>Mô tả</h4>
            <TextField
              variant='outlined'
              fullWidth
              multiline
              rows={3}
              value={description || ""}
              sx={{
                "& .MuiInputBase-input": {
                  fontSize: 15,
                  paddingX: 2,
                  paddingY: 1,
                },
              }}
              error={!!errors.description?.message}
              onChange={(e) => setValue("description", e.target.value)}
            />
            {errors.description && (
              <p className='mt-1 text-red-600'>{errors.description.message}</p>
            )}
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
