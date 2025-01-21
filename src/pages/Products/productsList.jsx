import React, { useEffect, useState,useContext } from "react";
import { SearchBox } from "../../components/SearchBox";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import TooltipBox from "@mui/material/Tooltip";
import Pagination from "@mui/material/Pagination";
import Rating from "@mui/material/Rating";
import { FiEdit3 } from "react-icons/fi";
import { MdOutlineRemoveRedEye } from "react-icons/md";
import { MdOutlineDeleteOutline } from "react-icons/md";
import Button from "@mui/material/Button";
import { PiExport } from "react-icons/pi";
import { IoMdAdd } from "react-icons/io";
import Checkbox from "@mui/material/Checkbox";
import { Link } from "react-router-dom";

import Drawer from "@mui/material/Drawer";

import { IoCloseSharp } from "react-icons/io5";

import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation } from "swiper/modules";

import { FaImage } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";

import { MyContext } from "../../App";

const label = { inputProps: { "aria-label": "Checkbox demo" } };

export const ProductsList = () => {
  const [perPage, setPerPage] = useState(10);
  const [showBy, setShowBy] = useState(10);
  const [isAllChecked, setIsAllChecked] = useState(false);

  const [categoryVal, setCategoryVal] = useState("");
  const [subCategoryVal, setSubCategoryVal] = useState("");
  const [isFeatured, setIsFeatured] = useState("None");

  const context = useContext(MyContext);

  const [open, setOpen] = useState(false);

  const handleChange = (event) => {
    setPerPage(event.target.value);
  };

  const selectAll = (e) => {
    if (e.target.checked === true) {
      setIsAllChecked(true);
    } else {
      setIsAllChecked(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    context.setIsHeaderFooterShow(false);
  }, []);

  const toggleDrawer = (newOpen) => {
    setOpen(newOpen);
  };

  return (
    <>
      <div className="card shadow my-4 border-0 flex-center p-3">
        <div className="flex items-center justify-between">
          <h1 className="font-weight-bold mb-0">Products</h1>

          <div className="ml-auto flex items-center gap-3">
            <Button className="btn-border btn-sm">
              <PiExport /> Export
            </Button>
            <Link to="/product/create">
              <Button className="btn-blue btn-sm">
                <IoMdAdd /> Add Product
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="card shadow my-4 border-0">
        <div className="flex items-center mb-4 justify-between  pt-3 px-4">
          <h2 className="mb-0 font-bold text-md">Best Selling Products</h2>

          <div className="ml-auto flex items-center gap-4">
            <SearchBox />

            <div className="">
              <FormControl size="small" className="w-100">
                <Select
                  value={showBy}
                  onChange={(e) => setShowBy(e.target.value)}
                  displayEmpty
                  inputProps={{ "aria-label": "Without label" }}
                  labelId="demo-select-small-label"
                  className="w-100"
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={20}>20</MenuItem>
                  <MenuItem value={30}>30</MenuItem>
                </Select>
              </FormControl>
            </div>
          </div>
        </div>

        <div className="table-responsive mb-2">
          <table className="table w-[100%] table-striped">
            <thead className="thead-light">
              <tr>
                <th>
                  <Checkbox {...label} size="small" onChange={selectAll} />
                </th>
                <th>PRODUCT</th>
                <th>CATEGORY</th>
                <th>BRAND</th>
                <th>PRICE</th>
                <th>STOCK</th>
                <th>RATING</th>
                <th>ORDER</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>
                  <Checkbox {...label} size="small" checked={isAllChecked} />
                </td>
                <td>
                  <div className="flex items-center gap-5 w-[300px]">
                    <div className="imgWrapper shadow overflow-hidden w-[25%] h-[25%] rounded-md">
                      <img src="https://mironcoder-hotash.netlify.app/images/product/01.webp" />
                    </div>

                    <div className="info w-[75%]">
                      <h6>Tops and skirt set for Female...</h6>
                      <p>
                        Women's exclusive summer Tops and skirt set for Female
                        Tops and skirt set
                      </p>
                    </div>
                  </div>
                </td>
                <td>womans</td>
                <td>richman</td>
                <td>
                  <div className="w-[70px]">
                    <del class="old">$21.00</del>
                    <span class="new text-danger">$21.00</span>
                  </div>
                </td>
                <td>300</td>
                <td>
                  <Rating
                    name="size-small"
                    defaultValue={4.5}
                    size="small"
                    precision={0.5}
                    readOnly
                  />
                </td>
                <td>350</td>

                <td>
                  <div className="actions flex items-center gap-2">
                    <TooltipBox title="Edit" placement="top">
                      <button
                        className="flex items-center justify-center w-[30px] h-[30px]
                rounded-md duration-300"
                        onClick={() => toggleDrawer(true)}
                      >
                        <FiEdit3 />
                      </button>
                    </TooltipBox>

                    <TooltipBox title="View" placement="top">
                      <button
                        className="flex items-center justify-center w-[30px] h-[30px]
                rounded-md duration-300"
                      >
                        <MdOutlineRemoveRedEye />
                      </button>
                    </TooltipBox>

                    <TooltipBox title="Remove" placement="top">
                      <button
                        className="flex items-center justify-center w-[30px] h-[30px]
                rounded-md duration-300"
                      >
                        <MdOutlineDeleteOutline />
                      </button>
                    </TooltipBox>
                  </div>
                </td>
              </tr>

              <tr>
                <td>
                  <Checkbox {...label} size="small" checked={isAllChecked} />
                </td>
                <td>
                  <div className="flex items-center gap-5 w-[300px]">
                    <div className="imgWrapper shadow overflow-hidden w-[25%] h-[25%] rounded-md">
                      <img src="https://mironcoder-hotash.netlify.app/images/product/01.webp" />
                    </div>

                    <div className="info w-[75%]">
                      <h6>Tops and skirt set for Female...</h6>
                      <p>
                        Women's exclusive summer Tops and skirt set for Female
                        Tops and skirt set
                      </p>
                    </div>
                  </div>
                </td>
                <td>womans</td>
                <td>richman</td>
                <td>
                  <div className="w-[70px]">
                    <del class="old">$21.00</del>
                    <span class="new text-danger">$21.00</span>
                  </div>
                </td>
                <td>300</td>
                <td>
                  <Rating
                    name="size-small"
                    defaultValue={4.5}
                    size="small"
                    precision={0.5}
                    readOnly
                  />
                </td>
                <td>350</td>

                <td>
                  <div className="actions flex items-center gap-2">
                    <TooltipBox title="Edit" placement="top">
                      <button
                        className="flex items-center justify-center w-[30px] h-[30px]
              rounded-md duration-300"
                        onClick={() => toggleDrawer(true)}
                      >
                        <FiEdit3 />
                      </button>
                    </TooltipBox>

                    <TooltipBox title="View" placement="top">
                      <button
                        className="flex items-center justify-center w-[30px] h-[30px]
              rounded-md duration-300"
                      >
                        <MdOutlineRemoveRedEye />
                      </button>
                    </TooltipBox>

                    <TooltipBox title="Remove" placement="top">
                      <button
                        className="flex items-center justify-center w-[30px] h-[30px]
              rounded-md duration-300"
                      >
                        <MdOutlineDeleteOutline />
                      </button>
                    </TooltipBox>
                  </div>
                </td>
              </tr>

              <tr>
                <td>
                  <Checkbox {...label} size="small" checked={isAllChecked} />
                </td>
                <td>
                  <div className="flex items-center gap-5 w-[300px]">
                    <div className="imgWrapper shadow overflow-hidden w-[25%] h-[25%] rounded-md">
                      <img src="https://mironcoder-hotash.netlify.app/images/product/01.webp" />
                    </div>

                    <div className="info w-[75%]">
                      <h6>Tops and skirt set for Female...</h6>
                      <p>
                        Women's exclusive summer Tops and skirt set for Female
                        Tops and skirt set
                      </p>
                    </div>
                  </div>
                </td>
                <td>womans</td>
                <td>richman</td>
                <td>
                  <div className="w-[70px]">
                    <del class="old">$21.00</del>
                    <span class="new text-danger">$21.00</span>
                  </div>
                </td>
                <td>300</td>
                <td>
                  <Rating
                    name="size-small"
                    defaultValue={4.5}
                    size="small"
                    precision={0.5}
                    readOnly
                  />
                </td>
                <td>350</td>

                <td>
                  <div className="actions flex items-center gap-2">
                    <TooltipBox title="Edit" placement="top">
                      <button
                        className="flex items-center justify-center w-[30px] h-[30px]
            rounded-md duration-300"
                        onClick={() => toggleDrawer(true)}
                      >
                        <FiEdit3 />
                      </button>
                    </TooltipBox>

                    <TooltipBox title="View" placement="top">
                      <button
                        className="flex items-center justify-center w-[30px] h-[30px]
            rounded-md duration-300"
                      >
                        <MdOutlineRemoveRedEye />
                      </button>
                    </TooltipBox>

                    <TooltipBox title="Remove" placement="top">
                      <button
                        className="flex items-center justify-center w-[30px] h-[30px]
            rounded-md duration-300"
                      >
                        <MdOutlineDeleteOutline />
                      </button>
                    </TooltipBox>
                  </div>
                </td>
              </tr>

              <tr>
                <td>
                  <Checkbox {...label} size="small" checked={isAllChecked} />
                </td>
                <td>
                  <div className="flex items-center gap-5 w-[300px]">
                    <div className="imgWrapper shadow overflow-hidden w-[25%] h-[25%] rounded-md">
                      <img src="https://mironcoder-hotash.netlify.app/images/product/01.webp" />
                    </div>

                    <div className="info w-[75%]">
                      <h6>Tops and skirt set for Female...</h6>
                      <p>
                        Women's exclusive summer Tops and skirt set for Female
                        Tops and skirt set
                      </p>
                    </div>
                  </div>
                </td>
                <td>womans</td>
                <td>richman</td>
                <td>
                  <div className="w-[70px]">
                    <del class="old">$21.00</del>
                    <span class="new text-danger">$21.00</span>
                  </div>
                </td>
                <td>300</td>
                <td>
                  <Rating
                    name="size-small"
                    defaultValue={4.5}
                    size="small"
                    precision={0.5}
                    readOnly
                  />
                </td>
                <td>350</td>

                <td>
                  <div className="actions flex items-center gap-2">
                    <TooltipBox title="Edit" placement="top">
                      <button
                        className="flex items-center justify-center w-[30px] h-[30px]
          rounded-md duration-300"
                        onClick={() => toggleDrawer(true)}
                      >
                        <FiEdit3 />
                      </button>
                    </TooltipBox>

                    <TooltipBox title="View" placement="top">
                      <button
                        className="flex items-center justify-center w-[30px] h-[30px]
          rounded-md duration-300"
                      >
                        <MdOutlineRemoveRedEye />
                      </button>
                    </TooltipBox>

                    <TooltipBox title="Remove" placement="top">
                      <button
                        className="flex items-center justify-center w-[30px] h-[30px]
          rounded-md duration-300"
                      >
                        <MdOutlineDeleteOutline />
                      </button>
                    </TooltipBox>
                  </div>
                </td>
              </tr>

              <tr>
                <td>
                  <Checkbox {...label} size="small" checked={isAllChecked} />
                </td>
                <td>
                  <div className="flex items-center gap-5 w-[300px]">
                    <div className="imgWrapper shadow overflow-hidden w-[25%] h-[25%] rounded-md">
                      <img src="https://mironcoder-hotash.netlify.app/images/product/01.webp" />
                    </div>

                    <div className="info w-[75%]">
                      <h6>Tops and skirt set for Female...</h6>
                      <p>
                        Women's exclusive summer Tops and skirt set for Female
                        Tops and skirt set
                      </p>
                    </div>
                  </div>
                </td>
                <td>womans</td>
                <td>richman</td>
                <td>
                  <div className="w-[70px]">
                    <del class="old">$21.00</del>
                    <span class="new text-danger">$21.00</span>
                  </div>
                </td>
                <td>300</td>
                <td>
                  <Rating
                    name="size-small"
                    defaultValue={4.5}
                    size="small"
                    precision={0.5}
                    readOnly
                  />
                </td>
                <td>350</td>

                <td>
                  <div className="actions flex items-center gap-2">
                    <TooltipBox title="Edit" placement="top">
                      <button
                        className="flex items-center justify-center w-[30px] h-[30px]
        rounded-md duration-300"
                        onClick={() => toggleDrawer(true)}
                      >
                        <FiEdit3 />
                      </button>
                    </TooltipBox>

                    <TooltipBox title="View" placement="top">
                      <button
                        className="flex items-center justify-center w-[30px] h-[30px]
        rounded-md duration-300"
                      >
                        <MdOutlineRemoveRedEye />
                      </button>
                    </TooltipBox>

                    <TooltipBox title="Remove" placement="top">
                      <button
                        className="flex items-center justify-center w-[30px] h-[30px]
        rounded-md duration-300"
                      >
                        <MdOutlineDeleteOutline />
                      </button>
                    </TooltipBox>
                  </div>
                </td>
              </tr>

              <tr>
                <td>
                  <Checkbox {...label} size="small" checked={isAllChecked} />
                </td>
                <td>
                  <div className="flex items-center gap-5 w-[300px]">
                    <div className="imgWrapper shadow overflow-hidden w-[25%] h-[25%] rounded-md">
                      <img src="https://mironcoder-hotash.netlify.app/images/product/01.webp" />
                    </div>

                    <div className="info w-[75%]">
                      <h6>Tops and skirt set for Female...</h6>
                      <p>
                        Women's exclusive summer Tops and skirt set for Female
                        Tops and skirt set
                      </p>
                    </div>
                  </div>
                </td>
                <td>womans</td>
                <td>richman</td>
                <td>
                  <div className="w-[70px]">
                    <del class="old">$21.00</del>
                    <span class="new text-danger">$21.00</span>
                  </div>
                </td>
                <td>300</td>
                <td>
                  <Rating
                    name="size-small"
                    defaultValue={4.5}
                    size="small"
                    precision={0.5}
                    readOnly
                  />
                </td>
                <td>350</td>

                <td>
                  <div className="actions flex items-center gap-2">
                    <TooltipBox title="Edit" placement="top">
                      <button
                        className="flex items-center justify-center w-[30px] h-[30px]
      rounded-md duration-300"
                        onClick={() => toggleDrawer(true)}
                      >
                        <FiEdit3 />
                      </button>
                    </TooltipBox>

                    <TooltipBox title="View" placement="top">
                      <button
                        className="flex items-center justify-center w-[30px] h-[30px]
      rounded-md duration-300"
                      >
                        <MdOutlineRemoveRedEye />
                      </button>
                    </TooltipBox>

                    <TooltipBox title="Remove" placement="top">
                      <button
                        className="flex items-center justify-center w-[30px] h-[30px]
      rounded-md duration-300"
                      >
                        <MdOutlineDeleteOutline />
                      </button>
                    </TooltipBox>
                  </div>
                </td>
              </tr>

              <tr>
                <td>
                  <Checkbox {...label} size="small" checked={isAllChecked} />
                </td>
                <td>
                  <div className="flex items-center gap-5 w-[300px]">
                    <div className="imgWrapper shadow overflow-hidden w-[25%] h-[25%] rounded-md">
                      <img src="https://mironcoder-hotash.netlify.app/images/product/01.webp" />
                    </div>

                    <div className="info w-[75%]">
                      <h6>Tops and skirt set for Female...</h6>
                      <p>
                        Women's exclusive summer Tops and skirt set for Female
                        Tops and skirt set
                      </p>
                    </div>
                  </div>
                </td>
                <td>womans</td>
                <td>richman</td>
                <td>
                  <div className="w-[70px]">
                    <del class="old">$21.00</del>
                    <span class="new text-danger">$21.00</span>
                  </div>
                </td>
                <td>300</td>
                <td>
                  <Rating
                    name="size-small"
                    defaultValue={4.5}
                    size="small"
                    precision={0.5}
                    readOnly
                  />
                </td>
                <td>350</td>

                <td>
                  <div className="actions flex items-center gap-2">
                    <TooltipBox title="Edit" placement="top">
                      <button
                        className="flex items-center justify-center w-[30px] h-[30px]
    rounded-md duration-300"
                        onClick={() => toggleDrawer(true)}
                      >
                        <FiEdit3 />
                      </button>
                    </TooltipBox>

                    <TooltipBox title="View" placement="top">
                      <button
                        className="flex items-center justify-center w-[30px] h-[30px]
    rounded-md duration-300"
                      >
                        <MdOutlineRemoveRedEye />
                      </button>
                    </TooltipBox>

                    <TooltipBox title="Remove" placement="top">
                      <button
                        className="flex items-center justify-center w-[30px] h-[30px]
    rounded-md duration-300"
                      >
                        <MdOutlineDeleteOutline />
                      </button>
                    </TooltipBox>
                  </div>
                </td>
              </tr>

              <tr>
                <td>
                  <Checkbox {...label} size="small" checked={isAllChecked} />
                </td>
                <td>
                  <div className="flex items-center gap-5 w-[300px]">
                    <div className="imgWrapper shadow overflow-hidden w-[25%] h-[25%] rounded-md">
                      <img src="https://mironcoder-hotash.netlify.app/images/product/01.webp" />
                    </div>

                    <div className="info w-[75%]">
                      <h6>Tops and skirt set for Female...</h6>
                      <p>
                        Women's exclusive summer Tops and skirt set for Female
                        Tops and skirt set
                      </p>
                    </div>
                  </div>
                </td>
                <td>womans</td>
                <td>richman</td>
                <td>
                  <div className="w-[70px]">
                    <del class="old">$21.00</del>
                    <span class="new text-danger">$21.00</span>
                  </div>
                </td>
                <td>300</td>
                <td>
                  <Rating
                    name="size-small"
                    defaultValue={4.5}
                    size="small"
                    precision={0.5}
                    readOnly
                  />
                </td>
                <td>350</td>

                <td>
                  <div className="actions flex items-center gap-2">
                    <TooltipBox title="Edit" placement="top">
                      <button
                        className="flex items-center justify-center w-[30px] h-[30px]
  rounded-md duration-300"
                        onClick={() => toggleDrawer(true)}
                      >
                        <FiEdit3 />
                      </button>
                    </TooltipBox>

                    <TooltipBox title="View" placement="top">
                      <button
                        className="flex items-center justify-center w-[30px] h-[30px]
  rounded-md duration-300"
                      >
                        <MdOutlineRemoveRedEye />
                      </button>
                    </TooltipBox>

                    <TooltipBox title="Remove" placement="top">
                      <button
                        className="flex items-center justify-center w-[30px] h-[30px]
  rounded-md duration-300"
                      >
                        <MdOutlineDeleteOutline />
                      </button>
                    </TooltipBox>
                  </div>
                </td>
              </tr>

              <tr>
                <td>
                  <Checkbox {...label} size="small" checked={isAllChecked} />
                </td>
                <td>
                  <div className="flex items-center gap-5 w-[300px]">
                    <div className="imgWrapper shadow overflow-hidden w-[25%] h-[25%] rounded-md">
                      <img src="https://mironcoder-hotash.netlify.app/images/product/01.webp" />
                    </div>

                    <div className="info w-[75%]">
                      <h6>Tops and skirt set for Female...</h6>
                      <p>
                        Women's exclusive summer Tops and skirt set for Female
                        Tops and skirt set
                      </p>
                    </div>
                  </div>
                </td>
                <td>womans</td>
                <td>richman</td>
                <td>
                  <div className="w-[70px]">
                    <del class="old">$21.00</del>
                    <span class="new text-danger">$21.00</span>
                  </div>
                </td>
                <td>300</td>
                <td>
                  <Rating
                    name="size-small"
                    defaultValue={4.5}
                    size="small"
                    precision={0.5}
                    readOnly
                  />
                </td>
                <td>350</td>

                <td>
                  <div className="actions flex items-center gap-2">
                    <TooltipBox title="Edit" placement="top">
                      <button
                        className="flex items-center justify-center w-[30px] h-[30px]
rounded-md duration-300"
                        onClick={() => toggleDrawer(true)}
                      >
                        <FiEdit3 />
                      </button>
                    </TooltipBox>

                    <TooltipBox title="View" placement="top">
                      <button
                        className="flex items-center justify-center w-[30px] h-[30px]
rounded-md duration-300"
                      >
                        <MdOutlineRemoveRedEye />
                      </button>
                    </TooltipBox>

                    <TooltipBox title="Remove" placement="top">
                      <button
                        className="flex items-center justify-center w-[30px] h-[30px]
rounded-md duration-300"
                      >
                        <MdOutlineDeleteOutline />
                      </button>
                    </TooltipBox>
                  </div>
                </td>
              </tr>

              <tr>
                <td>
                  <Checkbox {...label} size="small" checked={isAllChecked} />
                </td>
                <td>
                  <div className="flex items-center gap-5 w-[300px]">
                    <div className="imgWrapper shadow overflow-hidden w-[25%] h-[25%] rounded-md">
                      <img src="https://mironcoder-hotash.netlify.app/images/product/01.webp" />
                    </div>

                    <div className="info w-[75%]">
                      <h6>Tops and skirt set for Female...</h6>
                      <p>
                        Women's exclusive summer Tops and skirt set for Female
                        Tops and skirt set
                      </p>
                    </div>
                  </div>
                </td>
                <td>womans</td>
                <td>richman</td>
                <td>
                  <div className="w-[70px]">
                    <del class="old">$21.00</del>
                    <span class="new text-danger">$21.00</span>
                  </div>
                </td>
                <td>300</td>
                <td>
                  <Rating
                    name="size-small"
                    defaultValue={4.5}
                    size="small"
                    precision={0.5}
                    readOnly
                  />
                </td>
                <td>350</td>

                <td>
                  <div className="actions flex items-center gap-2">
                    <TooltipBox title="Edit" placement="top">
                      <button
                        className="flex items-center justify-center w-[30px] h-[30px]
rounded-md duration-300"
                        onClick={() => toggleDrawer(true)}
                      >
                        <FiEdit3 />
                      </button>
                    </TooltipBox>

                    <TooltipBox title="View" placement="top">
                      <button
                        className="flex items-center justify-center w-[30px] h-[30px]
rounded-md duration-300"
                      >
                        <MdOutlineRemoveRedEye />
                      </button>
                    </TooltipBox>

                    <TooltipBox title="Remove" placement="top">
                      <button
                        className="flex items-center justify-center w-[30px] h-[30px]
rounded-md duration-300"
                      >
                        <MdOutlineDeleteOutline />
                      </button>
                    </TooltipBox>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="table-footer flex items-center justify-between py-2 px-3 mb-2">
          <div className="flex items-center gap-3">
            <h6 className="mb-0 text-sm">Rows per page</h6>
            <Select
              labelId="demo-select-small-label"
              id="demo-select-small"
              value={perPage}
              label="Page"
              onChange={handleChange}
              size="small"
            >
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={20}>20</MenuItem>
              <MenuItem value={30}>30</MenuItem>
              <MenuItem value={40}>40</MenuItem>
              <MenuItem value={50}>50</MenuItem>
            </Select>
          </div>

          <Pagination
            count={10}
            color="primary"
            showFirstButton
            showLastButton
            className="ml-auto"
          />
        </div>
      </div>

      <Drawer open={open} onClose={() => toggleDrawer(false)} anchor={"right"} className="sidepanel">

        <form className="form w-[100%] mt-4 relative">

        <Button className="close_ " onClick={() => toggleDrawer(false)}><IoMdClose/></Button>


          <div className="card shadow  border-0 flex-center p-3">
            <h2 className="font-weight-bold text-black/70 mb-4">
              Basic Information
            </h2>

            <div className="row">
              <div className="col-md-12 col_">
                <h4>Product Name</h4>
                <div className="form-group">
                  <input type="text" className="input" />
                </div>
              </div>

              <div className="col-md-12 col_">
                <h4>Product Description</h4>
                <div className="form-group">
                  <textarea className="input" />
                </div>
              </div>

              <div className="col-md-4 col_">
                <h4>Category</h4>
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
                        <em>None</em>
                      </MenuItem>
                      <MenuItem value={"Men"}>Men</MenuItem>
                      <MenuItem value={"Woman"}>Woman</MenuItem>
                      <MenuItem value={"Kids"}>Kids</MenuItem>
                    </Select>
                  </FormControl>
                </div>
              </div>

              <div className="col-md-4 col_">
                <h4>Sub Category</h4>
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
                        <em>None</em>
                      </MenuItem>
                      <MenuItem value={"Shirts"}>Shirts</MenuItem>
                      <MenuItem value={"T-Shirts"}>T-Shirts</MenuItem>
                    </Select>
                  </FormControl>
                </div>
              </div>

              <div className="col-md-4 col_">
                <h4>Price</h4>
                <div className="form-group">
                  <input type="text" className="input" />
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-4 col_">
                <h4>Old Price</h4>
                <div className="form-group">
                  <input type="text" className="input" />
                </div>
              </div>

              <div className="col-md-4 col_">
                <h4>Is Featured</h4>
                <div className="form-group">
                  <FormControl size="small" className="w-100">
                    <Select
                      value={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.value)}
                      displayEmpty
                      inputProps={{ "aria-label": "Without label" }}
                      labelId="demo-select-small-label"
                      className="w-100"
                    >
                      <MenuItem value="None">
                        <em>None</em>
                      </MenuItem>
                      <MenuItem value={"True"}>True</MenuItem>
                      <MenuItem value={"False"}>False</MenuItem>
                    </Select>
                  </FormControl>
                </div>
              </div>

              <div className="col-md-4 col_">
                <h4>Product Stock</h4>
                <div className="form-group">
                  <input type="text" className="input" />
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-4 col_">
                <h4>Brand</h4>
                <div className="form-group">
                  <input type="text" className="input" />
                </div>
              </div>

              <div className="col-md-4 col_">
                <h4>Discount</h4>
                <div className="form-group">
                  <input type="text" className="input" />
                </div>
              </div>

              <div className="col-md-4 col_">
                <h4>Rating</h4>
                <div className="form-group">
                  <Rating
                    name="read-only"
                    value={1}
                    precision={0.5}
                    size="small"
                    readOnly
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="card shadow my-4 border-0 flex-center p-3">
            <h2 className="font-weight-bold text-black/70">
              Upload new product images
            </h2>

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

            <Button className="btn-blue btn-lg">Create Product</Button>

            <br />
          </div>
        </form>
      </Drawer>
    </>
  );
};
