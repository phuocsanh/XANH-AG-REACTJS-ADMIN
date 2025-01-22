import { useEffect, useState, useContext } from "react";

import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { IoCloseSharp } from "react-icons/io5";
import { IoIosAddCircle } from "react-icons/io";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation } from "swiper/modules";

import { FaImage } from "react-icons/fa";
import Button from "@mui/material/Button";

import { MyContext } from "../../../App";
import { TextField } from "@mui/material";
import ItemLinkVideo from "./ItemLinkVideo";
// TypeScript only: need a type cast here because https://github.com/Microsoft/TypeScript/issues/26591

// function handleClick(event) {
//   event.preventDefault();
//   console.info("You clicked a breadcrumb.");
// }

export const ProductCreate = () => {
  const [categoryVal, setCategoryVal] = useState("");
  const [videos, setVideos] = useState([""]);
  const [subCategoryVal, setSubCategoryVal] = useState("");

  const context = useContext(MyContext);

  useEffect(() => {
    window.scrollTo(0, 0);
    context.setIsHeaderFooterShow(false);
  }, []);

  return (
    <>
      <div className="card shadow my-4 border-0 flex-center p-3">
        <div className="flex items-center justify-between">
          <h1 className="font-weight-bold mb-0">Thêm Sản phẩm</h1>

          {/* <div className="ml-auto flex items-center gap-3">
            <Breadcrumbs aria-label="breadcrumb">
              <StyledBreadcrumb
                component="a"
                href="#"
                label="Home"
                icon={<HomeIcon fontSize="small" />}
              />
              <StyledBreadcrumb component="a" href="#" label="Product" />
              <StyledBreadcrumb label="Create" />
            </Breadcrumbs>
          </div> */}
        </div>
      </div>

      <form className="form w-[100%] mt-4">
        <div className="card shadow my-4 border-0 flex-center p-3">
          <h2 className="font-weight-bold text-black/70 mb-4">
            Thông tin sản phẩm
          </h2>

          <div className="row">
            <div className="col-md-12 col_ mb-3">
              <h4>Tên sản phẩm</h4>
              <div>
                <TextField
                  variant="outlined"
                  fullWidth
                  sx={{
                    "& .MuiInputBase-input": {
                      fontSize: 15,
                      height: 30,
                      paddingX: 2,
                      paddingY: 1,
                    },
                  }}
                  // error={!!errors.email?.message || false}
                  // onChange={(e) => setValue("email", e.target.value)}
                />
                {/* {errors.email && (
              <p className="mt-1 text-red-600">{errors.email.message}</p>
            )} */}
              </div>
            </div>

            <div className="col-md-4 col_ ">
              <h4>Loại </h4>
              <div className="form-group">
                <FormControl size="small" className="w-100">
                  <Select
                    value={categoryVal}
                    onChange={(e) => setCategoryVal(e.target.value)}
                    displayEmpty
                    inputProps={{ "aria-label": "Without label" }}
                    labelId="demo-select-small-label"
                    className="w-100"
                  >
                    <MenuItem value="">
                      <em>Chọn</em>
                    </MenuItem>
                    <MenuItem value={"Men"}>Men</MenuItem>
                    <MenuItem value={"Woman"}>Woman</MenuItem>
                    <MenuItem value={"Kids"}>Kids</MenuItem>
                  </Select>
                </FormControl>
              </div>
            </div>

            <div className="col-md-4 col_">
              <h4>Loại phụ</h4>
              <div className="form-group">
                <FormControl size="small" className="w-100">
                  <Select
                    value={subCategoryVal}
                    onChange={(e) => setSubCategoryVal(e.target.value)}
                    displayEmpty
                    inputProps={{ "aria-label": "Without label" }}
                    labelId="demo-select-small-label"
                    className="w-100"
                  >
                    <MenuItem value="">
                      <em>Chọn</em>
                    </MenuItem>
                    <MenuItem value={"Shirts"}>Shirts</MenuItem>
                    <MenuItem value={"T-Shirts"}>T-Shirts</MenuItem>
                  </Select>
                </FormControl>
              </div>
            </div>

            <div className="col-md-4 col_">
              <h4>Brand</h4>
              <TextField
                variant="outlined"
                fullWidth
                sx={{
                  "& .MuiInputBase-input": {
                    fontSize: 15,
                    height: 25,
                    paddingX: 2,
                    paddingY: 1,
                  },
                }}
                // error={!!errors.email?.message || false}
                // onChange={(e) => setValue("email", e.target.value)}
              />
            </div>
          </div>

          <div className="row">
            <div className="col-md-4 col_">
              <h4>Giá</h4>
              <TextField
                variant="outlined"
                fullWidth
                sx={{
                  "& .MuiInputBase-input": {
                    fontSize: 15,
                    height: 25,
                    paddingX: 2,
                    paddingY: 1,
                  },
                }}
                // error={!!errors.email?.message || false}
                // onChange={(e) => setValue("email", e.target.value)}
              />
            </div>
            <div className="col-md-4 col_">
              <h4>Giá giảm</h4>
              <TextField
                variant="outlined"
                fullWidth
                sx={{
                  "& .MuiInputBase-input": {
                    fontSize: 15,
                    height: 25,
                    paddingX: 2,
                    paddingY: 1,
                  },
                }}
                // error={!!errors.email?.message || false}
                // onChange={(e) => setValue("email", e.target.value)}
              />
            </div>
            <div className="col-md-4 col_">
              <h4>Số lượng</h4>
              <TextField
                variant="outlined"
                fullWidth
                sx={{
                  "& .MuiInputBase-input": {
                    fontSize: 15,
                    height: 25,
                    paddingX: 2,
                    paddingY: 1,
                  },
                }}
                // error={!!errors.email?.message || false}
                // onChange={(e) => setValue("email", e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="card shadow my-4 border-0 flex-center p-3">
          <h2 className="font-weight-bold text-black/70">Thuộc tính</h2>

          <br />
        </div>
        <div className="card shadow my-4 border-0 flex-center p-3">
          <h4 className="font-weight-bold text-black/70">Hình sản phẩm</h4>

          <div className="flex items-center imageUploadingWrapperSlider">
            <div className="slider">
              <Swiper
                slidesPerView={7}
                spaceBetween={0}
                navigation={true}
                slidesPerGroup={1}
                modules={[Navigation]}
                className="imageUploading  w-100"
              >
                <SwiperSlide>
                  <div className="imgUploadBoxWrapper">
                    <span className="remove flex items-center justify-center w-[20px] h-[20px]">
                      <IoCloseSharp />
                    </span>
                    <div className="imgUploadBox cursor-pointer overflow-hidden rounded-md duration-300">
                      <img
                        src="https://mironcoder-hotash.netlify.app/images/product/single/01.webp"
                        className="w-100"
                      />
                    </div>
                  </div>
                </SwiperSlide>

                <SwiperSlide>
                  <div className="imgUploadBoxWrapper">
                    <span className="remove flex items-center justify-center w-[20px] h-[20px]">
                      <IoCloseSharp />
                    </span>
                    <div className="imgUploadBox cursor-pointer overflow-hidden rounded-md duration-300">
                      <img
                        src="https://mironcoder-hotash.netlify.app/images/product/single/01.webp"
                        className="w-100"
                      />
                    </div>
                  </div>
                </SwiperSlide>

                <SwiperSlide>
                  <div className="imgUploadBoxWrapper">
                    <span className="remove flex items-center justify-center w-[20px] h-[20px]">
                      <IoCloseSharp />
                    </span>
                    <div className="imgUploadBox cursor-pointer overflow-hidden rounded-md duration-300">
                      <img
                        src="https://mironcoder-hotash.netlify.app/images/product/single/01.webp"
                        className="w-100"
                      />
                    </div>
                  </div>
                </SwiperSlide>

                <SwiperSlide>
                  <div className="imgUploadBoxWrapper">
                    <span className="remove flex items-center justify-center w-[20px] h-[20px]">
                      <IoCloseSharp />
                    </span>
                    <div className="imgUploadBox cursor-pointer overflow-hidden rounded-md duration-300">
                      <img
                        src="https://mironcoder-hotash.netlify.app/images/product/single/01.webp"
                        className="w-100"
                      />
                    </div>
                  </div>
                </SwiperSlide>

                <SwiperSlide>
                  <div className="imgUploadBoxWrapper">
                    <span className="remove flex items-center justify-center w-[20px] h-[20px]">
                      <IoCloseSharp />
                    </span>
                    <div className="imgUploadBox cursor-pointer overflow-hidden rounded-md duration-300">
                      <img
                        src="https://mironcoder-hotash.netlify.app/images/product/single/01.webp"
                        className="w-100"
                      />
                    </div>
                  </div>
                </SwiperSlide>
              </Swiper>
            </div>

            <div className="imgUploadBoxWrapper">
              <div className="imgUploadBox cursor-pointer overflow-hidden rounded-md duration-300 flex items-center justify-center flex-col">
                <input type="file" />
                <FaImage className="icon" />
                <h4 className="mb-0 text-black/30 text-center w-100">
                  Image Upload
                </h4>
              </div>
            </div>
          </div>
          <div className=" col_">
            <h4 className="flex items-center mr-3">
              Mã Videos Youtube{" "}
              <button
                className="ml-2"
                onClick={(e) => {
                  e.preventDefault();
                  if (videos.length > 2) return;

                  setVideos((pre) => [...pre, ""]);
                }}
              >
                <IoIosAddCircle color="" size={25} />
              </button>
            </h4>
            <div className="flex flex-row">
              {videos.map((i, idx) => (
                <ItemLinkVideo
                  idx={idx}
                  key={idx}
                  setVideos={setVideos}
                  videos={videos}
                />
              ))}
            </div>
          </div>

          <div className=" col_ mt-3 mb-3">
            <h4>Mô tả</h4>
            <TextField
              variant="outlined"
              fullWidth
              multiline
              sx={{
                "& .MuiInputBase-input": {
                  fontSize: 15,

                  paddingX: 2,
                  paddingY: 1,
                },
              }}
              // error={!!errors.email?.message || false}
              // onChange={(e) => setValue("email", e.target.value)}
            />
          </div>
          <Button className="btn-blue btn-lg">Create Product</Button>

          <br />
        </div>
      </form>
    </>
  );
};
