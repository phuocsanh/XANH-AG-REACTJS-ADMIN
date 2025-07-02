import i18next from '@/i18n';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  IImageCrop,
  ImageCropSettingForm,
  ImageFile,
  getCroppedImg,
} from '@/components/upload-images';
import { cancelLabel, okLabel } from '@/constant/const';
import { formatBytes } from '@/lib/file';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useState } from 'react';
import Cropper, { Area, Point } from 'react-easy-crop';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { Form } from '../ui/form';

/**
 *
 */
interface ImageCropProps extends IImageCrop {
  open: boolean;
  file: ImageFile;
  toggle: () => void;
  onUseOriginal: () => void;
  onCropDone: (croppedFile: File, options?: Omit<ImageCropSetting, 'zoom' | 'rotation'>) => void;
  onCancel: () => void;
}

const imageCropSettingSchema = z
  .object({
    zoom: z.number(),
    rotation: z.number(),
    Width: z.number().nullable().optional(),
    Height: z.number().nullable().optional(),
  })
  .refine(data => (!data.Height && !data.Width) || (data.Height && data.Width), {
    message: i18next.t('validation.required.both', { ns: 'uploadImage' }),
    path: ['Width'],
  });

export type ImageCropSetting = z.infer<typeof imageCropSettingSchema>;

const defaultImageCropValues: ImageCropSetting = {
  zoom: 1,
  rotation: 0,
  Width: null,
  Height: null,
};

export const ImageCrop = ({
  file,
  onCropDone,
  onCancel,
  onUseOriginal,
  open,
  toggle,
  sizes,
}: ImageCropProps) => {
  const { name, size, type, preview } = file;

  const { t } = useTranslation('uploadImage');

  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  const settingOptionsForm = useForm<ImageCropSetting>({
    defaultValues: defaultImageCropValues,
    resolver: zodResolver(imageCropSettingSchema),
  });
  const { control, getValues, setValue, reset, trigger } = settingOptionsForm;

  const [zoom, rotation] = useWatch({
    control: control,
    name: ['zoom', 'rotation'],
  });

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const cropImage = useCallback(async () => {
    try {
      const croppedFile = await getCroppedImg(preview, name, croppedAreaPixels, rotation);
      if (croppedFile) {
        const isFormValuesValid = await trigger();

        if (!isFormValuesValid) {
          return;
        }

        const { Width, Height } = getValues();
        onCropDone(croppedFile, { Width, Height });

        setCrop({ x: 0, y: 0 });
        reset(defaultImageCropValues);
      }
    } catch (e) {
      console.error(e);
    }
  }, [croppedAreaPixels, getValues, name, onCropDone, preview, reset, rotation, trigger]);

  const [cropSize, setCropSize] = useState({ height: 0, width: 0 });

  return (
    <Dialog open={open} onOpenChange={toggle}>
      <DialogContent className="flex h-[80vh] max-w-[50vw] flex-col">
        <DialogHeader>
          <DialogTitle className="whitespace-pre-wrap pr-1">{name}</DialogTitle>
          <DialogDescription>{`${formatBytes(size)} - ${type}`}</DialogDescription>
        </DialogHeader>
        <div className="relative h-full ">
          <Cropper
            image={preview}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={5 / 5}
            onCropChange={setCrop}
            onMediaLoaded={setCropSize}
            onCropComplete={onCropComplete}
            onZoomChange={zoom => setValue('zoom', zoom)}
            onRotationChange={rotation => setValue('rotation', rotation)}
            cropSize={cropSize}
          />
        </div>
        <Form {...settingOptionsForm}>
          <ImageCropSettingForm sizes={sizes} />
        </Form>
        <DialogFooter>
          <Button
            variant={'secondary'}
            onClick={() => {
              onCancel();
              toggle();
            }}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={'default'}
            className="bg-green-600 hover:bg-green-500 active:bg-green-700"
            onClick={onUseOriginal}
          >
            {t('useOriginalImage')}
          </Button>
          <Button variant={'default'} onClick={() => void cropImage()}>
            {okLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
