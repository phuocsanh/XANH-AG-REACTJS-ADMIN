import React from 'react';
import { Button, Tooltip } from 'antd';
import { FileExcelOutlined } from '@ant-design/icons';
import ExcelJS from 'exceljs';
import dayjs from 'dayjs';

type ExcelColumnType = 'text' | 'number' | 'integer' | 'currency' | 'date' | 'datetime';

interface ExportExcelColumn {
  key: string;
  header: string;
  format?: (value: any, record: any) => any;
  value?: (record: any) => any;
  excelType?: ExcelColumnType;
  wrapText?: boolean;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  align?: 'left' | 'center' | 'right';
}

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
    value?: (record: any) => any;
    excelType?: ExcelColumnType;
    wrapText?: boolean;
    width?: number;
    minWidth?: number;
    maxWidth?: number;
    align?: 'left' | 'center' | 'right';
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

const resolveColumnValue = (record: any, column: ExportExcelColumn) => {
  const rawValue = column.value ? column.value(record) : record[column.key];
  return column.format ? column.format(rawValue, record) : rawValue;
};

const getCellDisplayText = (value: any, column: ExportExcelColumn) => {
  if (value === null || value === undefined) return '';

  if (column.excelType === 'date' && value) {
    return dayjs(value).format('DD/MM/YYYY');
  }

  if (column.excelType === 'datetime' && value) {
    return dayjs(value).format('DD/MM/YYYY HH:mm');
  }

  if (column.excelType === 'currency' && value !== '') {
    return Number(value || 0).toLocaleString('vi-VN');
  }

  if (column.excelType === 'number' && value !== '') {
    return Number(value || 0).toLocaleString('vi-VN');
  }

  return String(value);
};

const toExcelDateValue = (value: any) => {
  if (!value) return '';
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.toDate() : value;
};

const applyCellFormatting = (
  cell: ExcelJS.Cell,
  value: any,
  column: ExportExcelColumn
) => {
  const align =
    column.align ||
    (column.excelType === 'currency' || column.excelType === 'number'
      ? 'right'
      : column.excelType === 'date' || column.excelType === 'datetime'
        ? 'center'
        : 'left');

  cell.alignment = {
    horizontal: align,
    vertical: column.wrapText ? 'top' : 'middle',
    wrapText: column.wrapText ?? false,
  };

  if (value === '' || value === null || value === undefined) {
    cell.value = '';
    return;
  }

  switch (column.excelType) {
    case 'currency':
      cell.value = Number(value || 0);
      cell.numFmt = '#,##0';
      break;
    case 'integer':
      cell.value = Number(value || 0);
      cell.numFmt = '0';
      break;
    case 'number':
      cell.value = Number(value || 0);
      cell.numFmt = '#,##0.##';
      break;
    case 'date':
      cell.value = toExcelDateValue(value) as any;
      cell.numFmt = 'dd/mm/yyyy';
      break;
    case 'datetime':
      cell.value = toExcelDateValue(value) as any;
      cell.numFmt = 'dd/mm/yyyy hh:mm';
      break;
    default:
      cell.value = value;
      break;
  }
};

const getColumnWidth = (
  column: ExportExcelColumn,
  rows: any[],
) => {
  if (column.width) {
    return column.width;
  }

  const headerWidth = column.header.length + 2;
  const contentWidth = rows.reduce((maxWidth, record) => {
    const value = resolveColumnValue(record, column);
    const displayText = getCellDisplayText(value, column);
    const longestLine = displayText
      .split('\n')
      .reduce((maxLineWidth, line) => Math.max(maxLineWidth, line.length), 0);
    return Math.max(maxWidth, longestLine + 2);
  }, headerWidth);

  const minWidth = column.minWidth ?? 10;
  const maxWidth = column.maxWidth ?? (column.wrapText ? 40 : 30);
  return Math.min(Math.max(contentWidth, minWidth), maxWidth);
};

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
  const handleExport = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(sheetName);

      worksheet.columns = columns.map((col) => ({
        header: col.header,
        key: col.key,
        width: getColumnWidth(col, data),
      }));

      data.forEach((record) => {
        const row = worksheet.addRow({});
        columns.forEach((col, index) => {
          const value = resolveColumnValue(record, col);
          const cell = row.getCell(index + 1);
          applyCellFormatting(cell, value, col);
        });
      });

      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' };

      const name = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob(
        [buffer],
        { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
      );
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = name;
      link.click();
      window.URL.revokeObjectURL(url);
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
