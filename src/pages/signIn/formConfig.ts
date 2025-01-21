import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { UseFormProps } from "react-hook-form";

// Sử dụng Zod để định nghĩa schema
const schema = z.object({
  email: z.string().nonempty("Email không được để trống!").trim(),
  password: z.string().nonempty("Mật khẩu không được để trống!").trim(),
});

export type FormField = z.infer<typeof schema>;

// Cấu hình form với zodResolver
const formConfig: UseFormProps<FormField> = {
  resolver: zodResolver(schema),
  defaultValues: {
    email: "",
    password: "",
  },
};

export default formConfig;
