import * as LabelPrimitive from '@radix-ui/react-label';
import * as React from 'react';

import { Label } from '@/components/ui/label';
import { DEFAULT_QUERY_LIST_PAYLOAD, FORMAT_DATE, FORMAT_DATE_TIME } from '@/constant/const';
import { setImagesToUploadControl } from '@/lib/file';
import { atBottom, cn } from '@/lib/utils';
import { Model, createQueryComponentFn } from '@/services/utils';
import { ListComponentResponse, QueryListComponentType } from '@/types';
import { Slot } from '@radix-ui/react-slot';
import { format, isValid, parse } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import {
  CaptionLayout,
  DateRange,
  DayPickerRangeProps,
  DayPickerSingleProps,
  SelectRangeEventHandler,
  SelectSingleEventHandler,
  isDateRange,
} from 'react-day-picker';
import {
  Controller,
  ControllerRenderProps,
  FieldPath,
  FieldValues,
  FormProvider,
  useFormContext,
} from 'react-hook-form';
import { QueryKey, useInfiniteQuery } from 'react-query';
import { Combobox } from '../combobox';
import { ImageFile, UploadImageRef, UploadImages, UploadImagesProps } from '../upload-images';
import { buttonVariants } from './button';
import { Calendar, CalendarProps } from './calendar';
import { Input } from './input';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

const Form = FormProvider;

type FormProps = {
  label?: string;
  description?: string;
  children?: React.ReactElement;
  placeholder?: string;
  type?: FormFieldType;
  onChange?: unknown;
};

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
};

const FormFieldContext = React.createContext<FormFieldContextValue>({} as FormFieldContextValue);

// const FormField = <
//   TFieldValues extends FieldValues = FieldValues,
//   TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
// >({
//   children,
//   ...props
// }: ControllerProps<TFieldValues, TName> & {
//   children: React.ReactElement; //
// }) => {
//   const { control } = useFormContext<TFieldValues>();

//   return (
//     <FormFieldContext.Provider value={{ name: props.name }}>
//       <Controller
//         {...props}
//         control={control}
//         name={props.name}
//         render={({ field }) => <FormItem {...field}>{children}</FormItem>}
//       />
//     </FormFieldContext.Provider>
//   );
// };

type FormFieldType = 'text' | 'number' | 'checkbox' | 'date' | 'custom' | 'select';

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  label,
  name,
  children,
  ...props
}: { name: TName; type?: FormFieldType } & FormProps &
  Partial<Omit<ControllerRenderProps<TFieldValues, TName>, 'ref'>> &
  Partial<React.HTMLAttributes<HTMLInputElement>>) => {
  const { control } = useFormContext<TFieldValues>();

  return (
    <FormFieldContext.Provider value={{ name: name }}>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <FormItem {...field} {...props} label={label}>
            {children}
          </FormItem>
        )}
      />
    </FormFieldContext.Provider>
  );
};

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState, formState } = useFormContext();

  const fieldState = getFieldState(fieldContext.name, formState);

  if (!fieldContext) {
    throw new Error('useFormField should be used within <FormField>');
  }

  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};

type FormItemContextValue = {
  id: string;
};

type FormItemProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = React.HTMLAttributes<HTMLDivElement> &
  FormProps &
  Omit<ControllerRenderProps<TFieldValues, TName>, 'ref'>;

const FormItemContext = React.createContext<FormItemContextValue>({} as FormItemContextValue);

const FormItem = React.forwardRef<HTMLDivElement, FormItemProps>(
  ({ className = '', children, label, description, type, ...props }, ref) => {
    const id = React.useId();

    const getClassName = () => {
      if (type === 'checkbox') {
        return className + ' flex flex-row items-start space-x-3 space-y-0 p-1';
      }

      if (type === 'select') {
        return className + ' w-full';
      }

      return className;
    };

    const renderChild = () => {
      if (!React.isValidElement(children)) {
        children = <Input />;
      }

      if (type === 'date') {
        children = <FormDatePicker />;
      }

      // if (type === 'select') {
      //   return <FormCombobox {...props} label={label} description={description} />;
      // }

      if (type === 'checkbox') {
        return (
          <>
            <FormControl>
              {React.cloneElement(children, {
                ...props,
                checked: props.value as boolean,
                onCheckedChange: (checked: boolean) =>
                  props.onChange({ target: { value: checked, name: props.name } }),
              })}
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel className="first-letter:uppercase">{label}</FormLabel>
              <FormDescription>{description}</FormDescription>
            </div>
          </>
        );
      }

      return (
        <>
          <FormLabel className="first-letter:uppercase">{label}</FormLabel>
          <FormControl>
            {React.cloneElement(children, { ...props, className: 'placeholder:lowercase' })}
          </FormControl>
          <FormDescription>{description}</FormDescription>
          <FormMessage />
        </>
      );
    };

    return (
      <FormItemContext.Provider value={{ id }}>
        <div ref={ref} className={cn('space-y-2', getClassName())}>
          {renderChild()}
        </div>
      </FormItemContext.Provider>
    );
  }
);
FormItem.displayName = 'FormItem';

const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  const { error, formItemId } = useFormField();

  return (
    <Label
      ref={ref}
      className={cn(error && 'text-destructive', className)}
      htmlFor={formItemId}
      {...props}
    />
  );
});
FormLabel.displayName = 'FormLabel';

const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField();

  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={!error ? `${formDescriptionId}` : `${formDescriptionId} ${formMessageId}`}
      aria-invalid={!!error}
      {...props}
    />
  );
});
FormControl.displayName = 'FormControl';

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField();

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn('text-[0.8rem] text-muted-foreground', className)}
      {...props}
    />
  );
});
FormDescription.displayName = 'FormDescription';

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error?.message) : children;

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn('text-[0.8rem] font-medium text-destructive', className)}
      {...props}
    >
      {body}
    </p>
  );
});
FormMessage.displayName = 'FormMessage';

/**
 * Utilities components
 */
export type FormDatePickerProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = FormProps &
  CalendarProps &
  Partial<Omit<ControllerRenderProps<TFieldValues, TName>, 'ref'>> & {
    showTimePicker?: boolean;
  };

const FormDatePicker = ({
  mode = 'single',
  name,
  value,
  onChange,
  className,
  disabled,
  showTimePicker,
  ...props
}: FormDatePickerProps) => {
  const [inputValue, setInputValue] = React.useState<string>('');
  const [dateValue, setDateValue] = React.useState<Date | DateRange | undefined>();
  const [timeValue, setTimeValue] = React.useState<string>();

  const showPickedValue = React.useCallback(
    (value: Date | DateRange) => {
      if (!value) {
        return 'Chọn ngày';
      }

      if (isDateRange(value)) {
        const { from, to } = value;

        if (from && to) {
          return `${format(from, FORMAT_DATE)} - ${format(to, FORMAT_DATE)}`;
        }

        return from ? format(from, FORMAT_DATE) : '';
      }

      return format(value, showTimePicker ? FORMAT_DATE_TIME : FORMAT_DATE);
    },
    [showTimePicker]
  );

  const setDateState = React.useCallback(
    (value: Date | DateRange | undefined) => {
      if (!value) {
        return;
      }

      if (showTimePicker && value instanceof Date) {
        const hours = value.getHours();
        const minutes = value.getMinutes();
        setTimeValue(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
      }

      setDateValue(value);
      setInputValue(showPickedValue(value));
    },
    [showPickedValue, showTimePicker]
  );

  React.useLayoutEffect(() => {
    if (value) {
      setDateState(value as Date | DateRange);
    }
  }, [setDateState, value]);

  const handleInputChange: React.ChangeEventHandler<HTMLInputElement> = event => {
    setInputValue(event.target.value);
  };

  const handleInputBlur: React.ChangeEventHandler<HTMLInputElement> = ({ target: { value } }) => {
    const getParsedDate = (): Date | DateRange | undefined => {
      if (mode === 'single') {
        const format = showTimePicker ? FORMAT_DATE_TIME : FORMAT_DATE;
        const singleDate = parse(value, format, new Date());

        if (!isValid(singleDate)) {
          return;
        }

        return singleDate;
      }

      if (mode === 'range') {
        const [from, to]: string[] = value.split('-');
        const fromParsed = parse(from.trim(), FORMAT_DATE, new Date());
        const toParsed = parse(to.trim(), FORMAT_DATE, new Date());

        if (!isValid(fromParsed) || !isValid(toParsed)) {
          return;
        }

        const rangeDate = { from: fromParsed, to: toParsed };

        if (!isDateRange(rangeDate)) {
          return;
        }

        return rangeDate;
      }

      return;
    };

    const parsedDate = getParsedDate();
    setDateState(parsedDate);

    if (onChange) {
      onChange(parsedDate);
    }
  };

  const handleSelect = (date: Date | DateRange | undefined) => {
    const getSelectedDate = (): Date | DateRange | undefined => {
      if (isDateRange(date)) {
        const { from, to } = date;

        if (from || to) {
          return {
            from: from || undefined,
            to: to || undefined,
          };
        }
      }

      return date;
    };

    const value = getSelectedDate();
    setDateState(value);

    if (onChange) {
      onChange(value);
    }
  };

  const handleRangeSelect: SelectRangeEventHandler = (date: DateRange | undefined) => {
    handleSelect(date);
  };

  const handleSingleSelect: SelectSingleEventHandler = (day: Date | undefined) => {
    handleSelect(day);
  };

  const handleTimeChange: React.ChangeEventHandler<HTMLInputElement> = e => {
    const { value } = e.target;
    const [hours, minutes] = value.split(':');
    setTimeValue(`${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`);

    if (!dateValue) {
      return;
    }

    if (dateValue instanceof Date) {
      const dateTimeValue = new Date(
        dateValue.getFullYear(),
        dateValue.getMonth(),
        dateValue.getDate(),
        Number.parseInt(hours),
        Number.parseInt(minutes)
      );

      setDateState(dateTimeValue);

      if (onChange) {
        onChange(dateTimeValue);
      }
    }
  };

  const footer = (
    <>
      <div className="px-4 pb-4 pt-0">
        <Label>Giờ</Label>
        <Input type="time" value={timeValue} onChange={handleTimeChange} />
      </div>
      {!timeValue && <p>Chọn giờ.</p>}
    </>
  );

  const calendarProps = {
    name,
    captionLayout: 'dropdown-buttons' as CaptionLayout,
    fromYear: 1960,
    toYear: 2030,
    initialFocus: true,
    ...props,
  };

  const SingleDatePicker = (props: Omit<DayPickerSingleProps, 'selected' | 'onSelect'>) => {
    const selected = dateValue as Date | undefined;
    return (
      <Calendar
        {...props}
        selected={selected}
        defaultMonth={selected}
        onSelect={handleSingleSelect}
      />
    );
  };

  const RangeDatePicker = (props: Omit<DayPickerRangeProps, 'selected' | 'onSelect'>) => {
    const selected = dateValue as DateRange | undefined;
    return (
      <Calendar
        {...props}
        selected={selected}
        showOutsideDays={false}
        onSelect={handleRangeSelect}
      />
    );
  };

  return (
    <Popover>
      <div className="flex items-center ">
        <Input
          value={inputValue}
          onBlur={handleInputBlur}
          onChange={handleInputChange}
          disabled={disabled as boolean}
          className={cn('rounded-r-none', className)}
        />
        <PopoverTrigger
          className={buttonVariants({
            variant: 'outline',
            className: 'flex items-center rounded-l-none',
          })}
        >
          <CalendarIcon className={cn('ml-auto h-4 w-4 opacity-50')} />
        </PopoverTrigger>
      </div>
      <PopoverContent className="w-full p-0" align="center">
        {mode === 'single' ? (
          <SingleDatePicker {...calendarProps} mode="single" />
        ) : (
          <RangeDatePicker {...calendarProps} mode="range" />
        )}
        {showTimePicker && footer}
      </PopoverContent>
    </Popover>
  );
};

export type FormComboboxProps<
  TRecord,
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = FormProps & {
  multiple?: boolean;
  queryKey?: QueryKey;
  model?: Model;
  // queryFn?: (params: QueryListComponentType) => Promise<PaginationResponse<TRecord>>;
  options?: TRecord[];
  showFields?: (keyof TRecord)[];
  onSelectItem?: (item: TRecord) => void;
  onSelectedItems?: (items: TRecord[]) => void;
  valueField?: keyof TRecord;
  filter?: (value: TRecord, index: number, array: TRecord[]) => unknown;
} & Partial<Omit<ControllerRenderProps<TFieldValues, TName>, 'ref'>> &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'>;

const FormCombobox = <TRecord extends ListComponentResponse>({
  model,
  queryKey,
  options = [],
  filter = () => true,
  ...props
}: FormComboboxProps<TRecord>) => {
  const queryFunction = async ({ pageParam = 1 }) => {
    if (!model) {
      return Promise.reject();
    }

    const queryFn = createQueryComponentFn<TRecord>(model);

    if (queryFn) {
      const params: QueryListComponentType = {
        keySearch: '',
        id: 0,
        pageIndex: pageParam,
        pageSize: DEFAULT_QUERY_LIST_PAYLOAD.pageSize!,
        isGetAll: false,
      };

      return await queryFn(params);
    }

    return Promise.reject();
  };

  const { data, fetchNextPage, isFetching } = useInfiniteQuery({
    queryKey,
    queryFn: queryFunction,
    getNextPageParam: lastPage => {
      if (lastPage.items.length === 0) {
        return;
      }

      return lastPage.pageIndex + 1;
    },
    staleTime: Infinity,
  });

  const { pages } = data || { pages: [{ items: options }] };
  const items = pages.map(page => page.items).flat();

  const handleScroll: React.UIEventHandler<HTMLDivElement> = event => {
    if (!atBottom(event.currentTarget) || isFetching) {
      return;
    }

    void fetchNextPage();
  };

  return <Combobox {...props} options={items.filter(filter)} onScroll={handleScroll} />;
};

type FormImagesUploaderProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = UploadImagesProps & Partial<Omit<ControllerRenderProps<TFieldValues, TName>, 'ref'>>;

const FormImagesUploader = ({
  mode = 'multiple',
  onChange,
  value,
  ...props
}: FormImagesUploaderProps) => {
  const uploaderRef = React.useRef<UploadImageRef>(null);

  React.useEffect(() => {
    if (!value) return;

    if (mode === 'single') {
      void setImagesToUploadControl(uploaderRef.current, [{ link: String(value) }]);
    } else if (Array.isArray(value)) {
      const paths = value.map((link: string) => ({ link }));
      void setImagesToUploadControl(uploaderRef.current, paths);
    }
  }, [mode, value]);

  const handleUploadSuccess = (files: ImageFile[]) => {
    if (!files) return;

    if (!onChange) return;

    if (mode === 'single') {
      onChange(files[0].url);
    } else {
      onChange(files.map(i => i.url));
    }
  };

  const handleRemove = (file: ImageFile) => {
    if (!file) return;

    if (!onChange) return;

    if (mode === 'single') {
      onChange('');
    } else {
      onChange((value as string[]).filter(i => i !== file.url));
    }
  };

  return (
    <UploadImages
      mode={mode}
      ref={uploaderRef}
      onRemove={handleRemove}
      onUploadSuccess={handleUploadSuccess}
      {...props}
    />
  );
};

export {
  Form,
  FormCombobox,
  FormControl,
  FormDatePicker,
  FormDescription,
  FormField,
  FormImagesUploader,
  FormItem,
  FormLabel,
  FormMessage,
  useFormField,
};
