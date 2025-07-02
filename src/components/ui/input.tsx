import * as React from 'react';

import { cn } from '@/lib/utils';
import { useFormContext } from 'react-hook-form';
import { NumericFormat } from 'react-number-format';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const InputNumber = ({
  className,
  decimalScale = 3,
  ...props
}: InputProps & {
  decimalScale?: number;
  type?: 'text' | 'tel' | 'password';
  value?: number | string | null;
  defaultValue?: number | string | null;
}) => {
  const [number, setNumber] = React.useState<number>();
  const { setValue } = useFormContext();

  React.useEffect(() => {
    if (!number && props.value) {
      setNumber(Number(props.value));
    }
  }, [number, props.value]);

  return (
    <NumericFormat
      thousandSeparator
      customInput={Input}
      decimalScale={decimalScale}
      className={cn('text-right', className)}
      {...props}
      onValueChange={value => {
        setNumber(value.floatValue);
      }}
      onBlur={() => setValue(props.name!, number)}
    />
  );
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground read-only:bg-primary-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input, InputNumber };
