import { useEffect, useState, useContext } from "react"

import Button from "@mui/material/Button"
import { IoMdAdd } from "react-icons/io"

import { MyContext } from "../../App"

import DialogAddUpdate from "./components/dialog-add-update"
import { ConfirmModal } from "../../components/common"
import {
  useProductSubtypesQuery,
  useDeleteProductSubtypeMutation,
} from "../../queries/product-subtype"
import { ProductSubtype } from "../../models/product-subtype.model"
import { useProductTypesQuery as useProductTypes } from "../../queries/product-type"
import { toast } from "react-toastify"
import DataTable from "../../components/common/data-table"
import FilterHeader from "../../components/common/filter-header"

const ListSubCategory = () => {
  const context = useContext(MyContext)

  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [filters, setFilters] = useState<Record<string, any>>({})

  const {
    data: productSubtypesResponse,
    isLoading: isLoadingSubtypes,
    refetch: refetchSubtypes,
  } = useProductSubtypesQuery({
    page: currentPage,
    limit: pageSize,
    ...filters,
  })
  const deleteProductSubtypeMutation = useDeleteProductSubtypeMutation()
  const { data: productTypesResponse, isLoading: isLoadingTypes } =
    useProductTypes()

  useEffect(() => {
    window.scrollTo(0, 0)
    context.setIsHeaderFooterShow(false)
  }, [context])

  const [openDialog, setOpenDialog] = useState(false)
  const [editingRow, setEditingRow] = useState<ProductSubtype | null>(null)
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false)
  const [deletingSubCategory, setDeletingSubCategory] =
    useState<ProductSubtype | null>(null)

  // Trích xuất dữ liệu từ response phân trang
  const productSubtypes = productSubtypesResponse?.data?.items || []
  const productTypes = productTypesResponse?.data?.items || []

  // Xử lý sửa loại phụ sản phẩm
  const handleEdit = (record: ProductSubtype) => {
    setEditingRow(record)
    setOpenDialog(true)
  }

  // Xử lý xóa loại phụ sản phẩm
  const handleDelete = (record: ProductSubtype) => {
    setDeletingSubCategory(record)
    setDeleteConfirmVisible(true)
  }

  // Xử lý xác nhận xóa
  const handleConfirmDelete = async () => {
    if (!deletingSubCategory) return

    try {
      await deleteProductSubtypeMutation.mutateAsync(deletingSubCategory.id)
      toast.success("Xóa loại phụ sản phẩm thành công!")
      setDeleteConfirmVisible(false)
      setDeletingSubCategory(null)
      refetchSubtypes()
    } catch (error) {
      console.error("Lỗi khi xóa loại phụ sản phẩm:", error)
      toast.error("Có lỗi xảy ra khi xóa loại phụ sản phẩm!")
      setDeleteConfirmVisible(false)
      setDeletingSubCategory(null)
    }
  }

  // Xử lý hủy bỏ xóa
  const handleCancelDelete = () => {
    setDeleteConfirmVisible(false)
    setDeletingSubCategory(null)
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

  // Hàm để lấy tên loại sản phẩm từ ID
  const getProductTypeName = (productTypeId: number) => {
    if (!productTypes) return "N/A"
    const productType = productTypes.find(
      (type: { id: number }) => type.id === productTypeId
    )
    return productType ? productType.name : "N/A"
  }

  return (
    <>
      <div className='right-content w-100'>
        <div className='card shadow border-0 w-100 p-4'>
          <div className='d-flex align-items-center gap-3'>
            <h5 className='mb-0'>Danh sách loại phụ sản phẩm</h5>
            <Button className='btn-blue ms-auto px-3' onClick={handleAdd}>
              <IoMdAdd /> &nbsp; Thêm loại phụ sản phẩm
            </Button>
          </div>
        </div>

        <div className='card shadow border-0 p-3 mt-4'>
          <DataTable<ProductSubtype>
            columns={[
              {
                title: (
                  <FilterHeader 
                      title="Tên loại phụ sản phẩm" 
                      dataIndex="name" 
                      value={filters.name} 
                      onChange={(val) => handleFilterChange('name', val)}
                      inputType="text"
                  />
                ),
                dataIndex: "name",
                key: "name",
                sorter: true,
                render: (text: string) => text || "N/A",
              },
              {
                title: "Loại sản phẩm",
                dataIndex: "product_type_id",
                key: "product_type_id",
                sorter: true,
                render: (product_type_id: number) =>
                  getProductTypeName(product_type_id),
              },
              {
                title: "Mô tả",
                dataIndex: "description",
                key: "description",
                render: (description: string) => description || "N/A",
              },
              {
                title: "Ngày tạo",
                dataIndex: "created_at",
                key: "created_at",
                render: (date: string) =>
                  date ? new Date(date).toLocaleDateString("vi-VN") : "N/A",
              },
            ]}
            data={productSubtypes || []}
            loading={isLoadingSubtypes || isLoadingTypes}
            onChange={handleTableChange}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: productSubtypesResponse?.data?.total || 0,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total: number, range: [number, number]) =>
                `${range[0]}-${range[1]} của ${total} loại phụ sản phẩm`,
            }}
            showSearch={false}
            scroll={{ x: "100%" }}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      </div>

      <DialogAddUpdate
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        editingSubtype={editingRow}
      />

      <ConfirmModal
        title='Xác nhận xóa'
        content={
          deletingSubCategory
            ? `Bạn có chắc chắn muốn xóa loại phụ sản phẩm "${deletingSubCategory.name}"?`
            : "Bạn có chắc chắn muốn xóa loại phụ sản phẩm này?"
        }
        open={deleteConfirmVisible}
        onOk={handleConfirmDelete}
        onCancel={handleCancelDelete}
        okText='Xóa'
        okType='primary'
        cancelText='Hủy'
        confirmLoading={deleteProductSubtypeMutation.isPending}
      />
    </>
  )
}

export default ListSubCategory
