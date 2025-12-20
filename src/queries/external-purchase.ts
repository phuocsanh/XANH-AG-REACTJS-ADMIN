import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/utils/api';
import type {
  ExternalPurchase,
  CreateExternalPurchaseDto,
  MergedPurchase,
} from '@/models/external-purchase.model';
import { message } from 'antd';

// Query Keys
export const externalPurchaseKeys = {
  all: ['external-purchases'] as const,
  byRiceCrop: (riceCropId: number) => [...externalPurchaseKeys.all, 'rice-crop', riceCropId] as const,
  detail: (id: number) => [...externalPurchaseKeys.all, 'detail', id] as const,
  merged: (riceCropId: number) => ['merged-purchases', riceCropId] as const,
};

/**
 * Lấy danh sách hóa đơn external theo rice_crop_id
 */
export const useExternalPurchases = (riceCropId: number) => {
  return useQuery({
    queryKey: externalPurchaseKeys.byRiceCrop(riceCropId),
    queryFn: async () => {
      const response = await api.get<any>(`/external-purchases/rice-crop/${riceCropId}`);
      return response.data || response;
    },
    enabled: !!riceCropId,
  });
};

/**
 * Lấy tất cả hóa đơn (system + external) đã merge
 */
export const useMergedPurchases = (riceCropId: number) => {
  return useQuery({
    queryKey: externalPurchaseKeys.merged(riceCropId),
    queryFn: async () => {
      const response = await api.get<any>(`/rice-crops/${riceCropId}/all-purchases`);
      return response.data || response;
    },
    enabled: !!riceCropId,
  });
};

/**
 * Tạo hóa đơn mua ngoài
 */
export const useCreateExternalPurchase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateExternalPurchaseDto) => {
      return await api.postRaw<ExternalPurchase>('/external-purchases', dto as any);
    },
    onSuccess: (data) => {
      message.success('Đã thêm hóa đơn mua hàng');
      queryClient.invalidateQueries({ queryKey: externalPurchaseKeys.byRiceCrop(data.rice_crop_id) });
      queryClient.invalidateQueries({ queryKey: externalPurchaseKeys.merged(data.rice_crop_id) });
    },
    onError: () => {
      message.error('Có lỗi xảy ra khi thêm hóa đơn');
    },
  });
};

/**
 * Cập nhật hóa đơn
 */
export const useUpdateExternalPurchase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dto }: { id: number; dto: Partial<CreateExternalPurchaseDto> }) => {
      return await api.patchRaw<ExternalPurchase>(`/external-purchases/${id}`, dto);
    },
    onSuccess: (data) => {
      message.success('Đã cập nhật hóa đơn');
      queryClient.invalidateQueries({ queryKey: externalPurchaseKeys.byRiceCrop(data.rice_crop_id) });
      queryClient.invalidateQueries({ queryKey: externalPurchaseKeys.merged(data.rice_crop_id) });
    },
    onError: () => {
      message.error('Có lỗi xảy ra khi cập nhật');
    },
  });
};

/**
 * Xóa hóa đơn
 */
export const useDeleteExternalPurchase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, riceCropId }: { id: number; riceCropId: number }) => {
      await api.delete(`/external-purchases/${id}`);
      return riceCropId;
    },
    onSuccess: (riceCropId) => {
      message.success('Đã xóa hóa đơn');
      queryClient.invalidateQueries({ queryKey: externalPurchaseKeys.byRiceCrop(riceCropId) });
      queryClient.invalidateQueries({ queryKey: externalPurchaseKeys.merged(riceCropId) });
    },
    onError: () => {
      message.error('Có lỗi xảy ra khi xóa');
    },
  });
};
