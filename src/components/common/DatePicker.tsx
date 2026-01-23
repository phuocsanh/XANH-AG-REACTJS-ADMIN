import React from 'react';
import { DatePicker as AntDatePicker, DatePickerProps } from 'antd';
import locale from 'antd/es/date-picker/locale/vi_VN';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import updateLocale from 'dayjs/plugin/updateLocale';

dayjs.extend(updateLocale);

// Tùy chỉnh dayjs locale 'vi' để hiển thị đẹp hơn
dayjs.updateLocale('vi', {
  months: [
    'Tháng 01', 'Tháng 02', 'Tháng 03', 'Tháng 04', 'Tháng 05', 'Tháng 06',
    'Tháng 07', 'Tháng 08', 'Tháng 09', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ],
  monthsShort: [
    'Tháng 01', 'Tháng 02', 'Tháng 03', 'Tháng 04', 'Tháng 05', 'Tháng 06',
    'Tháng 07', 'Tháng 08', 'Tháng 09', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ],
  weekdays: ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'],
  weekdaysShort: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
  weekdaysMin: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
});

dayjs.locale('vi');

interface CustomDatePicker extends React.FC<DatePickerProps> {
  RangePicker: any;
}

// Tùy chỉnh locale để hiển thị "Tháng" đầy đủ và chuyên nghiệp
const viLocale = {
  ...locale,
  lang: {
    ...locale.lang,
    monthFormat: 'MMMM',
    shortMonths: [
      'Tháng 01', 'Tháng 02', 'Tháng 03', 'Tháng 04', 'Tháng 05', 'Tháng 06',
      'Tháng 07', 'Tháng 08', 'Tháng 09', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ],
  }
};

/**
 * RangePicker component với cấu hình độc lập bảng lịch
 * Cho phép người dùng chuyển đổi tháng ở hai bảng một cách độc lập
 */
export const RangePicker: React.FC<any> = (props) => {
  return (
    <AntDatePicker.RangePicker
      {...props}
      locale={viLocale}
      placeholder={props.placeholder || ['Từ ngày', 'Đến ngày']}
      format={props.format || "DD/MM/YYYY"}
      linkedPanels={false}
      className={`custom-range-picker-unlinked ${props.className || ''}`}
    />
  );
};

/**
 * DatePicker component với locale tiếng Việt mặc định
 */
export const DatePicker: CustomDatePicker = (props) => {
  return (
    <AntDatePicker
      {...props}
      locale={viLocale}
      placeholder={props.placeholder || "Chọn ngày"}
      format={props.format || "DD/MM/YYYY"}
    />
  );
};

DatePicker.RangePicker = RangePicker;

export default DatePicker;
