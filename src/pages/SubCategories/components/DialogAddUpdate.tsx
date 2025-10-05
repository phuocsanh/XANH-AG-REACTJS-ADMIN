import React, { useEffect } from "react";
import { Modal, Form, Input, Select, Button, Space } from "antd";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  ProductSubtype,
  CreateProductSubtypeDto,
  UpdateProductSubtypeDto,
  productSubtypeService,
} from "@/services/product-subtype.service";
import { ProductType } from "@/models/product-type.model";
import { useProductTypes } from "@/queries/use-product-type";
import {
  productSubtypeSchema,
  ProductSubtypeFormData,
  defaultProductSubtypeValues,
} from "./formConfig";

interface DialogAddUpdateProps {
  open: boolean;
  onClose: () => void;
  editingSubtype?: ProductSubtype | null;
}

const DialogAddUpdate: React.FC<DialogAddUpdateProps> = ({
  open,
  onClose,
  editingSubtype,
}) => {
  const queryClient = useQueryClient();
  const { data: productTypesResponse } = useProductTypes();
  const productTypes = productTypesResponse?.data?.items || [];

  // Form configuration
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductSubtypeFormData>({
    resolver: zodResolver(productSubtypeSchema),
    defaultValues: defaultProductSubtypeValues,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateProductSubtypeDto) =>
      productSubtypeService.createProductSubtype(data),
    onSuccess: () => {
      // Toast sẽ được hiển thị trong mutation hook
      queryClient.invalidateQueries({ queryKey: ["productSubtypes"] });
      onClose();
      reset();
    },
    onError: (error: Error) => {
      toast.error(error?.message || "Có lỗi xảy ra khi tạo loại phụ sản phẩm!");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateProductSubtypeDto }) =>
      productSubtypeService.updateProductSubtype(id, data),
    onSuccess: () => {
      // Toast sẽ được hiển thị trong mutation hook
      queryClient.invalidateQueries({ queryKey: ["productSubtypes"] });
      onClose();
      reset();
    },
    onError: (error: Error) => {
      toast.error(
        error?.message || "Có lỗi xảy ra khi cập nhật loại phụ sản phẩm!"
      );
    },
  });

  // Reset form khi dialog mở/đóng hoặc khi có dữ liệu chỉnh sửa
  useEffect(() => {
    if (open) {
      if (editingSubtype) {
        reset({
          subtypeName: editingSubtype.subtypeName,
          subtypeCode: editingSubtype.subtypeCode,
          productTypeId: editingSubtype.productTypeId,
          description: editingSubtype.description || "",
          status: 'active', // Mặc định là active vì backend chỉ hỗ trợ active
        });
      } else {
        reset(defaultProductSubtypeValues);
      }
    }
  }, [open, editingSubtype, reset]);

  // Xử lý submit form
  const onSubmit = (data: ProductSubtypeFormData) => {
    if (editingSubtype) {
      updateMutation.mutate({
        id: editingSubtype.id,
        data: {
          subtypeName: data.subtypeName,
          subtypeCode: data.subtypeCode,
          productTypeId: data.productTypeId,
          description: data.description,
          status: data.status,
        },
      });
    } else {
      createMutation.mutate({
        subtypeName: data.subtypeName,
        subtypeCode: data.subtypeCode,
        productTypeId: data.productTypeId,
        description: data.description,
        status: data.status,
      });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      title={
        editingSubtype
          ? "Chỉnh sửa loại phụ sản phẩm"
          : "Thêm loại phụ sản phẩm"
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
        {/* Tên loại phụ sản phẩm */}
        <Form.Item
          label="Tên loại phụ sản phẩm"
          validateStatus={errors.subtypeName ? "error" : ""}
          help={errors.subtypeName?.message}
          required
        >
          <Controller
            name="subtypeName"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder="Nhập tên loại phụ sản phẩm"
                disabled={isLoading}
              />
            )}
          />
        </Form.Item>

        {/* Mã loại phụ sản phẩm */}
        <Form.Item
          label="Mã loại phụ sản phẩm"
          validateStatus={errors.subtypeCode ? "error" : ""}
          help={errors.subtypeCode?.message}
          required
        >
          <Controller
            name="subtypeCode"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder="Nhập mã loại phụ sản phẩm"
                disabled={isLoading}
              />
            )}
          />
        </Form.Item>

        {/* Loại sản phẩm */}
        <Form.Item
          label="Loại sản phẩm"
          validateStatus={errors.productTypeId ? "error" : ""}
          help={errors.productTypeId?.message}
          required
        >
          <Controller
            name="productTypeId"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                placeholder="Chọn loại sản phẩm"
                disabled={isLoading}
                options={productTypes.map((type: ProductType) => ({
                  label: type.typeName,
                  value: type.id,
                }))}
              />
            )}
          />
        </Form.Item>

        {/* Mô tả */}
        <Form.Item
          label="Mô tả"
          validateStatus={errors.description ? "error" : ""}
          help={errors.description?.message}
        >
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <Input.TextArea
                {...field}
                placeholder="Nhập mô tả (tùy chọn)"
                rows={3}
                disabled={isLoading}
              />
            )}
          />
        </Form.Item>

        {/* Trạng thái */}
        <Form.Item
          label="Trạng thái"
          validateStatus={errors.status ? "error" : ""}
          help={errors.status?.message}
        >
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                placeholder="Chọn trạng thái"
                disabled={isLoading}
                options={[
                  { label: "Hoạt động", value: "active" },
                ]}
              />
            )}
          />
        </Form.Item>

        {/* Buttons */}
        <Form.Item>
          <Space>
            <Button onClick={onClose} disabled={isLoading}>
              Hủy
            </Button>
            <Button type="primary" htmlType="submit" loading={isLoading}>
              {editingSubtype ? "Cập nhật" : "Tạo mới"}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default DialogAddUpdate;