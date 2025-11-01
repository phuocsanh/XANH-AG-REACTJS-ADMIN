import React from "react"
import { Card, Typography, Button } from "@mui/material"
import { Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material"
import DataTable from "@/components/common/data-table"
import { useMobile, useTablet } from "@/hooks/use-media-query"
import type { ColumnType } from "antd/es/table"

interface ColumnConfig<T> {
  title: string
  dataIndex: string & keyof T
  key: string
  width?: number
  sorter?: boolean
  render?: (value: unknown, record: T) => React.ReactNode
}

interface ResponsiveDataTableProps<T> {
  columns: ColumnConfig<T>[]
  data: T[]
  loading?: boolean
  showSearch?: boolean
  searchPlaceholder?: string
  searchableColumns?: string[]
  onEdit?: (record: T) => void
  onDelete?: (record: T) => void
  onView?: (record: T) => void
  paginationConfig?: {
    pageSize?: number
    showSizeChanger?: boolean
    showQuickJumper?: boolean
    showTotal?: (total: number, range: [number, number]) => string
  }
}

const ResponsiveDataTable = <T extends { id?: number | string }>({
  columns,
  data,
  loading = false,
  showSearch = false,
  searchPlaceholder = "Tìm kiếm...",
  searchableColumns = [],
  onEdit,
  onDelete,
  onView,
  paginationConfig = {
    pageSize: 10,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} mục`,
  },
}: ResponsiveDataTableProps<T>) => {
  const isMobile = useMobile()
  const isTablet = useTablet()

  // Nếu là mobile hoặc tablet, hiển thị dạng card
  if (isMobile || isTablet) {
    return (
      <div className='w-full max-w-full overflow-x-hidden'>
        {data.map((item, index) => (
          <Card
            key={item.id || index}
            className='mb-4 p-4 w-full max-w-full overflow-hidden'
          >
            <div className='flex justify-between items-start'>
              <div className='flex-1 min-w-0'>
                {/* Hiển thị các trường dữ liệu chính */}
                {columns.slice(0, 3).map((column) => (
                  <div key={column.key} className='mb-2'>
                    <Typography
                      variant='caption'
                      color='textSecondary'
                      className='block'
                    >
                      {column.title}:
                    </Typography>
                    <Typography className='truncate'>
                      {column.render
                        ? column.render(item[column.dataIndex], item)
                        : String(item[column.dataIndex] || "N/A")}
                    </Typography>
                  </div>
                ))}
              </div>
              <div className='flex space-x-1 ml-2'>
                {onView && (
                  <Button
                    size='small'
                    onClick={() => onView(item)}
                    className='min-w-0 p-2'
                  >
                    <EditIcon fontSize='small' />
                  </Button>
                )}
                {onEdit && (
                  <Button
                    size='small'
                    onClick={() => onEdit(item)}
                    className='min-w-0 p-2'
                  >
                    <EditIcon fontSize='small' />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    size='small'
                    onClick={() => onDelete(item)}
                    className='min-w-0 p-2'
                    color='error'
                  >
                    <DeleteIcon fontSize='small' />
                  </Button>
                )}
              </div>
            </div>

            {/* Hiển thị các trường dữ liệu phụ nếu có */}
            {columns.length > 3 && (
              <div className='mt-2 pt-2 border-t border-gray-200'>
                {columns.slice(3).map((column) => (
                  <div key={column.key} className='mb-1'>
                    <Typography
                      variant='caption'
                      color='textSecondary'
                      className='block'
                    >
                      {column.title}:
                    </Typography>
                    <Typography variant='body2' className='truncate'>
                      {column.render
                        ? column.render(item[column.dataIndex], item)
                        : String(item[column.dataIndex] || "N/A")}
                    </Typography>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    )
  }

  // Nếu là desktop, hiển thị dạng bảng
  return (
    <div className='overflow-x-auto w-full'>
      <DataTable<T>
        columns={columns as ColumnType<T>[]}
        data={data}
        loading={loading}
        showSearch={showSearch}
        searchPlaceholder={searchPlaceholder}
        searchableColumns={searchableColumns}
        onEdit={onEdit}
        onDelete={onDelete}
        onView={onView}
        scroll={{ x: "max-content" }}
        paginationConfig={paginationConfig}
      />
    </div>
  )
}

export default ResponsiveDataTable
