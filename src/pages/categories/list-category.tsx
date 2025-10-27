import { useEffect, useState, useContext, useMemo } from "react"

import Button from "@mui/material/Button"
import { IoMdAdd } from "react-icons/io"

import { MyContext } from "../../App"

import DialogAddUpdate from "./components/dialog-add-update"
import { ConfirmModal } from "../../components/common" // Cập nhật import
import {
  useAllProductTypesQuery as useProductTypes,
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

// Extend ProductType interface để tương thích với DataTable

const ListCategory = () => {
  const context = useContext(MyContext)

  // Sử dụng React Query để lấy dữ liệu loại sản phẩm
  const { data: productTypesProductType, isLoading } = useProductTypes()
  const deleteProductTypeMutation = useDeleteProductTypeMutation()

  useEffect(() => {
    window.scrollTo(0, 0)
    context.setIsHeaderFooterShow(false)
  }, [context])

  const [openDialog, setOpenDialog] = useState(false)
  const [editingRow, setEditingRow] = useState<ProductType | null>(null)
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false) // Thêm state cho modal xóa
  const [deletingCategory, setDeletingCategory] = useState<ProductType | null>(
    null
  ) // Thêm state cho danh mục đang xóa

  // Chuyển đổi dữ liệu từ API thành format phù hợp với table
  const rows: ExtendedProductType[] = useMemo(() => {
    if (!productTypesProductType) return []
    // useAllProductTypesQuery trả về { items: ProductType[], total: number }
    const items = productTypesProductType.items || []
    return items.map((item: ProductType) => ({
      id: item.id,
      typeName: item.typeName,
      typeCode: item.typeCode,
      description: item.description || "",
      status: item.status,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }))
  }, [productTypesProductType])

  // Xử lý sửa loại sản phẩm
  const handleEdit = (record: ExtendedProductType) => {
    setEditingRow(record as ProductType)
    setOpenDialog(true)
  }

  // Xử lý xóa loại sản phẩm - cập nhật để set state cho modal
  const handleDelete = (record: ExtendedProductType) => {
    // Set state để hiển thị modal xác nhận
    setDeletingCategory(record as ProductType)
    setDeleteConfirmVisible(true)
  }

  // Xử lý xác nhận xóa
  const handleConfirmDelete = async () => {
    if (!deletingCategory) return

    try {
      await deleteProductTypeMutation.mutateAsync(deletingCategory.id as number)
      toast.success("Xóa loại sản phẩm thành công!")
      // Đóng modal xác nhận
      setDeleteConfirmVisible(false)
      setDeletingCategory(null)
    } catch (error) {
      console.error("Lỗi khi xóa loại sản phẩm:", error)
      toast.error("Có lỗi xảy ra khi xóa loại sản phẩm!")
      // Đóng modal xác nhận
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
                title: "Tên loại sản phẩm",
                dataIndex: "typeName",
                key: "typeName",
                sorter: true,
              },
              {
                title: "Mã loại",
                dataIndex: "typeCode",
                key: "typeCode",
                sorter: true,
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
                dataIndex: "createdAt",
                key: "createdAt",
                render: (date: string) =>
                  date ? new Date(date).toLocaleDateString("vi-VN") : "N/A",
                sorter: true,
              },
            ]}
            data={rows}
            loading={isLoading}
            showSearch={true}
            searchPlaceholder='Tìm kiếm loại sản phẩm...'
            searchableColumns={["typeName", "typeCode", "description"]}
            onEdit={handleEdit}
            onDelete={handleDelete}
            scroll={{ x: "100%" }}
            paginationConfig={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} loại sản phẩm`,
            }}
          />
        </div>
      </div>

      {/* Dialog thêm/sửa loại sản phẩm */}
      <DialogAddUpdate
        openDialog={openDialog}
        setOpenDialog={setOpenDialog}
        editingRow={editingRow}
      />

      {/* Modal xác nhận xóa loại sản phẩm */}
      <ConfirmModal
        title='Xác nhận xóa'
        content={
          deletingCategory
            ? `Bạn có chắc chắn muốn xóa loại sản phẩm "${deletingCategory.typeName}"?`
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
