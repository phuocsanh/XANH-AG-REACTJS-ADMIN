import React from "react"
import { useAppStore } from "../../stores"
import { FiUser } from "react-icons/fi"

export const UserImage: React.FC = () => {
  const userInfo = useAppStore((state) => state.userInfo)
  
  // URL ảnh mặc định nếu user không có avatar
  const defaultAvatar = "https://ui-avatars.com/api/?name=User&background=059669&color=fff&size=128"
  
  // Lấy nickname hoặc account để hiển thị
  const displayName = userInfo?.nickname || userInfo?.account || userInfo?.user_account || "User"
  
  // Tạo avatar URL với tên người dùng
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=059669&color=fff&size=128`

  return (
    <span className='userImage flex w-[40px] h-[40px] overflow-hidden cursor-pointer rounded-full border-2 border-white'>
      <img
        src={avatarUrl}
        alt={displayName}
        className='w-[100%] h-[100%] object-cover'
        onError={(e) => {
          // Nếu ảnh lỗi, hiển thị icon user
          e.currentTarget.style.display = 'none'
          const parent = e.currentTarget.parentElement
          if (parent) {
            parent.innerHTML = `
              <div class='w-full h-full flex items-center justify-center bg-green-600'>
                <svg class='text-white text-2xl' fill='none' stroke='currentColor' viewBox='0 0 24 24' width='24' height='24'>
                  <path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'></path>
                </svg>
              </div>
            `
          }
        }}
      />
    </span>
  )
}
