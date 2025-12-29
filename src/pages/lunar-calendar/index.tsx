import React, { useState } from 'react';
import { Calendar, Badge, Card, Row, Col, Tag, Typography, Divider, Select } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import locale from 'antd/es/calendar/locale/vi_VN'; // Import locale tiếng Việt cho Ant Design Calendar
// @ts-ignore - amlich không có types
import amlich from 'amlich';

// Cấu hình dayjs
dayjs.extend(localizedFormat);
dayjs.locale('vi');

const { Title, Text } = Typography;

// Hàm hỗ trợ viết hoa chữ cái đầu mỗi từ
const capitalizeWords = (str: string) => {
  return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

// Màu sắc cho các loại ngày
const COLORS = {
  today: '#52c41a',
  weekend: '#ff4d4f',
  normal: '#1890ff',
};

/**
 * Component Lịch Vạn Niên
 * Hiển thị lịch dương và âm lịch Việt Nam
 * Public - Ai cũng có thể xem
 */
const LunarCalendar: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());

  // Lấy thông tin âm lịch cho một ngày
  const getLunarInfo = (date: Dayjs) => {
    const solar = {
      day: date.date(),
      month: date.month() + 1, // dayjs month bắt đầu từ 0
      year: date.year(),
    };

    try {
      const lunar = amlich.convertSolar2Lunar(
        solar.day,
        solar.month,
        solar.year,
        7 // GMT+7 cho Việt Nam
      );

      return {
        day: lunar[0],
        month: lunar[1],
        year: lunar[2],
        leap: lunar[3], // Tháng nhuận
        jd: lunar[4], // Julian day
      };
    } catch (error) {
      console.error('Error converting to lunar:', error);
      return null;
    }
  };


  // Render nội dung của mỗi ô ngày
  const dateCellRender = (date: Dayjs) => {
    const lunar = getLunarInfo(date);
    const isToday = date.isSame(dayjs(), 'day');
    const isWeekend = date.day() === 0 || date.day() === 6;
    
    // Lấy thứ tiếng Việt đầy đủ (viết tắt Chủ nhật cho gọn)
    const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const dayOfWeek = dayNames[date.day()];

    return (
      <div className="lunar-cell">
        {/* 1. Hiển thị thứ */}
        <div className="lunar-day-of-week">
          {dayOfWeek}
        </div>
        
        {/* 2. Hiển thị ngày dương (có nhãn) */}
        <div className="solar-date-container">
          <span className="solar-label">Ngày dương:</span>
          <span className="solar-date-value">
            {date.date()}
          </span>
        </div>
        
        {/* 3. Hiển thị ngày âm (ghi rõ) */}
        {lunar && (
          <div 
            className="lunar-date-container"
            style={{ 
              color: isToday ? COLORS.today : isWeekend ? COLORS.weekend : '#666'
            }}
          >
            <span className="lunar-label">Âm lịch:</span>
            <span className="lunar-value">
              {lunar.day}/{lunar.month}
              {lunar.leap ? ' (nhuận)' : ''}
            </span>
          </div>
        )}
      </div>
    );
  };

  // Render header của tháng
  const monthCellRender = (date: Dayjs) => {
    return null; // Không cần render gì đặc biệt cho tháng
  };

  // Xử lý khi chọn ngày
  const onSelect = (date: Dayjs) => {
    setSelectedDate(date);
  };

  // Lấy thông tin chi tiết của ngày được chọn
  const selectedLunar = getLunarInfo(selectedDate);
  const isToday = selectedDate.isSame(dayjs(), 'day');

  // Format ngày tháng đầy đủ bằng tiếng Việt (viết hoa chữ cái đầu mỗi từ)
  const getVietnameseDateString = (date: Dayjs) => {
    const dayOfWeek = date.format('dddd'); // Thứ hai, Thứ ba...
    const day = date.date();
    const month = date.month() + 1;
    const year = date.year();
    
    const dateString = `${dayOfWeek}, ngày ${day} tháng ${month} năm ${year}`;
    return capitalizeWords(dateString);
  };

  return (
    <div className="p-2 md:p-6">
      <Title level={2} className="mb-6 text-center" style={{ fontSize: '32px' }}>
        📅 Lịch Vạn Niên
      </Title>

      <Row gutter={[16, 16]}>
        {/* Thông tin chi tiết ngày được chọn - ĐƯA LÊN TRÊN */}
        <Col xs={24}>
          <Card className="text-center shadow-sm">
            <div className="space-y-4">
              {/* Dương lịch */}
              <div>
                <Text strong className="block mb-3 text-lg uppercase" style={{ color: '#059669', opacity: 0.8, letterSpacing: '2px' }}>🌞 Dương lịch</Text>
                <Title level={2} className="m-0 !text-2xl md:!text-4xl" style={{ color: '#047857', lineHeight: '1.4' }}>
                  {isToday ? 'Hôm nay, ' : ''}{getVietnameseDateString(selectedDate)}
                </Title>
              </div>

              <Divider className="my-8" />

              {/* Âm lịch */}
              {selectedLunar && (
                <div>
                  <Text strong className="block mb-3 text-lg uppercase" style={{ color: '#d4380d', opacity: 0.8, letterSpacing: '2px' }}>🌙 Âm lịch</Text>
                  <Title level={3} className="m-0 !text-xl md:!text-3xl" style={{ color: '#cf1322', lineHeight: '1.4' }}>
                    {capitalizeWords(`Ngày ${selectedLunar.day} tháng ${selectedLunar.month}`)}
                    {selectedLunar.leap ? ' (Nhuận)' : ''}, {capitalizeWords(`năm ${selectedLunar.year}`)}
                  </Title>
                </div>
              )}

            </div>
          </Card>
        </Col>

        {/* Calendar chính - ĐƯA XUỐNG DƯỚI */}
        <Col xs={24}>
          <Card title={<span style={{ fontSize: '22px', fontWeight: 'bold' }}>📆 Chọn ngày</span>}>
            <Calendar
              fullscreen={false}
              onSelect={onSelect}
              dateCellRender={dateCellRender}
              monthCellRender={monthCellRender}
              locale={locale}
              headerRender={({ value, onChange }) => {
                const currentYear = dayjs().year();
                const currentMonth = dayjs().month();
                
                const start = 0;
                const end = 12;
                const monthOptions = [];

                for (let i = start; i < end; i++) {
                  const isCurrentMonth = i === currentMonth;
                  monthOptions.push(
                    <Select.Option key={i} value={i} label={`Tháng ${i + 1}`} className="month-item">
                      <span style={{ 
                        color: isCurrentMonth ? '#52c41a' : 'inherit',
                        fontWeight: isCurrentMonth ? '800' : 'normal'
                      }}>
                        Tháng {i + 1} {isCurrentMonth ? '(Hiện tại)' : ''}
                      </span>
                    </Select.Option>
                  );
                }

                const year = value.year();
                const month = value.month();
                const yearOptions = [];
                for (let i = year - 10; i < year + 15; i += 1) {
                  const isCurrentYear = i === currentYear;
                  yearOptions.push(
                    <Select.Option key={i} value={i} label={i.toString()} className="year-item">
                      <span style={{ 
                        color: isCurrentYear ? '#52c41a' : 'inherit',
                        fontWeight: isCurrentYear ? '800' : 'normal'
                      }}>
                        {i} {isCurrentYear ? '(Hiện tại)' : ''}
                      </span>
                    </Select.Option>
                  );
                }

                return (
                  <div style={{ padding: '10px 5px' }}>
                    <Row gutter={[8, 4]} justify="end" align="middle" wrap={false}>
                      <Col className="flex items-center">
                        <Text strong style={{ marginRight: 6, fontSize: '16px', whiteSpace: 'nowrap' }}>Năm:</Text>
                        <Select
                          size="middle"
                          dropdownMatchSelectWidth={false}
                          optionLabelProp="label"
                          className="my-year-select"
                          style={{ width: 85, fontSize: '16px' }}
                          value={year}
                          onChange={(newYear) => {
                            const now = value.clone().year(newYear);
                            onChange(now);
                          }}
                        >
                          {yearOptions}
                        </Select>
                      </Col>
                      <Col className="flex items-center">
                        <Text strong style={{ marginLeft: 12, marginRight: 6, fontSize: '16px', whiteSpace: 'nowrap' }}>Tháng:</Text>
                        <Select
                          size="middle"
                          dropdownMatchSelectWidth={false}
                          optionLabelProp="label"
                          style={{ width: 125, fontSize: '16px' }}
                          value={month}
                          onChange={(newMonth) => {
                            const now = value.clone().month(newMonth);
                            onChange(now);
                          }}
                        >
                          {monthOptions}
                        </Select>
                      </Col>
                    </Row>
                  </div>
                );
              }}
            />
          </Card>
        </Col>

        {/* Hướng dẫn */}
        <Col xs={24}>
          <Card title={<span style={{ fontSize: '22px', fontWeight: 'bold' }}>ℹ️ Hướng dẫn sử dụng</span>}>
            <ul className="text-lg space-y-4 pl-6" style={{ color: '#434343' }}>
              <li>Bấm vào bất kỳ ô ngày nào trong lịch để xem <b>Thông tin chi tiết</b> (Số ngày, Thứ, Âm lịch) ở phía trên.</li>
              <li>Sử dụng bộ chọn <b>"Chọn Năm"</b> và <b>"Chọn Tháng"</b> ở trên bảng lịch để di chuyển nhanh đến thời gian mong muốn.</li>
              <li>Ô ngày đang được chọn sẽ có <b>màu nền xanh lá</b> và <b>chữ màu trắng</b> nổi bật.</li>
              <li>
                <Badge color={COLORS.today} text={<span className="text-lg">Ngày hiện tại: Được đánh dấu bằng vòng màu xanh lá</span>} />
              </li>
              <li>
                <Badge color={COLORS.weekend} text={<span className="text-lg">Cuối tuần: Ngày Thứ 7 và Chủ Nhật được tô màu cam đỏ dễ nhận biết</span>} />
              </li>
            </ul>
          </Card>
        </Col>
      </Row>

      {/* CSS tùy chỉnh */}
      <style>{`
        .lunar-cell {
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
        }
        
        .lunar-day-of-week {
          font-size: 10px;
          color: #999;
          margin-bottom: 4px;
          line-height: 1.2;
          white-space: nowrap;
        }
        
        .lunar-date {
          font-size: 11px;
          line-height: 1.2;
          white-space: nowrap;
        }
        
        .ant-picker-calendar-date-today {
          border: 2px solid ${COLORS.today} !important;
        }
        
        /* Ẩn header thứ (T2, T3...) vì mỗi ô đã có thứ đầy đủ */
        .ant-picker-content thead {
          display: none !important;
        }
        
        /* Ẩn số ngày dương lịch mặc định của Ant Design */
        .ant-picker-calendar-date-value {
          display: none !important;
        }
        
        /* Style cho ngày dương lịch tự custom */
        .solar-date-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin: 2px 0;
          line-height: 1.1;
        }

        .solar-label {
          font-size: 11px;
          text-transform: uppercase;
          color: #8c8c8c;
          letter-spacing: 0.5px;
          transition: color 0.3s;
        }

        .solar-date-value {
          font-size: 26px;
          font-weight: 800;
          color: #1a1a1a;
          line-height: 1;
          transition: color 0.3s;
        }

        .lunar-date-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          line-height: 1.1;
          transition: color 0.3s;
        }

        .lunar-label {
          font-size: 11px;
          text-transform: uppercase;
          opacity: 0.8;
          letter-spacing: 0.5px;
          transition: color 0.3s;
        }

        .lunar-value {
          font-size: 16px;
          font-weight: 700;
          transition: color 0.3s;
        }
        
        /* Thêm border rõ ràng cho mỗi ô */
        .ant-picker-cell {
          border: 1px solid #d9d9d9 !important;
        }
        
        /* CSS chung cho tất cả màn hình */
        .ant-picker-calendar {
          overflow-x: auto !important;
          -webkit-overflow-scrolling: touch;
        }

        .ant-picker-content table {
          min-width: 840px !important;
          table-layout: fixed !important; /* Dùng fixed để đảm bảo width không bị co */
          width: 100% !important;
          border-collapse: collapse;
        }
        
        .ant-picker-calendar table {
          table-layout: fixed !important;
          width: 100% !important;
        }
        
        .ant-picker-cell {
          padding: 0 !important;
          min-width: 120px !important;
          height: 110px !important; /* Tăng chiều cao để đủ chỗ cho chữ to hơn */
          text-align: center !important;
          border: 0.5px solid #f0f0f0 !important;
          transition: all 0.3s ease;
        }

        /* Khi ô được chọn (Selected) */
        .ant-picker-cell-selected .ant-picker-cell-inner {
          background: var(--gradient-sidebar) !important;
          border-radius: 0 !important;
        }

        .ant-picker-cell-selected .solar-date-value,
        .ant-picker-cell-selected .lunar-day-of-week,
        .ant-picker-cell-selected .solar-label,
        .ant-picker-cell-selected .lunar-label,
        .ant-picker-cell-selected .lunar-value,
        .ant-picker-cell-selected .lunar-date-container {
          color: #fff !important;
        }

        /* Ẩn background mặc định khi selected */
        .ant-picker-calendar-full .ant-picker-cell-selected .ant-picker-cell-inner {
          background: var(--gradient-sidebar) !important;
        }
        
        .ant-picker-cell-inner {
          height: 100% !important;
          display: flex !important;
          justify-content: center !important;
          align-items: center !important;
        }
        
        .ant-picker-calendar-date-content {
          height: 100% !important;
          min-height: 110px !important;
          display: flex !important;
          justify-content: center !important;
          align-items: center !important;
          padding: 0 !important;
        }
        
        .lunar-cell {
          padding: 8px 4px !important;
          gap: 4px;
          text-align: center !important;
          width: 100%;
          height: 100%;
          display: flex !important;
          flex-direction: column !important;
          justify-content: center !important;
          align-items: center !important;
        }
        
        /* Tăng font size cho dễ đọc */
        .lunar-day-of-week {
          font-size: 15px !important;
          font-weight: 600;
          color: #595959;
          width: 100%;
          text-align: center;
          margin-bottom: 4px;
          transition: color 0.3s;
        }
        
        .lunar-date-container {
          width: 100%;
          text-align: center;
        }
        
        /* CSS riêng cho mobile - Đảm bảo thanh cuộn xuất hiện */
        @media (max-width: 768px) {
          .ant-picker-calendar {
            display: block !important;
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch;
          }
          .ant-picker-panel {
            width: 840px !important;
          }
        }
        
        .ant-picker-calendar {
          overflow-x: auto !important;
        }
        
        .space-y-2 > * + * {
          margin-top: 0.5rem;
        }
        
        .space-y-4 > * + * {
          margin-top: 1rem;
        }
        .my-year-select .ant-select-selection-item,
        .ant-select-single .ant-select-selector .ant-select-selection-item {
          font-size: 16px !important;
          font-weight: 600 !important;
        }
      `}</style>
    </div>
  );
};

export default LunarCalendar;
