# HƯỚNG DẪN KIẾN TRÚC DỰ ÁN

## 1. Tổng quan kiến trúc

### 1.1. Kiến trúc hiện tại (ĐÃ ÁP DỤNG)
Dự án web đã được cập nhật để áp dụng kiến trúc tương tự như dự án mobile, loại bỏ lớp service và sử dụng trực tiếp React Query hooks:

```
src/
├── components/          # Các component dùng chung
├── models/             # Interface và type definitions
├── pages/              # Các trang chính của ứng dụng
├── provider/           # React Query provider
├── queries/            # React Query hooks (thay thế cho services)
├── routes/             # Routing configuration
├── stores/             # Zustand stores
├── utils/              # Các hàm tiện ích
└── App.tsx            # Root component
```

### 1.2. So sánh với kiến trúc cũ
**Kiến trúc cũ (service-based):**
```
src/
├── services/           # Logic business và API calls
├── components/
├── models/
└── pages/
```

**Kiến trúc mới (hook-based):**
```
src/
├── queries/            # React Query hooks thay thế services
├── components/
├── models/
└── pages/
```

## 2. Chi tiết các thư mục

### 2.1. Thư mục `queries/`
Thư mục này chứa các React Query hooks thay thế cho services cũ.

**Ví dụ cấu trúc file:**
```
queries/
├── user.ts            # Các hooks liên quan đến user
├── product.ts         # Các hooks liên quan đến product
├── auth.ts            # Các hooks liên quan đến authentication
└── ...
```

**Ví dụ nội dung file `user.ts`:**
```typescript
import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "react-toastify"
import api from "@/utils/api"
import { queryClient } from "@/provider/app-provider-tanstack"
import { User } from "@/models/user.model"

// Query keys cho user
export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (filters: string) => [...userKeys.lists(), { filters }] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (id: number) => [...userKeys.details(), id] as const,
}

/**
 * Hook lấy danh sách người dùng
 */
export const useUsersQuery = (filters?: string) => {
  return useQuery({
    queryKey: userKeys.list(filters || ""),
    queryFn: async () => {
      const response = await api.get<User[]>("/users")
      return response
    },
  })
}

/**
 * Hook lấy thông tin người dùng theo ID
 */
export const useUserQuery = (id: number) => {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<User>(`/users/${id}`)
      return response
    },
    enabled: !!id,
  })
}

/**
 * Hook tạo người dùng mới
 */
export const useCreateUserMutation = () => {
  return useMutation({
    mutationFn: async (userData: Partial<User>) => {
      const response = await api.post<User>("/users", userData)
      return response
    },
    onSuccess: () => {
      // Invalidate và refetch danh sách users
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      toast.success("Tạo người dùng thành công!")
    },
    onError: (error: Error) => {
      console.error("Lỗi tạo người dùng:", error)
      toast.error("Có lỗi xảy ra khi tạo người dùng")
    },
  })
}

/**
 * Hook cập nhật thông tin người dùng
 */
export const useUpdateUserMutation = () => {
  return useMutation({
    mutationFn: async ({ id, userData }: { id: number; userData: Partial<User> }) => {
      const response = await api.patch<User>(`/users/${id}`, userData)
      return response
    },
    onSuccess: (data, variables) => {
      // Invalidate các queries liên quan
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.id) })
      toast.success("Cập nhật thông tin người dùng thành công!")
    },
    onError: (error: Error) => {
      console.error("Lỗi cập nhật người dùng:", error)
      toast.error("Có lỗi xảy ra khi cập nhật thông tin người dùng")
    },
  })
}

/**
 * Hook xóa người dùng
 */
export const useDeleteUserMutation = () => {
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete<void>(`/users/${id}`)
      return response
    },
    onSuccess: () => {
      // Invalidate danh sách users
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      toast.success("Xóa người dùng thành công!")
    },
    onError: (error: Error) => {
      console.error("Lỗi xóa người dùng:", error)
      toast.error("Có lỗi xảy ra khi xóa người dùng")
    },
  })
}
```

### 2.2. Thư mục `models/`
Chứa các interface và type definitions cho dữ liệu trong ứng dụng.

**Ví dụ `user.model.ts`:**
```typescript
// Định nghĩa các kiểu dữ liệu cho người dùng
import { AnyObject } from "./common"

export interface User {
  id: number
  userName: string
  userEmail: string
  userPassword?: string
  userState?: number
  userSalt?: string
  createdAt: string
  updatedAt: string
}

export interface CreateUserDto extends AnyObject {
  userName: string
  userEmail: string
  userPassword: string
  userState?: number
}

export interface UpdateUserDto extends Partial<CreateUserDto>, AnyObject {}
```

### 2.3. Thư mục `components/`
Chứa các component dùng chung trong ứng dụng.

### 2.4. Thư mục `pages/`
Chứa các trang chính của ứng dụng.

## 3. Quy trình làm việc

### 3.1. Tạo mới một feature

1. **Tạo model**: Định nghĩa interface trong thư mục `models/`
2. **Tạo query hooks**: Tạo file mới trong thư mục `queries/` với các hooks cần thiết
3. **Sử dụng trong component**: Import và sử dụng query hooks trong component

**Ví dụ sử dụng trong component:**
```typescript
import { useUsersQuery, useCreateUserMutation } from "@/queries/user"

const UserList = () => {
  // Sử dụng query hook để lấy dữ liệu
  const { data: users, isLoading } = useUsersQuery()
  
  // Sử dụng mutation hook để tạo mới
  const createUserMutation = useCreateUserMutation()
  
  const handleCreateUser = async (userData: Partial<User>) => {
    try {
      await createUserMutation.mutateAsync(userData)
    } catch (error) {
      console.error("Lỗi tạo người dùng:", error)
    }
  }
  
  if (isLoading) return <div>Đang tải...</div>
  
  return (
    <div>
      {users?.map(user => (
        <div key={user.id}>{user.userName}</div>
      ))}
    </div>
  )
}
```

### 3.2. Migration từ service-based sang hook-based

Đã hoàn thành việc migration toàn bộ services sang query hooks:

1. ✅ User service
2. ✅ Product service
3. ✅ Auth service
4. ✅ Inventory service
5. ✅ Unit service
6. ✅ Product type service
7. ✅ Product subtype service
8. ✅ Sales service
9. ✅ File tracking service
10. ✅ Upload service

## 4. Best Practices

### 4.1. Query Keys
Luôn sử dụng cấu trúc query keys nhất quán:

```typescript
export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (filters: string) => [...userKeys.lists(), { filters }] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (id: number) => [...userKeys.details(), id] as const,
}
```

### 4.2. Error Handling
Luôn xử lý lỗi trong mutation:

```typescript
export const useCreateUserMutation = () => {
  return useMutation({
    mutationFn: async (userData: Partial<User>) => {
      const response = await api.post<User>("/users", userData)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      toast.success("Tạo người dùng thành công!")
    },
    onError: (error: Error) => {
      console.error("Lỗi tạo người dùng:", error)
      toast.error("Có lỗi xảy ra khi tạo người dùng")
    },
  })
}
```

### 4.3. Caching và Invalidating
Luôn invalidate cache đúng cách sau khi mutation thành công:

```typescript
onSuccess: (data, variables) => {
  // Invalidate các queries liên quan
  queryClient.invalidateQueries({ queryKey: userKeys.lists() })
  queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.id) })
  toast.success("Cập nhật thông tin người dùng thành công!")
},
```

## 5. Hướng dẫn cập nhật component

### 5.1. Thay import service bằng import query

**Trước (sử dụng service):**
```typescript
import { userService } from "@/services/user.service"

const UserList = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true)
      try {
        const data = await userService.getUsers()
        setUsers(data)
      } catch (error) {
        console.error("Lỗi:", error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchUsers()
  }, [])
  
  // ...
}
```

**Sau (sử dụng query):**
```typescript
import { useUsersQuery } from "@/queries/user"

const UserList = () => {
  // Sử dụng query hook để lấy dữ liệu
  const { data: users, isLoading } = useUsersQuery()
  
  // Không cần useEffect, state loading, error handling
  // React Query tự động xử lý tất cả
  
  if (isLoading) return <div>Đang tải...</div>
  
  return (
    <div>
      {users?.map(user => (
        <div key={user.id}>{user.userName}</div>
      ))}
    </div>
  )
}
```

### 5.2. Sử dụng mutation cho các thao tác tạo/sửa/xóa

**Trước (sử dụng service):**
```typescript
import { userService } from "@/services/user.service"

const UserForm = () => {
  const [loading, setLoading] = useState(false)
  
  const handleSubmit = async (userData: Partial<User>) => {
    setLoading(true)
    try {
      await userService.createUser(userData)
      // Xử lý sau khi tạo thành công
      toast.success("Tạo người dùng thành công!")
    } catch (error) {
      console.error("Lỗi:", error)
      toast.error("Có lỗi xảy ra!")
    } finally {
      setLoading(false)
    }
  }
  
  // ...
}
```

**Sau (sử dụng mutation):**
```typescript
import { useCreateUserMutation } from "@/queries/user"

const UserForm = () => {
  const createUserMutation = useCreateUserMutation()
  
  const handleSubmit = async (userData: Partial<User>) => {
    try {
      await createUserMutation.mutateAsync(userData)
      // Xử lý sau khi tạo thành công (đã được xử lý trong mutation)
    } catch (error) {
      console.error("Lỗi:", error)
      // Xử lý lỗi (đã được xử lý trong mutation)
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <button 
        type="submit" 
        disabled={createUserMutation.isPending}
      >
        {createUserMutation.isPending ? "Đang tạo..." : "Tạo người dùng"}
      </button>
    </form>
  )
}
```

## 6. Lợi ích của kiến trúc mới

1. **Tái sử dụng code**: Models và query hooks có thể được sử dụng ở nhiều nơi
2. **Tự động caching**: React Query tự động quản lý cache và invalidation
3. **Xử lý loading/error**: Tự động xử lý trạng thái loading và error
4. **Background updates**: Tự động cập nhật dữ liệu nền
5. **Pagination và infinite scroll**: Hỗ trợ dễ dàng
6. **Devtools**: React Query Devtools giúp debug dễ dàng hơn
7. **Kiến trúc rõ ràng**: Tách biệt logic business và UI

## 7. Các file services đã được di chuyển

Tất cả các file services đã được di chuyển sang query hooks:

- ✅ src/queries/user.ts (thay thế src/services/user.service.ts)
- ✅ src/queries/product.ts (thay thế src/services/product.service.ts)
- ✅ src/queries/auth.ts (thay thế src/services/auth.service.ts)
- ✅ src/queries/inventory.ts (thay thế src/services/inventory.service.ts)
- ✅ src/queries/unit.ts (thay thế src/services/unit.service.ts)
- ✅ src/queries/product-type.ts (thay thế src/services/product-type.service.ts)
- ✅ src/queries/product-subtype.ts (thay thế src/services/product-subtype.service.ts)
- ✅ src/queries/sales.ts (thay thế src/services/sales.service.ts)
- ✅ src/queries/file-tracking.ts (thay thế src/services/file-tracking.service.ts)
- ✅ src/queries/upload.ts (thay thế src/services/upload.service.ts)

Thư mục src/services/ hiện chỉ còn file index.ts rỗng để đảm bảo backward compatibility.