import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { UseFormProps } from "react-hook-form";
import { Status } from "../../../models/common";

// Schema cho ProductType theo cấu trúc backend
const schema = z.object({
  typeName: z.string().nonempty("Tên loại sản phẩm không được để trống!").trim(),
  typeCode: z.string().nonempty("Mã loại sản phẩm không được để trống!").trim(),
  description: z.string().optional(),
  status: z.nativeEnum(Status).default(Status.ACTIVE),
});

export type FormField = z.infer<typeof schema>;

// Cấu hình form với zodResolver
const formConfig: UseFormProps<FormField> = {
  resolver: zodResolver(schema),
  defaultValues: {
    typeName: "",
    typeCode: "",
    description: "",
    status: Status.ACTIVE,
  },
};

export default formConfig;
