import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

// Material UI components
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import Pagination from "@mui/material/Pagination";
import Checkbox from "@mui/material/Checkbox";
import Button from "@mui/material/Button";
import { 
  CircularProgress, 
  Box, 
  Drawer, 
  Typography, 
  Grid, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  InputLabel, 
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Tooltip
} from "@mui/material";

// Icons
import { FiEdit3 } from "react-icons/fi";
import { MdOutlineRemoveRedEye, MdOutlineDeleteOutline } from "react-icons/md";
import { IoMdAdd, IoMdClose } from "react-icons/io";
import { FaImage } from "react-icons/fa";

// App components
import { MyContext } from "../../App";

// API hooks
import { useProducts, useDeleteProductMutation } from "../../queries/use-product";
import { useProductTypes } from "../../queries/use-product-type";

// Models
import { Product, ExtendedProductListParams } from "../../models/product.model";

// Interface cho SearchBox component
interface SearchBoxProps {
  onSearch: (query: string) => void;
}

// SearchBox component
const SearchBox: React.FC<SearchBoxProps> = ({ onSearch }) => {
  const [searchValue, setSearchValue] = useState<string>("");

  const handleSearch = () => {
    onSearch(searchValue);
  };

  return (
    <div className="search-box">
      <input 
        type="text" 
        placeholder="Tìm kiếm sản phẩm..." 
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        onKeyPress={(e: React.KeyboardEvent) => e.key === 'Enter' && handleSearch()}
      />
      <button onClick={handleSearch}>Tìm kiếm</button>
    </div>
  );
};

// Interface cho ProductType
interface ProductType {
  id: number;
  name: string;
  description?: string;
}

// Định nghĩa component TooltipBox
const TooltipBox: React.FC<{
  children: React.ReactElement;
  title: string;
  placement?: "top" | "bottom" | "left" | "right";
}> = ({ children, title, placement }) => {
  return (
    <Tooltip title={title} placement={placement || "top"} arrow>
      {children}
    </Tooltip>
  );
};



export const ProductsList = () => {
  const navigate = useNavigate();
  const appContext = useContext(MyContext);
  
  // State cho phân trang và hiển thị
  const [perPage, setPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showBy, setShowBy] = useState<string>("10");
  const [isAllChecked, setIsAllChecked] = useState<boolean>(false);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);

  // State cho tìm kiếm và lọc
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [categoryVal, setCategoryVal] = useState<string>("");
  const [subCategoryVal, setSubCategoryVal] = useState<string>("");
  const [isFeatured, setIsFeatured] = useState<string>("None");

  // State cho dialog xóa sản phẩm
  const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);
  const [productToDelete, setProductToDelete] = useState<number | null>(null);
  
  // State cho drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  // Lấy danh sách sản phẩm từ API
  const { data: productsResponse, isLoading, isError, refetch } = useProducts({
    limit: perPage,
    offset: (currentPage - 1) * perPage,
    search: searchQuery,
    categoryId: categoryVal ? parseInt(categoryVal) : undefined,
    subCategoryId: subCategoryVal ? parseInt(subCategoryVal) : undefined,
    featured: isFeatured !== "None" ? isFeatured === "Yes" : undefined
  } as ExtendedProductListParams);
  
  const productsData = productsResponse?.data || { items: [] as Product[], total: 0 };
  const products = productsData?.items || [];
  const totalItems = productsData?.total || 0;

  // Lấy danh sách loại sản phẩm từ API
  const { data: productTypesResponse, error: productTypesError } = useProductTypes();
  
  // Đảm bảo productTypes luôn là một mảng, với fallback data nếu API lỗi
  let productTypes: ProductType[] = [];
  
  if (productTypesError) {
    // Dữ liệu mock tạm thời khi API lỗi
    productTypes = [
      { id: 1, name: 'Rau củ', description: 'Các loại rau củ tươi' },
      { id: 2, name: 'Trái cây', description: 'Các loại trái cây tươi' },
      { id: 3, name: 'Thịt cá', description: 'Thịt và hải sản tươi sống' }
    ];
  } else if (Array.isArray(productTypesResponse?.data)) {
    productTypes = productTypesResponse.data;
  } else {
    productTypes = [];
  }
  
  // Mutation để xóa sản phẩm
  const deleteProductMutation = useDeleteProductMutation();

  // Xử lý khi thay đổi số lượng hiển thị trên một trang
  const handleChangeShowBy = (event: SelectChangeEvent) => {
    const value = event.target.value;
    setShowBy(value);
    setPerPage(parseInt(value));
    setCurrentPage(1);
  };

  // Xử lý khi thay đổi trang
  const handleChangePage = (event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
  };

  // Xử lý khi thay đổi loại sản phẩm
  const handleChangeCategory = (event: SelectChangeEvent<string>) => {
    setCategoryVal(event.target.value);
    setSubCategoryVal("");
    setCurrentPage(1);
  };

  // Xử lý khi thay đổi loại sản phẩm con
  const handleChangeSubCategory = (event: SelectChangeEvent<string>) => {
    setSubCategoryVal(event.target.value);
    setCurrentPage(1);
  };

  // Xử lý khi thay đổi trạng thái nổi bật
  const handleChangeFeatured = (event: SelectChangeEvent<string>) => {
    setIsFeatured(event.target.value);
    setCurrentPage(1);
  };

  // Xử lý khi tìm kiếm
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  // Xử lý khi chọn tất cả sản phẩm
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const checked = event.target.checked;
    if (checked && productsData?.items) {
      const allProductIds = productsData.items.map((product: Product) => product.id);
      setSelectedProducts(allProductIds);
    } else {
      setSelectedProducts([]);
    }
    setIsAllChecked(checked);
  };

  // Xử lý khi chọn một sản phẩm
  const handleSelectProduct = (productId: number, isChecked: boolean): void => {
    setSelectedProducts(prevSelected => {
      if (isChecked) {
        return [...prevSelected, productId];
      } else {
        return prevSelected.filter(id => id !== productId);
      }
    });
  };



  // Xử lý xác nhận xóa sản phẩm
  const confirmDeleteProduct = async (): Promise<void> => {
    if (!productToDelete) return;
    
    try {
      await deleteProductMutation.mutateAsync(productToDelete);
      toast.success("Xóa sản phẩm thành công!");
      refetch();
    } catch {
      toast.error("Có lỗi xảy ra khi xóa sản phẩm!");
    } finally {
      setOpenDeleteDialog(false);
      setProductToDelete(null);
    }
  };

  // Xử lý mở/đóng drawer
  const toggleDrawer = (newOpen: boolean): void => {
    setIsDrawerOpen(newOpen);
  };

  // Xử lý khi nhấn nút thêm sản phẩm mới
  const handleAddProduct = (): void => {
    toggleDrawer(true);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    if (appContext && typeof appContext.setIsHeaderFooterShow === 'function') {
      appContext.setIsHeaderFooterShow(false);
    }
    
    return () => {
      if (appContext && typeof appContext.setIsHeaderFooterShow === 'function') {
        appContext.setIsHeaderFooterShow(true);
      }
    };
  }, [appContext]);

return (
  <Box sx={{ width: '100%', overflow: 'hidden' }}>
    {/* Phần tiêu đề và nút thêm mới */}
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
      <Typography variant="h5" component="h1">
        Danh sách sản phẩm
      </Typography>
      <Button
        variant="contained"
        color="primary"
        startIcon={<IoMdAdd />}
        onClick={handleAddProduct}
      >
        Thêm sản phẩm mới
      </Button>
    </Box>

      {/* Phần tìm kiếm và lọc */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <SearchBox onSearch={handleSearch} />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel id="category-label">Loại sản phẩm</InputLabel>
              <Select
                labelId="category-label"
                value={categoryVal}
                label="Loại sản phẩm"
                onChange={handleChangeCategory}
              >
                <MenuItem value="">Tất cả</MenuItem>
                {productTypes?.map((type: ProductType) => (
                  <MenuItem key={type.id} value={type.id.toString()}>
                    {type.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel id="subcategory-label">Loại con</InputLabel>
              <Select
                labelId="subcategory-label"
                value={subCategoryVal}
                label="Loại con"
                onChange={handleChangeSubCategory}
                disabled={!categoryVal}
              >
                <MenuItem value="">Tất cả</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel id="featured-label">Nổi bật</InputLabel>
              <Select
                labelId="featured-label"
                value={isFeatured}
                label="Nổi bật"
                onChange={handleChangeFeatured}
              >
                <MenuItem value="None">Tất cả</MenuItem>
                <MenuItem value="Yes">Có</MenuItem>
                <MenuItem value="No">Không</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel id="show-by-label">Hiển thị</InputLabel>
              <Select
                labelId="show-by-label"
                value={showBy}
                label="Hiển thị"
                onChange={handleChangeShowBy}
              >
                <MenuItem value="10">10</MenuItem>
                <MenuItem value="20">20</MenuItem>
                <MenuItem value="50">50</MenuItem>
                <MenuItem value="100">100</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Bảng danh sách sản phẩm */}
      <Paper sx={{ width: '100%', mb: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={isAllChecked}
                    onChange={handleSelectAll}
                    inputProps={{ 'aria-label': 'select all products' }}
                  />
                </TableCell>
                <TableCell>Hình ảnh</TableCell>
                <TableCell>Tên sản phẩm</TableCell>
                <TableCell>Giá</TableCell>
                <TableCell>Loại</TableCell>
                <TableCell>Số lượng</TableCell>
                <TableCell>Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography color="error">Lỗi khi tải dữ liệu. Vui lòng thử lại.</Typography>
                  </TableCell>
                </TableRow>
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography>Không có sản phẩm nào.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product: Product) => (
                  <TableRow key={product.id}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedProducts.includes(product.id)}
                        onChange={(e) => handleSelectProduct(product.id, e.target.checked)}
                        inputProps={{ 'aria-labelledby': `product-${product.id}` }}
                      />
                    </TableCell>
                    <TableCell>
                      {product.thumb ? (
                        <Box
                          component="img"
                          sx={{ width: 50, height: 50, objectFit: 'cover' }}
                          src={product.thumb}
                          alt={product.name}
                        />
                      ) : (
                        <FaImage size={30} color="#ccc" />
                      )}
                    </TableCell>
                    <TableCell id={`product-${product.id}`}>{product.name}</TableCell>
                    <TableCell>{product.price}</TableCell>
                    <TableCell>
                      {productTypes?.find((t: ProductType) => t.id === product.type)?.name || 'Không xác định'}
                    </TableCell>
                    <TableCell>{product.quantity}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <TooltipBox title="Xem chi tiết">
                          <Button
                            size="small"
                            variant="outlined"
                            color="info"
                            onClick={() => navigate(`/products/${product.id}`)}
                          >
                            <MdOutlineRemoveRedEye />
                          </Button>
                        </TooltipBox>
                        <TooltipBox title="Chỉnh sửa">
                          <Button
                            size="small"
                            variant="outlined"
                            color="primary"
                            onClick={() => toggleDrawer(true)}
                          >
                            <FiEdit3 />
                          </Button>
                        </TooltipBox>
                        <TooltipBox title="Xóa">
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={() => {
                              setProductToDelete(product.id);
                              setOpenDeleteDialog(true);
                            }}
                          >
                            <MdOutlineDeleteOutline />
                          </Button>
                        </TooltipBox>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Phân trang */}
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <Pagination
            count={Math.ceil(totalItems / perPage)}
            page={currentPage}
            onChange={handleChangePage}
            color="primary"
          />
        </Box>
      </Paper>

      {/* Dialog xác nhận xóa sản phẩm */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Xác nhận xóa sản phẩm
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Bạn có chắc chắn muốn xóa sản phẩm này? Hành động này không thể hoàn tác.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} color="primary">
            Hủy
          </Button>
          <Button onClick={confirmDeleteProduct} color="error" autoFocus>
            Xóa
          </Button>
        </DialogActions>
      </Dialog>

      {/* Drawer chỉnh sửa sản phẩm */}
      <Drawer
        anchor="right"
        open={isDrawerOpen}
        onClose={() => toggleDrawer(false)}
        sx={{ '& .MuiDrawer-paper': { width: { xs: '100%', sm: 500 } } }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Chỉnh sửa sản phẩm</Typography>
            <Button onClick={() => toggleDrawer(false)}>
              <IoMdClose />
            </Button>
          </Box>
          <Typography>Form chỉnh sửa sản phẩm sẽ được thêm vào đây</Typography>
        </Box>
      </Drawer>
    </Box>
  );
};

export default ProductsList;
