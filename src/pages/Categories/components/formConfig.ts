import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { UseFormProps } from "react-hook-form";

// Sử dụng Zod để định nghĩa schema
const schema = z.object({
  name: z.string().nonempty("Tên sản phẩm không được để trống!").trim(),
  title: z.string().nonempty("Loại sản phẩm không được để trống!").trim(),
  picture: z
    .string()
    .nonempty("Vui lòng thêm hình ảnh")
    .url("Hình ảnh phải là URL hợp lệ"),
});

export type FormField = z.infer<typeof schema>;

// Cấu hình form với zodResolver
const formConfig: UseFormProps<FormField> = {
  resolver: zodResolver(schema),
  defaultValues: {
    name: "",
    title: "",
    picture: "",
  },
};

export default formConfig;
