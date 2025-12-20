import React from 'react';
import { DatePicker as AntDatePicker, DatePickerProps } from 'antd';
import locale from 'antd/es/date-picker/locale/vi_VN';
import 'dayjs/locale/vi';

interface CustomDatePicker extends React.FC<DatePickerProps> {
  RangePicker: typeof AntDatePicker.RangePicker;
}

/**
 * DatePicker component với locale tiếng Việt mặc định
 * Wrapper của Ant Design DatePicker
 */
export const DatePicker: CustomDatePicker = (props) => {
  return (
    <AntDatePicker
      locale={locale}
      format="DD/MM/YYYY"
      placeholder="Chọn ngày"
      {...props}
    />
  );
};

DatePicker.RangePicker = AntDatePicker.RangePicker;

export default DatePicker;
