import { api } from "./api"

export interface UploadResponse {
  url: string
  // Thêm các trường khác nếu server trả về
}

export const uploadFile = async (
  file: File,
  folder: string
): Promise<UploadResponse> => {
  const formData = new FormData()
  formData.append("file", file)

  const response = await api.post<UploadResponse>(
    `/uploads?folder=${folder}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  )

  return response.data
}
