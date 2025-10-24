import { useEffect, useContext, useState } from "react"

import Button from "@mui/material/Button"
import { IoMdAdd } from "react-icons/io"

import { MyContext } from "../../App"

import { ProductSubtype } from "../../models/product-subtype.model"
import {
  useProductSubtypesQuery,
  useDeleteProductSubtypeMutation,
} from "../../queries/product-subtype"
import { useProductTypesQuery } from "../../queries/product-type"
import DialogAddUpdate from "./components/dialog-add-update"
import DataTable from "../../components/common/data-table"

const ListSubCategory = () => {
  const context = useContext(MyContext)

  useEffect(() => {
    window.scrollTo(0, 0)
    context.setIsHeaderFooterShow(false)
  }, [context])

  const [openDialog, setOpenDialog] = useState(false)
  const [editingRow, setEditingRow] = useState<ProductSubtype | null>(null)

  // Sử dụng React Query để lấy dữ liệu loại phụ sản phẩm
  const { data: productSubtypes, isLoading: isLoadingSubtypes } =
    useProductSubtypesQuery()

  // Sử dụng React Query để lấy dữ liệu loại sản phẩm
  const { data: productTypes, isLoading: isLoadingTypes } =
    useProductTypesQuery()

  // Mutation để xóa loại phụ sản phẩm
  const deleteProductSubtypeMutation = useDeleteProductSubtypeMutation()

  // Xử lý sửa loại phụ sản phẩm
  const handleEdit = (record: ProductSubtype) => {
    setEditingRow(record)
    setOpenDialog(true)
  }

  // Xử lý xóa loại phụ sản phẩm
  const handleDelete = async (record: ProductSubtype) => {
    if (
      window.confirm(
        `Bạn có chắc chắn muốn xóa loại phụ sản phẩm "${record.name}"?`
      )
    ) {
      try {
        await deleteProductSubtypeMutation.mutateAsync(record.id)
      } catch (error) {
        console.error("Lỗi khi xóa loại phụ sản phẩm:", error)
      }
    }
  }

  // Xử lý thêm mới
  const handleAdd = () => {
    setEditingRow(null)
    setOpenDialog(true)
  }

  // Hàm để lấy tên loại sản phẩm từ ID
  const getProductTypeName = (productTypeId: number) => {
    if (!productTypes?.items) return "N/A"
    const productType = productTypes.items.find(
      (type) => type.id === productTypeId
    )
    return productType ? productType.typeName : "N/A"
  }

  return (
    <>
      <div className='right-content w-100'>
        <div className='card shadow border-0 w-100 flex-row p-4'>
          <h5 className='mb-0'>Danh sách loại phụ sản phẩm</h5>
          <div className='ml-auto d-flex align-items-center'>
            <div className='ml-auto d-flex align-items-center'>
              <Button className='btn-blue ml-3 pl-3 pr-3' onClick={handleAdd}>
                <IoMdAdd /> &nbsp; Thêm loại phụ sản phẩm
              </Button>
            </div>
          </div>
        </div>

        <div className='card shadow border-0 p-3 mt-4'>
          <DataTable<ProductSubtype>
            columns={[
              {
                title: "Tên loại phụ sản phẩm",
                dataIndex: "subtypeName",
                key: "subtypeName",
                sorter: true,
                render: (text: string) => text || "N/A",
              },
              {
                title: "Loại sản phẩm",
                dataIndex: "productTypeId",
                key: "productTypeId",
                sorter: true,
                render: (productTypeId: number) =>
                  getProductTypeName(productTypeId),
              },
              {
                title: "Mô tả",
                dataIndex: "description",
                key: "description",
                render: (description: string) => description || "N/A",
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
            data={productSubtypes || []}
            loading={isLoadingSubtypes || isLoadingTypes}
            showSearch={true}
            searchPlaceholder='Tìm kiếm loại phụ sản phẩm...'
            searchableColumns={["subtypeName", "description"]}
            onEdit={handleEdit}
            onDelete={handleDelete}
            scroll={{ x: "100%" }}
            paginationConfig={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} loại phụ sản phẩm`,
            }}
          />
        </div>
      </div>

      {/* Dialog thêm/sửa loại phụ sản phẩm */}
      <DialogAddUpdate
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        editingSubtype={editingRow}
      />
    </>
  )
}

export default ListSubCategory
