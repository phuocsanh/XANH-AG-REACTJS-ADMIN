import { Button } from '@/components/ui/button';
import { ImageFile, getFileName } from '@/components/upload-images';
import { formatBytes } from '@/lib/file';
import { Image, X } from 'lucide-react';

/**
 *
 */
type UploadedItemProps = {
  file: ImageFile;
  // onClickToEdit: () => void;
  onClickToView: () => void;
  onRemoveFile: () => void;
};

export const UploadedItem = ({
  file,
  // onClickToEdit,
  onClickToView,
  onRemoveFile,
}: UploadedItemProps) => {
  return (
    <div className="flex justify-between overflow-hidden rounded-md p-3 transition-all hover:bg-primary-foreground/80">
      <div className="flex items-start gap-x-3">
        <img
          src={file.preview}
          className="block h-16 w-16 rounded-md object-contain hover:cursor-pointer hover:opacity-80"
          onClick={onClickToView}
        />
        <div className="flex flex-col">
          <p
            className="text-sm font-medium hover:cursor-pointer hover:underline"
            onClick={() => window.open(file.preview, '_blank')}
          >
            {getFileName(file?.name)}
          </p>
          <p className="text-sm font-normal">{`${formatBytes(file.size)} - ${file.type}`}</p>
        </div>
      </div>
      <div>
        <Button variant={'ghost'} className="h-[auto] p-1" onClick={onClickToView}>
          <Image size={15} className="text-primary/60" />
        </Button>
        <Button variant={'ghost'} className="h-[auto] p-1" onClick={onRemoveFile}>
          <X size={15} className="text-primary/60" />
        </Button>
      </div>
    </div>
  );
};
