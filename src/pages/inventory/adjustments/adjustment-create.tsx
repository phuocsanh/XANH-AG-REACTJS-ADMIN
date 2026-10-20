import React, { useState, useEffect } from "react"
import { useQueries } from "@tanstack/react-query"
import {
  Box,
  Button,
  Typography,
  Grid,
  Card,
  CardContent,
  Alert,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  MenuItem,
} from "@mui/material"
import {
  FormField,
  FormFieldNumber,
  FormImageUpload,
  FormComboBox,
} from "@/components/form"
import NumberInput from "@/components/common/number-input"
import ComboBox from "@/components/common/combo-box"
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material"
import { useNavigate, useParams } from "react-router-dom"
import { useForm, Controller, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { message } from "antd"
import {
  useCreateAdjustmentMutation,
  useUpdateAdjustmentMutation,
  useApproveAdjustmentMutation,
  useAttachImageToAdjustmentMutation,
  useDeleteAdjustmentImageMutation,
  useAdjustmentQuery,
} from "@/queries/inventory-adjustment"
import { useUploadFileMutation } from "@/queries/inventory"
import { useProductsQuery } from "@/queries/product"
import apiClient from "@/utils/api"
import { useAppStore } from "@/stores"
import {
  adjustmentFormSchema,
  AdjustmentFormData,
  defaultAdjustmentValues,
} from "./form-config"
import { handleApiError } from "@/utils/error-handler"
import { notifyFormErrors } from "@/utils/form-error"
import { LoadingSpinner } from "@/components/common"
import { useFormGuard } from "@/hooks/use-form-guard"

const AdjustmentCreate = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const adjustmentId = id ? Number(id) : undefined
  const isEditMode = !!adjustmentId

  const userInfo = useAppStore((state) => state.userInfo)
  const [productSearch, setProductSearch] = useState("")
  const [tempProductSelect, setTempProductSelect] = useState<number | null>(
    null,
  )

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<AdjustmentFormData>({
    resolver: zodResolver(adjustmentFormSchema),
    defaultValues: defaultAdjustmentValues,
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  })

  // Queries
  const { data: existingAdjustment, isLoading: isLoadingAdjustment } =
    useAdjustmentQuery(adjustmentId || 0)

  const { data: productsData } = useProductsQuery({
    limit: 100,
    keyword: productSearch || undefined,
  })

  const createMutation = useCreateAdjustmentMutation()
  const updateMutation = useUpdateAdjustmentMutation()
  const approveMutation = useApproveAdjustmentMutation()
  const attachImageMutation = useAttachImageToAdjustmentMutation()
  const deleteImageMutation = useDeleteAdjustmentImageMutation()
  const uploadFileMutation = useUploadFileMutation()

  const { confirmExit } = useFormGuard(isDirty)

  const productList = productsData?.data?.items || []
  const adjustmentType = watch("adjustment_type")
  const batchQueries = useQueries({
    queries: fields.map((field) => ({
      queryKey: ["adjustment-source-batches", field.product_id],
      queryFn: async () => {
        const response = await apiClient.get<any[]>(
          `/inventory/batches/product/${field.product_id}`,
        )
        return Array.isArray(response) ? response : []
      },
      enabled: adjustmentType === "IN",
    })),
  })

  // Kiểm tra phiếu có phải draft không (chỉ draft mới sửa được)
  const isDraft =
    !existingAdjustment ||
    existingAdjustment.status === "draft" ||
    existingAdjustment.status === "Nháp" ||
    existingAdjustment.status === "0"
  const isReadOnly = isEditMode && !isDraft

  // Pre-fill form when editing
  useEffect(() => {
    if (isEditMode && existingAdjustment) {
      console.log("🖼️ Setting images to form:", existingAdjustment.images)
      const statusValue =
        existingAdjustment.status === "Đã duyệt" ||
        existingAdjustment.status === "approved"
          ? "approved"
          : "draft"
      reset({
        adjustment_type: existingAdjustment.adjustment_type as "IN" | "OUT",
        reason: existingAdjustment.reason,
        notes: existingAdjustment.notes || "",
        status: statusValue,
        items:
          existingAdjustment.items?.map((item) => {
            const product = productList.find((p) => p.id === item.product_id)
            return {
              product_id: item.product_id,
              product_name:
                product?.trade_name ||
                product?.name ||
                (item as any).product?.trade_name ||
                (item as any).product?.name ||
                (item as any).product_name ||
                `Sản phẩm #${item.product_id}`,
              quantity_change: item.quantity_change,
              source_batch_id: item.stock_allocations?.find((allocation) => allocation.pending)?.sourceBatchId,
              taxable_quantity: item.stock_allocations?.find((allocation) => allocation.pending)?.taxableQuantity ?? 0,
              reason: item.reason || "",
              notes: item.notes || "",
            }
          }) || [],
        images: existingAdjustment.images || [], // Set ảnh từ API vào form
      })
    }
  }, [isEditMode, existingAdjustment, reset, productList])

  // Thêm sản phẩm vào danh sách
  const handleAddProduct = (productId: number) => {
    const product = productList.find((p) => p.id === productId)
    if (!product) return

    // Check if duplicate
    const exists = fields.some((field) => field.product_id === productId)
    if (exists) {
      message.warning("Sản phẩm đã có trong danh sách!")
      return
    }

    append({
      product_id: product.id,
      product_name: product.trade_name || product.name,
      quantity_change: 0,
      taxable_quantity: 0,
      reason: "",
      notes: "",
    })
  }

  // Submit form
  const onSubmit = async (data: AdjustmentFormData) => {
    if (!userInfo?.id) {
      message.error("Không tìm thấy thông tin người dùng!")
      return
    }

    try {
      // Sanitize items
      const processedItems = data.items.map((item) => ({
        product_id: item.product_id,
        quantity_change: data.adjustment_type === "IN"
          ? Math.abs(item.quantity_change)
          : -Math.abs(item.quantity_change),
        ...(data.adjustment_type === "IN" && item.quantity_change > 0 && {
          source_batch_id: item.source_batch_id,
          taxable_quantity: item.taxable_quantity || 0,
        }),
        reason: item.reason,
        notes: item.notes,
      }))

      // Chuyển images thành array URL (giống sản phẩm)
      const imageUrls = (data.images || [])
        .map((img: any) => (typeof img === "string" ? img : img.url || ""))
        .filter(Boolean)

      const adjustmentData = {
        adjustment_type: data.adjustment_type,
        reason: data.reason,
        notes: data.notes,
        status: data.status,
        created_by: userInfo.id,
        items: processedItems,
        adjustment_code: existingAdjustment?.code || "",
        images: imageUrls, // Gửi array URL trong body
      }

      let finalAdjustmentId = adjustmentId

      console.log("📸 Sending images:", imageUrls)

      if (isEditMode && adjustmentId) {
        await updateMutation.mutateAsync({
          id: adjustmentId,
          data: adjustmentData as any,
        })
      } else {
        // Tạo phiếu điều chỉnh
        const newAdjustment = await createMutation.mutateAsync(
          adjustmentData as any,
        )
        finalAdjustmentId = newAdjustment?.id
      }

      // 3. Nếu chọn trạng thái 'approved', gọi mutation duyệt
      if (data.status === "approved" && finalAdjustmentId) {
        // Kiểm tra nếu chưa được duyệt thì mới gọi duyệt
        const currentStatus = existingAdjustment?.status
        if (currentStatus !== "Đã duyệt" && currentStatus !== "approved") {
          await approveMutation.mutateAsync(finalAdjustmentId)
        }
      }

      message.success(isEditMode ? "Cập nhật thành công!" : "Tạo thành công!")
      navigate("/inventory/adjustments")
    } catch (error) {
      console.error("Error saving adjustment:", error)
      handleApiError(error)
    }
  }

  const handleFormInvalid = (formErrors: typeof errors) => {
    notifyFormErrors(formErrors, "Vui lòng kiểm tra lại phiếu điều chỉnh kho")
  }

  if (isEditMode && isLoadingAdjustment) {
    return <LoadingSpinner />
  }

  return (
    <Box>
      <Box display='flex' alignItems='center' mb={3}>
        <IconButton
          onClick={() => confirmExit(() => navigate("/inventory/adjustments"))}
          sx={{ mr: 2 }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant='h4' fontWeight='bold'>
          {isReadOnly
            ? "Chi tiết phiếu điều chỉnh kho"
            : isEditMode
              ? "Chỉnh sửa phiếu điều chỉnh kho"
              : "Tạo phiếu điều chỉnh kho"}
        </Typography>
      </Box>

      <form onSubmit={handleSubmit(onSubmit, handleFormInvalid)}>
        <Grid container spacing={3}>
          {/* Thông tin chung */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant='h6' mb={2}>
                  Thông tin phiếu
                </Typography>

                <Grid container spacing={2}>
                  {isEditMode && (
                    <Grid item xs={12}>
                      <Box
                        mb={2}
                        p={2}
                        sx={{
                          backgroundColor: "#f0f7ff",
                          border: "1px solid #bae7ff",
                          borderRadius: 1,
                        }}
                      >
                        <Typography variant='subtitle2' color='textSecondary'>
                          Mã phiếu điều chỉnh:
                        </Typography>
                        <Typography
                          variant='h6'
                          color='primary'
                          sx={{ fontWeight: "bold" }}
                        >
                          {existingAdjustment?.code ||
                            (isLoadingAdjustment
                              ? "Đang tải..."
                              : `Phiếu #${adjustmentId}`)}
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                  <Grid item xs={12} sm={6}>
                    <FormComboBox
                      name='adjustment_type'
                      control={control}
                      label='Loại điều chỉnh'
                      placeholder='Chọn loại điều chỉnh'
                      options={[
                        { value: "IN", label: "Tăng kho" },
                        { value: "OUT", label: "Giảm kho" },
                      ]}
                      disabled={isReadOnly}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    {isReadOnly && existingAdjustment?.status === "Đã hủy" ? (
                      <Box>
                        <Typography variant='caption' color='text.secondary'>
                          Trạng thái phiếu
                        </Typography>
                        <Typography>Đã hủy</Typography>
                      </Box>
                    ) : (
                      <FormComboBox
                        name='status'
                        control={control}
                        label='Trạng thái phiếu'
                        placeholder='Chọn trạng thái'
                        options={[
                          { value: "draft", label: "Nháp" },
                          {
                            value: "approved",
                            label: "Duyệt (Cập nhật tồn kho)",
                          },
                        ]}
                        disabled={isReadOnly}
                      />
                    )}
                  </Grid>
                </Grid>

                <Box mt={2}>
                  <FormField
                    name='reason'
                    control={control}
                    label='Lý do điều chỉnh'
                    type='textarea'
                    rows={3}
                    placeholder='VD: Kiểm kê, hư hỏng, thất lạc...'
                    disabled={isReadOnly}
                  />
                </Box>

                <Box mt={2}>
                  <FormField
                    name='notes'
                    control={control}
                    label='Ghi chú'
                    type='textarea'
                    rows={2}
                    disabled={isReadOnly}
                  />
                </Box>

                <Box mt={2}>
                  <Typography variant='subtitle2' mb={1}>
                    Hình ảnh chứng từ / hiện trạng
                  </Typography>
                  <FormImageUpload
                    name='images'
                    control={control}
                    uploadType='common'
                    returnFullObjects={true}
                    multiple
                    maxCount={5}
                    disabled={isReadOnly}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Chọn sản phẩm */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant='h6' mb={2}>
                  Thêm sản phẩm
                </Typography>
                <Box>
                  <Typography variant='subtitle2' mb={1}>
                    Tìm kiếm sản phẩm:
                  </Typography>
                  <ComboBox
                    data={productList.map((p) => ({
                      value: p.id,
                      label: p.trade_name || p.name,
                    }))}
                    disabled={isReadOnly}
                    value={tempProductSelect}
                    onChange={(value) => {
                      if (value) {
                        handleAddProduct(value)
                        setTempProductSelect(null)
                      }
                    }}
                    placeholder='-- Chọn sản phẩm --'
                    showSearch
                    allowClear
                    onSearch={setProductSearch}
                    filterOption={false}
                    style={{ width: "100%" }}
                  />
                </Box>
                <Box mt={2}>
                  <Alert severity='info'>
                    {adjustmentType === "IN"
                      ? "Điều chỉnh tăng: chọn lô nhập nguồn để giữ đúng GBKT; nhập SL thuế theo chứng từ."
                      : "Điều chỉnh giảm tự trừ FIFO theo từng lô và tự lưu SL thuế đã trừ; không cần nhập SL thuế."}
                  </Alert>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Danh sách sản phẩm */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant='h6' mb={2}>
                  Danh sách sản phẩm điều chỉnh
                </Typography>

                {errors.items?.message && (
                  <Alert severity='error' sx={{ mb: 2 }}>
                    {errors.items.message}
                  </Alert>
                )}

                {fields.length > 0 ? (
                  <TableContainer component={Paper} variant='outlined'>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Sản phẩm</TableCell>
                          <TableCell align='right'>Số lượng thay đổi</TableCell>
                          {adjustmentType === "IN" && <TableCell>Lô nhập nguồn</TableCell>}
                          {adjustmentType === "IN" && <TableCell align='right'>SL thuế tăng</TableCell>}
                          <TableCell>Lý do (tuỳ chọn)</TableCell>
                          <TableCell align='center'>Xóa</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {fields.map((field, index) => {
                          // Access error for this specific item
                          const itemErrors = (errors.items as any)?.[index]
                          const qtyError = itemErrors?.quantity_change?.message
                          const sourceError = itemErrors?.source_batch_id?.message
                          const taxError = itemErrors?.taxable_quantity?.message
                          const sourceBatches = batchQueries[index]?.data || []

                          return (
                            <TableRow key={field.id}>
                              <TableCell>
                                <Typography variant='body2' fontWeight='bold'>
                                  {field.product_name}
                                </Typography>
                              </TableCell>
                              <TableCell
                                align='right'
                                sx={{ verticalAlign: "top" }}
                              >
                                <Controller
                                  name={`items.${index}.quantity_change`}
                                  control={control}
                                  render={({ field }) => {
                                    const adjustmentType =
                                      watch("adjustment_type") // Lấy loại điều chỉnh
                                    const absValue = Math.abs(field.value || 0)

                                    return (
                                      <Box>
                                        <Box
                                          display='flex'
                                          alignItems='center'
                                          gap={1}
                                          justifyContent='flex-end'
                                        >
                                          {/* Toggle button - chỉ hiện 1 nút tương ứng */}
                                          {adjustmentType === "IN" && (
                                            <Button
                                              size='small'
                                              variant='contained'
                                              color='success'
                                              disabled={isReadOnly}
                                              sx={{
                                                minWidth: 60,
                                                fontSize: "12px",
                                              }}
                                            >
                                              Tăng
                                            </Button>
                                          )}
                                          {adjustmentType === "OUT" && (
                                            <Button
                                              size='small'
                                              variant='contained'
                                              color='error'
                                              disabled={isReadOnly}
                                              sx={{
                                                minWidth: 60,
                                                fontSize: "12px",
                                              }}
                                            >
                                              Giảm
                                            </Button>
                                          )}

                                          {/* Number input */}
                                          <NumberInput
                                            value={absValue || null}
                                            onChange={(val) => {
                                              const newVal = val || 0
                                              // Tự động set dấu theo loại điều chỉnh
                                              if (adjustmentType === "IN") {
                                                field.onChange(newVal) // Luôn dương
                                              } else if (
                                                adjustmentType === "OUT"
                                              ) {
                                                field.onChange(-newVal) // Luôn âm
                                              } else {
                                                field.onChange(newVal)
                                              }
                                            }}
                                            min={0}
                                            disabled={isReadOnly}
                                            size='small'
                                            style={{
                                              width: 100,
                                              borderColor: qtyError
                                                ? "#d32f2f"
                                                : undefined,
                                            }}
                                            placeholder='Số lượng'
                                          />
                                        </Box>
                                        {qtyError && (
                                          <Typography
                                            variant='caption'
                                            color='error'
                                            display='block'
                                            textAlign='right'
                                            mt={0.5}
                                          >
                                            {qtyError}
                                          </Typography>
                                        )}
                                      </Box>
                                    )
                                  }}
                                />
                              </TableCell>
                              {adjustmentType === "IN" && (
                                <TableCell sx={{ minWidth: 250 }}>
                                  <Controller
                                    name={`items.${index}.source_batch_id`}
                                    control={control}
                                    render={({ field: sourceField }) => (
                                      <TextField
                                        {...sourceField}
                                        select
                                        size='small'
                                        fullWidth
                                        value={sourceField.value ?? ""}
                                        onChange={(event) => sourceField.onChange(event.target.value ? Number(event.target.value) : undefined)}
                                        disabled={isReadOnly}
                                        label='Lô nhập (không bắt buộc nếu SL thuế = 0)'
                                        error={Boolean(sourceError)}
                                        helperText={sourceError}
                                      >
                                        <MenuItem value=''>Không gắn lô nhập</MenuItem>
                                        {sourceBatches.filter((batch: any) => batch.receipt_item_id && batch.receipt_item?.receipt?.status === "approved").map((batch: any) => (
                                          <MenuItem key={batch.id} value={batch.id}>
                                            {(batch.code || `Lô #${batch.id}`) +
                                              ` · ${batch.receipt_item?.receipt?.code || `Phiếu nhập #${batch.receipt_item_id}`}` +
                                              ` · Tồn ${Number(batch.remaining_quantity || 0)}`}
                                          </MenuItem>
                                        ))}
                                      </TextField>
                                    )}
                                  />
                                </TableCell>
                              )}
                              {adjustmentType === "IN" && (
                                <TableCell align='right' sx={{ minWidth: 130 }}>
                                  <Controller
                                    name={`items.${index}.taxable_quantity`}
                                    control={control}
                                    render={({ field: taxField }) => (
                                      <NumberInput
                                        value={taxField.value || null}
                                        onChange={(value) => taxField.onChange(value || 0)}
                                        min={0}
                                        max={Math.max(0, Number(watch(`items.${index}.quantity_change`) || 0))}
                                        size='small'
                                        style={{ width: 110 }}
                                        placeholder='SL thuế'
                                      />
                                    )}
                                  />
                                  {taxError && (
                                    <Typography variant='caption' color='error' display='block'>
                                      {taxError}
                                    </Typography>
                                  )}
                                </TableCell>
                              )}
                              <TableCell>
                                <Controller
                                  name={`items.${index}.reason`}
                                  control={control}
                                  render={({ field }) => (
                                    <input
                                      {...field}
                                      disabled={isReadOnly}
                                      placeholder='Lý do chi tiết...'
                                      style={{
                                        width: "100%",
                                        padding: "4px 8px",
                                        border: "1px solid #d9d9d9",
                                        borderRadius: "4px",
                                        fontSize: "14px",
                                      }}
                                    />
                                  )}
                                />
                              </TableCell>
                              <TableCell align='center'>
                                <IconButton
                                  size='small'
                                  color='error'
                                  disabled={isReadOnly}
                                  onClick={() => remove(index)}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Alert severity='warning'>
                    Chưa có sản phẩm nào. Vui lòng thêm sản phẩm!
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Actions */}
          <Grid item xs={12}>
            <Box display='flex' gap={2} justifyContent='flex-end'>
              <Button
                variant='outlined'
                onClick={() =>
                  confirmExit(() => navigate("/inventory/adjustments"))
                }
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {isReadOnly ? "Đóng" : "Hủy"}
              </Button>
              {!isReadOnly && (
                <Button
                  type='submit'
                  variant='contained'
                  color='primary'
                  startIcon={<SaveIcon />}
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                >
                  {isEditMode
                    ? updateMutation.isPending
                      ? "Đang cập nhật..."
                      : "Cập nhật phiếu"
                    : createMutation.isPending
                      ? "Đang tạo..."
                      : "Tạo phiếu"}
                </Button>
              )}
            </Box>
          </Grid>
        </Grid>
      </form>
    </Box>
  )
}

export default AdjustmentCreate
