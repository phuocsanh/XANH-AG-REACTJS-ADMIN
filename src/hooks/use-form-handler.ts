import { SyntheticEvent, useEffect } from "react"
import {
  DefaultValues,
  FieldValues,
  UseFormProps,
  useForm,
} from "react-hook-form"
import {
  MutationKey,
  QueryKey,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { useMutate } from "./use-mutate"

/**
 * Configuration options for the useFormHandler hook.
 *
 * @template FormValues - The type representing the shape of form values, extending FieldValues & { id: number }.
 */
interface UseFormHandlerOptions<
  FormValues extends FieldValues & { id: number }
> {
  /**
   * The query key for fetching data using react-query.
   */
  queryKey: QueryKey

  /**
   * The query key for fetching data using react-query.
   */
  mutateKey: MutationKey

  /**
   * The query key for fetching data using react-query.
   */
  invalidateKey?: QueryKey

  /**
   * The ID used for querying specific data. Default is 0.
   */
  queryId?: FormValues["id"]

  /**
   * The options for react-hook-form useForm hook.
   */
  formOptions?: UseFormProps<FormValues, unknown>

  /**
   * A function to format the response data obtained from the server.
   */
  formatResponseFn?: (
    data: FormValues
  ) => FormValues | DefaultValues<FormValues> | undefined

  /**
   * A function to format the payload before sending it to the server.
   */
  formatPayloadFn?: (data: FormValues) => FormValues

  /**
   * A function to fetch form data for a given ID from the server.
   */
  readFn?: (id: FormValues["id"]) => Promise<FormValues>

  /**
   * A function to create new data on the server.
   */
  createFn?: (data: FormValues) => Promise<number>

  /**
   * A function to update existing data on the server.
   */
  updateFn?: (data: FormValues) => Promise<number>

  /**
   * A callback function executed after a successful create operation.
   * @example
   * ```tsx
   * const onCreateSuccess = (data, variables) => {
   *   console.log('Successfully created:', data);
   *   console.log('Form variables:', variables);
   *   if (data === 1) {
   *     notification.success(i18next.t('order.updateSuccess'));
   *   }
   * };
   * ```
   */
  onCreateSuccess?: (
    data: number,
    variables: FormValues
  ) => Promise<unknown> | void

  /**
   * A callback function executed after a successful update operation.
   * @example
   * ```tsx
   * const onUpdateSuccess = (data, variables) => {
   *   console.log('Successfully updated:', data);
   *   console.log('Form variables:', variables);
   *   if (data === 1) {
   *     notification.success(i18next.t('order.createSuccess'));
   *   }
   * };
   * ```
   */
  onUpdateSuccess?: (
    data: number,
    variables: FormValues
  ) => Promise<unknown> | void
}

/**
 * useFormHandler Hook
 *
 * A custom hook to handle forms in React applications with the help of react-hook-form,
 * react-query, and other utility functions.
 *
 * @template FormValues - The type representing the shape of form values, extending FieldValues & { id: number }.
 * @param {UseFormHandlerOptions<FormValues>} props - The configuration options for the useFormHandler hook.
 * @returns {Object} - An object containing the data, methods, loading status, handleSubmit function, and error information.
 */
export const useFormHandler = <
  FormValues extends FieldValues & { id: number }
>({
  queryKey,
  mutateKey,
  invalidateKey,
  queryId = 0,
  formOptions,
  formatResponseFn,
  formatPayloadFn,
  readFn,
  createFn,
  updateFn,
  onCreateSuccess,
  onUpdateSuccess,
}: UseFormHandlerOptions<FormValues>) => {
  const methods = useForm<FormValues>(formOptions)
  const { reset } = methods

  const queryClient = useQueryClient()

  const {
    data,
    refetch,
    error,
    isLoading: querying,
  } = useQuery<FormValues>({
    queryKey,
    queryFn: async () => {
      if (readFn) {
        return await readFn(queryId)
      }
      return Promise.reject()
    },
    enabled: Boolean(readFn) && Boolean(queryId),
  })

  const { mutate: create, isPending: adding } = useMutate<number, FormValues>({
    invalidateKey,
    mutationFn: createFn,
    mutationKey: mutateKey,
  })

  const { mutate: update, isPending: updating } = useMutate<number, FormValues>(
    {
      invalidateKey,
      mutationFn: updateFn,
      mutationKey: mutateKey,
    }
  )

  useEffect(() => {
    if (!queryId) {
      reset((formOptions?.defaultValues as DefaultValues<FormValues>) ?? {})
    }
  }, [queryId, formOptions?.defaultValues, reset])

  const loading = adding || updating || querying

  const invalidateQuery = () => {
    queryClient
      .invalidateQueries({ queryKey })
      .catch((error) => console.error("Invalidate mutate query error: ", error))
  }

  const onSubmit = (values: FormValues) => {
    const payload = formatPayloadFn ? formatPayloadFn(values) : values

    if (!queryId) {
      create(payload, {
        onSuccess: async (data, variables) => {
          if (data) {
            invalidateQuery()
          }

          if (onCreateSuccess) {
            return await onCreateSuccess(data, variables)
          }
        },
      })
    } else {
      update(payload, {
        onSuccess: async (data, variables) => {
          if (data === 1) {
            invalidateQuery()
          }

          if (onUpdateSuccess) {
            return await onUpdateSuccess(data, variables)
          }
        },
      })
    }
  }

  const handleSubmit = (e: SyntheticEvent<HTMLElement>) => {
    e.preventDefault()

    const submitHandler = methods.handleSubmit(onSubmit, (error) => {
      console.error("Form submit failure: ", error)
    })

    submitHandler().catch((error) => {
      console.log("error:", error)
    })
  }

  return { data, methods, loading, handleSubmit, refetch, error }
}
