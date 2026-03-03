/**
 * Format số tiền thành chuỗi VND
 */
export const formatCurrency = (value: number | string): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return '0 ₫';
  }
  
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(numValue);
};

/**
 * Format số thành chuỗi có dấu phân cách
 */
export const formatNumber = (value: number | string): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return '0';
  }
  
  return new Intl.NumberFormat('vi-VN').format(numValue);
};

/**
 * Format ngày tháng
 */
export const formatDate = (date: string | Date, format: 'short' | 'long' = 'short'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'N/A';
  }
  
  if (format === 'long') {
    return dateObj.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  
  return dateObj.toLocaleDateString('vi-VN');
};
import dayjs from "dayjs";

/**
 * Tính số ngày chênh lệch so với ngày hiện tại
 */
export const calculateDaysDiff = (date?: string | Date | null): number | null => {
  if (!date) return null;
  const start = dayjs(date).startOf('day');
  const now = dayjs().startOf('day');
  return now.diff(start, 'day');
};
