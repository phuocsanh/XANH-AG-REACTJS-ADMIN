import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { UseFormProps } from "react-hook-form";

// Sử dụng Zod để định nghĩa schema
const schema = z.object({
  email: z.string().nonempty("Email không được để trống!").email("Email không hợp lệ").trim(),
  password: z.string().nonempty("Mật khẩu không được để trống!").min(6, "Mật khẩu phải có ít nhất 6 ký tự").trim(),
});

export type FormField = z.infer<typeof schema> & {
  userAccount: string;
  userPassword: string;
};

// Cấu hình form với zodResolver
const formConfig: UseFormProps<FormField> = {
  resolver: zodResolver(schema),
  defaultValues: {
    email: "",
    password: "",
    userAccount: "",
    userPassword: "",
  },
};

export default formConfig;
