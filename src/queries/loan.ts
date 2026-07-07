import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "react-toastify"
import api from "@/utils/api"
import { handleApiError } from "@/utils/error-handler"
import { queryClient } from "@/provider/app-provider-tanstack"
import { CreateLoanDto, Loan, RepayLoanDto } from "@/models/loan"
import { mapSearchResponse } from "@/utils/api-response-mapper"

export const loanKeys = {
  all: ["loans"] as const,
  lists: () => [...loanKeys.all, "list"] as const,
  list: (params?: Record<string, unknown>) => [...loanKeys.lists(), params] as const,
  details: () => [...loanKeys.all, "detail"] as const,
  detail: (id: number) => [...loanKeys.details(), id] as const,
} as const

export const useLoansQuery = (params?: Record<string, unknown>) => {
  const page = (params?.page as number) || 1
  const limit = (params?.limit as number) || 10

  return useQuery({
    queryKey: loanKeys.list(params),
    queryFn: async () => {
      const payload: Record<string, unknown> = { page, limit }

      Object.keys(params || {}).forEach((key) => {
        const value = params?.[key]
        if (value !== undefined && value !== null && value !== "") {
          payload[key] = value
        }
      })

      if (params?.sort_by) {
        payload.sort = `${params.sort_by}:${params.sort_direction || "DESC"}`
      }

      const response = await api.postRaw<any>("/loans/search", payload)
      return mapSearchResponse(response, page, limit)
    },
    refetchOnMount: true,
    staleTime: 0,
  })
}

export const useLoanQuery = (id: number) => {
  return useQuery({
    queryKey: loanKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<Loan>(`/loans/${id}`)
      return response
    },
    enabled: !!id,
  })
}

export const useCreateLoanMutation = () => {
  return useMutation({
    mutationFn: async (data: CreateLoanDto) => {
      return api.postRaw<Loan>("/loans", data as any)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: loanKeys.all })
      toast.success("Tạo khoản vay thành công!")
    },
    onError: (error: unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi tạo khoản vay")
    },
  })
}

export const useRepayLoanMutation = () => {
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: RepayLoanDto }) => {
      return api.postRaw<any>(`/loans/${id}/repay`, data as any)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: loanKeys.all })
      queryClient.invalidateQueries({ queryKey: ["payments"] })
      queryClient.invalidateQueries({ queryKey: ["customers"] })
      toast.success("Thanh toán khoản vay thành công!")
    },
    onError: (error: unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi thanh toán khoản vay")
    },
  })
}

export const useDeleteLoanMutation = () => {
  return useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/loans/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: loanKeys.all })
      toast.success("Xóa khoản vay thành công!")
    },
    onError: (error: unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi xóa khoản vay")
    },
  })
}
