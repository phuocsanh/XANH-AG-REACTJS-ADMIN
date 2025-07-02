import { Button } from '@/components/ui/button';
import {
  IImageCrop,
  ImageCrop,
  ImageCropSetting,
  ImageViewer,
  UploadedItem,
} from '@/components/upload-images';
import { MUTATE } from '@/constant/const';
import { useBoolean, useMutate } from '@/hooks';
import { cn } from '@/lib/utils';
import { upload } from '@/services/common';
import { UploadCloud } from 'lucide-react';
import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Trans, useTranslation } from 'react-i18next';

export type ImageFile = File & { url: string; preview: string };

/**
 *
 */
export type UploadImageRef = {
  getJustUploadedImagePaths: () => string[];
  getAllImageFiles: () => ImageFile[];
  setImageFiles: React.Dispatch<React.SetStateAction<ImageFile[]>>;
};
export interface UploadImagesProps extends React.HTMLAttributes<HTMLElement>, IImageCrop {
  folder: string;
  mode?: 'single' | 'multiple';
  onUploadSuccess?: (files: ImageFile[]) => void;
  onRemove?: (file: ImageFile) => void;
}

export const UploadImages = forwardRef<UploadImageRef, UploadImagesProps>(
  ({ className, folder, mode = 'multiple', sizes, onUploadSuccess, onRemove, ...props }, ref) => {
    const { t } = useTranslation('uploadImage');

    const [selectedIndex, setSelectedIndex] = useState<number>(0);

    const { state: openCropEditor, toggle: toggleCropEditor } = useBoolean();
    const { state: openImageViewer, toggle: toggleImageViewer } = useBoolean();

    const [files, setImageFiles] = useState<ImageFile[]>([]);

    useImperativeHandle(
      ref,
      () => ({
        setImageFiles,
        getAllImageFiles: () => files,
        getJustUploadedImagePaths: () => files.map(i => i.url),
      }),
      [files]
    );

    const { mutateAsync } = useMutate({
      mutationKey: MUTATE.UPLOAD_FILE,
      mutationFn: upload,
    });

    const uploadImage = async (
      imageFile: File,
      options?: Omit<ImageCropSetting, 'zoom' | 'rotation'>
    ) => {
      const payload = {
        File: imageFile,
        Type: 'image',
        Folder: folder,
        ...options,
      };

      const data = await mutateAsync(payload);

      if (!data) {
        throw new Error('Upload failure');
      }

      return Object.assign(imageFile, {
        url: data.path,
        preview: data.path,
      });
    };

    const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } = useDropzone({
      accept: { 'image/*': [] },
      noDragEventsBubbling: true,
      onDrop: (acceptedFiles: File[]) => {
        setImageFiles(oldFiles => {
          if (mode === 'single') {
            return [createImageFile(acceptedFiles[0])];
          }
          return [...oldFiles, ...acceptedFiles.map(createImageFile)];
        });

        if (acceptedFiles.length === 1) {
          const selectedIndex = mode == 'single' ? 0 : files.length;
          onImageClickToCrop(selectedIndex);
        } else {
          Promise.all(acceptedFiles.map(file => uploadImage(file)))
            .then(uploadedImages => {
              const newFiles = [...files, ...uploadedImages];

              if (onUploadSuccess) {
                onUploadSuccess(newFiles);
              }

              setImageFiles(newFiles);
            })
            .catch(error => console.log('error:', error));
        }
      },
    });

    const selectedFile = files[selectedIndex] || {};

    const removeFileByIndex = (index: number) => {
      const removeFile = files[index];

      if (onRemove && removeFile) {
        onRemove(removeFile);
      }

      setImageFiles(old => {
        return old.filter((_, idx) => idx !== index);
      });
    };

    const onImageClickToCrop = (index: number) => {
      setSelectedIndex(index);
      toggleCropEditor();
    };

    const onImageUploadSuccess = (imageFile: ImageFile, fileIndex: number) => {
      if (onUploadSuccess) {
        const newFiles = files.map((file, index) => {
          if (index !== fileIndex) {
            return file;
          }
          // new cropped file
          return imageFile;
        });

        onUploadSuccess(newFiles);
        setImageFiles(newFiles);
      }
    };

    const onImageClickToView = (index: number) => {
      setSelectedIndex(index);
      toggleImageViewer();
    };

    const onUseOriginal = () => {
      uploadImage(selectedFile)
        .then(imageFile => onImageUploadSuccess(imageFile, selectedIndex))
        .catch(error => console.error(error));

      toggleCropEditor();
    };

    const onDropDone = (
      croppedFile: File,
      options?: Omit<ImageCropSetting, 'zoom' | 'rotation'>
    ) => {
      uploadImage(croppedFile, options)
        .then(imageFile => onImageUploadSuccess(imageFile, selectedIndex))
        .catch(error => console.error(error));

      toggleCropEditor();
    };

    const onCancelDrop = () => {
      removeFileByIndex(selectedIndex);
    };

    useEffect(() => {
      // Make sure to revoke the data uris to avoid memory leaks, will run on unmount
      return () => files.forEach(file => URL.revokeObjectURL(file.preview));
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
      <>
        <section
          className={cn('flex h-auto flex-col gap-y-3 rounded-sm p-2 shadow-md', className)}
          {...props}
        >
          <div
            {...getRootProps({
              className: cn(
                'p-2 flex h-[100px] items-center justify-center rounded-md border-2 border-dashed transition-all hover:bg-primary-foreground',
                isDragActive ? 'border-primary-300 bg-primary-50/50' : ''
              ),
            })}
          >
            <input {...getInputProps()} name="img" />
            <div className="flex flex-col items-center">
              <Button
                variant={'ghost'}
                className="rounded-full p-2 text-primary-300 hover:bg-primary-50/80 hover:text-primary-500"
              >
                <UploadCloud />
              </Button>
              {isDragAccept && (
                <p className="text-sm text-muted-foreground">{t('acceptAllFiles')}</p>
              )}
              {isDragReject && (
                <p className="text-sm text-muted-foreground">{t('acceptSpecificFiles')}</p>
              )}
              {!isDragActive && (
                <p className="text-sm text-muted-foreground">
                  <Trans
                    ns="uploadImage"
                    i18nKey={'dragFilesHereOrClickToSelect'}
                    components={[
                      <span className="text-primary-300 hover:cursor-pointer hover:underline"></span>,
                    ]}
                  />
                </p>
              )}
            </div>
          </div>
          {files.length > 0 && (
            <aside className="flex flex-col gap-y-1">
              {files.map((file, index) => (
                <UploadedItem
                  key={file.name}
                  file={file}
                  // onClickToEdit={() => onImageClickToCrop(index)}
                  onClickToView={() => onImageClickToView(index)}
                  onRemoveFile={() => removeFileByIndex(index)}
                />
              ))}
            </aside>
          )}
        </section>
        <ImageCrop
          sizes={sizes}
          file={selectedFile}
          open={openCropEditor}
          onCropDone={onDropDone}
          onCancel={onCancelDrop}
          toggle={toggleCropEditor}
          onUseOriginal={onUseOriginal}
        />
        <ImageViewer file={selectedFile} open={openImageViewer} toggle={toggleImageViewer} />
      </>
    );
  }
);

const createImageFile = (file: File): ImageFile => {
  return Object.assign(file, {
    url: URL.createObjectURL(file),
    preview: URL.createObjectURL(file),
  });
};
