import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import api from '../utils/api';
import {
  DeliveryLog,
  DeliveryLogListResponse,
  CreateDeliveryLogDto,
  DeliveryStatus,
} from '../models/delivery-log.model';

// Query keys
export const deliveryLogKeys = {
  all: ['delivery-logs'] as const,
  lists: () => [...deliveryLogKeys.all, 'list'] as const,
  list: (filters: any) => [...deliveryLogKeys.lists(), filters] as const,
  details: () => [...deliveryLogKeys.all, 'detail'] as const,
  detail: (id: number) => [...deliveryLogKeys.details(), id] as const,
};

/**
 * Hook lấy danh sách phiếu giao hàng với phân trang
 */
export const useDeliveryLogs = (params: {
  page?: number;
  limit?: number;
  invoiceId?: number;
  status?: DeliveryStatus;
}) => {
  return useQuery({
    queryKey: deliveryLogKeys.list(params),
    queryFn: async () => {
      // api.get returns the data directly (interceptors handle response.data)
      const response = await api.get<DeliveryLogListResponse>('/delivery-logs', params);
      return response;
    },
  });
};

/**
 * Hook lấy chi tiết phiếu giao hàng
 */
export const useDeliveryLog = (id: number) => {
  return useQuery({
    queryKey: deliveryLogKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<DeliveryLog>(`/delivery-logs/${id}`);
      return response;
    },
    enabled: !!id,
  });
};

/**
 * Hook tạo phiếu giao hàng mới
 */
export const useCreateDeliveryLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateDeliveryLogDto) => {
      const response = await api.postRaw<DeliveryLog>('/delivery-logs', data as any);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deliveryLogKeys.lists() });
      toast.success('Tạo phiếu giao hàng thành công!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Tạo phiếu giao hàng thất bại!');
    },
  });
};

/**
 * Hook cập nhật phiếu giao hàng
 */
export const useUpdateDeliveryLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CreateDeliveryLogDto> }) => {
      const response = await api.patchRaw<DeliveryLog>(`/delivery-logs/${id}`, data);
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: deliveryLogKeys.lists() });
      queryClient.invalidateQueries({ queryKey: deliveryLogKeys.detail(variables.id) });
      toast.success('Cập nhật phiếu giao hàng thành công!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Cập nhật phiếu giao hàng thất bại!');
    },
  });
};

/**
 * Hook xóa phiếu giao hàng
 */
export const useDeleteDeliveryLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/delivery-logs/${id}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deliveryLogKeys.lists() });
      toast.success('Xóa phiếu giao hàng thành công!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Xóa phiếu giao hàng thất bại!');
    },
  });
};

/**
 * Hook cập nhật trạng thái phiếu giao hàng
 */
export const useUpdateDeliveryStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: DeliveryStatus }) => {
      const response = await api.patchRaw<DeliveryLog>(`/delivery-logs/${id}/status`, {
        status,
      });
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: deliveryLogKeys.lists() });
      queryClient.invalidateQueries({ queryKey: deliveryLogKeys.detail(variables.id) });
      toast.success('Cập nhật trạng thái thành công!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Cập nhật trạng thái thất bại!');
    },
  });
};
