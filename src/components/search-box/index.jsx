import { IoSearch } from "react-icons/io5"

export const SearchBox = () => {
  return (
    <div className='searchBox w-[300px] h-[40px] relative'>
      <IoSearch className='absolute top-3 left-3 z-[10]' />
      <input
        type='text'
        className='w-[100%] h-[100%] px-10 cursor-pointer'
        placeholder='Search here...'
      />
    </div>
  )
}
