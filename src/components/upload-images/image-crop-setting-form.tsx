import { ImageCropSetting } from '@/components/upload-images';
import { enterLabel } from '@/constant';
import { useBoolean } from '@/hooks';
import { useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Checkbox } from '../ui/checkbox';
import { FormCombobox, FormDescription, FormLabel } from '../ui/form';
import { InputNumber } from '../ui/input';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';

type size = {
  id: number;
  label: string;
  width: number;
  height: number;
};

const defaultSizes: size[] = [
  { id: 1, label: '1360 x 540', width: 1360, height: 540 },
  { id: 2, label: '300 x 188 ', width: 300, height: 188 },
  { id: 3, label: '800 x 500', width: 800, height: 500 },
  { id: 4, label: '600 x 600', width: 600, height: 600 },
  { id: 5, label: '300 x 400', width: 300, height: 400 },
  { id: 6, label: '600 x 800', width: 600, height: 800 },
  { id: 7, label: '1200 x 630', width: 1200, height: 630 },
];

export interface IImageCrop {
  sizes?: size[];
}

export const ImageCropSettingForm = ({ sizes = defaultSizes }: IImageCrop) => {
  const { t } = useTranslation('uploadImage');

  const {
    control,
    setValue,
    register,
    formState: { errors },
  } = useFormContext<ImageCropSetting>();

  const [selectedSize, setSelectedSize] = useState<number>();
  const { state: useSizeOption, toggle: onUseSizeOptionChecked } = useBoolean();

  return (
    <div id="image-uploader-setting-form" className="space-y-4">
      <div className="flex items-center justify-start gap-1">
        <FormLabel className="w-20" htmlFor="crop-img-select-size">
          {t('fields.size')}
        </FormLabel>
        <FormCombobox
          id="crop-img-select-size"
          className="max-w-xs"
          showFields={['label']}
          options={sizes}
          value={selectedSize}
          onSelectItem={size => {
            setValue('Width', size.width);
            setValue('Height', size.height);
            setSelectedSize(size.id);
          }}
          disabled={useSizeOption}
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-start gap-3">
          <Checkbox
            onCheckedChange={checked => {
              if (checked) {
                setSelectedSize(undefined);
              }
              onUseSizeOptionChecked();
            }}
          />
          <Label>{t('fields.useSizeOption')}</Label>
        </div>
        <FormDescription>{t('fields.sizeOptionActive')}</FormDescription>
      </div>
      <div className="flex items-center justify-start gap-1">
        <Label className="w-20" htmlFor="crop-img-select-size">
          {t('fields.width')}
        </Label>
        <InputNumber
          disabled={!useSizeOption}
          id="image-crop-width"
          placeholder={`${enterLabel} ${t('fields.width')}`}
          className="max-w-xs lowercase"
          {...register('Width', { valueAsNumber: true })}
        />
      </div>
      <div className="flex items-center justify-start gap-1">
        <Label className="w-20" htmlFor="crop-img-select-size">
          {t('fields.height')}
        </Label>
        <InputNumber
          disabled={!useSizeOption}
          id="image-crop-height"
          placeholder={`${enterLabel} ${t('fields.height')}`}
          className="max-w-xs lowercase"
          {...register('Height', { valueAsNumber: true })}
        />
      </div>
      <FormDescription id="both-error" className="leading-[1rem] text-destructive">
        {errors.Width?.message}
      </FormDescription>
      <div className="mt-4 flex items-center justify-start">
        <FormLabel className="w-20">{t('fields.zoom')}</FormLabel>
        <Controller
          name="zoom"
          control={control}
          render={({ field }) => (
            <Slider
              value={[field.value]}
              min={1}
              max={10}
              step={0.1}
              onValueChange={([zoom]) => field.onChange(zoom)}
            />
          )}
        />
      </div>
      <div className="flex items-center justify-start gap-1">
        <FormLabel className="w-20">{t('fields.rotate')}</FormLabel>
        <Controller
          name="rotation"
          control={control}
          render={({ field }) => {
            return (
              <Slider
                value={[field.value]}
                min={0}
                max={360}
                step={1}
                onValueChange={([rotation]) => field.onChange(rotation)}
              />
            );
          }}
        />
      </div>
    </div>
  );
};
