import { Button, TextField } from "@mui/material";
import { styled } from "@mui/material/styles";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import React from "react";
import { RiCloseLargeLine } from "react-icons/ri";
import { IoCloseCircleSharp } from "react-icons/io5";
import DialogCustom from "@/components/Dialog";
import { useForm } from "react-hook-form";
import formConfig, { FormField } from "./formConfig";
const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

function DialogAddUpdate({
  id,
  openDialog,
  setOpenDialog,
}: {
  id: number | null;
  openDialog: boolean;
  setOpenDialog: (is: boolean) => void;
}) {
  const {
    handleSubmit,
    setValue,
    watch,

    formState: { errors },
  } = useForm<FormField>(formConfig);
  const imagePreview = watch("picture");
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setValue("picture", imageUrl);
    }
  };
  const onSubmit = () => {};
  return (
    <DialogCustom open={openDialog} setOpen={setOpenDialog}>
      <div className=" relative w-[600px] min-h-min[400px] max-h-max-[800px] px-10 py-4 flex flex-col">
        <IoCloseCircleSharp
          className="absolute right-4 "
          size={30}
          onClick={() => setOpenDialog(false)}
        />
        <div className="relative flex items-center justify-center h-[50px]">
          <span className="font-bold text-lg ">
            {id ? "Cập nhật" : "Thêm"} loại sản phẩm
          </span>
        </div>

        <div className="mt-3">
          <h4 className="font-semibold mb-2">Tên*</h4>
          <TextField
            variant="outlined"
            fullWidth
            sx={{
              "& .MuiInputBase-input": {
                fontSize: 15,
                height: 25,
                paddingX: 2,
                paddingY: 1,
              },
            }}
            error={!!errors.name?.message || false}
            onChange={(e) => setValue("name", e.target.value)}
          />
          {errors.name && (
            <p className="mt-1 text-red-600">{errors.name.message}</p>
          )}
        </div>
        <div className="mt-3">
          <h4 className="font-semibold mb-2">Tiêu đề*</h4>
          <TextField
            variant="outlined"
            fullWidth
            sx={{
              "& .MuiInputBase-input": {
                fontSize: 15,
                height: 25,
                paddingX: 2,
                paddingY: 1,
              },
            }}
            error={!!errors.title?.message || false}
            onChange={(e) => setValue("title", e.target.value.toUpperCase())}
          />
          {errors.title && (
            <p className="mt-1 text-red-600">{errors.title.message}</p>
          )}
        </div>

        {imagePreview && (
          <div className="mt-3">
            <h4 className="font-semibold mb-2">Hình ảnh đã chọn:</h4>
            <div className="relative w-[200px] h-[200px]">
              <div
                onClick={() => setValue("picture", "")}
                className="p-1 absolute right-1 top-1 self-start rounded-full  bg-gray-500 bg-opacity-75"
              >
                <RiCloseLargeLine color="white" size={13} />
              </div>

              <img
                src={imagePreview}
                alt="Preview"
                className=" w-[200px] h-[200px] border rounded"
              />
            </div>
          </div>
        )}
        <Button
          className="mt-4 self-start"
          role={undefined}
          variant="contained"
          component="label"
          tabIndex={-1}
          startIcon={<CloudUploadIcon />}
        >
          Chọn hình ảnh *
          <VisuallyHiddenInput
            type="file"
            accept="image/*"
            onChange={handleFileChange}
          />
        </Button>
        {errors.picture && (
          <p className="mt-1 text-red-600">{errors.picture.message}</p>
        )}

        <Button
          onClick={handleSubmit(onSubmit)}
          className="mt-4"
          component="label"
          role={undefined}
          variant="contained"
        >
          <span>{id ? "Cập nhật" : "Thêm"}</span>
        </Button>
      </div>
    </DialogCustom>
  );
}

export default DialogAddUpdate;
