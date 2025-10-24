import { FILTER_DATE } from "@/constant/const"
import { capitalizeFirstLetter } from "@/lib/text"
import { FieldColumn, QueryListPayloadType } from "@/models"
import { format, startOfMonth } from "date-fns"
import { useCallback, useState } from "react"

/**
 * Creates a filter date column object based on the specified time frame.
 *
 * @param field - The name of the field to filter.
 * @param from - The start date of the time frame.
 * @param to - The end date of the time frame.
 * @returns A filter date column object.
 */
export const createFilterDateColumn = (
  field: string,
  from: Date,
  to: Date
): FieldColumn => {
  return {
    column: capitalizeFirstLetter(field),
    keySearch: `${format(from, FILTER_DATE)}-${format(to, FILTER_DATE)}`,
    expression: "BETWEEN",
  }
}

/**
 * Gets the initial filter column for the specified time field (default is 'billTime').
 *
 * @param timeField - The name of the time field to filter.
 * @returns An array containing the initial filter column.
 */
const getInitialFilterColumn = (timeField: string) => {
  const currentDate = new Date()
  const firstOfMonth = startOfMonth(currentDate)

  return [createFilterDateColumn(timeField, firstOfMonth, currentDate)]
}

/**
 * Custom hook for managing query list parameters, including filter columns.
 *
 * @param timeField - The name of the time field to use for date filtering (default is 'billTime').
 * @returns An object containing functions and state for managing query list parameters.
 */
export const useQueryListParams = (timeField = "billTime") => {
  const [queryListParams, setQueryListParams] = useState<
    Partial<QueryListPayloadType>
  >(() => ({
    filterColumn: getInitialFilterColumn(timeField),
  }))

  /**
   * Sets the filter column in the query list parameters.
   *
   * @param filterColumn - An array of filter column objects.
   */
  const setFilterColumn = (
    filterColumn: QueryListPayloadType["filterColumn"]
  ) => {
    setQueryListParams((params) => ({ ...params, filterColumn }))
  }

  /**
   * Adds or replaces a filter column in the query list parameters.
   *
   * @param columnFilter - The filter column object to add or replace.
   */
  const addOrReplaceFilterColumn = useCallback((columnFilter: FieldColumn) => {
    const newFieldColumn: FieldColumn = {
      ...columnFilter,
      column: capitalizeFirstLetter(columnFilter.column),
      keySearch: String(columnFilter.keySearch),
    }

    setQueryListParams((params) => {
      const columns = (params.filterColumn || []).filter((item) => {
        return item.column !== newFieldColumn.column
      })

      return {
        ...params,
        filterColumn: [...columns, newFieldColumn],
      }
    })
  }, [])

  /**
   * Adds or replaces a filter date column in the query list parameters.
   *
   * @param field - The name of the field to filter.
   * @param from - The start date of the time frame.
   * @param to - The end date of the time frame.
   */
  const addOrReplaceFilterDateColumn = useCallback(
    (field: string, from: Date, to: Date) => {
      addOrReplaceFilterColumn(createFilterDateColumn(field, from, to))
    },
    [addOrReplaceFilterColumn]
  )

  /**
   * Removes a filter column from the query list parameters.
   *
   * @param columnName - The name of the column to remove.
   */
  const removeFilterColumn = useCallback(
    (columnName: FieldColumn["column"]) => {
      setQueryListParams((params) => ({
        ...params,
        filterColumn: params.filterColumn?.filter((i) => {
          return i.column !== capitalizeFirstLetter(columnName)
        }),
      }))
    },
    []
  )

  /**
   * Clears the filter column in the query list parameters and sets it to the initial value.
   */
  const clearFilterColumn = useCallback(() => {
    setQueryListParams((params) => ({
      ...params,
      filterColumn: getInitialFilterColumn(timeField),
    }))
  }, [timeField])

  return {
    queryListParams,
    setQueryListParams,
    setFilterColumn,
    addOrReplaceFilterColumn,
    addOrReplaceFilterDateColumn,
    removeFilterColumn,
    clearFilterColumn,
  }
}
