import notification from "@/lib/notifications"
import { ResponseFailure } from "@/models"

import {
  MutationFunction,
  MutationKey,
  QueryKey,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"

/**
 * Options for the `useMutate` hook.
 *
 * @template TData - The type of data returned by the mutation function.
 * @template TVariables - The type of variables required by the mutation function.
 */
type UseMutateOptions<TData = unknown, TVariables = void> = {
  /**
   * The key used to invalidate the relevant query after a successful mutation.
   */
  invalidateKey?: QueryKey
  /**
   * The mutation function to be executed.
   */
  mutationFn?: MutationFunction<TData, TVariables>
  /**
   *
   */
  mutationKey: MutationKey
}

/**
 * Custom React Query hook for handling mutations.
 *
 * @remarks This hook abstracts the logic for handling mutations using `react-query`.
 * @param options - The options to configure the mutation behavior.
 * @returns The mutation function with `react-query` functionality.
 */
export const useMutate = <TData, TVariables>({
  invalidateKey,
  mutationFn,
  mutationKey,
}: UseMutateOptions<TData, TVariables>) => {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationKey,
    mutationFn,
    onSuccess: () => {
      if (invalidateKey) {
        queryClient
          .invalidateQueries({ queryKey: invalidateKey })
          .catch((error) => {
            console.log("error:", error)
          })
      }
    },
    onError: (errors: unknown[] | ResponseFailure) => {
      console.error(errors)
      if (typeof errors === "object") {
        /**
         * errors = {
         *  userName: "The userName field is required"
         *  password: "The password field is required"
         * }
         */
        // Object.keys(errors).forEach(key => {
        //   notification.error(errors[key]);
        // });
        // console.log('Object.values(errors).join', Object.values(errors).join('\t'));
        notification.error(Object.values(errors).join("\t"))
      }
    },
  })

  return mutation
}
