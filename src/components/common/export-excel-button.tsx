import React from 'react';
import { Button, Tooltip } from 'antd';
import { FileExcelOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';

interface ExportExcelButtonProps {
  /** Dữ liệu cần xuất dưới dạng mảng các object */
  data: any[];
  /** 
   * Cấu hình cột: mapper từ key của data sang tên cột trong excel.
   * key: key trong data
   * header: Tên cột hiển thị trong excel
   * format?: Hàm định dạng dữ liệu (ví dụ định dạng ngày tháng, tiền tệ)
   */
  columns: {
    key: string;
    header: string;
    format?: (value: any, record: any) => any;
  }[];
  /** Tên file khi tải về (mặc định: export.xlsx) */
  fileName?: string;
  /** Tên sheet trong file (mặc định: Sheet1) */
  sheetName?: string;
  /** Label của nút bấm */
  label?: string;
  /** Class CSS bổ sung */
  className?: string;
  /** Trạng thái loading */
  loading?: boolean;
}

/**
 * Component nút bấm hỗ trợ xuất dữ liệu ra file Excel (.xlsx)
 */
const ExportExcelButton: React.FC<ExportExcelButtonProps> = ({
  data,
  columns,
  fileName = 'export.xlsx',
  sheetName = 'Sheet1',
  label = 'Xuất Excel',
  className,
  loading = false,
}) => {
  const handleExport = () => {
    try {
      // 1. Chuẩn bị dữ liệu theo cấu hình cột
      const formattedData = data.map((record) => {
        const row: any = {};
        columns.forEach((col) => {
          const value = record[col.key];
          row[col.header] = col.format ? col.format(value, record) : value;
        });
        return row;
      });

      // 2. Tạo worksheet từ dữ liệu JSON
      const worksheet = XLSX.utils.json_to_sheet(formattedData);

      // Tự động điều chỉnh độ rộng cột (cơ bản)
      const wscols = columns.map(() => ({ wch: 20 }));
      worksheet['!cols'] = wscols;

      // 3. Tạo workbook và thêm worksheet vào
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

      // 4. Xuất file
      const name = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
      XLSX.writeFile(workbook, name);
    } catch (error) {
      console.error('❌ Lỗi xuất Excel:', error);
    }
  };

  return (
    <Tooltip title="Xuất dữ liệu hiện tại ra Excel">
      <Button
        type="default"
        icon={<FileExcelOutlined className="text-green-600" />}
        onClick={handleExport}
        className={`hover:border-green-500 hover:text-green-600 ${className}`}
        loading={loading}
        disabled={data.length === 0}
      >
        {label}
      </Button>
    </Tooltip>
  );
};

export default ExportExcelButton;
