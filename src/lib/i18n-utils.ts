/**
/**
 * International common case
 */
import notification from "./notifications"
import { capitalizeFirstLetter } from "./text"
import i18next from "../i18n"

export type Action =
  | "save"
  | "create"
  | "edit"
  | "update"
  | "delete"
  | "copy"
  | "back"
  | "close"
  | "enter"
  | "cancel"
  | "continue"
  | "select"
  | "search"
  | "import"
  | "export"
  | "ok"
  | "scan"
  | "apply"
  | "add"

export type Status = "success" | "fail"

/**
 * Generate a required validation message for a field.
 *
 * @param options - An object containing parameters for the validation message.
 * @param options.action - [optional] The action associated with the validation (e.g., 'enter' or 'select').
 * @param options.fieldName - The name of the field being validated.
 * @returns The required validation message.
 */
export const generateRequiredValidationMessage = ({
  action = "enter",
  fieldName,
}: {
  action?: Extract<Action, "enter" | "select">
  fieldName: string
}): string => {
  const requiredText = i18next
    .t("validation.required", {
      ns: "common",
      action: getActionLabel(action),
      fieldName,
    })
    .toLocaleLowerCase()

  return capitalizeFirstLetter(requiredText)
}

/**
 * Create a translation function for a specific namespace.
 *
 * @param namespace - The namespace for translation.
 * @returns A translation function.
 */
export const translationWithNamespace = (namespace: string) => (key: string) =>
  i18next.t(key, { ns: namespace })

/**
 * Create a required text generator function for a specific namespace.
 *
 * @param namespace - The namespace for translation.
 * @returns A function that generates required text messages.
 */
export const requiredTextWithNamespace = (namespace: string) => {
  return (
    fieldName: string,
    action?: "enter" | "select",
    fieldPath?: string
  ) => {
    return generateRequiredValidationMessage({
      action: action || "enter",
      fieldName: i18next.t(fieldPath ?? `fields.${fieldName}`, {
        ns: namespace,
      }),
    })
  }
}

/**
 * Generate a notification message.
 *
 * @param options - An object containing parameters for the notification message.
 * @param options.action - [optional] The action associated with the notification (e.g., 'create' or 'update').
 * @param options.objectName - The name of the object related to the notification.
 * @param options.status - [optional] The status of the notification (e.g., 'success' or 'fail').
 * @returns The generated notification message.
 */
export const generateNotificationMessage = ({
  action = "create",
  objectName,
  status = "success",
}: {
  action?: Extract<Action, "create" | "update" | "delete" | "apply">
  objectName: string
  status?: Status
}): string => {
  const statusNotify = i18next.t(`notification.${status}`, {
    ns: "common",
  })
  const label = `${
    getActionLabel(action) as string
  } ${objectName} ${statusNotify}`.toLocaleLowerCase()

  return capitalizeFirstLetter(label)
}

/**
 * Get the label for an action or an array of actions.
 *
 * @param keys - The action or an array of actions to get labels for.
 * @returns The label for the action(s).
 */
export const getActionLabel = (keys: Action | Action[]): string | string[] => {
  if (Array.isArray(keys)) {
    return keys.map((key) => {
      return i18next.t(`action.${key}`, { ns: "common" })
    })
  }

  return i18next.t(`action.${keys}`, { ns: "common" })
}

/**
 * Create a mutation success function for generating notifications.
 *
 * @param ns - The namespace for translation.
 * @returns A function that generates success notifications based on mutation data.
 */
export const createMutationSuccessFn = (ns: string) => (data: number) => {
  if (!data) {
    return
  }

  const message = generateNotificationMessage({
    action: data === 1 ? "update" : "create",
    objectName: i18next.t("model", { ns }),
  })

  notification.success(message)
}
