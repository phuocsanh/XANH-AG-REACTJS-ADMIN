import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ImageFile, getFileName } from '@/components/upload-images';
import { formatBytes } from '@/lib/file';

/**
 *
 */
type ImageViewerProps = {
  file: ImageFile;
  open: boolean;
  toggle: () => void;
};

export const ImageViewer = ({ file, open, toggle }: ImageViewerProps) => {
  return (
    <Dialog open={open} onOpenChange={toggle}>
      <DialogContent className="max-h-[80vh] max-w-[50vw] space-y-5">
        <DialogHeader>
          {file.name && (
            <DialogTitle className="whitespace-pre-wrap pr-1">{getFileName(file.name)}</DialogTitle>
          )}
          {file.size && file.type && (
            <DialogDescription>{`${formatBytes(file.size)} - ${file.type}`}</DialogDescription>
          )}
        </DialogHeader>
        <div className="flex max-h-[65vh] items-center justify-center">
          <img
            src={file.preview}
            className="max-h-full w-auto object-contain bg-slate-100"
            onClick={() => window.open(file.preview, '_blank')}
          />
        </div>
        <DialogFooter />
      </DialogContent>
    </Dialog>
  );
};
