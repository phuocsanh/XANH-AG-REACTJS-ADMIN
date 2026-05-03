import { message } from "antd"
import type { FieldErrors, FieldValues } from "react-hook-form"

const ERROR_FIELD_SELECTORS = [
  '[aria-invalid="true"]',
  '.ant-input-status-error',
  '.ant-select-status-error',
  '.ant-picker-status-error',
  '.ant-input-number-status-error',
  '.Mui-error input',
  '.Mui-error textarea',
  '.Mui-error .MuiInputBase-input',
].join(", ")

function collectMessages(node: unknown, result: string[]) {
  if (!node || typeof node !== "object") return

  const errorNode = node as Record<string, unknown>
  const messageText = errorNode.message

  if (typeof messageText === "string" && messageText.trim()) {
    result.push(messageText.trim())
  }

  Object.values(errorNode).forEach((value) => {
    if (value && typeof value === "object") {
      collectMessages(value, result)
    }
  })
}

export function getFormErrorMessages<TFieldValues extends FieldValues>(
  errors: FieldErrors<TFieldValues>
) {
  const messages: string[] = []
  collectMessages(errors, messages)
  return [...new Set(messages)]
}

export function focusFirstFormError() {
  if (typeof document === "undefined") return

  window.requestAnimationFrame(() => {
    const firstErrorElement = document.querySelector(ERROR_FIELD_SELECTORS) as
      | HTMLElement
      | null

    if (!firstErrorElement) return

    firstErrorElement.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    })

    if ("focus" in firstErrorElement) {
      firstErrorElement.focus({ preventScroll: true })
    }
  })
}

export function notifyFormErrors<TFieldValues extends FieldValues>(
  errors: FieldErrors<TFieldValues>,
  fallbackMessage = "Vui lòng kiểm tra lại các trường thông tin bắt buộc"
) {
  const messages = getFormErrorMessages(errors)
  const firstMessage = messages[0]
  const remainingCount = Math.max(messages.length - 1, 0)

  message.error(
    firstMessage
      ? `${firstMessage}${remainingCount > 0 ? ` và ${remainingCount} lỗi khác` : ""}`
      : fallbackMessage
  )

  focusFirstFormError()
}
