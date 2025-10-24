import { useEffect, useContext, useState } from "react"

import Button from "@mui/material/Button"
import { IoMdAdd } from "react-icons/io"

import { MyContext } from "../../App"

import * as React from "react"
import { ProductSubtype } from "../../services/product-subtype.service"
import { productSubtypeService } from "../../services/product-subtype.service"
import { toast } from "react-toastify"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useProductSubtypes } from "../../queries/use-product-subtype"
import DialogAddUpdate from "./components/dialog-add-update"
import DataTable from "../../components/common/data-table"
import { Tag } from "antd"

// Extend ProductSubtype interface để tương thích với DataTable
interface ExtendedProductSubtype
  extends ProductSubtype,
    Record<string, unknown> {}

const ListSubCategory = () => {
  const context = useContext(MyContext)
  const queryClient = useQueryClient()

  useEffect(() => {
    window.scrollTo(0, 0)
    context.setIsHeaderFooterShow(false)
  }, [context])

  const [openDialog, setOpenDialog] = useState(false)
  const [editingRow, setEditingRow] = useState<ProductSubtype | null>(null)

  // Sử dụng React Query để lấy dữ liệu loại phụ sản phẩm
  const { data: productSubtypes, isLoading } = useProductSubtypes()

  // Mutation để xóa loại phụ sản phẩm
  const deleteProductSubtypeMutation = useMutation({
    mutationFn: (id: number) => productSubtypeService.deleteProductSubtype(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productSubtypes"] })
      toast.success("Xóa loại phụ sản phẩm thành công!")
    },
    onError: (error) => {
      console.error("Lỗi khi xóa loại phụ sản phẩm:", error)
      toast.error("Có lỗi xảy ra khi xóa loại phụ sản phẩm!")
    },
  })

  // Chuyển đổi dữ liệu từ API thành format phù hợp với table
  const rows: ExtendedProductSubtype[] = React.useMemo(() => {
    if (!productSubtypes || !Array.isArray(productSubtypes)) return []
    return productSubtypes.map((item: ProductSubtype) => ({
      id: item.id,
      subtypeName: item.subtypeName,
      subtypeCode: item.subtypeCode,
      productTypeId: item.productTypeId,
      description: item.description || "",
      status: item.status,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }))
  }, [productSubtypes])

  // Xử lý sửa loại phụ sản phẩm
  const handleEdit = (record: ExtendedProductSubtype) => {
    setEditingRow(record as ProductSubtype)
    setOpenDialog(true)
  }

  // Xử lý xóa loại phụ sản phẩm
  const handleDelete = async (record: ExtendedProductSubtype) => {
    if (
      window.confirm(
        `Bạn có chắc chắn muốn xóa loại phụ sản phẩm "${record.subtypeName}"?`
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

  // Render trạng thái
  const renderStatus = (status: string) => {
    const statusConfig = {
      active: { color: "green", text: "Hoạt động" },
      inactive: { color: "red", text: "Không hoạt động" },
      archived: { color: "orange", text: "Lưu trữ" },
    }
    const config = statusConfig[status as keyof typeof statusConfig] || {
      color: "default",
      text: status,
    }
    return <Tag color={config.color}>{config.text}</Tag>
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
          <DataTable<ExtendedProductSubtype>
            columns={[
              {
                title: "Tên loại phụ sản phẩm",
                dataIndex: "subtypeName",
                key: "subtypeName",
                sorter: true,
              },
              {
                title: "Mã loại phụ",
                dataIndex: "subtypeCode",
                key: "subtypeCode",
                sorter: true,
              },
              {
                title: "ID Loại sản phẩm",
                dataIndex: "productTypeId",
                key: "productTypeId",
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
                render: (status: string) => renderStatus(status),
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
            searchPlaceholder='Tìm kiếm loại phụ sản phẩm...'
            searchableColumns={["subtypeName", "subtypeCode", "description"]}
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
