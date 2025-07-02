import { cn } from '@/lib/utils';
import { Children, ReactNode, cloneElement, isValidElement } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Separator } from './ui/separator';

export type BasicDialogChildrenProps = {
  toggle?: BasicDialogProps['toggle'];
};

type BasicDialogProps = {
  open: boolean;
  toggle: () => void;
  title: string;
  description?: string | ReactNode;
  children: ReactNode | ReactNode[];
  className?: string;
};

export const BasicDialog = ({
  open,
  toggle,
  title,
  description,
  children,
  className,
}: BasicDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={toggle}>
      <DialogContent
        className={cn('max-w-[90vw]', className)}
        onInteractOutside={e => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <Separator />
        {Children.map(children, child => {
          if (!isValidElement<BasicDialogChildrenProps>(child)) {
            return null;
          }
          return cloneElement(child, { toggle });
        })}
      </DialogContent>
    </Dialog>
  );
};
