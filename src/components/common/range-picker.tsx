import React from 'react';
import { DatePicker as AntDatePicker, GetProps } from 'antd';
import { DatePicker } from './DatePicker';

/**
 * Props cho RangePicker dùng chung
 */
export type RangePickerProps = GetProps<typeof AntDatePicker.RangePicker>;

/**
 * Component RangePicker dùng chung đã được cấu hình tiếng Việt và độc lập bảng
 */
export const RangePicker: React.FC<RangePickerProps> = (props) => {
  return (
    <DatePicker.RangePicker 
      {...props} 
    />
  );
};

export default RangePicker;
