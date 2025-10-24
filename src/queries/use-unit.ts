import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "react-toastify"
import { unitService } from "@/services/unit.service"
import { CreateUnitDto, UpdateUnitDto } from "@/services/unit.service"
import { queryClient } from "@/provider/app-provider-tanstack"

// Hook lấy danh sách đơn vị tính
export const useUnits = () => {
  return useQuery({
    queryKey: ["units"],
    queryFn: () => unitService.getUnits(),
  })
}

// Hook tạo đơn vị tính mới
export const useCreateUnitMutation = () => {
  return useMutation({
    mutationFn: (unit: CreateUnitDto) => unitService.createUnit(unit),
    onSuccess: () => {
      // Làm mới danh sách đơn vị tính sau khi tạo thành công
      queryClient.invalidateQueries({ queryKey: ["units"] })
      toast.success("Tạo đơn vị tính thành công!")
    },
    onError: (error: Error) => {
      console.error("Lỗi khi tạo đơn vị tính:", error)
      toast.error("Đã xảy ra lỗi khi tạo đơn vị tính.")
    },
  })
}

// Hook cập nhật đơn vị tính
export const useUpdateUnitMutation = () => {
  return useMutation({
    mutationFn: ({ id, unit }: { id: number; unit: UpdateUnitDto }) =>
      unitService.updateUnit(id, unit),
    onSuccess: () => {
      // Làm mới dữ liệu đơn vị tính sau khi cập nhật thành công
      queryClient.invalidateQueries({ queryKey: ["units"] })
      toast.success("Cập nhật đơn vị tính thành công!")
    },
    onError: (error: Error) => {
      console.error("Lỗi khi cập nhật đơn vị tính:", error)
      toast.error("Đã xảy ra lỗi khi cập nhật đơn vị tính.")
    },
  })
}

// Hook xóa đơn vị tính
export const useDeleteUnitMutation = () => {
  return useMutation({
    mutationFn: (id: number) => unitService.deleteUnit(id),
    onSuccess: () => {
      // Làm mới danh sách đơn vị tính sau khi xóa thành công
      queryClient.invalidateQueries({ queryKey: ["units"] })
      toast.success("Xóa đơn vị tính thành công!")
    },
    onError: (error: Error) => {
      console.error("Lỗi khi xóa đơn vị tính:", error)
      toast.error("Đã xảy ra lỗi khi xóa đơn vị tính.")
    },
  })
}
