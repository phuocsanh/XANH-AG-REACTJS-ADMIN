import { z } from "zod"

export const newsSchema = z.object({
  title: z.string().min(1, "Vui lòng nhập tiêu đề"),
  category: z.string().optional(),
  author: z.string().optional(),
  content: z.string().min(1, "Vui lòng nhập nội dung"),
  thumbnail_url: z.any().optional(),
  images: z.any().optional(),
  status: z.string().default("active"),
  tags: z.array(z.string()).optional(),
  related_product_ids: z.array(z.number()).optional(),
  is_pinned: z.boolean().default(false),
})

export type NewsFormValues = z.infer<typeof newsSchema>

export const defaultNewsValues: NewsFormValues = {
  title: "",
  category: "",
  author: "",
  content: "",
  thumbnail_url: [],
  images: [],
  status: "active",
  tags: [],
  related_product_ids: [],
  is_pinned: false,
}
