import { useEffect, useContext, useState } from "react"
import DashboardBox from "./components/dashboard-box"
import { FaUserCircle } from "react-icons/fa"
import { IoMdCart } from "react-icons/io"
import { MdShoppingBag } from "react-icons/md"
import Rating from "@mui/material/Rating"
import { FiEdit3 } from "react-icons/fi"
import { MdOutlineRemoveRedEye } from "react-icons/md"
import { MdOutlineDeleteOutline } from "react-icons/md"
import TooltipBox from "@mui/material/Tooltip"
import Pagination from "@mui/material/Pagination"
import MenuItem from "@mui/material/MenuItem"
import FormControl from "@mui/material/FormControl"
import Select from "@mui/material/Select"
import Checkbox from "@mui/material/Checkbox"

import Drawer from "@mui/material/Drawer"
import Button from "@mui/material/Button"

import { IoCloseSharp } from "react-icons/io5"

import { Swiper, SwiperSlide } from "swiper/react"
import "swiper/css"
import "swiper/css/navigation"
import { Navigation } from "swiper/modules"

import { FaImage } from "react-icons/fa"
import { IoMdClose } from "react-icons/io"

import { MyContext } from "../../App"

const label = { inputProps: { "aria-label": "Checkbox demo" } }

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  Tooltip,
  ComposedChart,
  Line,
  Legend,
  Scatter,
} from "recharts"
import { SearchBox } from "../../components/search-box"

const data = [
  {
    name: "Page A",
    uv: 4000,
    pv: 2400,
    amt: 2400,
  },
  {
    name: "Page B",
    uv: 3000,
    pv: 1398,
    amt: 2210,
  },
  {
    name: "Page C",
    uv: 2000,
    pv: 9800,
    amt: 2290,
  },
  {
    name: "Page D",
    uv: 2780,
    pv: 3908,
    amt: 2000,
  },
  {
    name: "Page E",
    uv: 1890,
    pv: 4800,
    amt: 2181,
  },
  {
    name: "Page F",
    uv: 2390,
    pv: 3800,
    amt: 2500,
  },
  {
    name: "Page G",
    uv: 3490,
    pv: 4300,
    amt: 2100,
  },
]

export const Dashboard = () => {
  const [perPage, setPerPage] = useState(10)
  const [showBy, setShowBy] = useState(10)
  const [open, setOpen] = useState(false)

  const [isAllChecked, setIsAllChecked] = useState(false)
  const [categoryVal, setCategoryVal] = useState("")
  const [subCategoryVal, setSubCategoryVal] = useState("")
  const [isFeatured, setIsFeatured] = useState("None")
  const context = useContext(MyContext)

  const handleChange = (event) => {
    setPerPage(event.target.value)
  }

  const selectAll = (e) => {
    if (e.target.checked === true) {
      setIsAllChecked(true)
    } else {
      setIsAllChecked(false)
    }
  }

  useEffect(() => {
    window.scrollTo(0, 0)
    context.setIsHeaderFooterShow(false)
  }, [])

  const toggleDrawer = (newOpen) => {
    setOpen(newOpen)
  }

  return (
    <>
      <div className='section'>
        <div className='dashboardBoxWrapper d-flex'>
          <DashboardBox
            color={["#1da256", "#48d483"]}
            icon={<FaUserCircle />}
            grow={true}
          />
          <DashboardBox color={["#c012e2", "#eb64fe"]} icon={<IoMdCart />} />
          <DashboardBox
            color={["#2c78e5", "#60aff5"]}
            icon={<MdShoppingBag />}
          />
        </div>

        <div className='card shadow my-4 border-0'>
          <div className='flex items-center mb-4 justify-between  pt-3 px-4'>
            <h2 className='mb-0 font-bold text-md'>Best Selling Products</h2>

            <div className='ml-auto flex items-center gap-4'>
              <SearchBox />

              <div className=''>
                <FormControl size='small' className='w-100'>
                  <Select
                    value={showBy}
                    onChange={(e) => setShowBy(e.target.value)}
                    displayEmpty
                    inputProps={{ "aria-label": "Without label" }}
                    labelId='demo-select-small-label'
                    className='w-100'
                  >
                    <MenuItem value=''>
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

          <div className='table-responsive mb-2'>
            <table className='table w-[100%] table-striped'>
              <thead className='thead-light'>
                <tr>
                  <th>
                    <Checkbox {...label} size='small' onChange={selectAll} />
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
                    <Checkbox {...label} size='small' checked={isAllChecked} />
                  </td>
                  <td>
                    <div className='flex items-center gap-5 w-[300px]'>
                      <div className='imgWrapper shadow overflow-hidden w-[25%] h-[25%] rounded-md'>
                        <img src='https://mironcoder-hotash.netlify.app/images/product/01.webp' />
                      </div>

                      <div className='info w-[75%]'>
                        <h6>Tops and skirt set for Female...</h6>
                        <p>
                          Womens exclusive summer Tops and skirt set for Female
                          Tops and skirt set
                        </p>
                      </div>
                    </div>
                  </td>
                  <td>womans</td>
                  <td>richman</td>
                  <td>
                    <div className='w-[70px]'>
                      <del className='old'>$21.00</del>
                      <span className='new text-danger'>$21.00</span>
                    </div>
                  </td>
                  <td>300</td>
                  <td>
                    <Rating
                      name='size-small'
                      defaultValue={4.5}
                      size='small'
                      precision={0.5}
                      readOnly
                    />
                  </td>
                  <td>350</td>

                  <td>
                    <div className='actions flex items-center gap-2'>
                      <TooltipBox title='Edit' placement='top'>
                        <button
                          className='flex items-center justify-center w-[30px] h-[30px]
                rounded-md duration-300'
                          onClick={() => toggleDrawer(true)}
                        >
                          <FiEdit3 />
                        </button>
                      </TooltipBox>

                      <TooltipBox title='View' placement='top'>
                        <button
                          className='flex items-center justify-center w-[30px] h-[30px]
                rounded-md duration-300'
                        >
                          <MdOutlineRemoveRedEye />
                        </button>
                      </TooltipBox>

                      <TooltipBox title='Remove' placement='top'>
                        <button
                          className='flex items-center justify-center w-[30px] h-[30px]
                rounded-md duration-300'
                        >
                          <MdOutlineDeleteOutline />
                        </button>
                      </TooltipBox>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td>
                    <Checkbox {...label} size='small' checked={isAllChecked} />
                  </td>
                  <td>
                    <div className='flex items-center gap-5 w-[300px]'>
                      <div className='imgWrapper shadow overflow-hidden w-[25%] h-[25%] rounded-md'>
                        <img src='https://mironcoder-hotash.netlify.app/images/product/01.webp' />
                      </div>

                      <div className='info w-[75%]'>
                        <h6>Tops and skirt set for Female...</h6>
                        <p>
                          Womens exclusive summer Tops and skirt set for Female
                          Tops and skirt set
                        </p>
                      </div>
                    </div>
                  </td>
                  <td>womans</td>
                  <td>richman</td>
                  <td>
                    <div className='w-[70px]'>
                      <del className='old'>$21.00</del>
                      <span className='new text-danger'>$21.00</span>
                    </div>
                  </td>
                  <td>300</td>
                  <td>
                    <Rating
                      name='size-small'
                      defaultValue={4.5}
                      size='small'
                      precision={0.5}
                      readOnly
                    />
                  </td>
                  <td>350</td>

                  <td>
                    <div className='actions flex items-center gap-2'>
                      <TooltipBox title='Edit' placement='top'>
                        <button
                          className='flex items-center justify-center w-[30px] h-[30px]
              rounded-md duration-300'
                          onClick={() => toggleDrawer(true)}
                        >
                          <FiEdit3 />
                        </button>
                      </TooltipBox>

                      <TooltipBox title='View' placement='top'>
                        <button
                          className='flex items-center justify-center w-[30px] h-[30px]
              rounded-md duration-300'
                        >
                          <MdOutlineRemoveRedEye />
                        </button>
                      </TooltipBox>

                      <TooltipBox title='Remove' placement='top'>
                        <button
                          className='flex items-center justify-center w-[30px] h-[30px]
              rounded-md duration-300'
                        >
                          <MdOutlineDeleteOutline />
                        </button>
                      </TooltipBox>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td>
                    <Checkbox {...label} size='small' checked={isAllChecked} />
                  </td>
                  <td>
                    <div className='flex items-center gap-5 w-[300px]'>
                      <div className='imgWrapper shadow overflow-hidden w-[25%] h-[25%] rounded-md'>
                        <img src='https://mironcoder-hotash.netlify.app/images/product/01.webp' />
                      </div>

                      <div className='info w-[75%]'>
                        <h6>Tops and skirt set for Female...</h6>
                        <p>
                          Womens exclusive summer Tops and skirt set for Female
                          Tops and skirt set
                        </p>
                      </div>
                    </div>
                  </td>
                  <td>womans</td>
                  <td>richman</td>
                  <td>
                    <div className='w-[70px]'>
                      <del className='old'>$21.00</del>
                      <span className='new text-danger'>$21.00</span>
                    </div>
                  </td>
                  <td>300</td>
                  <td>
                    <Rating
                      name='size-small'
                      defaultValue={4.5}
                      size='small'
                      precision={0.5}
                      readOnly
                    />
                  </td>
                  <td>350</td>

                  <td>
                    <div className='actions flex items-center gap-2'>
                      <TooltipBox title='Edit' placement='top'>
                        <button
                          className='flex items-center justify-center w-[30px] h-[30px]
            rounded-md duration-300'
                          onClick={() => toggleDrawer(true)}
                        >
                          <FiEdit3 />
                        </button>
                      </TooltipBox>

                      <TooltipBox title='View' placement='top'>
                        <button
                          className='flex items-center justify-center w-[30px] h-[30px]
            rounded-md duration-300'
                        >
                          <MdOutlineRemoveRedEye />
                        </button>
                      </TooltipBox>

                      <TooltipBox title='Remove' placement='top'>
                        <button
                          className='flex items-center justify-center w-[30px] h-[30px]
            rounded-md duration-300'
                        >
                          <MdOutlineDeleteOutline />
                        </button>
                      </TooltipBox>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td>
                    <Checkbox {...label} size='small' checked={isAllChecked} />
                  </td>
                  <td>
                    <div className='flex items-center gap-5 w-[300px]'>
                      <div className='imgWrapper shadow overflow-hidden w-[25%] h-[25%] rounded-md'>
                        <img src='https://mironcoder-hotash.netlify.app/images/product/01.webp' />
                      </div>

                      <div className='info w-[75%]'>
                        <h6>Tops and skirt set for Female...</h6>
                        <p>
                          Womens exclusive summer Tops and skirt set for Female
                          Tops and skirt set
                        </p>
                      </div>
                    </div>
                  </td>
                  <td>womans</td>
                  <td>richman</td>
                  <td>
                    <div className='w-[70px]'>
                      <del className='old'>$21.00</del>
                      <span className='new text-danger'>$21.00</span>
                    </div>
                  </td>
                  <td>300</td>
                  <td>
                    <Rating
                      name='size-small'
                      defaultValue={4.5}
                      size='small'
                      precision={0.5}
                      readOnly
                    />
                  </td>
                  <td>350</td>

                  <td>
                    <div className='actions flex items-center gap-2'>
                      <TooltipBox title='Edit' placement='top'>
                        <button
                          className='flex items-center justify-center w-[30px] h-[30px]
          rounded-md duration-300'
                          onClick={() => toggleDrawer(true)}
                        >
                          <FiEdit3 />
                        </button>
                      </TooltipBox>

                      <TooltipBox title='View' placement='top'>
                        <button
                          className='flex items-center justify-center w-[30px] h-[30px]
          rounded-md duration-300'
                        >
                          <MdOutlineRemoveRedEye />
                        </button>
                      </TooltipBox>

                      <TooltipBox title='Remove' placement='top'>
                        <button
                          className='flex items-center justify-center w-[30px] h-[30px]
          rounded-md duration-300'
                        >
                          <MdOutlineDeleteOutline />
                        </button>
                      </TooltipBox>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td>
                    <Checkbox {...label} size='small' checked={isAllChecked} />
                  </td>
                  <td>
                    <div className='flex items-center gap-5 w-[300px]'>
                      <div className='imgWrapper shadow overflow-hidden w-[25%] h-[25%] rounded-md'>
                        <img src='https://mironcoder-hotash.netlify.app/images/product/01.webp' />
                      </div>

                      <div className='info w-[75%]'>
                        <h6>Tops and skirt set for Female...</h6>
                        <p>
                          Womens exclusive summer Tops and skirt set for Female
                          Tops and skirt set
                        </p>
                      </div>
                    </div>
                  </td>
                  <td>womans</td>
                  <td>richman</td>
                  <td>
                    <div className='w-[70px]'>
                      <del className='old'>$21.00</del>
                      <span className='new text-danger'>$21.00</span>
                    </div>
                  </td>
                  <td>300</td>
                  <td>
                    <Rating
                      name='size-small'
                      defaultValue={4.5}
                      size='small'
                      precision={0.5}
                      readOnly
                    />
                  </td>
                  <td>350</td>

                  <td>
                    <div className='actions flex items-center gap-2'>
                      <TooltipBox title='Edit' placement='top'>
                        <button
                          className='flex items-center justify-center w-[30px] h-[30px]
        rounded-md duration-300'
                          onClick={() => toggleDrawer(true)}
                        >
                          <FiEdit3 />
                        </button>
                      </TooltipBox>

                      <TooltipBox title='View' placement='top'>
                        <button
                          className='flex items-center justify-center w-[30px] h-[30px]
        rounded-md duration-300'
                        >
                          <MdOutlineRemoveRedEye />
                        </button>
                      </TooltipBox>

                      <TooltipBox title='Remove' placement='top'>
                        <button
                          className='flex items-center justify-center w-[30px] h-[30px]
        rounded-md duration-300'
                        >
                          <MdOutlineDeleteOutline />
                        </button>
                      </TooltipBox>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td>
                    <Checkbox {...label} size='small' checked={isAllChecked} />
                  </td>
                  <td>
                    <div className='flex items-center gap-5 w-[300px]'>
                      <div className='imgWrapper shadow overflow-hidden w-[25%] h-[25%] rounded-md'>
                        <img src='https://mironcoder-hotash.netlify.app/images/product/01.webp' />
                      </div>

                      <div className='info w-[75%]'>
                        <h6>Tops and skirt set for Female...</h6>
                        <p>
                          Womens exclusive summer Tops and skirt set for Female
                          Tops and skirt set
                        </p>
                      </div>
                    </div>
                  </td>
                  <td>womans</td>
                  <td>richman</td>
                  <td>
                    <div className='w-[70px]'>
                      <del className='old'>$21.00</del>
                      <span className='new text-danger'>$21.00</span>
                    </div>
                  </td>
                  <td>300</td>
                  <td>
                    <Rating
                      name='size-small'
                      defaultValue={4.5}
                      size='small'
                      precision={0.5}
                      readOnly
                    />
                  </td>
                  <td>350</td>

                  <td>
                    <div className='actions flex items-center gap-2'>
                      <TooltipBox title='Edit' placement='top'>
                        <button
                          className='flex items-center justify-center w-[30px] h-[30px]
      rounded-md duration-300'
                          onClick={() => toggleDrawer(true)}
                        >
                          <FiEdit3 />
                        </button>
                      </TooltipBox>

                      <TooltipBox title='View' placement='top'>
                        <button
                          className='flex items-center justify-center w-[30px] h-[30px]
      rounded-md duration-300'
                        >
                          <MdOutlineRemoveRedEye />
                        </button>
                      </TooltipBox>

                      <TooltipBox title='Remove' placement='top'>
                        <button
                          className='flex items-center justify-center w-[30px] h-[30px]
      rounded-md duration-300'
                        >
                          <MdOutlineDeleteOutline />
                        </button>
                      </TooltipBox>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td>
                    <Checkbox {...label} size='small' checked={isAllChecked} />
                  </td>
                  <td>
                    <div className='flex items-center gap-5 w-[300px]'>
                      <div className='imgWrapper shadow overflow-hidden w-[25%] h-[25%] rounded-md'>
                        <img src='https://mironcoder-hotash.netlify.app/images/product/01.webp' />
                      </div>

                      <div className='info w-[75%]'>
                        <h6>Tops and skirt set for Female...</h6>
                        <p>
                          Womens exclusive summer Tops and skirt set for Female
                          Tops and skirt set
                        </p>
                      </div>
                    </div>
                  </td>
                  <td>womans</td>
                  <td>richman</td>
                  <td>
                    <div className='w-[70px]'>
                      <del className='old'>$21.00</del>
                      <span className='new text-danger'>$21.00</span>
                    </div>
                  </td>
                  <td>300</td>
                  <td>
                    <Rating
                      name='size-small'
                      defaultValue={4.5}
                      size='small'
                      precision={0.5}
                      readOnly
                    />
                  </td>
                  <td>350</td>

                  <td>
                    <div className='actions flex items-center gap-2'>
                      <TooltipBox title='Edit' placement='top'>
                        <button
                          className='flex items-center justify-center w-[30px] h-[30px]
    rounded-md duration-300'
                          onClick={() => toggleDrawer(true)}
                        >
                          <FiEdit3 />
                        </button>
                      </TooltipBox>

                      <TooltipBox title='View' placement='top'>
                        <button
                          className='flex items-center justify-center w-[30px] h-[30px]
    rounded-md duration-300'
                        >
                          <MdOutlineRemoveRedEye />
                        </button>
                      </TooltipBox>

                      <TooltipBox title='Remove' placement='top'>
                        <button
                          className='flex items-center justify-center w-[30px] h-[30px]
    rounded-md duration-300'
                        >
                          <MdOutlineDeleteOutline />
                        </button>
                      </TooltipBox>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td>
                    <Checkbox {...label} size='small' checked={isAllChecked} />
                  </td>
                  <td>
                    <div className='flex items-center gap-5 w-[300px]'>
                      <div className='imgWrapper shadow overflow-hidden w-[25%] h-[25%] rounded-md'>
                        <img src='https://mironcoder-hotash.netlify.app/images/product/01.webp' />
                      </div>

                      <div className='info w-[75%]'>
                        <h6>Tops and skirt set for Female...</h6>
                        <p>
                          Womens exclusive summer Tops and skirt set for Female
                          Tops and skirt set
                        </p>
                      </div>
                    </div>
                  </td>
                  <td>womans</td>
                  <td>richman</td>
                  <td>
                    <div className='w-[70px]'>
                      <del className='old'>$21.00</del>
                      <span className='new text-danger'>$21.00</span>
                    </div>
                  </td>
                  <td>300</td>
                  <td>
                    <Rating
                      name='size-small'
                      defaultValue={4.5}
                      size='small'
                      precision={0.5}
                      readOnly
                    />
                  </td>
                  <td>350</td>

                  <td>
                    <div className='actions flex items-center gap-2'>
                      <TooltipBox title='Edit' placement='top'>
                        <button
                          className='flex items-center justify-center w-[30px] h-[30px]
  rounded-md duration-300'
                          onClick={() => toggleDrawer(true)}
                        >
                          <FiEdit3 />
                        </button>
                      </TooltipBox>

                      <TooltipBox title='View' placement='top'>
                        <button
                          className='flex items-center justify-center w-[30px] h-[30px]
  rounded-md duration-300'
                        >
                          <MdOutlineRemoveRedEye />
                        </button>
                      </TooltipBox>

                      <TooltipBox title='Remove' placement='top'>
                        <button
                          className='flex items-center justify-center w-[30px] h-[30px]
  rounded-md duration-300'
                        >
                          <MdOutlineDeleteOutline />
                        </button>
                      </TooltipBox>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td>
                    <Checkbox {...label} size='small' checked={isAllChecked} />
                  </td>
                  <td>
                    <div className='flex items-center gap-5 w-[300px]'>
                      <div className='imgWrapper shadow overflow-hidden w-[25%] h-[25%] rounded-md'>
                        <img src='https://mironcoder-hotash.netlify.app/images/product/01.webp' />
                      </div>

                      <div className='info w-[75%]'>
                        <h6>Tops and skirt set for Female...</h6>
                        <p>
                          Womens exclusive summer Tops and skirt set for Female
                          Tops and skirt set
                        </p>
                      </div>
                    </div>
                  </td>
                  <td>womans</td>
                  <td>richman</td>
                  <td>
                    <div className='w-[70px]'>
                      <del className='old'>$21.00</del>
                      <span className='new text-danger'>$21.00</span>
                    </div>
                  </td>
                  <td>300</td>
                  <td>
                    <Rating
                      name='size-small'
                      defaultValue={4.5}
                      size='small'
                      precision={0.5}
                      readOnly
                    />
                  </td>
                  <td>350</td>

                  <td>
                    <div className='actions flex items-center gap-2'>
                      <TooltipBox title='Edit' placement='top'>
                        <button
                          className='flex items-center justify-center w-[30px] h-[30px]
rounded-md duration-300'
                          onClick={() => toggleDrawer(true)}
                        >
                          <FiEdit3 />
                        </button>
                      </TooltipBox>

                      <TooltipBox title='View' placement='top'>
                        <button
                          className='flex items-center justify-center w-[30px] h-[30px]
rounded-md duration-300'
                        >
                          <MdOutlineRemoveRedEye />
                        </button>
                      </TooltipBox>

                      <TooltipBox title='Remove' placement='top'>
                        <button
                          className='flex items-center justify-center w-[30px] h-[30px]
rounded-md duration-300'
                        >
                          <MdOutlineDeleteOutline />
                        </button>
                      </TooltipBox>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td>
                    <Checkbox {...label} size='small' checked={isAllChecked} />
                  </td>
                  <td>
                    <div className='flex items-center gap-5 w-[300px]'>
                      <div className='imgWrapper shadow overflow-hidden w-[25%] h-[25%] rounded-md'>
                        <img src='https://mironcoder-hotash.netlify.app/images/product/01.webp' />
                      </div>

                      <div className='info w-[75%]'>
                        <h6>Tops and skirt set for Female...</h6>
                        <p>
                          Womens exclusive summer Tops and skirt set for Female
                          Tops and skirt set
                        </p>
                      </div>
                    </div>
                  </td>
                  <td>womans</td>
                  <td>richman</td>
                  <td>
                    <div className='w-[70px]'>
                      <del className='old'>$21.00</del>
                      <span className='new text-danger'>$21.00</span>
                    </div>
                  </td>
                  <td>300</td>
                  <td>
                    <Rating
                      name='size-small'
                      defaultValue={4.5}
                      size='small'
                      precision={0.5}
                      readOnly
                    />
                  </td>
                  <td>350</td>

                  <td>
                    <div className='actions flex items-center gap-2'>
                      <TooltipBox title='Edit' placement='top'>
                        <button
                          className='flex items-center justify-center w-[30px] h-[30px]
rounded-md duration-300'
                          onClick={() => toggleDrawer(true)}
                        >
                          <FiEdit3 />
                        </button>
                      </TooltipBox>

                      <TooltipBox title='View' placement='top'>
                        <button
                          className='flex items-center justify-center w-[30px] h-[30px]
rounded-md duration-300'
                        >
                          <MdOutlineRemoveRedEye />
                        </button>
                      </TooltipBox>

                      <TooltipBox title='Remove' placement='top'>
                        <button
                          className='flex items-center justify-center w-[30px] h-[30px]
rounded-md duration-300'
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

          <div className='table-footer flex items-center justify-between py-2 px-3 mb-2'>
            <div className='flex items-center gap-3'>
              <h6 className='mb-0 text-sm'>Rows per page</h6>
              <Select
                labelId='demo-select-small-label'
                id='demo-select-small'
                value={perPage}
                label='Page'
                onChange={handleChange}
                size='small'
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
              color='primary'
              showFirstButton
              showLastButton
              className='ml-auto'
            />
          </div>
        </div>

        <div className='row'>
          <div className='col-md-6'>
            <div className='card shadow  p-4 border-0'>
              <h2 className='mb-4 font-bold'>Sales Report</h2>
              <AreaChart
                width={600}
                height={300}
                data={data}
                syncId='anyId'
                margin={{
                  top: 10,
                  right: 30,
                  left: 0,
                  bottom: 0,
                }}
              >
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='name' />
                <YAxis />
                <Tooltip />
                <Area
                  type='monotone'
                  dataKey='uv'
                  stroke='#8884d8'
                  fill='#8884d8'
                />
              </AreaChart>
            </div>
          </div>

          <div className='col-md-6'>
            <div className='card shadow  p-4 border-0'>
              <h2 className='mb-4 font-bold'>Sales Report</h2>
              <BarChart width={600} height={300} data={data}>
                <Bar dataKey='uv' fill='#8884d8' />
              </BarChart>
            </div>
          </div>
        </div>

        <div className='row'>
          <div className='col-md-12'>
            <div className='card shadow mt-4 p-4 border-0'>
              <h2 className='mb-4 font-bold'>Sales Report</h2>
              <ComposedChart
                width={1100}
                height={500}
                data={data}
                margin={{
                  top: 20,
                  right: 20,
                  bottom: 20,
                  left: 20,
                }}
              >
                <CartesianGrid stroke='#f5f5f5' />
                <XAxis dataKey='name' />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type='monotone'
                  dataKey='amt'
                  fill='#8884d8'
                  stroke='#8884d8'
                />
                <Bar dataKey='pv' barSize={20} fill='#413ea0' />
                <Line type='monotone' dataKey='uv' stroke='#ff7300' />
                <Scatter dataKey='cnt' fill='red' />
              </ComposedChart>
            </div>
          </div>
        </div>
      </div>

      <Drawer
        open={open}
        onClose={() => toggleDrawer(false)}
        anchor={"right"}
        className='sidepanel'
      >
        <form className='form w-[100%] mt-4 relative'>
          <Button className='close_ ' onClick={() => toggleDrawer(false)}>
            <IoMdClose />
          </Button>

          <div className='card shadow  border-0 flex-center p-3'>
            <h2 className='font-weight-bold text-black/70 mb-4'>
              Basic Information
            </h2>

            <div className='row'>
              <div className='col-md-12 col_'>
                <h4>Product Name</h4>
                <div className='form-group'>
                  <input type='text' className='input' />
                </div>
              </div>

              <div className='col-md-12 col_'>
                <h4>Product Description</h4>
                <div className='form-group'>
                  <textarea className='input' />
                </div>
              </div>

              <div className='col-md-4 col_'>
                <h4>Category</h4>
                <div className='form-group'>
                  <FormControl size='small' className='w-100'>
                    <Select
                      value={categoryVal}
                      onChange={(e) => setCategoryVal(e.target.value)}
                      displayEmpty
                      inputProps={{ "aria-label": "Without label" }}
                      labelId='demo-select-small-label'
                      className='w-100'
                    >
                      <MenuItem value=''>
                        <em>None</em>
                      </MenuItem>
                      <MenuItem value={"Men"}>Men</MenuItem>
                      <MenuItem value={"Woman"}>Woman</MenuItem>
                      <MenuItem value={"Kids"}>Kids</MenuItem>
                    </Select>
                  </FormControl>
                </div>
              </div>

              <div className='col-md-4 col_'>
                <h4>Sub Category</h4>
                <div className='form-group'>
                  <FormControl size='small' className='w-100'>
                    <Select
                      value={subCategoryVal}
                      onChange={(e) => setSubCategoryVal(e.target.value)}
                      displayEmpty
                      inputProps={{ "aria-label": "Without label" }}
                      labelId='demo-select-small-label'
                      className='w-100'
                    >
                      <MenuItem value=''>
                        <em>None</em>
                      </MenuItem>
                      <MenuItem value={"Shirts"}>Shirts</MenuItem>
                      <MenuItem value={"T-Shirts"}>T-Shirts</MenuItem>
                    </Select>
                  </FormControl>
                </div>
              </div>

              <div className='col-md-4 col_'>
                <h4>Price</h4>
                <div className='form-group'>
                  <input type='text' className='input' />
                </div>
              </div>
            </div>

            <div className='row'>
              <div className='col-md-4 col_'>
                <h4>Old Price</h4>
                <div className='form-group'>
                  <input type='text' className='input' />
                </div>
              </div>

              <div className='col-md-4 col_'>
                <h4>Is Featured</h4>
                <div className='form-group'>
                  <FormControl size='small' className='w-100'>
                    <Select
                      value={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.value)}
                      displayEmpty
                      inputProps={{ "aria-label": "Without label" }}
                      labelId='demo-select-small-label'
                      className='w-100'
                    >
                      <MenuItem value='None'>
                        <em>None</em>
                      </MenuItem>
                      <MenuItem value={"True"}>True</MenuItem>
                      <MenuItem value={"False"}>False</MenuItem>
                    </Select>
                  </FormControl>
                </div>
              </div>

              <div className='col-md-4 col_'>
                <h4>Product Stock</h4>
                <div className='form-group'>
                  <input type='text' className='input' />
                </div>
              </div>
            </div>

            <div className='row'>
              <div className='col-md-4 col_'>
                <h4>Brand</h4>
                <div className='form-group'>
                  <input type='text' className='input' />
                </div>
              </div>

              <div className='col-md-4 col_'>
                <h4>Discount</h4>
                <div className='form-group'>
                  <input type='text' className='input' />
                </div>
              </div>

              <div className='col-md-4 col_'>
                <h4>Rating</h4>
                <div className='form-group'>
                  <Rating
                    name='read-only'
                    value={1}
                    precision={0.5}
                    size='small'
                    readOnly
                  />
                </div>
              </div>
            </div>
          </div>

          <div className='card shadow my-4 border-0 flex-center p-3'>
            <h2 className='font-weight-bold text-black/70'>
              Upload new product images
            </h2>

            <div className='flex items-center imageUploadingWrapperSlider'>
              <div className='slider'>
                <Swiper
                  slidesPerView={7}
                  spaceBetween={0}
                  navigation={true}
                  slidesPerGroup={1}
                  modules={[Navigation]}
                  className='imageUploading  w-100'
                >
                  <SwiperSlide>
                    <div className='imgUploadBoxWrapper'>
                      <span className='remove flex items-center justify-center w-[20px] h-[20px]'>
                        <IoCloseSharp />
                      </span>
                      <div className='imgUploadBox cursor-pointer overflow-hidden rounded-md duration-300'>
                        <img
                          src='https://mironcoder-hotash.netlify.app/images/product/single/01.webp'
                          className='w-100'
                        />
                      </div>
                    </div>
                  </SwiperSlide>

                  <SwiperSlide>
                    <div className='imgUploadBoxWrapper'>
                      <span className='remove flex items-center justify-center w-[20px] h-[20px]'>
                        <IoCloseSharp />
                      </span>
                      <div className='imgUploadBox cursor-pointer overflow-hidden rounded-md duration-300'>
                        <img
                          src='https://mironcoder-hotash.netlify.app/images/product/single/01.webp'
                          className='w-100'
                        />
                      </div>
                    </div>
                  </SwiperSlide>

                  <SwiperSlide>
                    <div className='imgUploadBoxWrapper'>
                      <span className='remove flex items-center justify-center w-[20px] h-[20px]'>
                        <IoCloseSharp />
                      </span>
                      <div className='imgUploadBox cursor-pointer overflow-hidden rounded-md duration-300'>
                        <img
                          src='https://mironcoder-hotash.netlify.app/images/product/single/01.webp'
                          className='w-100'
                        />
                      </div>
                    </div>
                  </SwiperSlide>

                  <SwiperSlide>
                    <div className='imgUploadBoxWrapper'>
                      <span className='remove flex items-center justify-center w-[20px] h-[20px]'>
                        <IoCloseSharp />
                      </span>
                      <div className='imgUploadBox cursor-pointer overflow-hidden rounded-md duration-300'>
                        <img
                          src='https://mironcoder-hotash.netlify.app/images/product/single/01.webp'
                          className='w-100'
                        />
                      </div>
                    </div>
                  </SwiperSlide>

                  <SwiperSlide>
                    <div className='imgUploadBoxWrapper'>
                      <span className='remove flex items-center justify-center w-[20px] h-[20px]'>
                        <IoCloseSharp />
                      </span>
                      <div className='imgUploadBox cursor-pointer overflow-hidden rounded-md duration-300'>
                        <img
                          src='https://mironcoder-hotash.netlify.app/images/product/single/01.webp'
                          className='w-100'
                        />
                      </div>
                    </div>
                  </SwiperSlide>
                </Swiper>
              </div>

              <div className='imgUploadBoxWrapper'>
                <div className='imgUploadBox cursor-pointer overflow-hidden rounded-md duration-300 flex items-center justify-center flex-col'>
                  <input type='file' />
                  <FaImage className='icon' />
                  <h4 className='mb-0 text-black/30 text-center w-100'>
                    Image Upload
                  </h4>
                </div>
              </div>
            </div>

            <Button className='btn-blue btn-lg'>Create Product</Button>

            <br />
          </div>
        </form>
      </Drawer>
    </>
  )
}
