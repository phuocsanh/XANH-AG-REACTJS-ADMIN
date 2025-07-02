/**
 * File utilities
 */
import { ImageFile, UploadImageRef } from '@/components/upload-images';
import { v4 } from 'uuid';

export const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

export const getPreviewURL = (path: string) =>
  `${import.meta.env.VITE_API_URL}${path.replace('static', 'data')}`.replace('/cms', '');

const createImageFile = async (url: string) => {
  const blob = await fetch(url || '').then(r => r.blob());
  // const blob = await fetch(getPreviewURL(url || '')).then(r => r.blob());
  const file = new File([blob], url || v4(), { type: blob.type });

  return Object.assign(file, {
    isNew: false,
    url: url || '',
    preview: url || '',
    // preview: getPreviewURL(url || ''),
  });
};

export const setImagesToUploadControl = async <
  TImages extends { link?: string | null }[] | undefined,
>(
  uploadControl: UploadImageRef | null,
  images: TImages
) => {
  if (uploadControl && images) {
    const imageFiles: ImageFile[] = await Promise.all(
      images.map(async image => await createImageFile(image.link || ''))
    );
    uploadControl.setImageFiles(imageFiles);
  }
};

export const removeExtension = (fileName: string) =>
  fileName.includes('.') ? fileName.split('.')[0] : fileName;

export const dataURIToBlob = (dataURI: string) => {
  dataURI = dataURI.replace(/^data:/, '');

  const type = dataURI.match(/image\/[^;]+/);
  const base64 = dataURI.replace(/^[^,]+,/, '');
  const arrayBuffer = new ArrayBuffer(base64.length);
  const typedArray = new Uint8Array(arrayBuffer);

  for (let i = 0; i < base64.length; i++) {
    typedArray[i] = base64.charCodeAt(i);
  }

  return new Blob([arrayBuffer], { type: type?.[0] ?? 'image/png' });
};

export const stringToArrayBuffer = (string: string) => {
  const buffer = new ArrayBuffer(string.length);
  const bufferView = new Uint8Array(buffer);
  for (let i = 0; i < string.length; i++) {
    bufferView[i] = string.charCodeAt(i);
  }
  return buffer;
};
