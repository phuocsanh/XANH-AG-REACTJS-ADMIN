import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { UseFormProps } from "react-hook-form";

// Sử dụng Zod để định nghĩa schema
const schema = z.object({
  name: z.string().nonempty("Tên sản phẩm không được để trống!").trim(),
  type: z.string().nonempty("Loại sản phẩm không được để trống!").trim(),
  sub_type: z.string().trim().optional(),
  price: z.number().min(0, "Giá không được âm"),
  discountedPrice: z.string().trim(),
  quantity: z.number().min(0, "Số lượng không được âm").optional(),
  pictures: z
    .array(z.string().url("Hình ảnh phải là URL hợp lệ"))
    .min(1, "Phải có ít nhất một hình ảnh"),
  videos: z
    .array(z.string().url("Video ảnh phải là URL hợp lệ").trim())
    .optional(),
});

export type FormField = z.infer<typeof schema>;

// Cấu hình form với zodResolver
const formConfig: UseFormProps<FormField> = {
  resolver: zodResolver(schema),
  defaultValues: {
    name: "",
    type: "",
    sub_type: "",
    price: 0,
    discountedPrice: "",
    pictures: [""],
    videos: [""],
  },
};

export default formConfig;
