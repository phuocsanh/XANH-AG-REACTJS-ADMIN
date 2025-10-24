import api from "@/utils/api"
import { AnyObject } from "@/models/common"
import { BaseStatus } from "@/constant/base-status"

// Interface cho Unit entity
export interface Unit {
  id: number
  unitName: string
  unitCode: string
  description?: string
  status: BaseStatus
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

// Interface cho tạo mới Unit
export interface CreateUnitDto extends AnyObject {
  unitName: string
  unitCode: string
  description?: string
  status?: BaseStatus
}

// Interface cho cập nhật Unit
export interface UpdateUnitDto extends AnyObject {
  unitName?: string
  unitCode?: string
  description?: string
  status?: BaseStatus
}

// Service xử lý các chức năng liên quan đến đơn vị tính
export const unitService = {
  // Lấy danh sách tất cả đơn vị tính
  getUnits: async (): Promise<Unit[]> => {
    const response = await api.get<Unit[]>("/units")
    return response
  },

  // Lấy thông tin đơn vị tính theo ID
  getUnitById: async (id: number): Promise<Unit> => {
    const response = await api.get<Unit>(`/units/${id}`)
    return response
  },

  // Tạo mới đơn vị tính
  createUnit: async (data: CreateUnitDto): Promise<Unit> => {
    const response = await api.post<Unit>("/units", data)
    return response
  },

  // Cập nhật đơn vị tính
  updateUnit: async (id: number, data: UpdateUnitDto): Promise<Unit> => {
    const response = await api.patch<Unit>(`/units/${id}`, data)
    return response
  },

  // Kích hoạt đơn vị tính
  activateUnit: async (id: number): Promise<Unit> => {
    const response = await api.patch<Unit>(`/units/${id}/activate`)
    return response
  },

  // Vô hiệu hóa đơn vị tính
  deactivateUnit: async (id: number): Promise<Unit> => {
    const response = await api.patch<Unit>(`/units/${id}/deactivate`)
    return response
  },

  // Lưu trữ đơn vị tính
  archiveUnit: async (id: number): Promise<Unit> => {
    const response = await api.patch<Unit>(`/units/${id}/archive`)
    return response
  },

  // Khôi phục đơn vị tính từ lưu trữ
  restoreUnit: async (id: number): Promise<Unit> => {
    const response = await api.patch<Unit>(`/units/${id}/restore`)
    return response
  },

  // Xóa mềm đơn vị tính
  deleteUnit: async (id: number): Promise<void> => {
    await api.delete<void>(`/units/${id}/soft`)
  },

  // Xóa vĩnh viễn đơn vị tính
  permanentDeleteUnit: async (id: number): Promise<void> => {
    await api.delete<void>(`/units/${id}`)
  },
}

export default unitService
