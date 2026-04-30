export type PromotionCampaignStatus = "draft" | "active" | "ended" | "archived"

export interface PromotionCampaignProductRef {
  id?: number
  product_id: number
  product?: {
    id: number
    name?: string
    trade_name?: string
    code?: string
  }
}

export interface PromotionRewardMonthlyRelease {
  id?: number
  month_index: number
  release_quantity: number
}

export interface PromotionRewardPoolItem {
  id?: number
  reward_name: string
  reward_value: number
  total_quantity: number
  remaining_quantity?: number
  reserved_quantity?: number
  issued_quantity?: number
  sort_order?: number
  monthly_release: PromotionRewardMonthlyRelease[]
}

export interface PromotionCampaign {
  id: number
  code: string
  name: string
  type: string
  status: PromotionCampaignStatus
  start_at: string
  end_at: string
  threshold_amount: number | string
  base_win_rate: number | string
  second_win_rate: number | string
  reward_release_mode: string
  reward_quota: number
  reward_value: number | string
  max_reward_per_customer: number
  notes?: string | null
  created_by?: number | null
  created_at: string
  updated_at: string
  products?: PromotionCampaignProductRef[]
  reward_pools?: PromotionRewardPoolItem[]
  reward_pool_count?: number
  total_reward_quantity?: number
  total_reward_budget?: number
}

export interface PromotionCampaignListParams {
  page?: number
  limit?: number
  keyword?: string
  status?: PromotionCampaignStatus
}

export interface CreatePromotionCampaignRequest {
  code: string
  name: string
  start_at: string
  end_at: string
  threshold_amount: number
  base_win_rate: number
  second_win_rate?: number
  max_reward_per_customer?: number
  notes?: string
  product_ids: number[]
  rewards: PromotionRewardPoolItem[]
}

export interface UpdatePromotionCampaignRequest
  extends Partial<CreatePromotionCampaignRequest> {}

export interface PromotionRewardReservation {
  id: number
  promotion_id?: number
  promotion?: {
    id: number
    code?: string
    name?: string
  } | null
  customer_id: number
  customer?: {
    id: number
    code?: string
    name?: string
    phone?: string
  }
  reward_name: string
  reward_value: number
  status: string
  reserved_at: string
  issued_at?: string | null
  note?: string | null
}

export interface PromotionRewardReservationListParams {
  page?: number
  limit?: number
  promotion_id?: number
  status?: string
  keyword?: string
}
