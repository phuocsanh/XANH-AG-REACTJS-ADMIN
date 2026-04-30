import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "react-toastify"
import {
  CreatePromotionCampaignRequest,
  PromotionCampaign,
  PromotionCampaignListParams,
  PromotionCampaignStatus,
  PromotionRewardReservation,
  PromotionRewardReservationListParams,
  UpdatePromotionCampaignRequest,
} from "@/models/promotion-campaign"
import api from "@/utils/api"
import { handleApiError } from "@/utils/error-handler"
import { invalidateResourceQueries } from "@/utils/query-helpers"

export const promotionCampaignKeys = {
  all: ["/promotion-campaigns"] as const,
  list: (params?: PromotionCampaignListParams) =>
    [...promotionCampaignKeys.all, "list", params] as const,
  detail: (id?: number | null) => [...promotionCampaignKeys.all, "detail", id] as const,
  reservations: (id?: number | null) =>
    [...promotionCampaignKeys.all, "reservations", id] as const,
  allReservations: (params?: PromotionRewardReservationListParams) =>
    [...promotionCampaignKeys.all, "all-reservations", params] as const,
}

export const usePromotionCampaignsQuery = (params?: PromotionCampaignListParams) =>
  useQuery({
    queryKey: promotionCampaignKeys.list(params),
    queryFn: async () =>
      api.get<{
        items: PromotionCampaign[]
        total: number
        page: number
        limit: number
      }>("/promotion-campaigns", params),
  })

export const usePromotionCampaignQuery = (id?: number | null) =>
  useQuery({
    queryKey: promotionCampaignKeys.detail(id),
    queryFn: async () => api.get<PromotionCampaign>(`/promotion-campaigns/${id}`),
    enabled: !!id,
  })

export const usePromotionCampaignReservationsQuery = (id?: number | null) =>
  useQuery({
    queryKey: promotionCampaignKeys.reservations(id),
    queryFn: async () =>
      api.get<{ items: PromotionRewardReservation[] }>(
        `/promotion-campaigns/${id}/reservations`,
      ),
    enabled: !!id,
  })

export const usePromotionCampaignAllReservationsQuery = (
  params?: PromotionRewardReservationListParams,
) =>
  useQuery({
    queryKey: promotionCampaignKeys.allReservations(params),
    queryFn: async () =>
      api.get<{
        items: PromotionRewardReservation[]
        total: number
        page: number
        limit: number
      }>("/promotion-campaigns/reward-reservations", params),
  })

export const useCreatePromotionCampaignMutation = () =>
  useMutation({
    mutationFn: async (data: CreatePromotionCampaignRequest) =>
      api.postRaw<PromotionCampaign>("/promotion-campaigns", data),
    onSuccess: () => {
      invalidateResourceQueries("/promotion-campaigns")
      toast.success("Tạo campaign quay thưởng thành công")
    },
    onError: (error: unknown) => {
      handleApiError(error, "Không thể tạo campaign quay thưởng")
    },
  })

export const useUpdatePromotionCampaignMutation = () =>
  useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number
      data: UpdatePromotionCampaignRequest
    }) => api.patchRaw<PromotionCampaign>(`/promotion-campaigns/${id}`, data),
    onSuccess: () => {
      invalidateResourceQueries("/promotion-campaigns")
      toast.success("Cập nhật campaign quay thưởng thành công")
    },
    onError: (error: unknown) => {
      handleApiError(error, "Không thể cập nhật campaign quay thưởng")
    },
  })

export const useUpdatePromotionCampaignStatusMutation = () =>
  useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: number
      status: PromotionCampaignStatus
    }) =>
      api.patchRaw<PromotionCampaign>(`/promotion-campaigns/${id}/status`, {
        status,
      }),
    onSuccess: () => {
      invalidateResourceQueries("/promotion-campaigns")
      toast.success("Cập nhật trạng thái campaign thành công")
    },
    onError: (error: unknown) => {
      handleApiError(error, "Không thể cập nhật trạng thái campaign")
    },
  })

export const useIssuePromotionReservationMutation = () =>
  useMutation({
    mutationFn: async ({
      id,
      reservationId,
    }: {
      id: number
      reservationId: number
    }) =>
      api.patchRaw<{ success: boolean; message: string }>(
        `/promotion-campaigns/${id}/reservations/${reservationId}/issue`,
        {},
      ),
    onSuccess: () => {
      invalidateResourceQueries("/promotion-campaigns")
      toast.success("Đã xác nhận trao quà")
    },
    onError: (error: unknown) => {
      handleApiError(error, "Không thể xác nhận trao quà")
    },
  })
