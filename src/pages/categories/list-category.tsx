import { useEffect, useState, useContext, useMemo } from "react"

import Button from "@mui/material/Button"
import { IoMdAdd } from "react-icons/io"

import { MyContext } from "../../App"

import DialogAddUpdate from "./components/dialog-add-update"
import { ConfirmModal } from "../../components/common"
import {
  useProductTypesQuery as useProductTypes,
  useDeleteProductTypeMutation,
} from "../../queries/product-type"
import {
  ProductType,
  ExtendedProductType,
} from "../../models/product-type.model"
import { Status } from "../../models/common"
import { toast } from "react-toastify"
import DataTable from "../../components/common/data-table"
import { Tag } from "antd"
import FilterHeader from "../../components/common/filter-header"

const ListCategory = () => {
  const context = useContext(MyContext)

  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [filters, setFilters] = useState<Record<string, any>>({})

  // Sử dụng React Query để lấy dữ liệu loại sản phẩm
  const { data: productTypesResponse, isLoading } = useProductTypes({
    page: currentPage,
    limit: pageSize,
    ...filters,
  })
  const deleteProductTypeMutation = useDeleteProductTypeMutation()

  useEffect(() => {
    window.scrollTo(0, 0)
    context.setIsHeaderFooterShow(false)
  }, [context])

  const [openDialog, setOpenDialog] = useState(false)
  const [editingRow, setEditingRow] = useState<ProductType | null>(null)
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false)
  const [deletingCategory, setDeletingCategory] = useState<ProductType | null>(
    null
  )

  // Chuyển đổi dữ liệu từ API thành format phù hợp với table
  const rows = useMemo(() => {
    if (!productTypesResponse) return []
    // useProductTypesQuery trả về PaginationResponse<ProductType>
    const items = productTypesResponse.data?.items || []
    return items.map((item: ProductType) => ({
      ...item,
      name: item.name,
      code: item.code,
      created_at: item.created_at,
      updated_at: item.updated_at,
    }))
  }, [productTypesResponse])

  // Xử lý sửa loại sản phẩm
  const handleEdit = (record: ProductType & Record<string, unknown>) => {
    setEditingRow({
      ...record,
      name: record.name,
      code: record.code,
      created_at: record.created_at,
      updated_at: record.updated_at,
    } as ProductType)
    setOpenDialog(true)
  }

  // Xử lý xóa loại sản phẩm
  const handleDelete = (record: ExtendedProductType) => {
    setDeletingCategory(record as ProductType)
    setDeleteConfirmVisible(true)
  }

  // Xử lý xác nhận xóa
  const handleConfirmDelete = async () => {
    if (!deletingCategory) return

    try {
      await deleteProductTypeMutation.mutateAsync(deletingCategory.id as number)
      toast.success("Xóa loại sản phẩm thành công!")
      setDeleteConfirmVisible(false)
      setDeletingCategory(null)
    } catch (error) {
      console.error("Lỗi khi xóa loại sản phẩm:", error)
      toast.error("Có lỗi xảy ra khi xóa loại sản phẩm!")
      setDeleteConfirmVisible(false)
      setDeletingCategory(null)
    }
  }

  // Xử lý hủy bỏ xóa
  const handleCancelDelete = () => {
    setDeleteConfirmVisible(false)
    setDeletingCategory(null)
  }

  // Xử lý thêm mới
  const handleAdd = () => {
    setEditingRow(null)
    setOpenDialog(true)
  }

  // Handle Table Change
  const handleTableChange = (
    pagination: any,
    tableFilters: any,
    sorter: any
  ) => {
    setCurrentPage(pagination.current || 1)
    setPageSize(pagination.pageSize || 10)
  }

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value }
    if (!value) delete newFilters[key]
    setFilters(newFilters)
    setCurrentPage(1)
  }

  // Render trạng thái
  const renderStatus = (status: Status) => {
    const statusConfig = {
      active: { color: "green", text: "Hoạt động" },
      inactive: { color: "red", text: "Không hoạt động" },
      archived: { color: "orange", text: "Lưu trữ" },
    }
    const config = statusConfig[status] || { color: "default", text: status }
    return <Tag color={config.color}>{config.text}</Tag>
  }

  return (
    <>
      <div className='right-content w-100'>
        <div className='card shadow border-0 w-100 flex-row p-4'>
          <h5 className='mb-0'>Danh sách loại sản phẩm</h5>
          <div className='ml-auto d-flex align-items-center'>
            <div className='ml-auto d-flex align-items-center'>
              <Button className='btn-blue ml-3 pl-3 pr-3' onClick={handleAdd}>
                <IoMdAdd /> &nbsp; Thêm loại sản phẩm
              </Button>
            </div>
          </div>
        </div>

        <div className='card shadow border-0 p-3 mt-4'>
          <DataTable<ExtendedProductType>
            columns={[
              {
                title: (
                  <FilterHeader 
                      title="Tên loại sản phẩm" 
                      dataIndex="name" 
                      value={filters.name} 
                      onChange={(val) => handleFilterChange('name', val)}
                      inputType="text"
                  />
                ),
                dataIndex: "name",
                key: "name",
              },
              {
                title: (
                  <FilterHeader 
                      title="Mã loại" 
                      dataIndex="code" 
                      value={filters.code} 
                      onChange={(val) => handleFilterChange('code', val)}
                      inputType="text"
                  />
                ),
                dataIndex: "code",
                key: "code",
              },
              {
                title: "Mô tả",
                dataIndex: "description",
                key: "description",
                render: (description: string) => description || "N/A",
              },
              {
                title: "Trạng thái",
                dataIndex: "status",
                key: "status",
                render: (status: Status) => renderStatus(status),
              },
              {
                title: "Ngày tạo",
                dataIndex: "created_at",
                key: "created_at",
                render: (date: string) =>
                  date ? new Date(date).toLocaleDateString("vi-VN") : "N/A",
              },
            ]}
            data={rows}
            loading={isLoading}
            onChange={handleTableChange}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: productTypesResponse?.data?.total || 0,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total: number, range: [number, number]) =>
                `${range[0]}-${range[1]} của ${total} loại sản phẩm`,
            }}
            showSearch={false}
            scroll={{ x: "100%" }}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      </div>

      <DialogAddUpdate
        openDialog={openDialog}
        setOpenDialog={setOpenDialog}
        editingRow={editingRow}
      />

      <ConfirmModal
        title='Xác nhận xóa'
        content={
          deletingCategory
            ? `Bạn có chắc chắn muốn xóa loại sản phẩm "${deletingCategory.name}"?`
            : "Bạn có chắc chắn muốn xóa loại sản phẩm này?"
        }
        open={deleteConfirmVisible}
        onOk={handleConfirmDelete}
        onCancel={handleCancelDelete}
        okText='Xóa'
        okType='primary'
        cancelText='Hủy'
      />
    </>
  )
}

export default ListCategory
