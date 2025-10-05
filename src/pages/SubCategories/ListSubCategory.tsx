import { useEffect, useContext } from "react";

import Button from "@mui/material/Button";
import { PiExport } from "react-icons/pi";
import { IoMdAdd } from "react-icons/io";

import "swiper/css";
import "swiper/css/navigation";
import { MyContext } from "../../App";

////

import * as React from "react";
import { alpha } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Checkbox from "@mui/material/Checkbox";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import DeleteIcon from "@mui/icons-material/Delete";
import FilterListIcon from "@mui/icons-material/FilterList";
import { visuallyHidden } from "@mui/utils";
import { RiEdit2Fill, RiDeleteBin6Line } from "react-icons/ri";
import { ProductSubtype, productSubtypeService } from "../../services/product-subtype.service";
import { toast } from "react-toastify";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DialogAddUpdate from "./components/DialogAddUpdate"

///

interface Data {
  id: number;
  subtypeName: string;
  subtypeCode: string;
  productTypeId: number;
  description?: string;
  status: 'active' | 'inactive' | 'archived';
  createdAt: string;
  updatedAt: string;
}

function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

type Order = "asc" | "desc";

function getComparator<Key extends keyof Data>(
  order: Order,
  orderBy: Key
): (a: Data, b: Data) => number {
  return order === "desc"
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

interface HeadCell {
  disablePadding: boolean;
  id: keyof Data;
  label: string;
  numeric: boolean;
}

const headCells: readonly HeadCell[] = [
  {
    id: "subtypeName",
    numeric: false,
    disablePadding: true,
    label: "Tên loại phụ sản phẩm",
  },
  {
    id: "subtypeCode",
    numeric: false,
    disablePadding: false,
    label: "Mã loại phụ",
  },
  {
    id: "productTypeId",
    numeric: true,
    disablePadding: false,
    label: "ID Loại sản phẩm",
  },
  {
    id: "description",
    numeric: false,
    disablePadding: false,
    label: "Mô tả",
  },
  {
    id: "status",
    numeric: false,
    disablePadding: false,
    label: "Trạng thái",
  },
  {
    id: "createdAt",
    numeric: false,
    disablePadding: false,
    label: "Ngày tạo",
  },
];

interface EnhancedTableProps {
  numSelected: number;
  onRequestSort: (
    event: React.MouseEvent<unknown>,
    property: keyof Data
  ) => void;
  onSelectAllClick: (event: React.ChangeEvent<HTMLInputElement>) => void;
  order: Order;
  orderBy: string;
  rowCount: number;
}

function EnhancedTableHead(props: EnhancedTableProps) {
  const {
    onSelectAllClick,
    order,
    orderBy,
    numSelected,
    rowCount,
    onRequestSort,
  } = props;
  const createSortHandler =
    (property: keyof Data) => (event: React.MouseEvent<unknown>) => {
      onRequestSort(event, property);
    };

  return (
    <TableHead>
      <TableRow>
        <TableCell padding="checkbox">
          <Checkbox
            color="primary"
            indeterminate={numSelected > 0 && numSelected < rowCount}
            checked={rowCount > 0 && numSelected === rowCount}
            onChange={onSelectAllClick}
            inputProps={{
              "aria-label": "select all desserts",
            }}
          />
        </TableCell>
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            align={headCell.numeric ? "right" : "left"}
            padding={headCell.disablePadding ? "none" : "normal"}
            sortDirection={orderBy === headCell.id ? order : false}
          >
            <TableSortLabel
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : "asc"}
              onClick={createSortHandler(headCell.id)}
            >
              {headCell.label}
              {orderBy === headCell.id ? (
                <Box component="span" sx={visuallyHidden}>
                  {order === "desc" ? "sorted descending" : "sorted ascending"}
                </Box>
              ) : null}
            </TableSortLabel>
          </TableCell>
        ))}
        <TableCell align="center">Hành động</TableCell>
      </TableRow>
    </TableHead>
  );
}

interface EnhancedTableToolbarProps {
  numSelected: number;
  onDelete: () => void;
}

function EnhancedTableToolbar(props: EnhancedTableToolbarProps) {
  const { numSelected, onDelete } = props;

  return (
    <Toolbar
      sx={[
        {
          pl: { sm: 2 },
          pr: { xs: 1, sm: 1 },
        },
        numSelected > 0 && {
          bgcolor: (theme) =>
            alpha(
              theme.palette.primary.main,
              theme.palette.action.activatedOpacity
            ),
        },
      ]}
    >
      {numSelected > 0 ? (
        <Typography
          sx={{ flex: "1 1 100%" }}
          color="inherit"
          variant="subtitle1"
          component="div"
        >
          {numSelected} đã chọn
        </Typography>
      ) : (
        <Typography
          sx={{ flex: "1 1 100%" }}
          variant="h6"
          id="tableTitle"
          component="div"
        >
          Danh sách loại phụ sản phẩm
        </Typography>
      )}
      {numSelected > 0 ? (
        <Tooltip title="Xóa">
          <IconButton onClick={onDelete}>
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      ) : (
        <Tooltip title="Filter list">
          <IconButton>
            <FilterListIcon />
          </IconButton>
        </Tooltip>
      )}
    </Toolbar>
  );
}

const ListSubCategory = () => {
  const context = useContext(MyContext);
  const [order, setOrder] = React.useState<Order>("asc");
  const [orderBy, setOrderBy] = React.useState<keyof Data>("subtypeName");
  const [selected, setSelected] = React.useState<readonly number[]>([]);
  const [page, setPage] = React.useState(0);
  const [dense, setDense] = React.useState(false);
  const [rowsPerPage, setRowsPerPage] = React.useState(5);
  
  // State cho dialog thêm/sửa
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingSubtype, setEditingSubtype] = React.useState<ProductSubtype | null>(null);

  const queryClient = useQueryClient();

  // Hook để lấy danh sách loại phụ sản phẩm
  const { data: productSubtypes = [], isLoading, error } = useQuery({
    queryKey: ['productSubtypes'],
    queryFn: productSubtypeService.getProductSubtypes,
  });

  // Hook để xóa loại phụ sản phẩm
  const deleteProductSubtypeMutation = useMutation({
    mutationFn: productSubtypeService.deleteProductSubtype,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productSubtypes'] });
      // Toast sẽ được hiển thị trong mutation hook
    },
    onError: (error: Error) => {
       toast.error(error?.message || 'Có lỗi xảy ra khi xóa loại phụ sản phẩm!');
     },
  });

  // Chuyển đổi dữ liệu từ ProductSubtype sang Data interface
  const rows: Data[] = productSubtypes.map((subtype: ProductSubtype) => ({
    id: subtype.id,
    subtypeName: subtype.subtypeName,
    subtypeCode: subtype.subtypeCode,
    productTypeId: subtype.productTypeId,
    description: subtype.description || '',
    status: subtype.status,
    createdAt: new Date(subtype.createdAt).toLocaleDateString('vi-VN'),
    updatedAt: new Date(subtype.updatedAt).toLocaleDateString('vi-VN'),
  }));

  // Handlers cho dialog
  const handleOpenAddDialog = () => {
    setEditingSubtype(null);
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (subtype: ProductSubtype) => {
    setEditingSubtype(subtype);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingSubtype(null);
  };

  const handleRequestSort = (
    event: React.MouseEvent<unknown>,
    property: keyof Data
  ) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = rows.map((n) => n.id);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const handleClick = (event: React.MouseEvent<unknown>, id: number) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected: readonly number[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      );
    }
    setSelected(newSelected);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleChangeDense = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDense(event.target.checked);
  };

  const isSelected = (id: number) => selected.indexOf(id) !== -1;

  // Avoid a layout jump when reaching the last page with empty rows.
  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - rows.length) : 0;

  const visibleRows = React.useMemo(
    () =>
      [...rows]
        .sort(getComparator(order, orderBy))
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [order, orderBy, page, rowsPerPage, rows]
  );

  // Xử lý xóa nhiều loại phụ sản phẩm
  const handleDelete = async () => {
    if (selected.length === 0) return;

    const confirmDelete = window.confirm(
      `Bạn có chắc chắn muốn xóa ${selected.length} loại phụ sản phẩm đã chọn?`
    );

    if (confirmDelete) {
      try {
        await Promise.all(
          selected.map((id) => deleteProductSubtypeMutation.mutateAsync(id))
        );
        setSelected([]);
      } catch (error) {
        console.error('Lỗi khi xóa loại phụ sản phẩm:', error);
      }
    }
  };

  // Xử lý xóa một loại phụ sản phẩm
  const handleDeleteSingle = async (id: number) => {
    const confirmDelete = window.confirm(
      'Bạn có chắc chắn muốn xóa loại phụ sản phẩm này?'
    );

    if (confirmDelete) {
      try {
        await deleteProductSubtypeMutation.mutateAsync(id);
      } catch (error) {
        console.error('Lỗi khi xóa loại phụ sản phẩm:', error);
      }
    }
  };

  // Xử lý chỉnh sửa loại phụ sản phẩm
  const handleEdit = (subtype: ProductSubtype) => {
    handleOpenEditDialog(subtype);
  };

  // Xử lý thêm mới loại phụ sản phẩm
  const handleAdd = () => {
    handleOpenAddDialog();
  };

  useEffect(() => {
    // context.setIsHideSidebarAndHeader(false);
  }, [context]);

  if (isLoading) {
    return <div>Đang tải...</div>;
  }

  if (error) {
    return <div>Có lỗi xảy ra khi tải dữ liệu</div>;
  }

  return (
    <>
      <div className="right-content w-100">
        <div className="card shadow border-0 w-100 flex-row p-4">
          <h5 className="mb-0">Quản lý loại phụ sản phẩm</h5>
          <div className="ml-auto d-flex align-items-center">
            <div className="ml-auto d-flex align-items-center">
              <Button className="btn-blue ml-3 pl-3 pr-3">
                <PiExport /> Export
              </Button>
              <Button className="btn-blue ml-3 pl-3 pr-3" onClick={handleAdd}>
                <IoMdAdd /> Thêm loại phụ sản phẩm
              </Button>
            </div>
          </div>
        </div>

        <div className="card shadow border-0 p-3 mt-4">
          <h3 className="hd">Danh sách loại phụ sản phẩm</h3>

          <div className="row cardFilters mt-3">
            <div className="col-md-3">
              <h4>Hiển thị theo</h4>
              <FormControlLabel
                control={<Switch checked={dense} onChange={handleChangeDense} />}
                label="Thu gọn"
              />
            </div>
          </div>

          <div className="table-responsive mt-3">
            <Box sx={{ width: "100%" }}>
              <Paper sx={{ width: "100%", mb: 2 }}>
                <EnhancedTableToolbar
                  numSelected={selected.length}
                  onDelete={handleDelete}
                />
                <TableContainer>
                  <Table
                    sx={{ minWidth: 750 }}
                    aria-labelledby="tableTitle"
                    size={dense ? "small" : "medium"}
                  >
                    <EnhancedTableHead
                      numSelected={selected.length}
                      order={order}
                      orderBy={orderBy}
                      onSelectAllClick={handleSelectAllClick}
                      onRequestSort={handleRequestSort}
                      rowCount={rows.length}
                    />
                    <TableBody>
                      {visibleRows.map((row, index) => {
                        const isItemSelected = isSelected(row.id);
                        const labelId = `enhanced-table-checkbox-${index}`;

                        return (
                          <TableRow
                            hover
                            onClick={(event) => handleClick(event, row.id)}
                            role="checkbox"
                            aria-checked={isItemSelected}
                            tabIndex={-1}
                            key={row.id}
                            selected={isItemSelected}
                            sx={{ cursor: "pointer" }}
                          >
                            <TableCell padding="checkbox">
                              <Checkbox
                                color="primary"
                                checked={isItemSelected}
                                inputProps={{
                                  "aria-labelledby": labelId,
                                }}
                              />
                            </TableCell>
                            <TableCell
                              component="th"
                              id={labelId}
                              scope="row"
                              padding="none"
                            >
                              {row.subtypeName}
                            </TableCell>
                            <TableCell align="left">{row.subtypeCode}</TableCell>
                            <TableCell align="right">{row.productTypeId}</TableCell>
                            <TableCell align="left">
                              {row.description || "Không có mô tả"}
                            </TableCell>
                            <TableCell align="left">
                              <span
                                className={`badge ${
                                  row.status === 'active'
                                    ? "badge-success"
                                    : row.status === 'inactive'
                                    ? "badge-warning"
                                    : "badge-secondary"
                                }`}
                              >
                                {row.status === 'active' ? 'Hoạt động' : 
                                 row.status === 'inactive' ? 'Không hoạt động' : 'Lưu trữ'}
                              </span>
                            </TableCell>
                            <TableCell align="left">{row.createdAt}</TableCell>
                            <TableCell align="center">
                              <div className="actions d-flex align-items-center">
                                <IconButton
                                  className="success"
                                  color="success"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const originalSubtype = productSubtypes.find(s => s.id === row.id);
                                    if (originalSubtype) {
                                      handleEdit(originalSubtype);
                                    }
                                  }}
                                >
                                  <RiEdit2Fill />
                                </IconButton>
                                <IconButton
                                  className="error"
                                  color="error"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteSingle(row.id);
                                  }}
                                >
                                  <RiDeleteBin6Line />
                                </IconButton>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {emptyRows > 0 && (
                        <TableRow
                          style={{
                            height: (dense ? 33 : 53) * emptyRows,
                          }}
                        >
                          <TableCell colSpan={8} />
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  component="div"
                  count={rows.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  labelRowsPerPage="Số hàng mỗi trang:"
                  labelDisplayedRows={({ from, to, count }) =>
                    `${from}–${to} của ${count !== -1 ? count : `hơn ${to}`}`
                  }
                />
              </Paper>
            </Box>
          </div>
        </div>
      </div>

      {/* Dialog thêm/sửa loại phụ sản phẩm */}
      <DialogAddUpdate
        open={dialogOpen}
        onClose={handleCloseDialog}
        editingSubtype={editingSubtype}
      />
    </>
  );
};

export default ListSubCategory;
