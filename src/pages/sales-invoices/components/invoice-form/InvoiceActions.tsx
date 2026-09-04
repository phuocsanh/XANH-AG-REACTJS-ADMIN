// Component hiển thị các nút hành động của hóa đơn
import React from "react"
import { Box, Button, CircularProgress, IconButton } from "@mui/material"
import { Save as SaveIcon } from "@mui/icons-material"
import { ThunderboltOutlined } from "@ant-design/icons"
import { Popover } from "antd"

interface InvoiceActionsProps {
  onCancel: () => void
  onSaveDraft: () => void
  onSaveConfirm: () => void
  isPending: boolean
  isProfitLoading: boolean
  calculatedProfit: {
    revenue: number
    cost: number
    profit: number
    margin: number
  }
}

export const InvoiceActions = React.memo<InvoiceActionsProps>(
  ({
    onCancel,
    onSaveDraft,
    onSaveConfirm,
    isPending,
    isProfitLoading,
    calculatedProfit,
  }) => {
    // Trạng thái đóng/mở popover xem lợi nhuận (hỗ trợ chạm/click trên mobile)
    const [isProfitOpen, setIsProfitOpen] = React.useState(false)

    const isPositiveProfit = calculatedProfit.profit >= 0
    const lossOnCost =
      calculatedProfit.cost > 0
        ? (calculatedProfit.profit / calculatedProfit.cost) * 100
        : 0
    const lossMultiple =
      calculatedProfit.revenue > 0
        ? Math.abs(calculatedProfit.profit) / calculatedProfit.revenue
        : 0
    const shouldExplainLowRevenueLoss =
      calculatedProfit.profit < 0 &&
      calculatedProfit.revenue > 0 &&
      lossMultiple >= 3

    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: { xs: 1, sm: 2 },
          width: "100%",
        }}
      >
        {/* Nút tia sét xem lợi nhuận - Nằm ở góc trái, không đè lên nút Hủy, hỗ trợ cả hover và click trên mobile */}
        <Box sx={{ mr: "auto", flexShrink: 0 }}>
          <Popover
            open={isProfitOpen}
            onOpenChange={setIsProfitOpen}
            trigger={["hover", "click"]}
            placement='topLeft'
            content={
              <div style={{ minWidth: 210 }}>
                <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
                  Dự kiến:
                </div>
                {isProfitLoading ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      minHeight: 52,
                    }}
                  >
                    <CircularProgress size={18} />
                    <div style={{ fontSize: 12, color: "#666" }}>
                      Đang tính theo giá vốn lô...
                    </div>
                  </div>
                ) : (
                  <>
                    <div
                      style={{ fontSize: 12, color: "#666", marginBottom: 2 }}
                    >
                      Doanh thu:{" "}
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(calculatedProfit.revenue)}
                    </div>
                    <div
                      style={{ fontSize: 12, color: "#666", marginBottom: 6 }}
                    >
                      Giá vốn:{" "}
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(calculatedProfit.cost)}
                    </div>
                    <div
                      style={{
                        fontSize: 20,
                        fontWeight: "bold",
                        color: isPositiveProfit ? "#52c41a" : "#ff4d4f",
                        marginBottom: 4,
                      }}
                    >
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(calculatedProfit.profit)}
                    </div>
                    {shouldExplainLowRevenueLoss ? (
                      <>
                        <div style={{ fontSize: 12, color: "#666" }}>
                          Lỗ/doanh thu: gấp {lossMultiple.toFixed(2)} lần
                        </div>
                        <div style={{ fontSize: 12, color: "#666" }}>
                          Lỗ/giá vốn: {lossOnCost.toFixed(2)}%
                        </div>
                      </>
                    ) : (
                      <div style={{ fontSize: 12, color: "#666" }}>
                        Tỷ suất: {calculatedProfit.margin.toFixed(2)}%
                      </div>
                    )}
                  </>
                )}
              </div>
            }
          >
            <IconButton
              size='small'
              sx={{
                bgcolor: isProfitLoading
                  ? "warning.light"
                  : isPositiveProfit
                    ? "success.light"
                    : "error.light",
                "&:hover": {
                  bgcolor: isProfitLoading
                    ? "warning.main"
                    : isPositiveProfit
                      ? "success.main"
                      : "error.main",
                },
                width: 34,
                height: 34,
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              {isProfitLoading ? (
                <CircularProgress size={16} sx={{ color: "#fff" }} />
              ) : (
                <ThunderboltOutlined style={{ fontSize: 16, color: "#fff" }} />
              )}
            </IconButton>
          </Popover>
        </Box>

        {/* Các nút hành động - Xếp cạnh nhau, nút Hủy không bị đè */}
        <Button
          variant='outlined'
          onClick={onCancel}
          disabled={isPending}
          sx={{ minWidth: { xs: "auto", sm: 70 }, px: { xs: 1.5, sm: 2 } }}
        >
          Hủy
        </Button>
        <Button
          variant='outlined'
          onClick={onSaveDraft}
          disabled={isPending}
          startIcon={<SaveIcon sx={{ color: "text.secondary" }} />}
          sx={{ px: { xs: 1.2, sm: 2 } }}
        >
          Lưu nháp
        </Button>
        <Button
          variant='contained'
          color='primary'
          startIcon={<SaveIcon />}
          onClick={onSaveConfirm}
          disabled={isPending}
          sx={{ px: { xs: 1.5, sm: 2 } }}
        >
          {isPending ? "Đang tạo..." : "Lưu & Xác nhận"}
        </Button>
      </Box>
    )
  },
)

InvoiceActions.displayName = "InvoiceActions"
